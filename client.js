
//const DEFAULT_MODEL = 'onnx-community/bge-small-en-v1.5-ONNX'
//const DEFAULT_MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct'
const DEFAULT_MODEL = 'Goekdeniz-Guelmez/Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1-gguf/josiefied-qwen2.5-0.5b-instruct-abliterated-v1.Q4_K_M.gguf'
const DEFAULT_LORA = 'Goekdeniz-Guelmez/Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1/josiefied-qwen-spatial-engine.gguf'
const DEFAULT_JINJA = '/loras/spatial_engine/chat_template.jinja'
const DEFAULT_GBNF = '/loras/spatial_engine/grammar.gbnf'

const DEFAULT_PARQUET = 'https://storage.googleapis.com/quake-games/models/github.parquet';
const SEARCH_WORKER = '/components/llm-workers/objaverse/catalog-worker.js';


const WLLAMA_WORKER = '/components/llm-workers/wllama/worker.js';   // direct path
const ONNX_WORKER = '/components/llm-workers/onnx/worker.js';   // direct path
const DEFAULT_WORKER = DEFAULT_MODEL.toLowerCase().includes('gguf')
    ? WLLAMA_WORKER
    : DEFAULT_MODEL.toLowerCase().includes('onnx')
        ? ONNX_WORKER
        : WLLAMA_WORKER

const DEFAULT_SYNC = 30 * 1000


let projectConfig = {
    REGION: 'us-central1'
}

function injectSetupSettingsCog() {
    const panel = document.getElementById('control-panel');
    const header = panel?.querySelector('h2');
    if (!header) return;

    // Build the container anchor using your new class name template
    const cogWrapper = document.createElement('a');
    cogWrapper.href = '/setup';
    cogWrapper.title = 'Open Infrastructure Configuration Wizard';
    cogWrapper.className = 'header-icon-btn settings-cog'; // 👉 Clean separation of concerns

    cogWrapper.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    `;

    header.appendChild(cogWrapper);
}
/**
 * Ping backend configuration endpoints to retrieve project references
 */
async function initializeClusterStatus() {
    const statusView = document.getElementById('project-selector');

    try {
        // Query the profile metadata engine
        const res = await fetch('/illustrious-config.json');
        projectConfig = await res.json();
        if (projectConfig.DEBUG) {
            delete projectConfig['ACTIVE_PROJECT_ID']
        }
    } catch (err) {
        if (statusView) {
            statusView.style.color = '#ff3355';
            statusView.innerHTML = `⚠️ Illustrious endpoint project error <a href="/setup">Click here to configure</a>`;
        }
        console.warn("Ecosystem profile mapping localized. Ready for independent initialization.");
    }

    try {
        // Query the profile metadata engine
        const res = await fetch('/api/user-profile');
        const data = await res.json();

        if (statusView) {
            statusView.innerText = `🛰️ CLUSTER ONLINE // READY FOR PROMPT MATRIX`;
            clusterConnectionActive = true;
        }
    } catch (err) {
        if (statusView) {
            statusView.style.color = '#ff3355';
            statusView.innerText = `⚠️ LOCAL CLIENT CONTROLS ACTIVE`;
        }
        console.warn("Ecosystem profile mapping localized. Ready for independent initialization.");
    }

}




/**
 * Hand execution context over to your clean OAuth authentication gate
 */
function testAndRedirect() {
    console.log("🛰️ Initiating production OAuth handshake vector...");
    window.location.href = '/auth';
}


let activeWorkerEndpoint = null;
let clusterPollInterval = null;
let clusterConnectionActive = false;

/**
 * Synchronize and parse global cluster node pool configurations from Google Cloud
 */
