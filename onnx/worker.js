// Import the ONNX Runtime Web library from a CDN
importScripts('/onnx/ort.webgpu.min.js');
importScripts('/onnx/web-tokenizers.js');

//transformers.env.allowRemoteModels = true;
//transformers.env.useBrowserCache = true;
//transformers.env.localModelPath = '/onnx/';

// Configure ONNX Runtime to explicitly use WebGPU
ort.env.wasm.numThreads = 4;
ort.env.wasm.proxy = false;
ort.env.logLevel = 'verbose';
ort.env.wasm.wasmPaths = '/onnx/';

let session = null;




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
        const encoded = await tokenizer(payload.input_text);
        const inputIds = Array.from(encoded.input_ids.data); // Initial array of prompt tokens
        let currentDims = [...encoded.input_ids.dims]; // [1, sequence_length]
        let previousText = inputText
        const generatedTokenSequence = inputIds
        for (let step = 0; step < payload.max_new_tokens; step++) {
            // 1. Build the input tensor for the current sequence state
            const feeds = {
                input_ids: new ort.Tensor('int32', Int32Array.from(generatedTokenSequence), currentDims),
                attention_mask: new ort.Tensor('int32', new Int32Array(generatedTokenSequence.length).fill(1), currentDims)
            };

            // 2. Compute logits (The model gives us a massive matrix of probabilities for every word in its vocabulary)
            const outputResults = await session.run(feeds);

            // Grab the generation output logits matrix
            const logitsTensor = outputResults.logits || Object.values(outputResults)[0];
            const logits = logitsTensor.data;

            // 3. Extract the last token's probability slice (the prediction for the next word)
            const vocabSize = logitsTensor.dims[2];
            const lastTokenOffset = (logitsTensor.dims[1] - 1) * vocabSize;

            // Basic greedy argmax selection (Find the single highest probability token ID)
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

            // 4. Update the execution array parameters for the next iteration loop pass
            generatedTokenSequence.push(nextTokenId);
            currentDims[1]++; // Extend the token length dimension window by 1

            const currentText = tokenizer.decode(generatedTokenSequence);
            const textDelta = currentText.substring(previousText.length);
            previousText = currentText

            // 5. Send the raw token ID out. The main thread's tokenizer decodes it back to a human string word!
            self.postMessage({
                type: 'TOKEN_STREAM',
                payload: { delta: textDelta, tokenId: nextTokenId }
            });
        }
    } catch (error) {
        self.postMessage({ type: 'ERROR', payload: { message: error.message } });
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


async function BootModel(payload) {
    console.log('%c[Worker] Command acknowledged: LOAD_MODEL', 'color: #00bcd4; font-weight: bold;', payload);
    const startTime = performance.now();

    let i = 1
    try {
        console.log(`%c[Worker] Booting model [${i}/3] tracking: ${payload.modelUrl}`, 'color: #00bcd4;');

        // 1. Fetch topology graph layout config first (e.g., 0.39 MB)
        const graphBuffer = await fetchWithFallbackChain(payload.modelUrl, 'Graph');

        // 2. Fetch corresponding data weights from identical host destination sidecar
        //const dataUrl = getExternalDataUrl(targetUrl);
        const weightsBuffer = await fetchWithFallbackChain(payload.modelUrl, 'Weights');
        i = 2

        // 3. Fetch the raw tokenizer configuration file from the same location
        //const tokenizerUrl = getTokenizerJsonUrl(targetUrl);
        const tokenizerResponse = await fetchWithFallbackChain(payload.modelUrl, 'Tokenizer');
        i = 3

        // Read the tokenizer file asset straight as a plain string text blob
        const tokenizerJsonText = new TextDecoder().decode(tokenizerResponse);

        // 4. Compile the WebGPU ONNX InferenceSession using the pre-loaded buffers
        session = await compileInferenceSession(graphBuffer.buffer, weightsBuffer.buffer, 'model_quantized.onnx_data');

        // 5. Initialize the Web-Tokenizer engine using the freshly downloaded text config string
        console.log('%c[Worker] Instantiating isolated pure-WASM tokenizer engine...', 'color: #009688;');

        //await self.io_tokenizer.initWasm();

        // Feed the string text data configuration straight into the global instantiation factory
        tokenizer = tokenizers.Tokenizer.fromJSON(tokenizerJsonText);

        console.log('%c[Worker] ✔ Tokenizer engine successfully armed and paired with WebGPU graph.', 'color: #4caf50; font-weight: bold;');
        completed = true;

    } catch (err) {
        console.error(`%c[Worker] ❌ Pipeline step [${i}/3] dropped: ${err.message}`, 'color: #ff9800;');
        self.postMessage({ type: 'ERROR', payload: { message: err.message } });
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


