

let searchWorker

let worker



toggleCheckbox.addEventListener('change', (e) => {
    if (e.target.checked && !worker) {
        bootWllamaWorker()
    } else if (worker) {
        worker.postMessage({ type: 'UNLOAD_MODEL' });
    }
    SettingsManager.applyValue(IMPORT_SETTINGS.core.runLocally, e.target.checked)
});

async function bootWllamaWorker() {

    worker = new Worker(DEFAULT_WORKER, DEFAULT_WORKER.includes('wllama') ? { type: 'module' } : {});

    worker.onerror = (err) => console.error("Worker error:", err);
    worker.onmessage = workerResponseInterface;

}



async function bootOffscreenWorker() {
    const canvas = document.getElementById('output-canvas');
    const offscreen = canvas.transferControlToOffscreen();

    const worker = new Worker('upscaler-worker.js', { type: 'module' });

    // Send the canvas to the worker thread once
    worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);

    const video = document.getElementById('input-video');

    function sendFrames() {
        if (video.readyState >= 2) {
            // Create an ImageBitmap from the current frame to transfer ownership efficiently
            createImageBitmap(video).then(bitmap => {
                worker.postMessage({ type: 'frame', bitmap }, [bitmap]);
            });
        }
        // Use requestVideoFrameCallback if available, fallback to requestAnimationFrame
        (video.requestVideoFrameCallback || requestAnimationFrame)(sendFrames);
    }

    video.addEventListener('play', sendFrames);
}



let currentTimeout
let previousSearch
async function doNunuSearch() {
    const searchBox = document.querySelector('#nunu input[placeholder="Search"]')
    if (currentTimeout) {
        previousSearch = searchBox.value
        return
    }
    currentTimeout = setTimeout(() => {
        currentTimeout = null
        searchWorker.postMessage({
            type: 'SEARCH_QUERY',
            baseURI: window.location.origin + '/',
            parquetFiles: [DEFAULT_PARQUET],
            payload: previousSearch
        });
    }, 1000)
}


async function searchResponseInterface(e) {
    const { type, payload } = e.data;

    if (type === 'WORKER_READY') {
        searchWorker.postMessage({
            type: 'LOAD_SEARCH',
            baseURI: window.location.origin + '/',
            parquetFiles: [DEFAULT_PARQUET],
            payload: {
            }
        });
    } else if (type === 'SEARCH_READY') {

        console.log(e.data)
    } else if (type === 'SEARCH_RESULTS') {


        console.log(e.data)
    }
}


let jinjaText
let grammerText
let fakeLoadingInterval;