async function syncClusterHardware() {
    const statusView = document.getElementById('project-selector');
    const pulseLight = document.getElementById('observer-pulse');

    // Telemetry animation pulse handler
    if (pulseLight) {
        pulseLight.style.opacity = '0.3';
        setTimeout(() => { pulseLight.style.opacity = '1'; }, 300);
    }

    try {
        console.log("🔄 [CLIENT TELEMETRY] Pinging cluster manager control layer...");
        const CLUSTER_MANAGER_URL = window.projectConfig?.ACTIVE_PROJECT_ID
            ? `https://${projectConfig.REGION}-${projectConfig.ACTIVE_PROJECT_ID}.cloudfunctions.net/clusterManager`
            : '/api/cluster/status';

        const res = await fetch(`${CLUSTER_MANAGER_URL}?t=${Date.now()}`, { method: 'GET' });
        const data = await res.json();

        console.log(`📥 [CLIENT TELEMETRY] Response payload received (HTTP ${res.status}):`, data);

        // 📊 Route the unpacked payloads directly to your new structural UI observers
        renderObserverQuotaTable(data);
        renderObserverVmMatrix(data.instances);

        if (document.getElementById('obs-zone')) {
            document.getElementById('obs-zone').textContent = data.zone || '--';
        }

        // 1. Handle Active Auto-Boot / Relay Scaling States
        if (data.status === 'SCALING_UP') {
            updateMainStatusView(statusView, '#ffaa00', `🛰️ CLUSTER INITIALIZING: Kicking off baseline hardware allocation...`);
            toggleManualBootTray(false);
            activeWorkerEndpoint = null;
            return;
        }

        // 2. Handle One-Time Storage Volume/Seeder Initializations (Mode A)
        if (data.status === 'INITIALIZING_STORAGE') {
            updateMainStatusView(statusView, '#00bcff', `⚙️ CORE STORAGE BOUNDARY: Seeding Juggernaut-Z weights...`);
            toggleManualBootTray(false);
            activeWorkerEndpoint = null;
            return;
        }

        // 3. Handle Direct Worker Allocation Lifecycle Boots (Mode B Initial Handshake)
        if (data.status === 'INITIALIZING') {
            updateMainStatusView(statusView, '#ffff00', `⚡ PROVISIONING HARDWARE: Spot hypervisors allocating T4 VRAM maps...`);
            toggleManualBootTray(false);
            activeWorkerEndpoint = null;
            return;
        }

        if (data.status === 'POOL_BLOCKED') {
            updateMainStatusView(statusView, '#ff3355', `🛑 POOL BLOCKED: ${data.message}`);
            toggleManualBootTray(false);
            activeWorkerEndpoint = null;
            return;
        }

        // 4. Parse Operational Cluster Capacities
        if (data.instances && data.instances.length > 0) {
            console.log(`📊 [CLIENT TELEMETRY] Active pool size tracked: ${data.instances.length} nodes across zone.`);

            // Locate any fully running compute nodes exposing active endpoints inside the cloud pool
            const hotNode = data.instances.find(node => node.status === 'RUNNING' && node.endpoint);

            if (hotNode) {
                activeWorkerEndpoint = hotNode.endpoint;
                console.log(`🎯 [CLIENT TELEMETRY] Channel cleared! Endpoint locked to hot node: ${activeWorkerEndpoint}`);
                updateMainStatusView(statusView, 'var(--accent)', `🛰️ POOL ACTIVE // CHANNELS OPEN TO: ${hotNode.name}`);
                toggleManualBootTray(false);
            } else {
                // Node is active in GCP, but its current cloud status string is PROVISIONING, STAGING, or REPAIRING
                const stagingNode = data.instances[0];
                console.log(`⏳ [CLIENT TELEMETRY] Node "${stagingNode.name}" is visible but unready. State: ${stagingNode.status}`);
                updateMainStatusView(statusView, '#ffaa00', `⏳ STAGING HARDWARE: ${stagingNode.name} is [${stagingNode.status}]`);
                toggleManualBootTray(false);
                activeWorkerEndpoint = null;
            }
        } else {
            // Pool is empty and fallback trigger mechanisms didn't emit specialized status keys
            console.warn("⚠️ [CLIENT TELEMETRY] Cluster manager reported an empty instance array tracking layer.");
            updateMainStatusView(statusView, '#ffaa00', `⏳ STAGING HARDWARE TIER POOLS...`);
            toggleManualBootTray(true); // Expose the manual activation override panel securely
            activeWorkerEndpoint = null;
        }

    } catch (err) {
        console.error("❌ [CLIENT TELEMETRY CRASH] Failed to map cluster state framework:", err);
        updateMainStatusView(statusView, '#ff3355', `⚠️ OFFLINE // CLOUD CONNECTOR INTERRUPTED`);
        toggleManualBootTray(false);
    }
}


// ============================================================================
// 🛠️ DYNAMIC OBSERVABILITY ENGINE DRAW LOOPS
// ============================================================================

function updateMainStatusView(element, color, text) {
    if (!element) return;
    element.style.color = color;
    element.textContent = text;
}

function toggleManualBootTray(shouldShow) {
    const tray = document.getElementById('manual-allocation-tray');
    if (tray) tray.style.display = shouldShow ? 'block' : 'none';
}




