// Import the ONNX Runtime Web library from a CDN
importScripts('/onnx/ort.webgpu.min.js');
importScripts('/onnx/web-tokenizers.js');
importScripts('/local.js');

//transformers.env.allowRemoteModels = true;
//transformers.env.useBrowserCache = true;
//transformers.env.localModelPath = '/onnx/';

// Configure ONNX Runtime to explicitly use WebGPU
ort.env.wasm.numThreads = 4;
ort.env.wasm.proxy = false;
ort.env.logLevel = 'verbose';
ort.env.wasm.wasmPaths = '/onnx/';

let session = null;

const ONNX_DATABASE = 'onnx'

const ST_FILE = 8;
const ST_DIR = 4;
const FS_DEFAULT = (6 << 3) + (6 << 6) + (6);
const FS_FILE = (ST_FILE << 12) + FS_DEFAULT;
const FS_DIR = (ST_DIR << 12) + FS_DEFAULT;


async function fetchModelWithProgress(url, typeLabel = 'File') {
    console.log(`%c[Worker] Attempting network fetch for ${typeLabel} from: ${url}`, 'color: #9e9e9e;');
    const response = await fetch(url);


    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    console.log(`%c[Worker] Connected. Content-Length: ${totalBytes} bytes (${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`, 'color: #9e9e9e;');

    const reader = response.body.getReader();
    let receivedBytes = 0;
    const chunks = [];
    let lastReportedPercent = -1;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes > 0) {
            const percentComplete = Math.round((receivedBytes / totalBytes) * 100);
            if (percentComplete !== lastReportedPercent && percentComplete % 5 === 0) {
                console.log(`%c[Worker] Downloading: ${percentComplete}% (${(receivedBytes / (1024 * 1024)).toFixed(2)} MB / ${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`, 'color: #2196f3;');
                lastReportedPercent = percentComplete;
            }
            self.postMessage({ type: 'DOWNLOAD_PROGRESS', payload: { percent: percentComplete } });
        } else {
            console.log(`%c[Worker] Streaming bytes (unknown total length): ${(receivedBytes / (1024 * 1024)).toFixed(2)} MB`, 'color: #2196f3;');
        }
    }

    return assembleBufferChunks(chunks, receivedBytes);
}



function assembleBufferChunks(chunks, totalSize) {
    console.log(`%c[Worker] Flattening ${chunks.length} memory chunks down into an explicit ArrayBuffer allocation...`, 'color: #9c27b0;');
    const allocationStart = performance.now();
    const modelBuffer = new Uint8Array(totalSize);
    let position = 0;
    for (const chunk of chunks) {
        modelBuffer.set(chunk, position);
        position += chunk.length;
    }
    console.log(`%c[Worker] Buffer constructed. Size: ${(modelBuffer.byteLength / (1024 * 1024)).toFixed(2)} MB. Time: ${(performance.now() - allocationStart).toFixed(2)}ms`, 'color: #9c27b0;');
    return modelBuffer;
}




async function compileInferenceSession(modelBuffer, dataBuffer = null, dataFileName = 'model_quantized.onnx_data') {
    self.postMessage({ type: 'COMPILING_MODEL' });
    console.log('%c[Worker] Compiling graph onto WebGPU hardware pipeline...', 'color: #ff9800; font-weight: bold;');

    const options = {
        executionProviders: ['webgpu']
    };

    // Inject the fully downloaded weights buffer directly into the execution options
    if (dataBuffer) {
        console.log(`%c[Worker] Injecting external weights mapping tracking key: "${dataFileName}"`, 'color: #4caf50;');
        options.externalData = [
            {
                data: dataBuffer,
                path: dataFileName
            }
        ];
    }

    const start = performance.now();
    const activeSession = await ort.InferenceSession.create(modelBuffer, options);
    const end = performance.now();

    console.log('%c[Worker] ✔ ONNX Inference Session created successfully!', 'color: #4caf50; font-weight: bold;');
    console.log(`%c[Worker] Model Compile Time: ${(end - start).toFixed(2)}ms`);

    return activeSession;
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

let cachedWebGPU = undefined;
let tokenizer
async function RunModel(payload) {
    try {
        const inputText = payload.input_text;
        const encoded = await tokenizer.encode(payload.input_text);
        const inputIds = Array.from(encoded); // Initial array of prompt tokens
        let currentDims = [1, inputIds.length]; // [1, sequence_length]
        let previousText = inputText;
        const generatedTokenSequence = inputIds;

        //const numAttentionHeads = 12; // e.g., 12 for tiny architectures, 32 for larger models
        //const headDimension = 64;
        const numAttentionHeads = 2;   // Fixed: Match the model's expected 2 Key-Value heads
        const headDimension = 64;

        for (let step = 0; step < payload.max_new_tokens; step++) {
            const sequenceLength = generatedTokenSequence.length;

            // 1. Build the updated counting positional array natively inside the pass loop
            const positionIdsArray = new BigInt64Array(sequenceLength);
            for (let i = 0; i < sequenceLength; i++) {
                positionIdsArray[i] = BigInt(i);
            }

            /* Keep incase i switch back to bge
             const feeds = {
                input_ids: new ort.Tensor('int32', Int32Array.from(generatedTokenSequence), currentDims),
                attention_mask: new ort.Tensor('int32', new Int32Array(generatedTokenSequence.length).fill(1), currentDims),
                token_type_ids: new ort.Tensor('int32', new Int32Array(generatedTokenSequence.length).fill(0), currentDims)
            };
            */


            // 2. Build the feeds object (CRITICAL: token_type_ids completely removed)
            const feeds = {
                input_ids: new ort.Tensor('int64', BigInt64Array.from(generatedTokenSequence, x => BigInt(x)), currentDims),
                attention_mask: new ort.Tensor('int64', new BigInt64Array(sequenceLength).fill(1n), currentDims),
                position_ids: new ort.Tensor('int64', positionIdsArray, currentDims)
            };

            // 3. Loop through the model session schema to dynamically satisfy missing KV cache inputs
            for (const inputName of session.inputNames) {
                if (inputName.startsWith('past_key_values')) {
                    const emptyKvDims = [1, numAttentionHeads, 0, headDimension];
                    feeds[inputName] = new ort.Tensor('float32', new Float32Array(0), emptyKvDims);
                }
            }

            // 4. Compute logits
            const outputResults = await session.run(feeds);

            console.log('%c[Worker] Available Model Output Nodes:', 'color: #009688;', Object.keys(outputResults));

            const logitsTensor = outputResults.logits || outputResults.logits_out || Object.values(outputResults)[0];
            const logits = logitsTensor.data;

            const currentSequenceLength = logitsTensor.dims[1];
            const vocabSize = logitsTensor.dims[2];

            console.log(`%c[Worker] Math dimensions match -> Vocab Size: ${vocabSize} | Seq Length: ${currentSequenceLength}`, 'color: #2196f3;');

            // 5. Extract the last token's probability slice using your corrected shape bounds
            const lastTokenOffset = (currentSequenceLength - 1) * vocabSize;

            let nextTokenId = 0;
            let maxLogit = -Infinity;
            for (let v = 0; v < vocabSize; v++) {
                if (logits[lastTokenOffset + v] > maxLogit) {
                    maxLogit = logits[lastTokenOffset + v];
                    nextTokenId = v;
                }
            }

            // Check for End-of-Sequence stop token code
            if (nextTokenId === 151643) { // Typical Qwen EOS token ID
                console.log('[Worker] Hit End of Sequence token.');
                break;
            }

            // 6. Update the execution array parameters for the next iteration loop pass
            generatedTokenSequence.push(nextTokenId);
            currentDims[1]++; // Extend the token length dimension window by 1

            const currentText = tokenizer.decode(generatedTokenSequence);
            const textDelta = currentText.substring(previousText.length);
            previousText = currentText;

            // 7. Send the raw token ID out
            self.postMessage({
                type: 'TOKEN_STREAM',
                payload: { delta: textDelta, tokenId: nextTokenId }
            });
        }
    } catch (err) {
        self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || err.stacktrace) } });
    }
}

