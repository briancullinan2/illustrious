

// Wrap in an IIFE to allow the use of await in classic global scopes
(async () => {
    let dbModule;

    let moduleWorker = false
    let moduleLoaded = false
    if (typeof importScripts === 'function') {
        // Classic Web Worker: execution is synchronous, no await needed for script loading
        try {
            importScripts('/local.js');
            if (typeof getDatabaseMetadata === 'undefined') {
                throw new Error("Classic script loaded, but getDatabaseMetadata namespace is missing.");
            }
            moduleLoaded = true
        } catch (error) {
            moduleWorker = true
            console.error("Failed to load database utilities via importScripts:", error);
        }
    }


    if (moduleWorker || !moduleLoaded) {
        // Module execution window context: safely use dynamic import promise
        try {
            dbModule = await import('../local.js');
        } catch (error) {
            console.error("Failed to load database utilities via dynamic import:", error);
            throw error;
        }
    }

    // Unpack functions onto our parent-scoped variables
    Object.assign(self, dbModule);

    // Initialization complete: Trigger your dependent logic here
    console.log("Database dependencies successfully initialized.", DB_STORE_NAME);
})();

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





async function installDatabaseIfNeeded(database) {
    const databases = await getDatabaseMetadata();
    console.log('⚙️ [SW-INSTALL] Extracted internal IndexedDB metadata dictionaries:', databases);
    const shouldInstall = (await needsInstall(database, DB_SCHEME)).item3
    if (databases.filter(d => d.key == database).length == 0
        || shouldInstall) {
        console.warn(`⚠️ [SW-DATABASE] Target database "${database}" missing. Initializing core database maps now.`);
        await deleteOldDatabase(database)
        await setupDatabase(database, DB_SCHEME);
        console.log(`✅ [SW-DATABASE] Target database infrastructure initialized cleanly.`);
    }

}




function getGGUFModel(modelUrl) {
    return `${modelUrl}/${modelUrl.split('/').pop().toLowerCase()}.gguf`
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

    const tries = [
        `https://illustrious.quake.games/models/${cleanPath}`,
        `http://localhost:8080/models/${cleanPath}`,
    ];

    if (!rawFilePath.includes('.gguf') || rawFilePath.toLowerCase().includes('onnx')) {
        tries.push(...[
            `https://huggingface.co/${subFolder}/resolve/main/onnx/${fileName}`,
            `https://huggingface.co/${subFolder}/raw/main/${fileName}`,
            `https://huggingface.co/${subFolder}/${fileName}`,
            `https://huggingface.co/${cleanPath}`
        ])
    } else if (rawFilePath.includes('.gguf')) {
        const unquantizedPath = fileName.replace(/[\.-]gguf/gi, '')
        tries.push(...[
            // TODO: insert K4_0 format
            `https://huggingface.co/${subFolder}/resolve/main/${unquantizedPath}-q8_0.gguf`,
            `https://huggingface.co/${subFolder}/raw/main/${fileName}`,
            `https://huggingface.co/${subFolder}/${fileName}`,
            `https://huggingface.co/${cleanPath}`
        ])
    }

    return tries;
}





async function fetchWithFallbackChain(rawFilePath, type) {
    const targets = type === 'Weights'
        ? getFallbackUrls(getExternalDataUrl(rawFilePath))
        : type === 'Tokenizer'
            ? getFallbackUrls(getTokenizerJsonUrl(rawFilePath))
            : type === 'GGUF'
                ? getFallbackUrls(getGGUFModel(rawFilePath))
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

(function (root) {

    const exportsObject = {
        fetchWithFallbackChain,
        getFallbackUrls,
        getGGUFModel,
        getModelUrl,
        getExternalDataUrl,
        getTokenizerJsonUrl,
        installDatabaseIfNeeded,
        assembleBufferChunks,
        fetchModelWithProgress,
    };

    // 1. CommonJS Node environment
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exportsObject;
    }
    // 2. Bare exports environment
    else if (typeof exports !== 'undefined') {
        Object.assign(exports, exportsObject);
    }
    // 3. Web Worker context (Classic or Module)
    else if (typeof self !== 'undefined' && typeof self.importScripts === 'function') {
        Object.assign(self || root || {}, exportsObject);
    }
    // 4. Standard Browser UI Thread fallback
    else {
        Object.assign(root || {}, exportsObject);
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this);