function renderObserverQuotaTable(masterPayload) {
    const tableBody = document.getElementById('quota-telemetry-rows');
    if (!tableBody) return;

    // Guard rail if server payload context is entirely vacant or missing inner structural mappings
    if (!masterPayload || !masterPayload.success || !masterPayload.meta || !masterPayload.meta.services) {
        tableBody.innerHTML = `<tr><td colspan="4" class="quota-empty-alert">No cloud infrastructure systems verified online.</td></tr>`;
        return;
    }

    const services = masterPayload.meta.services;
    let rowsHtml = '';
    let processedMetricsCount = 0;

    // Loop through every provider service entry present in the consolidated object
    for (const [serviceName, serviceData] of Object.entries(services)) {
        // If a service completely failed its handshake, render a distinct warning alert row for it
        if (serviceData.success === false || !serviceData.quotas) {
            rowsHtml += `
                <tr class="quota-row-error text-danger-muted">
                    <td class="quota-cell-metric">⚠️ [${serviceName}] Telemetry Offlined</td>
                    <td colspan="3" class="quota-cell-error-message">${serviceData.error || 'Pipeline data vacant.'}</td>
                </tr>
            `;
            processedMetricsCount++;
            continue;
        }

        const quotas = serviceData.quotas;

        // Pattern A: Flattened / Single Property Layout (e.g., RunPod Wallet Matrix)
        if (quotas.metricName !== undefined) {
            const availabilityClass = parseFloat(String(quotas.available).replace(/[^0-9.-]+/g, '')) <= 0
                ? 'status-critical-text'
                : 'status-optimal-text';

            rowsHtml += `
                <tr class="quota-row quota-provider-${serviceName}">
                    <td class="quota-cell-metric">
                        <span class="provider-badge badge-runpod">[RunPod]</span> ${quotas.metricName}
                    </td>
                    <td class="quota-cell-value text-white">${quotas.inUse || quotas.usage || '$0.00'}</td>
                    <td class="quota-cell-value text-muted-dark">${quotas.limit || 'N/A'}</td>
                    <td class="quota-cell-value ${availabilityClass}">${quotas.available}</td>
                </tr>
            `;
            processedMetricsCount++;
        }
        // Pattern B: Keyed Dictionary Layout Object (e.g., Google Cloud Engine GPU limits map)
        else {
            for (const [metricName, metrics] of Object.entries(quotas)) {
                // Safely convert properties to floats for exact mathematical threshold checks
                const availNum = parseFloat(String(metrics.available).replace(/[^0-9.-]+/g, '')) || 0;
                const availabilityClass = availNum < 1 ? 'status-critical-text' : 'status-optimal-text';

                rowsHtml += `
                    <tr class="quota-row quota-provider-${serviceName}">
                        <td class="quota-cell-metric">
                            <span class="provider-badge badge-gcloud">[GCloud]</span> ${metricName.replace(/_/g, ' ')}
                        </td>
                        <td class="quota-cell-value text-white">${metrics.usage}</td>
                        <td class="quota-cell-value text-muted-dark">${metrics.limit}</td>
                        <td class="quota-cell-value ${availabilityClass}">${metrics.available}</td>
                    </tr>
                `;
                processedMetricsCount++;
            }
        }
    }

    // Secondary backstop verification if loop completes but no valid elements matched
    if (processedMetricsCount === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="quota-empty-alert">No active GPU quotas verified in this region.</td></tr>`;
        return;
    }

    tableBody.innerHTML = rowsHtml;
}

/**
 * Builds clear, diagnostic-equipped visual blocks for each remote compute instance
 */
function renderObserverVmMatrix(instances) {
    const container = document.getElementById('vm-pool-container');
    if (!container) return;

    if (!instances || instances.length === 0) {
        container.innerHTML = `<div class="vm-matrix-empty-msg">Zero hypervisor tracking structures online inside this zone pool.</div>`;
        return;
    }

    container.innerHTML = instances.map(instance => {
        // Resolve target state modifier classes dynamically
        let statusModifierClass = 'state-staging';
        if (instance.status === 'RUNNING') statusModifierClass = 'state-active';
        if (['STOPPING', 'TERMINATED', 'PROVISIONING_FAILED'].includes(instance.status)) statusModifierClass = 'state-failed';

        return `
            <div class="vm-instance-card">
                <div class="vm-card-header">
                    <span class="vm-card-name">${instance.name}</span>
                    <span class="vm-card-badge ${statusModifierClass}">
                        ${instance.status}
                    </span>
                </div>
                <div class="vm-card-detail">
                    📍 IP Reference: <span class="text-muted-light">${instance.ip || 'Unassigned'}</span>
                </div>
                ${instance.endpoint ? `
                <div class="vm-card-detail">
                    🔗 Worker Link: <a href="${instance.endpoint}" target="_blank" class="vm-worker-link">${instance.endpoint}</a>
                </div>` : ''}
                ${instance.diagnostic ? `
                <div class="vm-card-diagnostic-alert">
                    ⚠️ ${instance.diagnostic}
                </div>` : ''}
            </div>
        `;
    }).join('');
}



async function triggerManualAllocationClaim() {
    console.log("🚀 [MANUAL SYSTEM ALLOCATION] Bypassing automatic manager timers...");
    const statusView = document.getElementById('project-selector');
    updateMainStatusView(statusView, '#ffff00', `🚀 CLAIM TRIGGER DISPATCHED: Spawning machine...`);

    try {
        const CLUSTER_MANAGER_URL = window.projectConfig?.ACTIVE_PROJECT_ID
            ? `https://${projectConfig.REGION}-${projectConfig.ACTIVE_PROJECT_ID}.cloudfunctions.net/clusterManager`
            : '/api/cluster/status';
        const res = await fetch(`${CLUSTER_MANAGER_URL}?t=${Date.now()}`, { method: 'POST' });
        const result = await res.json();
        console.log("📥 [MANUAL ALLOCATION COMPLETED]", result);

        // Fast pulse refresh 1 second post-trigger to capture instant hypervisor response status
        setTimeout(syncClusterHardware, 1000);
    } catch (err) {
        console.error("❌ Programmatic override allocation error:", err);
    }
}


/**
 * Scale Cluster: Dispatches immediate instructions to add another parallel node
 * (Unused for simple setups, but left intact for multi-worker scale options)
 */
async function scaleClusterNodeUp() {
    console.log("📡 Requesting secondary parallel computational cluster allocation...");
    try {
        const CLUSTER_MANAGER_URL = projectConfig.ACTIVE_PROJECT_ID
            ? `https://${projectConfig.REGION}-${projectConfig.ACTIVE_PROJECT_ID}.cloudfunctions.net/clusterManager`
            : '/api/cluster/status'
        await fetch(`${CLUSTER_MANAGER_URL}?t=${Date.now()}`, { method: 'POST' });
        syncClusterHardware();
    } catch (e) {
        console.error("Cluster expansion exception:", e);
    }
}

/**
 * Render Action: Snaps viewport frames and multicasts prompt vectors to Juggernaut-Z
 */