function getModelUrl(modelUrl) {
    return `${modelUrl}/model_quantized.onnx`
}

function getExternalDataUrl(modelUrl) {
    return `${getModelUrl(modelUrl)}_data`;
}

function getTokenizerJsonUrl(modelUrl) {
    return `${modelUrl}/tokenizer.json`;
}



function getFallbackUrls(rawFilePath) {
    // If it's already a full HTTP/HTTPS url, return it immediately as the sole target
    if (rawFilePath.startsWith('http://') || rawFilePath.startsWith('https://')) {
        return [rawFilePath];
    }

    // Clean up leading/trailing slashes for predictable joining
    const cleanPath = rawFilePath.replace(/^\/+|\/+$/g, '');
    const fileName = cleanPath.split('/').pop()
    const subFolder = cleanPath.split('/').slice(0, -1).join('/')

    return [
        `https://illustrious.quake.games/models/${cleanPath}`,
        `http://localhost:8080/models/${cleanPath}`,
        `https://huggingface.co/${subFolder}/resolve/main/onnx/${fileName}`,
        `https://huggingface.co/${subFolder}/raw/main/${fileName}`,
        `https://huggingface.co/${subFolder}/${fileName}`,
        `https://huggingface.co/${cleanPath}`
    ];
}





async function fetchWithFallbackChain(rawFilePath, type) {
    const targets = type === 'Weights'
        ? getFallbackUrls(getExternalDataUrl(rawFilePath))
        : type === 'Tokenizer'
            ? getFallbackUrls(getTokenizerJsonUrl(rawFilePath))
            : getFallbackUrls(getModelUrl(rawFilePath));

    const accumulatedErrors = [];

    for (let i = 0; i < targets.length; i++) {
        const url = targets[i];
        try {
            console.log(`%c[Worker] Fallback step [${i + 1}/${targets.length}] initiated.`, 'color: #00bcd4;');
            return await fetchModelWithProgress(url, type);
        } catch (err) {
            console.warn(`%c[Worker] Target [${i + 1}/${targets.length}] failed: ${err.message}`, 'color: #ff9800;');
            accumulatedErrors.push(`[Target: ${type}: ${url}] -> ${err.message}`);
        }
    }

    throw new Error(`All fallback connection targets exhausted.\n${accumulatedErrors.join('\n')}`);
}


async function installDatabaseIfNeeded() {
    const databases = await getDatabaseMetadata();
    console.log('⚙️ [SW-INSTALL] Extracted internal IndexedDB metadata dictionaries:', databases);
    const shouldInstall = (await needsInstall(ONNX_DATABASE, DB_SCHEME)).item3
    if (databases.filter(d => d.key == ONNX_DATABASE).length == 0
        || shouldInstall) {
        console.warn(`⚠️ [SW-DATABASE] Target database "${ONNX_DATABASE}" missing. Initializing core database maps now.`);
        await deleteOldDatabase(ONNX_DATABASE)
        await setupDatabase(ONNX_DATABASE, DB_SCHEME);
        console.log(`✅ [SW-DATABASE] Target database infrastructure initialized cleanly.`);
    }

}



async function BootModel(payload) {
    console.log('%c[Worker] Command acknowledged: LOAD_MODEL', 'color: #00bcd4; font-weight: bold;', payload);
    const startTime = performance.now();

    await installDatabaseIfNeeded()

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


