
//const DEFAULT_MODEL = 'onnx-community/bge-small-en-v1.5-ONNX'
const DEFAULT_MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct'


let projectConfig = {
    REGION: 'us-central1'
}

function injectSetupSettingsCog() {
    const panel = document.getElementById('control-panel');
    const header = panel?.querySelector('h2');
    if (!header) return;

    // Build the container anchor using your new class name template
    const cogWrapper = document.createElement('a');
    cogWrapper.href = 'http://localhost:4000/setup';
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
    window.location.href = 'http://localhost:4000/auth';
}


let activeWorkerEndpoint = null;
let clusterPollInterval = null;
let clusterConnectionActive = false;

document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Illustrious Client Canvas Layer Mounted.");
    initializeClusterStatus();

    // 👉 Only render the administrative config wheel if running locally
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        injectSetupSettingsCog();
    }


    // Immediately poll cluster health parameters on page entrance
    syncClusterHardware();
    // Maintain a steady 10-second monitoring cycle over cluster health matrices
    clusterPollInterval = setInterval(syncClusterHardware, 10000);

    if (toggleCheckbox.checked) {
        worker.postMessage({
            type: 'LOAD_MODEL',
            payload: { modelUrl: DEFAULT_MODEL }
        });
    }
});


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


async function renderMulticastScene() {
    const stage = document.getElementById('canvas-stage');
    const prompt = document.getElementById('prompt-input').value;

    console.log(`📡 Dispatched Multicast Execution Target Chain...`);

    if (stage) {
        stage.innerHTML = `
            <div class="stage-generating-box">
                <span>⚡ Committing Multicast Engine Generation Loop...</span>
                <span class="stage-prompt-subtext">"${prompt}"</span>
            </div>
        `;
    }

    // TODO: Execute fetch POST against /api/cluster/allocate to spin the deployed gcloud GPU function
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

function addSceneSlice() {
    const prompt = document.getElementById('prompt-input').value;
    const coordsRaw = document.getElementById('coords-input').value;
    const stage = document.getElementById('canvas-stage');
    const coords = coordsRaw.split(',').map(num => parseInt(num.trim(), 10));

    if (coords.length !== 4 || coords.some(isNaN)) return;

    const sliceElement = document.createElement('div');
    sliceElement.style.position = 'absolute';
    sliceElement.style.left = `${coords[0]}%`;
    sliceElement.style.top = `${coords[1]}%`;
    sliceElement.style.width = `${coords[2]}%`;
    sliceElement.style.height = `${coords[3]}%`;
    sliceElement.style.border = '2px dashed var(--accent)';
    sliceElement.style.background = 'rgba(0, 255, 204, 0.03)';
    sliceElement.style.display = 'flex';
    sliceElement.style.alignItems = 'center';
    sliceElement.style.justifyContent = 'center';
    sliceElement.style.color = '#fff';
    sliceElement.style.fontFamily = 'monospace';
    sliceElement.style.fontSize = '11px';
    sliceElement.innerText = prompt;

    stage.appendChild(sliceElement);
}

document.getElementById('multicast-scene').addEventListener('click', handleGenerate)
document.getElementById('add-layer').addEventListener('click', addSceneSlice)
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


const worker = new Worker('/onnx/worker.js');
const progressElement = document.getElementById('local-model-progress');
const progressText = document.getElementById('local-model-progress-text');
const generalProgressElement = document.getElementById('general-progress');
const generalProgressText = document.getElementById('general-progress-text');
const toggleCheckbox = document.getElementById('local-model-toggle');

toggleCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        worker.postMessage({
            type: 'LOAD_MODEL',
            payload: { modelUrl: DEFAULT_MODEL }
        });
    }
});

worker.onmessage = function (e) {
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
    }
    else if (type === 'ERROR') {
        console.error('Worker Engine Error:', payload.message);
        progressText.textContent = 'Error';
        generalProgressText.textContent = 'Error';
    }
    else if (type === 'INFERENCE_COMPLETE') {
        const embeddings = payload.outputs.last_hidden_state.data;
        const dimensions = payload.outputs.last_hidden_state.dims;

        console.log('Received embedding chunk vector array:', embeddings);
        // Stream this vector chunk directly to your vector storage/processing layer
        renderOrIndexChunk(embeddings, dimensions);
    }
    else if(type === 'TOKEN_STREAM') {
        const outputElement = document.getElementById('output-display-container');
        outputElement.textContent += payload.delta;
        outputElement.scrollTop = outputElement.scrollHeight;
    }
};

async function handleGenerate() {
    const promptText = document.getElementById('prompt-input').value;
    const outputElement = document.getElementById('output-display-container');

    outputElement.textContent = promptText;

    worker.postMessage({
        type: 'RUN_INFERENCE',
        payload: {
            input_text: promptText,
            max_new_tokens: 1000,
            temperature: 0.8,
            top_k: 40
        }
    });
}