async function renderMulticastScene() {
    if (!activeWorkerEndpoint) {
        alert("Inference vector blocked: No hot Juggernaut-Z nodes currently exposed in the active pool.");
        return;
    }

    const stage = document.getElementById('canvas-stage');
    const promptStr = document.getElementById('prompt-input').value;
    const coordsRaw = document.getElementById('coords-input').value;

    // Parse out string percentages: "70, 0, 30, 30" -> [70, 0, 30, 30]
    const coords = coordsRaw.split(',').map(num => parseInt(num.trim(), 10));
    if (coords.length !== 4 || coords.some(isNaN)) {
        alert("Invalid spatial structure layout window mapping coordinates.");
        return;
    }

    // Visual loading response state handling
    const processingIndicator = document.createElement('div');
    processingIndicator.style.position = 'absolute';
    processingIndicator.style.background = 'rgba(16, 16, 20, 0.85)';
    processingIndicator.style.inset = '0';
    processingIndicator.style.display = 'flex';
    processingIndicator.style.alignItems = 'center';
    processingIndicator.style.justifyContent = 'center';
    processingIndicator.style.fontFamily = 'monospace';
    processingIndicator.style.color = 'var(--accent)';
    processingIndicator.innerHTML = `<span>⚡ Multicasting Spatial Dream Matrix... [${promptStr}]</span>`;
    stage.appendChild(processingIndicator);

    try {
        // 1. Generate an instant runtime image canvas blob frame from your stage viewport context
        const canvasBlob = await captureStageSnapshotBlob(stage);

        // 2. Wrap payloads tightly inside a multi-part form layout map
        let formData = new FormData();
        formData.append("prompt", promptStr);
        formData.append("x", coords[0]);
        formData.append("y", coords[1]);
        formData.append("w", coords[2]);
        formData.append("h", coords[3]);
        formData.append("file", canvasBlob, "stage-frame.jpg");

        console.log(`📡 Shipping binary canvas packet directly to GPU engine: ${activeWorkerEndpoint}`);

        const RELAY_MANAGER_URL = projectConfig.ACTIVE_PROJECT_ID
            ? `https://${projectConfig.REGION}-${projectConfig.ACTIVE_PROJECT_ID}.cloudfunctions.net/spatialRelay`
            : '/api/spatial/relay'
        // 3. Fire payload across the private data network boundary straight into Python FastAPI
        const response = await fetch(`${RELAY_MANAGER_URL}?t=${Date.now()}`, {
            method: 'POST',
            headers: {
                // Tell the Cloud Function where to forward the payload!
                'x-target-endpoint': `${activeWorkerEndpoint}/api/spatial/multicast`
            },
            body: formData
        });

        if (!response.ok) throw new Error(`Inference loop collapsed with status code: ${response.status}`);

        // 4. Ingest raw binary array map directly back into image sources
        const freshImageBlob = await response.blob();
        const outputImageUrl = URL.createObjectURL(freshImageBlob);

        // 5. Render freshly infected composition frame cleanly inside viewport
        stage.innerHTML = `<img src="${outputImageUrl}" style="width:100%; height:100%; object-fit:contain;" />`;

    } catch (err) {
        console.error("❌ Computational generation array dropped:", err);
        alert(`Generation Loop Interrupted: ${err.message}`);
        processingIndicator.remove();
    }
}

/**
 * UTILITY: Extracted vector frame compiler loops
 */
function captureStageSnapshotBlob(stageElement) {
    return new Promise((resolve) => {
        // Fallback generation framework block for instant local environment testing:
        const mockCanvas = document.createElement('canvas');
        mockCanvas.width = 512;
        mockCanvas.height = 512;
        const ctx = mockCanvas.getContext('2d');
        ctx.fillStyle = '#16161e';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#00ffcc';
        ctx.font = '14px monospace';
        ctx.fillText('Illustrious Base Canvas Frame Reference', 40, 250);

        mockCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.90);
    });
}


const multicastButton = document.getElementById('multicast-scene')
multicastButton.addEventListener('click', handleGenerate)
document.getElementById('add-layer').addEventListener('click', generateCameraDome.bind(null, void 0))
document.getElementById('claim-instance').addEventListener('click', triggerManualAllocationClaim)


document.getElementById('observer-panel').addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    // Slide Control Panel out of viewport left, slide Cloud Observer into focus right
    document.getElementById('control-panel').classList.remove('active');
    document.getElementById('cloud-observer').classList.add('active');
    return false;
});

document.getElementById('control-switch').addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    // Slide Cloud Observer out of viewport right, slide Control Panel back into focus left
    document.getElementById('cloud-observer').classList.remove('active');
    document.getElementById('control-panel').classList.add('active');
    return false;
});

// Mobile viewport Canvas toggles
const toggleCanvasBtn = document.getElementById('toggle-canvas');
if (toggleCanvasBtn) {
    toggleCanvasBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.add('canvas-mode');
        return false;
    });
}

const backToControlsBtn = document.getElementById('back-to-controls');
if (backToControlsBtn) {
    backToControlsBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.remove('canvas-mode');
        return false;
    });
}


const progressElement = document.getElementById('local-model-progress');
const progressText = document.getElementById('local-model-progress-text');
const generalProgressElement = document.getElementById('general-progress');
const generalProgressText = document.getElementById('general-progress-text');
const toggleCheckbox = document.getElementById('local-model-toggle');

toggleCheckbox.addEventListener('change', (e) => {
    if (e.target.checked && !worker) {
        bootWllamaWorker()
    }
});

let worker


async function bootWllamaWorker() {

    worker = new Worker(DEFAULT_WORKER, DEFAULT_WORKER.includes('wllama') ? { type: 'module' } : {});

    worker.onerror = (err) => console.error("Worker error:", err);
    worker.onmessage = workerResponseInterface;

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


    } else if (type === 'SEARCH_RESULTS') {


    }
}


