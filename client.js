
//const DEFAULT_MODEL = 'onnx-community/bge-small-en-v1.5-ONNX'
//const DEFAULT_MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct'
const DEFAULT_MODEL = 'Goekdeniz-Guelmez/Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1-gguf/josiefied-qwen2.5-0.5b-instruct-abliterated-v1.Q4_K_M.gguf'
const DEFAULT_LORA = 'Goekdeniz-Guelmez/Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1/josiefied-qwen-spatial-engine.gguf'
const DEFAULT_JINJA = '/loras/spatial_engine/chat_template.jinja'
const DEFAULT_GBNF = '/loras/spatial_engine/grammar.gbnf'

const DEFAULT_PARQUET = 'https://storage.googleapis.com/quake-games/models/github.parquet';
const SEARCH_WORKER = '/components/llm-workers/objaverse/catalog-worker.js';

const CONVERT_WORKER = '/components/llm-workers/convert/convert-worker.js';


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
    cogWrapper.target = '_blank'
    cogWrapper.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    `;

    header.appendChild(cogWrapper);
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



// ============================================================================
// 🛠️ DYNAMIC OBSERVABILITY ENGINE DRAW LOOPS
// ============================================================================

function updateMainStatusView(element, color, text) {
    if (!element) return;
    element.style.color = color;
    element.textContent = text;
}





const multicastButton = document.getElementById('multicast-scene')

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


if (!window.modules) {
    window.modules = {}
    window.modules['toggle/canvas'] = {}
    window.modules['toggle/canvas'][void 0] = e => {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.remove('canvas-mode');
        return false;
    }

    window.modules['about/open'] = {}
    window.modules['about/open'][void 0] = e => {
        window.open('https://github.com/briancullinan2/illustrious', '_blank');
    }
}



const progressElement = document.getElementById('local-model-progress');
const progressText = document.getElementById('local-model-progress-text');
const generalProgressElement = document.getElementById('general-progress');
const generalProgressText = document.getElementById('general-progress-text');
const toggleCheckbox = document.getElementById('local-model-toggle');


async function initializeFrontend() {

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

    bootAvailableWorkers()
}