async function workerResponseInterface(e) {
    const { type, payload } = e.data;

    if (type === 'DOWNLOAD_PROGRESS') {
        progressElement.value = payload.percent;
        progressText.textContent = `${payload.percent}%`;
        generalProgressElement.value = payload.percent;
        generalProgressText.textContent = `${payload.percent}%`;
    }
    else if (type === 'COMPILING_MODEL') {
        progressText.textContent = 'Compiling GPU pipelines...';
        generalProgressText.textContent = 'Compiling GPU pipelines...';
    }
    else if (type === 'MODEL_READY') {
        if (fakeLoadingInterval) {
            clearInterval(fakeLoadingInterval)
        }
        progressText.textContent = 'Ready';
        progressElement.value = 100;
        generalProgressText.textContent = 'Ready';
        generalProgressElement.value = 100;

        const statusElement = document.getElementById('tree-status');
        if (statusElement) {
            statusElement.textContent = 'Ready...';
            statusElement.className = 'tree-val tree-status-ready';
        }

        multicastButton.removeAttribute('disabled', 'disabled')

    }
    else if (type === 'ERROR') {
        console.error('Worker Engine Error:', payload.message);
        progressText.textContent = 'Error';
        generalProgressText.textContent = 'Error';
        const statusElement = document.getElementById('tree-status');
        if (statusElement) {
            statusElement.textContent = 'Error: ' + payload.message;
            statusElement.className = 'tree-val status-critical-text';
        }
    }
    /*
    else if (type === 'INFERENCE_COMPLETE') {
        const embeddings = payload.outputs.last_hidden_state.data;
        const dimensions = payload.outputs.last_hidden_state.dims;

        console.log('Received embedding chunk vector array:', embeddings);
        // Stream this vector chunk directly to your vector storage/processing layer
        renderOrIndexChunk(embeddings, dimensions);
        const chunkStatus = document.getElementById('tree-chunk-status');
        if (chunkStatus) {
            chunkStatus.textContent = 'Chunk Indexed';
            chunkStatus.className = 'tree-val status-optimal-text';
        }

        multicastButton.removeAttribute('disabled', 'disabled')
    }
    */
    else if (type === 'TOKEN_STREAM') {
        const statusElement = document.getElementById('tree-status');
        if (statusElement) {
            statusElement.textContent = 'Streaming...';
            statusElement.className = 'tree-val tree-status-thinking';
        }
        const tokenStatus = document.getElementById('tree-token-status');
        if (tokenStatus) {
            if (tokenStatus.classList.contains('text-muted') || tokenStatus.textContent === 'Idle') {
                tokenStatus.classList.remove('text-muted');
                tokenStatus.textContent = '';
            }
            tokenStatus.textContent += payload.delta;
        }
        const container = document.getElementById('output-display-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    else if (type === 'GENERATION_COMPLETE') {
        const statusElement = document.getElementById('tree-status');
        if (statusElement) {
            statusElement.textContent = 'Success';
            statusElement.className = 'tree-val tree-status-ready';
        }
        const completeStatus = document.getElementById('tree-complete-status');
        if (completeStatus) {
            completeStatus.textContent = 'Finished';
            completeStatus.className = 'tree-val status-optimal-text';
        }

        parseSpatialCommands(document.getElementById('tree-token-status').textContent)
        multicastButton.removeAttribute('disabled', 'disabled')
    } else if (type === 'WORKER_READY') {
        const toggle = document.getElementById('local-model-toggle');
        progressText.textContent = 'Loading';
        generalProgressText.textContent = 'Loading';
        progressElement.value = 0;
        generalProgressElement.value = 0;

        fakeLoadingInterval = setInterval(() => {
            if (progressElement.value < 90) {
                progressElement.value++;
                generalProgressElement.value++;
            } else {
                progressElement.value = 100;
                generalProgressElement.value = 100;
                clearInterval(fakeLoadingInterval)
                fakeLoadingInterval = null
            }
        }, 100)

        const statusElement = document.getElementById('tree-status');
        if (statusElement) {
            statusElement.textContent = 'Loading model...';
            statusElement.className = 'tree-val tree-status-thinking';
        }

        const response = await fetch(DEFAULT_JINJA);
        if (response.ok) {
            jinjaText = await response.text();
        }

        const response2 = await fetch(DEFAULT_GBNF);
        if (response2.ok) {
            grammerText = await response2.text();
        }

        if (toggle?.checked) {
            worker.postMessage({
                type: 'LOAD_MODEL',
                baseURI: window.location.origin + '/',
                payload: {
                    modelUrl: DEFAULT_MODEL,
                    loraUrl: DEFAULT_LORA,
                    chatTemplate: jinjaText,
                    gbnfGrammar: grammerText
                }
            });
        }
    } else if (type === 'UNLOAD_COMPLETE') {
        worker.terminate();
        console.log('🛑 Worker completely terminated safely.');
        progressElement.value = 0;
        progressText.textContent = `Temrinated`;
        generalProgressElement.value = 0;
        generalProgressText.textContent = `Terminated`;
        worker = null
    }
}



async function bootAvailableWorkers() {

    if (toggleCheckbox.checked) {
        bootWllamaWorker()
    } else {
        const treeStatus = document.getElementById('tree-status');
        if (treeStatus) {
            treeStatus.textContent = 'Disabled...';
            treeStatus.className = 'tree-val text-muted';
        }
    }


    searchWorker = new Worker(SEARCH_WORKER, { type: 'module' });

    searchWorker.onerror = (err) => console.error("Worker error:", err);
    searchWorker.onmessage = searchResponseInterface;
}


async function handleGenerate() {
    document.getElementById('scene-builder').classList.add('collapsed')
    const promptText = document.getElementById('prompt-input').value;
    const coordsText = document.getElementById('coords-input').value;

    const treePrompt = document.getElementById('tree-prompt');
    const treeCoords = document.getElementById('tree-coords');
    const treeStatus = document.getElementById('tree-status');
    const treeTokenStatus = document.getElementById('tree-token-status');
    const treeChunkStatus = document.getElementById('tree-chunk-status');
    const treeCompleteStatus = document.getElementById('tree-complete-status');

    if (treePrompt) treePrompt.textContent = `"${promptText}"`;
    if (treeCoords) treeCoords.textContent = `"${coordsText}"`;
    if (treeStatus) {
        treeStatus.textContent = 'Thinking...';
        treeStatus.className = 'tree-val tree-status-thinking';
    }
    if (treeTokenStatus) {
        treeTokenStatus.textContent = 'Idle';
        treeTokenStatus.className = 'tree-val text-muted';
    }
    if (treeChunkStatus) {
        treeChunkStatus.textContent = 'Ready';
        treeChunkStatus.className = 'tree-val text-muted';
    }
    if (treeCompleteStatus) {
        treeCompleteStatus.textContent = 'Waiting';
        treeCompleteStatus.className = 'tree-val text-muted';
    }

    multicastButton.setAttribute('disabled', 'disabled')

    worker.postMessage({
        type: 'RUN_INFERENCE',
        payload: {
            input_text: promptText,
            max_new_tokens: 1000,
            temperature: 0.8,
            top_k: 40,
            chatTemplate: jinjaText,
            gbnfGrammar: grammerText
        }
    });
}


multicastButton.addEventListener('click', handleGenerate)


