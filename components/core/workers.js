

let searchWorker

let worker

let searchResults = []

let converterReady = false


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
    searchWorker.onerror = (err) => {
        console.error("Worker error:", err);
    }
    searchWorker.onmessage = searchResponseInterface;


    convertWorker = new Worker(CONVERT_WORKER, { type: 'module' });
    convertWorker.onerror = function (event) {
        console.error("❌ Worker crashed!");
        console.error("Message:", event.message);   // <-- The actual error text
        console.error("File:", event.filename);     // <-- Which file caused it
        console.error("Line:", event.lineno);       // <-- The exact line number

        // Prevent the error from bubbling up further if needed
        event.preventDefault();
    };
    convertWorker.onmessage = convertResponseInterface;
}


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

    worker.onerror = (err) => {
        console.error("Worker error:", err);
    }
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
        if (previousSearch.trim().length === 0)
            return

        searchWorker.postMessage({
            type: 'SEARCH_QUERY',
            baseURI: window.location.origin + '/',
            parquetFiles: [DEFAULT_PARQUET],
            payload: previousSearch
        });
    }, 1000)
}

async function convertResponseInterface(e) {
    const { type, payload } = e.data;

    if (type === 'WORKER_READY') {
        convertWorker.postMessage({
            type: 'LOAD_CONVERT',
            baseURI: window.location.origin + '/',
            payload: {
            }
        });
    }

    if (type === 'UNAUTHORIZED') {

    }
    if (type === 'CONVERT_LOADED') {
        converterReady = true
        const currentSearch = searchResults
        searchResults = []
        convertWorker.postMessage({
            type: 'DOWNLOAD_SEARCH',
            baseURI: window.location.origin + '/',
            payload: searchResults
        });
    }


    if (type === 'DOWNLOAD_FINISHED') {
        for (let item of payload || []) {
            if (item.success)
                addVisualModelToNunuAssets(item)
        }
    }
}




async function addModelToNunuAssets(payload) {
    try {
        if (!payload.success) {
            throw new Error("Cannot asset-load a failed worker download payload.");
        }

        // 1. Fetch the binary Blob back out of IndexedDB using the store name and repo key
        const record = await getRecord(DB_STORE_NAME, payload.path, payload.db);
        if (!record || !record.contents) {
            throw new Error(`Model data not found in IndexedDB for path: ${payload.path}`);
        }

        const fileName = payload.path.split('/').pop();
        const extension = fileName.split('.').pop().toLowerCase();

        // 3. Create a raw nunuStudio Binary Resource container
        // NunuStudio organizes files in its asset manager via instances of Resource wrappers
        const resource = new window.nunu.BinaryResource(record.contents, extension);
        resource.name = decodeURIComponent(fileName);

        // 4. Register the asset strictly to the Program Manager (Assets list), NOT the Scene
        // 'editor' refers to the global nunuStudio Editor core instance
        if (typeof editor !== 'undefined' && editor.program) {

            // Add the resource container directly into the project asset registry
            editor.program.addResource(resource);

            // 5. Force the Editor GUI Asset panel UI to redraw and show the new entry
            if (editor.gui && editor.gui.assetTab) {
                editor.gui.assetTab.updateObjects();
            } else if (editor.updateObjectsViews) {
                editor.updateObjectsViews();
            }

            console.log(`Successfully injected "${resource.name}" into the nunuStudio Assets layout.`);
            return resource;
        } else {
            throw new Error("nunuStudio global 'editor' context context or active program structure was unavailable.");
        }

    } catch (error) {
        console.error("Failed to inject model into nunuStudio Assets:", error);
    }
}



async function addVisualModelToNunuAssets(payload, classes) {
    const THREE = require('three')
    classes ||= THREE.resolveNunuClasses()

    try {
        if (!payload.success) return;

        // 1. Grab file from IndexedDB
        const record = await getRecord(DB_STORE_NAME, payload.path, payload.db);
        if (!record || !record.contents) return;

        const fileName = payload.path.split('/').pop();
        const extension = fileName.split('.').pop().toLowerCase();

        let geometry;
        let material = new classes.Material(); // Uses your resolved default material
        let mesh;

        // 2. Parse the bytes into structural 3D Geometry based on type
        if (extension === 'stl') {
            // If using standard Three.js loaders available in nunuStudio context
            const loader = new THREE.STLLoader();
            geometry = loader.parse(record.contents);
            mesh = new classes.Mesh(geometry, material);
        }
        else if (extension === 'obj') {
            const loader = new THREE.OBJLoader();
            const textDecoder = new TextDecoder('utf-8');
            const objText = textDecoder.decode(record.contents);

            // OBJLoader returns a structural Group/Object3D wrapper containing meshes
            const objRoot = loader.parse(objText);

            // Extract the geometry or map the whole group structure to a nunu Mesh format
            mesh = objRoot;
        }

        if (!mesh) {
            console.warn(`Unsupported parsing for type: ${extension}`);
            return;
        }

        // Set identification details
        mesh.name = decodeURIComponent(fileName);

        // 3. Inject it straight into the Project Program Shapes/Objects list
        if (window.nunu && window.nunu.program) {
            // This adds it to the project's object pool without placing it in the active scene tree yet
            window.nunu.program.addResource(mesh);

            // Force asset drawer layout update
            window.nunu.updateObjectsViewsGUI();
            console.log(`Injected 3D Mesh asset: ${mesh.name}`);
        }

    } catch (error) {
        console.error("Failed parsing asset into BufferGeometry:", error);
    }
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
        // TODO: immediately pass to the downloader module

        if (!converterReady) {
            searchResults.push(...e.data.payload)
        } else {
            convertWorker.postMessage({
                type: 'DOWNLOAD_SEARCH',
                baseURI: window.location.origin + '/',
                payload: e.data.payload
            });

        }
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


