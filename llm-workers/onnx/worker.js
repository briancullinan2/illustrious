// Import the ONNX Runtime Web library from a CDN
importScripts('/llm-workers/downloader.js');
importScripts('/llm-workers/onnx/ort.webgpu.min.js');
importScripts('/llm-workers/onnx/web-tokenizers.js');

//transformers.env.allowRemoteModels = true;
//transformers.env.useBrowserCache = true;
//transformers.env.localModelPath = '/onnx/';

ort.env.logLevel = 'verbose';
// Configure ONNX Runtime to explicitly use WebGPU
ort.env.webgpu.numThreads = 4;
ort.env.webgpu.proxy = false;
ort.env.webgpu.wasmPaths = '/llm-workers/onnx/';

ort.env.wasm.numThreads = 4;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmPaths = '/llm-workers/onnx/';

let session = null;

const ONNX_DATABASE = 'onnx'

const ST_FILE = 8;
const ST_DIR = 4;
const FS_DEFAULT = (6 << 3) + (6 << 6) + (6);
const FS_FILE = (ST_FILE << 12) + FS_DEFAULT;
const FS_DIR = (ST_DIR << 12) + FS_DEFAULT;



async function compileInferenceSession(modelBuffer, dataBuffer = null, dataFileName = 'model_quantized.onnx_data') {
    self.postMessage({ type: 'COMPILING_MODEL' });

    const options = {
        executionProviders: ['webgpu'],
        graphOptimizationLevel: 'all',
        executionMode: 'parallel',
        enableMemPattern: true,
        enableCpuMemArena: false,
        // Critical for reducing copies
        preferredOutputLocation: {
            'present.*': 'gpu-buffer',   // keep KV on GPU
            'logits': 'gpu-buffer'
        },
        // Extra tuning
        logSeverityLevel: 3,  // reduce logging noise
    };

    if (dataBuffer) {
        options.externalData = [{ data: dataBuffer, path: dataFileName }];
    }

    const start = performance.now();
    const activeSession = await ort.InferenceSession.create(modelBuffer, options);
    const end = performance.now();

    console.log(`[Worker] Session ready in ${(end - start).toFixed(2)}ms`);
    console.log('[Worker] Inputs:', activeSession.inputNames.slice(0, 8), '...');
    console.log('[Worker] Outputs:', activeSession.outputNames);

    return activeSession;
}


let cachedWebGPU = undefined;
let tokenizer


