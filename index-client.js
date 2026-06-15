// index-client.js
let clusterConnectionActive = false;
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Illustrious Client Canvas Layer Mounted.");
    initializeClusterStatus();

    // 👉 Only render the administrative config wheel if running locally
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        injectSetupSettingsCog();
    }
});



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
 * Handle individual layer generation data extraction slices
 */
function addSceneSlice() {
    const prompt = document.getElementById('prompt-input').value;
    const coordinatesRaw = document.getElementById('coords-input').value;
    const stage = document.getElementById('canvas-stage');

    // Parse out string arrays into clean integers: "70, 0, 30, 30" -> [70, 0, 30, 30]
    const coords = coordinatesRaw.split(',').map(num => parseInt(num.trim(), 10));

    if (coords.length !== 4 || coords.some(isNaN)) {
        alert("Invalid coordinate allocation matrix. Ensure standard format: X, Y, W, H");
        return;
    }

    console.log(`☣️ Layer Split Dispatched -> X:${coords[0]}% Y:${coords[1]}% W:${coords[2]}% H:${coords[3]}%`);

    // Dynamic absolute layout position frame injection mimicking image_ff6103 layout
    const sliceElement = document.createElement('div');
    sliceElement.className = 'canvas-slice-overlay';
    sliceElement.style.position = 'absolute';
    sliceElement.style.left = `${coords[0]}%`;
    sliceElement.style.top = `${coords[1]}%`;
    sliceElement.style.width = `${coords[2]}%`;
    sliceElement.style.height = `${coords[3]}%`;
    sliceElement.style.border = '2px dashed var(--accent)';
    sliceElement.style.background = 'rgba(0, 255, 204, 0.05)';
    sliceElement.style.display = 'flex';
    sliceElement.style.alignItems = 'center';
    sliceElement.style.justifyContent = 'center';
    sliceElement.style.padding = '10px';
    sliceElement.style.fontSize = '11px';
    sliceElement.style.fontFamily = 'monospace';
    sliceElement.style.color = '#fff';
    sliceElement.style.textShadow = '0 2px 4px #000';
    sliceElement.innerText = prompt;

    // Flush stage placeholders on manual layout injections
    const placeholder = stage.querySelector('.canvas-stage-ready-text');
    if (placeholder) placeholder.remove();

    stage.appendChild(sliceElement);
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