let jinjaText
let grammerText


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
    }
}


let searchWorker



document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Illustrious Client Canvas Layer Mounted.");
    initializeClusterStatus();

    // 👉 Only render the administrative config wheel if running locally
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        injectSetupSettingsCog();
    }

    // Toggle Collapsible Scene Builder section
    const sceneBuilderToggle = document.getElementById('scene-builder-toggle');
    const sceneBuilder = document.getElementById('scene-builder');
    const sceneBuilderChevron = document.getElementById('scene-builder-chevron');

    if (sceneBuilderToggle && sceneBuilder) {
        sceneBuilderToggle.addEventListener('click', () => {
            const isCollapsed = sceneBuilder.classList.toggle('collapsed');
            if (sceneBuilderChevron) {
                sceneBuilderChevron.textContent = isCollapsed ? '▼' : '▲';
            }
        });
    }

    // Immediately poll cluster health parameters on page entrance
    syncClusterHardware();
    // Maintain a steady 10-second monitoring cycle over cluster health matrices
    clusterPollInterval = setInterval(syncClusterHardware, DEFAULT_SYNC);

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
});



async function handleGenerate() {
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


function parseTokens(statement) {
    // Regex matches either words/formulas (nouns/links) or arrays of numbers/formulas (specs)
    const tokenRegex = /\[([^\]]+)\]/g;
    const items = [];
    let match;

    while ((match = tokenRegex.exec(statement)) !== null) {
        const rawContent = match[1].trim();

        // 1. Identify Specs: contains commas
        if (rawContent.includes(',')) {
            // Split by comma to get the individual metric strings/formulas
            const specArray = rawContent.split(',').map(s => s.trim());
            items.push({ type: 'specs', value: specArray });
        }
        // 2. Identify Links: starts with an @ sign or contains operators with @
        else if (rawContent.includes('@')) {
            items.push({ type: 'links', value: rawContent });
        }
        // 3. Identify Nouns: everything else (split spaces into an array)
        else {
            const nounArray = rawContent.split(/\s+/).filter(Boolean);
            items.push({ type: 'nouns', value: nounArray });
        }
    }

    return items;
}


function resolveRelativeObject(parsedSequence, absoluteNounCount, activeScene) {
    if (absoluteNounCount <= 0) return null;

    // Get the previous noun token by tracking absolute sequence position
    const nounTokens = parsedSequence.filter(o => o.type === 'nouns');
    const relativeToken = nounTokens[absoluteNounCount - 1];

    if (!relativeToken || !relativeToken.value || relativeToken.value.length === 0) {
        return null;
    }

    let relativeObject = null;
    activeScene.traverse(function (child) {
        if (relativeToken.value.includes(child.name)) {
            relativeObject = child;
        }
    });
    return relativeObject;
}