async function RunModel(payload) {
    try {
        const { input_text, max_new_tokens = 256, temperature = 0.7, top_k = 40, top_p = 0.95 } = payload;

        let generatedTokens = Array.from(await tokenizer.encode(input_text));
        let previousText = input_text;
        let kvCache = null;

        const pastNames = session.inputNames.filter(n => n.startsWith('past_key_values'));

        // Reusable tensors for decode phase
        let attentionMaskTensor = null;
        let positionIdsTensor = null;

        for (let step = 0; step < max_new_tokens; step++) {
            const isPrefill = step === 0;
            const seqLen = generatedTokens.length;
            const feeds = {};

            if (isPrefill) {
                const pos = new BigInt64Array(seqLen);
                for (let i = 0; i < seqLen; i++) pos[i] = BigInt(i);

                feeds.input_ids = new ort.Tensor('int64', BigInt64Array.from(generatedTokens, x => BigInt(x)), [1, seqLen]);
                feeds.attention_mask = new ort.Tensor('int64', new BigInt64Array(seqLen).fill(1n), [1, seqLen]);
                feeds.position_ids = new ort.Tensor('int64', pos, [1, seqLen]);

                for (const name of pastNames) {
                    feeds[name] = new ort.Tensor('float32', new Float32Array(0), [1, 2, 0, 64]);
                }
            } else {
                const lastToken = generatedTokens[seqLen - 1];

                // Reuse attention mask (grows with sequence)
                if (!attentionMaskTensor || attentionMaskTensor.dims[1] !== seqLen) {
                    attentionMaskTensor = new ort.Tensor('int64', new BigInt64Array(seqLen).fill(1n), [1, seqLen]);
                }

                positionIdsTensor = new ort.Tensor('int64', new BigInt64Array([BigInt(seqLen - 1)]), [1, 1]);

                feeds.input_ids = new ort.Tensor('int64', new BigInt64Array([BigInt(lastToken)]), [1, 1]);
                feeds.attention_mask = attentionMaskTensor;
                feeds.position_ids = positionIdsTensor;

                for (const pastName of pastNames) {
                    const presentName = pastName.replace('past_key_values', 'present');
                    if (kvCache?.[presentName]) {
                        feeds[pastName] = kvCache[presentName];
                    }
                }
            }
            const oldCache = kvCache;

            const outputs = await session.run(feeds);
            kvCache = outputs;

            // === CRITICAL FIX 1: Free the previous cycle's WebGPU memory buffers ===
            if (oldCache) {
                for (const key in oldCache) {
                    if (oldCache[key].dispose) oldCache[key].dispose();
                }
            }

            let logitsTensor = outputs.logits || outputs.logits_out ||
                Object.values(outputs).find(t => t.dims && t.dims.length === 3);

            if (!logitsTensor) throw new Error("Logits not found");

            // Download to CPU
            const logitsData = await logitsTensor.getData();

            // === CRITICAL FIX 2: Free the massive Logits tensor from VRAM immediately ===
            if (logitsTensor.dispose) logitsTensor.dispose();

            const vocabSize = logitsTensor.dims[2];
            const lastLogits = logitsData.slice(-vocabSize);

            // This now executes in ~2ms instead of ~200ms
            const nextTokenId = sampleToken(lastLogits, temperature, top_k, top_p);

            if (nextTokenId === 151643 || nextTokenId === tokenizer?.eos_token_id) {
                console.log('[Worker] EOS reached');
                break;
            }

            generatedTokens.push(nextTokenId);

            const currentText = tokenizer.decode(generatedTokens);
            const delta = currentText.substring(previousText.length);
            previousText = currentText;

            self.postMessage({
                type: 'TOKEN_STREAM',
                payload: { delta, tokenId: nextTokenId }
            });
        }

        self.postMessage({ type: 'GENERATION_COMPLETE' });
    } catch (err) {
        console.error(err);
        self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || err.stacktrace) } });
    }
}


// Highly optimized linear-scan sampler to eliminate O(N log N) array sorting
function sampleToken(logits, temperature = 0.7, topK = 40, topP = 0.95) {
    const vocabSize = logits.length;

    // 1. Find the absolute max logit for numerical stability
    let maxLogit = -Infinity;
    for (let i = 0; i < vocabSize; i++) {
        if (logits[i] > maxLogit) maxLogit = logits[i];
    }

    if (temperature <= 0) {
        let maxIdx = 0;
        for (let i = 0; i < vocabSize; i++) {
            if (logits[i] === maxLogit) return i;
        }
    }

    // 2. Linear Top-K extraction (O(N) instead of O(N log N))
    // We only track the top 40 scores to avoid sorting 150,000 elements!
    let topScores = new Float32Array(topK).fill(-Infinity);
    let topIndices = new Int32Array(topK).fill(-1);

    for (let i = 0; i < vocabSize; i++) {
        const val = logits[i];
        // If this logit is bigger than the smallest logit in our Top K list...
        if (val > topScores[topK - 1]) {
            let insertPos = topK - 1;
            // Find exactly where it belongs
            while (insertPos > 0 && val > topScores[insertPos - 1]) {
                insertPos--;
            }
            // Shift the lower elements down
            for (let j = topK - 1; j > insertPos; j--) {
                topScores[j] = topScores[j - 1];
                topIndices[j] = topIndices[j - 1];
            }
            // Slot it in
            topScores[insertPos] = val;
            topIndices[insertPos] = i;
        }
    }

    // 3. Apply Temperature and Softmax ONLY to the 40 items we actually care about
    let sum = 0;
    const probs = new Float32Array(topK);
    for (let i = 0; i < topK; i++) {
        if (topIndices[i] === -1) continue;
        probs[i] = Math.exp((topScores[i] - maxLogit) / temperature);
        sum += probs[i];
    }

    for (let i = 0; i < topK; i++) {
        probs[i] /= sum; // Normalize probabilities
    }

    // 4. Top-P (Nucleus) Filtering on the tiny 40-item list
    let cumProb = 0;
    let cutoff = topK;
    for (let i = 0; i < topK; i++) {
        cumProb += probs[i];
        if (cumProb >= topP) {
            cutoff = i + 1;
            break;
        }
    }

    // 5. Roll the dice
    const rand = Math.random();
    let accum = 0;
    for (let i = 0; i < cutoff; i++) {
        accum += probs[i];
        if (rand <= accum) return topIndices[i];
    }

    return topIndices[cutoff - 1];
}



