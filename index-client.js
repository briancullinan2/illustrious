// index-client.js



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
 * Trigger master multicast calculation pipeline loops on serverless workers
 */
async function renderMulticastScene() {
    const stage = document.getElementById('canvas-stage');
    const prompt = document.getElementById('prompt-input').value;

    console.log(`📡 Dispatched Multicast Execution Target Chain...`);

    if (stage) {
        stage.innerHTML = `
            <div style="font-family: monospace; font-size: 13px; color: var(--accent); display:flex; flex-direction:column; gap:8px; align-items:center;">
                <span>⚡ Committing Multicast Engine Generation Loop...</span>
                <span style="color: var(--text-dim); font-size:11px;">"${prompt}"</span>
            </div>
        `;
    }

    // TODO: Execute fetch POST against /api/cluster/provision to spin the deployed gcloud GPU function
}

/**
 * Hand execution context over to your clean OAuth authentication gate
 */
function testAndRedirect() {
    console.log("🛰️ Initiating production OAuth handshake vector...");
    window.location.href = 'http://localhost:4000/auth';
}

// index-client.js

// 👉 CONFIGURATION BOUNDARY: Swap this with your public deployed Cloud Function URI
//const CLUSTER_MANAGER_URL = "https://us-central1-illustrious-499422.cloudfunctions.net/clusterManager";
const CLUSTER_MANAGER_URL = '/api/local-debug/cluster'


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
});


/**
 * Synchronize and parse global cluster node pool configurations from Google Cloud
 */
async function syncClusterHardware() {
    const statusView = document.getElementById('project-selector');

    try {
        console.log("🔄 [CLIENT TELEMETRY] Pinging cluster manager control layer...");
        const res = await fetch(CLUSTER_MANAGER_URL + '?t=' + Date.now(), { method: 'GET' });
        const data = await res.json();

        console.log(`📥 [CLIENT TELEMETRY] Response payload received (HTTP ${res.status}):`, data);

        // 1. Handle Active Auto-Boot / Relay Scaling States
        if (data.status === 'SCALING_UP') {
            if (statusView) {
                statusView.style.color = '#ffaa00';
                statusView.innerText = `🛰️ CLUSTER INITIALIZING: Kicking off baseline hardware allocation...`;
            }
            activeWorkerEndpoint = null;
            return;
        }

        // 2. 👉 INSERTED: Handle One-Time Storage Volume/Seeder Initializations (Mode A)
        if (data.status === 'INITIALIZING_STORAGE') {
            if (statusView) {
                statusView.style.color = '#00bcff';
                statusView.innerText = `⚙️ CORE STORAGE BOUNDARY: Seeding Juggernaut-Z weights...`;
            }
            activeWorkerEndpoint = null;
            return;
        }

        // 3. 👉 INSERTED: Handle Direct Worker Allocation Lifecycle Boots (Mode B Initial Handshake)
        if (data.status === 'INITIALIZING') {
            if (statusView) {
                statusView.style.color = '#ffff00';
                statusView.innerText = `⚡ PROVISIONING HARDWARE: Spot hypervisors allocating T4 VRAM maps...`;
            }
            activeWorkerEndpoint = null;
            return;
        }

        if (data.status === 'POOL_BLOCKED') {
            if (statusView) {
                statusView.style.color = '#ff3355';
                statusView.innerText = `🛑 POOL BLOCKED: ${data.message}`;
            }
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
                if (statusView) {
                    statusView.style.color = 'var(--accent)';
                    statusView.innerText = `🛰️ POOL ACTIVE // CHANNELS OPEN TO: ${hotNode.name}`;
                }
            } else {
                // Node is active in GCP, but its current cloud status string is PROVISIONING, STAGING, or REPAIRING
                const stagingNode = data.instances[0];
                console.log(`⏳ [CLIENT TELEMETRY] Node "${stagingNode.name}" is visible but unready. State: ${stagingNode.status}`);
                if (statusView) {
                    statusView.style.color = '#ffaa00';
                    statusView.innerText = `⏳ STAGING HARDWARE: ${stagingNode.name} is [${stagingNode.status}]`;
                }
                activeWorkerEndpoint = null;
            }
        } else {
            // Pool is empty and fallback trigger mechanisms didn't emit specialized status keys
            console.warn("⚠️ [CLIENT TELEMETRY] Cluster manager reported an empty instance array tracking layer.");
            if (statusView) {
                statusView.style.color = '#ffaa00';
                statusView.innerText = `⏳ STAGING HARDWARE TIER POOLS...`;
            }
            activeWorkerEndpoint = null;
        }

    } catch (err) {
        console.error("❌ [CLIENT TELEMETRY CRASH] Failed to map cluster state framework:", err);
        if (statusView) {
            statusView.style.color = '#ff3355';
            statusView.innerText = `⚠️ OFFLINE // CLOUD CONNECTOR INTERRUPTED`;
        }
    }
}

/**
 * Scale Cluster: Dispatches immediate instructions to add another parallel node
 * (Unused for simple setups, but left intact for multi-worker scale options)
 */
async function scaleClusterNodeUp() {
    console.log("📡 Requesting secondary parallel computational cluster allocation...");
    try {
        await fetch(CLUSTER_MANAGER_URL, { method: 'POST' });
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

        // 3. Fire payload across the private data network boundary straight into Python FastAPI
        const response = await fetch(`${activeWorkerEndpoint}/api/spatial/multicast`, {
            method: "POST",
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