function createSpatialObject(primaryNoun, nunuClasses, THREE) {
    let geometry, material;
    let createdObject = null;
    const normalizedType = primaryNoun.toLowerCase();

    if (normalizedType.includes('pointlight')) {
        return new THREE.PointLight(0xffffff, 1, 100);
    } else if (normalizedType.includes('directionallight')) {
        return new THREE.DirectionalLight(0xffffff, 1);
    } else if (normalizedType.includes('ambientlight')) {
        return new THREE.AmbientLight(0x404040);
    } else if (normalizedType.includes('spotlight')) {
        return new THREE.SpotLight(0xffffff);
    } else if (normalizedType.includes('audiolistener')) {
        return new THREE.AudioListener();
    } else if (normalizedType.includes('gridhelper')) {
        return new THREE.GridHelper(10, 10);
    } else if (normalizedType.includes('axeshelper')) {
        return new THREE.AxesHelper(5);
    } else if (normalizedType.includes('arrowhelper')) {
        const dir = new THREE.Vector3(0, 1, 0);
        const origin = new THREE.Vector3(0, 0, 0);
        return new THREE.ArrowHelper(dir, origin, 1, 0xffff00);
    }

    if (normalizedType.includes('cylinder')) {
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
    } else if (normalizedType.includes('sphere')) {
        geometry = new THREE.SphereGeometry(0.5, 16, 16);
    } else if (normalizedType.includes('plane')) {
        geometry = new THREE.PlaneGeometry(1, 1);
    } else if (normalizedType.includes('circle')) {
        geometry = new THREE.CircleGeometry(0.5, 16);
    } else if (normalizedType.includes('torus')) {
        geometry = new THREE.TorusGeometry(0.5, 0.2, 8, 24);
    } else if (normalizedType.includes('cone')) {
        geometry = new THREE.ConeGeometry(0.5, 1, 16);
    } else {
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    if (normalizedType.includes('basic')) {
        material = new THREE.MeshBasicMaterial({ color: 0xAEB2F8 });
    } else if (normalizedType.includes('phong')) {
        material = new THREE.MeshPhongMaterial({ color: 0xAEB2F8 });
    } else {
        material = new nunuClasses.Material({
            color: 0xAEB2F8,
            roughness: 0.4
        });
    }

    return new nunuClasses.Mesh(geometry, material);
}


function evaluateSpatialFormula(expr, currentIdxValue) {
    let cleanExpr = expr.replace(/@idx/g, currentIdxValue);
    // Added both fw and fd metrics to prevent fallback failures
    const fw = 2.0;
    const fd = 1.5;
    try {
        return Function(`"use strict"; const fw = ${fw}; const fd = ${fd}; return (${cleanExpr})`)();
    } catch (e) {
        return parseFloat(cleanExpr) || 0;
    }
}


async function parseSpatialCommands(inputStr, currentIdxValue = 0) {
    const THREE = require('three');
    const parsedSequence = parseTokens(inputStr);
    const activeScene = window.nunu.getScene();

    let lastNouns = null;
    let defaultSpec = ["0", "0", "0", "0", "0", "0", "0"];
    let nounTokenCount = 0; // Tracks the total observed sequential noun tokens

    for (let i = 0; i < parsedSequence.length; i++) {
        const token = parsedSequence[i];

        if (token.type === 'nouns') {
            lastNouns = token.value;
            nounTokenCount++;
        }

        else if (token.type === 'specs') {
            const specValues = token.value;
            const activeSpec = (specValues && specValues.length >= 6) ? specValues : defaultSpec;
            const primaryNoun = (lastNouns && lastNouns.length > 0) ? lastNouns[lastNouns.length - 1] : "cube";

            let targetObject = null;
            let relativeObject = null;

            // Resolve context index targets relative to current token sequence positions
            const hasIndexToken = activeSpec.some(val => val.includes('@idx')) || primaryNoun.includes('@idx');
            if (hasIndexToken) {
                relativeObject = resolveRelativeObject(parsedSequence, nounTokenCount - 1, activeScene);
            }

            if (lastNouns && lastNouns.length > 0) {
                const searchName = primaryNoun.replace('@idx', currentIdxValue);
                activeScene.traverse(function (child) {
                    if (child.name === searchName) {
                        targetObject = child;
                    }
                });
            }

            if (!targetObject) {
                const nunuClasses = THREE.resolveNunuClasses();
                targetObject = createSpatialObject(primaryNoun, nunuClasses, THREE);
                targetObject.name = primaryNoun.replace('@idx', currentIdxValue);

                window.nunu.addObject(targetObject, activeScene);

                applyTransformations(targetObject, activeSpec, currentIdxValue, relativeObject);
                currentIdxValue++;
            } else {
                applyTransformations(targetObject, activeSpec, currentIdxValue, relativeObject);
            }

            window.nunu.gui.updateInterface();
        }
    }
}



//parseSpatialCommands('[elephant][0,0,0,0,0,0,1] [red][0,0,0,0,0,0,1] [balloon][fw*@idx,fd*@idx,0,0,0,0,1]')

function applyTransformations(targetObject, activeSpec, indexContext, relativeObject) {
    // Evaluate positions passing the corresponding spatial axis tag
    const posX = evaluateSpatialFormula(activeSpec[0], indexContext, relativeObject, 'x');
    const posY = evaluateSpatialFormula(activeSpec[1], indexContext, relativeObject, 'y');
    const posZ = evaluateSpatialFormula(activeSpec[2], indexContext, relativeObject, 'z');

    targetObject.position.set(posX, posY, posZ);

    // Evaluate rotations (mapping fallback anchors to rotation axes if needed)
    if (activeSpec.length >= 6) {
        const rotX = evaluateSpatialFormula(activeSpec[3], indexContext, relativeObject, 'x');
        const rotY = evaluateSpatialFormula(activeSpec[4], indexContext, relativeObject, 'y');
        const rotZ = evaluateSpatialFormula(activeSpec[5], indexContext, relativeObject, 'z');

        targetObject.rotation.set(rotX, rotY, rotZ);
    }
}



function evaluateSpatialFormula(expr, indexContext, relativeObject, axis) {
    let baseCoordinate = 0;
    if (relativeObject && relativeObject.position) {
        baseCoordinate = relativeObject.position[axis] || 0;
    }

    let fw = 1.0;
    let fd = 1.0;
    let currentAxisDimension = 1.0;

    if (relativeObject) {
        const THREE = require('three');
        relativeObject.updateMatrixWorld(true);
        if (relativeObject.geometry) {
            relativeObject.geometry.computeBoundingBox();
        }

        const box = new THREE.Box3().setFromObject(relativeObject);
        const size = new THREE.Vector3();
        box.getSize(size);

        fw = size.x !== 0 ? size.x : 1.0;
        fd = size.z !== 0 ? size.z : 1.0;

        if (axis === 'x') currentAxisDimension = fw;
        else if (axis === 'z') currentAxisDimension = fd;
        else currentAxisDimension = (size.y !== 0) ? size.y : 1.0;
    }

    let cleanExpr = expr.trim();

    // Contextual implicit check: If the formula starts with variable shorthand notation,
    // stack the previous base coordinate accumulation calculation to the front.
    // TODO: handle all edge cases and ordering, THIS WON'T ALWAYS BE TRUE!
    if (cleanExpr.startsWith('fw') || cleanExpr.startsWith('fd') || cleanExpr.startsWith('@idx')) {
        cleanExpr = `@0 + ${cleanExpr}`;
    }

    // Centralized safe string substitution mapping
    cleanExpr = cleanExpr.replace(/\s+/g, '')
        .replace(/@0/g, baseCoordinate)
        .replace(/fw/g, fw)
        .replace(/fd/g, fd)
        .replace(/@idx/g, currentAxisDimension);

    return parseSimpleExpression(cleanExpr);
}


function parseSimpleExpression(pureMathExpr) {
    // 1. Precise Lexical Tokenizer (Handles numbers, operators, and parentheses)
    const rawTokens = pureMathExpr.match(/(\d*\.?\d+)|([\+\-\*\/\(\)])/g);
    if (!rawTokens) return parseFloat(pureMathExpr) || 0;

    // 2. Convert Infix to Postfix via Shunting-yard algorithm
    const postfixQueue = [];
    const operatorStack = [];

    const precedence = {
        '+': 1,
        '-': 1,
        '*': 2,
        '/': 2
    };

    for (let i = 0; i < rawTokens.length; i++) {
        const token = rawTokens[i];

        if (!isNaN(parseFloat(token))) {
            // Token is a number, push straight to output queue
            postfixQueue.push(parseFloat(token));
        } else if (token === '(') {
            operatorStack.push(token);
        } else if (token === ')') {
            // Pop operators off the stack to output queue until reaching matching '('
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                postfixQueue.push(operatorStack.pop());
            }
            operatorStack.pop(); // Discard the opening parenthesis
        } else {
            // Token is an operator (+, -, *, /)
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1] !== '(' &&
                precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
            ) {
                postfixQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        }
    }

    // Flush remaining operators from stack to queue
    while (operatorStack.length > 0) {
        postfixQueue.push(operatorStack.pop());
    }

    // 3. Evaluate Postfix Expression Queue
    const evaluationStack = [];

    for (let i = 0; i < postfixQueue.length; i++) {
        const token = postfixQueue[i];

        if (typeof token === 'number') {
            evaluationStack.push(token);
        } else {
            const right = evaluationStack.pop() || 0;
            const left = evaluationStack.pop() || 0;

            switch (token) {
                case '+': evaluationStack.push(left + right); break;
                case '-': evaluationStack.push(left - right); break;
                case '*': evaluationStack.push(left * right); break;
                case '/': evaluationStack.push(left / (right || 1)); break; // Prevent divide by zero
            }
        }
    }

    return evaluationStack[0] || 0;
}