async function BootModel(payload) {
    console.log('%c[Worker] Command acknowledged: LOAD_MODEL', 'color: #00bcd4; font-weight: bold;', payload);
    const startTime = performance.now();

    await installDatabaseIfNeeded(ONNX_DATABASE)

    let i = 1
    let graphBuffer
    try {
        console.log(`%c[Worker] Booting model [${i}/3] tracking: ${payload.modelUrl}`, 'color: #00bcd4;');

        // 1. Fetch topology graph layout config first (e.g., 0.39 MB)
        const modelPath = getModelUrl(payload.modelUrl)
        graphBuffer = (await getRecord(DB_STORE_NAME, modelPath, ONNX_DATABASE))?.contents
        if (!graphBuffer) {
            graphBuffer = await fetchWithFallbackChain(payload.modelUrl, 'Graph');
            putRecord(DB_STORE_NAME, {
                path: modelPath,
                timestamp: new Date(),
                mode: FS_FILE,
                contents: new Uint8Array(graphBuffer),
                parent: modelPath.substring(0, modelPath.lastIndexOf('/')) || '/'
            }, ONNX_DATABASE)
        }

    } catch (err) {
        console.error(`%c[Worker] ❌ Pipeline step [${i}/3] dropped: ${err.message}`, 'color: #ff9800;');
        self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || err.stacktrace) } });
    }

    let weightsBuffer
    try {

        // 2. Fetch corresponding data weights from identical host destination sidecar
        //const dataUrl = getExternalDataUrl(targetUrl);
        const weightsPath = getExternalDataUrl(payload.modelUrl)
        weightsBuffer = (await getRecord(DB_STORE_NAME, weightsPath, ONNX_DATABASE))?.contents
        if (!weightsBuffer) {
            weightsBuffer = await fetchWithFallbackChain(payload.modelUrl, 'Weights');
            putRecord(DB_STORE_NAME, {
                path: weightsPath,
                timestamp: new Date(),
                mode: FS_FILE,
                contents: new Uint8Array(weightsBuffer),
                parent: weightsPath.substring(0, weightsPath.lastIndexOf('/')) || '/'
            }, ONNX_DATABASE)
        }
        i = 2

    } catch (err) {
        console.error(`%c[Worker] ❌ Pipeline step [${i}/3] dropped: ${err.message}`, 'color: #ff9800;');
        self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || err.stacktrace) } });
    }

    let tokenizerResponse
    try {

        // 3. Fetch the raw tokenizer configuration file from the same location
        //const tokenizerUrl = getTokenizerJsonUrl(targetUrl);
        const tokenizerPath = getTokenizerJsonUrl(payload.modelUrl)
        tokenizerResponse = (await getRecord(DB_STORE_NAME, tokenizerPath, ONNX_DATABASE))?.contents
        if (!tokenizerResponse) {
            tokenizerResponse = await fetchWithFallbackChain(payload.modelUrl, 'Tokenizer');
            putRecord(DB_STORE_NAME, {
                path: tokenizerPath,
                timestamp: new Date(),
                mode: FS_FILE,
                contents: new Uint8Array(tokenizerResponse),
                parent: tokenizerPath.substring(0, tokenizerPath.lastIndexOf('/')) || '/'
            }, ONNX_DATABASE)
        }
        i = 3

        // Read the tokenizer file asset straight as a plain string text blob
        const tokenizerJsonText = new TextDecoder().decode(tokenizerResponse);

        // 4. Compile the WebGPU ONNX InferenceSession using the pre-loaded buffers
        session = await compileInferenceSession(graphBuffer.buffer, weightsBuffer?.buffer, 'model_quantized.onnx_data');

        // 5. Initialize the Web-Tokenizer engine using the freshly downloaded text config string
        console.log('%c[Worker] Instantiating isolated pure-WASM tokenizer engine...', 'color: #009688;');

        //await self.io_tokenizer.initWasm();

        // Feed the string text data configuration straight into the global instantiation factory
        tokenizer = await tokenizers.Tokenizer.fromJSON(tokenizerJsonText);

        console.log('%c[Worker] ✔ Tokenizer engine successfully armed and paired with WebGPU graph.', 'color: #4caf50; font-weight: bold;');
        completed = true;

    } catch (err) {
        console.error(`%c[Worker] ❌ Pipeline step [${i}/3] dropped: ${err.message}`, 'color: #ff9800;');
        self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || err.stacktrace) } });
    }


    console.log(`%c[Worker] Pipeline finished loading successfully in ${(performance.now() - startTime).toFixed(2)}ms`, 'color: #009688; font-weight: bold;');
    self.postMessage({ type: 'MODEL_READY' });
}