async function populateSelectedPanelsWithTextures(base64ImageArray) {
    const THREE = require('three');
    const nunuClasses = THREE.resolveNunuClasses();

    // 1. Harvest Nunu's active multi-select array from the interface tree tracker
    // Nunu typically tracks highlighted objects in an array named 'selectedObjects' or via its selection state
    const selectedObjects = window.nunu.gui.panel.treeView.selectedObjects
        || window.nunu.selectedObjects
        || [];

    // Filter the selection to ensure we are only manipulating visible mesh configurations
    const targetPanels = selectedObjects.filter(obj => obj.isMesh);

    if (targetPanels.length === 0) {
        console.warn("No active mesh panels are highlighted in the Project Explorer. Multi-select your dome panels first!");
        return;
    }

    console.log(`Processing image textures onto ${targetPanels.length} selected Nunu panels...`);

    // 2. Iterate through the selections (up to 16 or the limit of the returned image array)
    const iterationLimit = Math.min(targetPanels.length, base64ImageArray.length);

    for (let i = 0; i < iterationLimit; i++) {
        const currentPanel = targetPanels[i];
        const rawBase64 = base64ImageArray[i];

        // 3. Construct a standard HTML image payload frame to feed into the Texture Loader
        const img = new Image();
        img.src = rawBase64.startsWith('data:') ? rawBase64 : `data:image/jpeg;base64,${rawBase64}`;

        // Instantiate using the reflection-harvested Texture constructor context
        const texture = new nunuClasses.Texture(img);
        texture.needsUpdate = true; // Tell the GPU pipeline to upload the fresh image pixel stream

        // 4. Create an independent texture material instance matching the BSP style signature
        const panelMaterial = new nunuClasses.Material({
            name: `${currentPanel.name}_AI_Texture`,
            side: THREE.DoubleSide,
            map: texture,
            transparent: false,
            roughness: 0.6,
            metalness: 0.1
        });

        // 5. Swap the asset structure on the live panel mesh object
        currentPanel.material = panelMaterial;
    }

    // Force the editor viewport matrix and properties trees to synchronize
    window.nunu.gui.updateInterface();
    console.log("Successfully projected the 16-frame grid layout matrix onto highlighted panel selections.");
}




async function generateCameraDome(gridSize = 4) {
    const THREE = require('three');
    const nunuClasses = THREE.resolveNunuClasses(); // Harvest original wrappers safely
    const activeScene = window.nunu.getScene();

    let camera = activeScene.defaultCamera;
    activeScene.traverse(function (child) {
        if (child.isCamera && !camera) {
            camera = child;
        }
    });

    if (!camera) {
        console.error("Could not find an active camera view.");
        return;
    }

    const domeGroup = new THREE.Group();
    domeGroup.name = `GeodesicDome_${gridSize}x${gridSize}`;
    window.nunu.addObject(domeGroup, activeScene);

    const radius = 15;
    const hFov = (60 * Math.PI) / 180;
    const vFov = (45 * Math.PI) / 180;

    // --- Airtight Spherical Projection Fix ---
    // Instead of raw squashed lat/lon coordinates, map using an un-warped equidistant cylindrical model
    const mapToSphere = (vPct, hPct) => {
        const lon = hPct * hFov;
        const lat = vPct * vFov;

        const x = radius * Math.sin(lon) * Math.cos(lat);
        const y = radius * Math.sin(lat);
        const z = -radius * Math.cos(lon) * Math.cos(lat);
        return new THREE.Vector3(x, y, z);
    };

    // 1. Generate the vertex grid context
    const vertexGrid = [];
    for (let r = 0; r <= gridSize; r++) {
        vertexGrid[r] = [];
        const vPct = (r / gridSize) - 0.5;
        for (let c = 0; c <= gridSize; c++) {
            const hPct = (c / gridSize) - 0.5;
            vertexGrid[r][c] = mapToSphere(vPct, hPct);
        }
    }

    // 2. Build the independent watertight panel items
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const pBotLeft = vertexGrid[row][col];
            const pBotRight = vertexGrid[row][col + 1];
            const pTopLeft = vertexGrid[row + 1][col];
            const pTopRight = vertexGrid[row + 1][col + 1];

            // Calculate precise shared geometric center point
            const center = new THREE.Vector3()
                .addVectors(pTopLeft, pTopRight)
                .add(pBotLeft)
                .add(pBotRight)
                .multiplyScalar(0.25);

            // Subtract center coordinates to build local offset arrays
            const localTL = pTopLeft.clone().sub(center);
            const localTR = pTopRight.clone().sub(center);
            const localBL = pBotLeft.clone().sub(center);
            const localBR = pBotRight.clone().sub(center);

            const geometry = new THREE.BufferGeometry();

            // Build the explicit triangle indices using CCW winding sequence
            const vertices = new Float32Array([
                localBL.x, localBL.y, localBL.z,
                localBR.x, localBR.y, localBR.z,
                localTL.x, localTL.y, localTL.z,

                localBR.x, localBR.y, localBR.z,
                localTR.x, localTR.y, localTR.z,
                localTL.x, localTL.y, localTL.z
            ]);

            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();

            const material = new nunuClasses.Material({
                color: 0xAEB2F8, // --ace-blue 
                roughness: 0.5,
                metalness: 0.1,
                side: THREE.DoubleSide
            });

            const panelMesh = new nunuClasses.Mesh(geometry, material);
            panelMesh.name = `Panel_R${row}_C${col}`;

            // Position panel node at center transform
            panelMesh.position.copy(center);

            // ❌ REMOVED: panelMesh.lookAt(0,0,0);
            // DO NOT let independent panels compute individual lookAt vectors.
            // Leaving rotation matching the parent group naturally eliminates the twist gap!

            window.nunu.addObject(panelMesh, domeGroup);
        }
    }

    // 3. Align parent matrix precisely onto active camera tracking transform
    const camPos = new THREE.Vector3();
    const camRot = new THREE.Quaternion();
    camera.getWorldPosition(camPos);
    camera.getWorldQuaternion(camRot);

    domeGroup.position.copy(camPos);
    domeGroup.quaternion.copy(camRot);

    window.nunu.gui.updateInterface();
    console.log(`Airtight geodesic panel array compiled successfully.`);
}



function injectSfMToNunu(sfmEntity, entityName = "SfM_PointCloud_Node") {
    const nunuClasses = resolveNunuClasses();
    const activeScene = window.nunu.getScene();

    // 1. Ensure the entity carries a clean name descriptor for the Nunu Tree Hierarchy
    sfmEntity.name = entityName;

    // 2. Walk the incoming SfM entity tree to upgrade raw materials to Nunu's monitored types if needed
    sfmEntity.traverse(function (child) {
        if (child.isPoints) {
            child.name = child.name || "Points_SubCloud";
            // Keeps WebSfM's custom vertex coloring pipelines intact
            child.material.vertexColors = true;
        }
        else if (child.isMesh) {
            child.name = child.name || "Mesh_Surface";
            // If it's a solid reconstructed mesh, upgrade to Nunu's tracked material structure
            if (!(child.material instanceof nunuClasses.Material)) {
                const oldMat = child.material;
                child.material = new nunuClasses.Material({
                    name: "SfM_Surface_Mat",
                    color: oldMat.color,
                    map: oldMat.map,
                    side: THREE.DoubleSide
                });
            }
        }
    });

    // 3. Register the root SfM container directly into Nunu's active runtime tree layout
    window.nunu.addObject(sfmEntity, activeScene);

    // 4. Force Nunu UI tree view and property layers to refresh immediately
    window.nunu.gui.updateInterface();

    console.log(`Successfully merged SfM structural entity [${entityName}] into Nunu workspace context.`);
}



function createFrameRater(targetFps, callback) {
    const fpsInterval = 1000 / targetFps;

    const startTime = performance.now();
    let frameCount = 0;

    const eventStack = [];
    let isFlushing = false; // The single logic protector

    // Permanent heartbeat interval running from startup
    setInterval(() => {
        // Only trigger if items are waiting AND we aren't currently inside a paint cycle
        if (eventStack.length > 0 && !isFlushing) {

            // Shallow copy and clear the stack immediately
            const currentBatch = [...eventStack];
            eventStack.length = 0;

            requestAnimationFrame((paintTime) => {
                isFlushing = true; // Lock out the interval thread during execution

                frameCount++;
                const t = paintTime - startTime;

                try {
                    if (typeof callback === 'function') {
                        // Drain the batch execution. Isolate each callback so a
                        // single throw can't drop the rest of the batch.
                        for (let i = 0; i < currentBatch.length; i++) {
                            try {
                                callback(currentBatch[i], t, frameCount);
                            } catch (e) {
                                console.error('frame callback failed', e);
                            }
                        }
                    }
                } finally {
                    // Always release the lock, even if a callback throws, so the
                    // limiter can never freeze permanently.
                    isFlushing = false;
                }
            });
        }
    }, fpsInterval);

    return {
        requestFrameUpdate(e) {
            eventStack.push(e);
        }
    };
}