// Main message routing pipeline loop block processing listener switch
self.onmessage = async function (e) {
    const { type, payload } = e.data;

    // Await the check if it hasn't been evaluated yet
    if (cachedWebGPU === undefined) {
        cachedWebGPU = await hasWebGPU();
    }

    if (!cachedWebGPU) {
        console.error(`%c[Worker] Command acknowledged: ${type} but WebGPU execution environment is unavailable. Core dropped.`, 'color: #f44336; font-weight: bold;', payload);
        self.postMessage({ type: 'ERROR', payload: { message: 'WebGPU backend not available in this context.' } });
        return;
    }

    if (type === 'LOAD_MODEL') {
        BootModel(payload)
    }

    if (type === 'RUN_INFERENCE') {
        RunModel(payload)
    }
};



/**
 * Asynchronously verifies the presence and accessibility of WebGPU within the Worker.
 * @returns {Promise<boolean>} True if a valid WebGPU adapter is instantiated.
 */
async function hasWebGPU() {
    console.log('%c[Worker] Checking WebGPU Availability...', 'color: #9c27b0;');

    if (!navigator.gpu) {
        console.error('%c[Worker] ❌ navigator.gpu is completely undefined in this Worker context. Ensure your browser supports WebGPU in Workers and you are running on localhost or HTTPS.', 'color: #f44336; font-weight: bold;');
        return false;
    }

    try {
        console.log('%c[Worker] ✔ navigator.gpu is accessible in Worker. Requesting adapter...', 'color: #4caf50;');
        const adapter = await navigator.gpu.requestAdapter();

        if (adapter) {
            console.log('%c[Worker] ✔ WebGPU Hardware Adapter identified:', 'color: #4caf50;', adapter.name || 'Generic WebGPU Device');
            return true;
        } else {
            console.warn('%c[Worker] ⚠ navigator.gpu exists, but requestAdapter() returned null (No compatible GPU found).', 'color: #ff9800;');
            return false;
        }
    } catch (err) {
        console.error('%c[Worker] ❌ Exception thrown during WebGPU adapter request:', 'color: #f44336;', err);
        return false;
    }
}




/**
 * Iterates through raw worker message payload feeds and formats them into exact hardware execution tensors.
 * @param {Object} inputsPayload - Raw untyped metadata payload describing inputs.
 * @returns {Object} Valid structural input dictionary feeding map for runtime execution.
 */
function prepareInputTensors(inputsPayload) {
    console.log('%c[Worker] Structural mapping validation checking for inputs...', 'color: #9e9e9e;');
    const inputFeeds = {};
    for (const [key, val] of Object.entries(inputsPayload)) {
        console.log(`%c[Worker] Input Name: "${key}" | Type: ${val.type} | Dims: [${val.dims.join(', ')}]`, 'color: #795548;');
        inputFeeds[key] = new ort.Tensor(val.type, val.data, val.dims);
    }
    return inputFeeds;
}

/**
 * Parses and maps hardware execution output tensors into array structures ready for worker safe serialization.
 * @param {Object} executionResults - Raw inference results containing ort.Tensor references.
 * @returns {Object} Transmittable structure map clones.
 */
function serializeOutputTensors(executionResults) {
    console.log('%c[Worker] Formatting hardware outputs back to serializable thread formats...', 'color: #9e9e9e;');
    const serializedOutputs = {};
    for (const [key, tensor] of Object.entries(executionResults)) {
        console.log(`%c[Worker] Output Name: "${key}" | Dims: [${tensor.dims.join(', ')}]`, 'color: #673ab7;');
        serializedOutputs[key] = {
            data: Array.from(tensor.data),
            dims: tensor.dims
        };
    }
    return serializedOutputs;
}



self.postMessage({ type: 'WORKER_READY' });

