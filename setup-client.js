let selectedProjectId = '';
let credentialData


async function loadEnvironment() {
    const res = await fetch('/api/local-env?t=' + Date.now());
    credentialData = await res.json();
    document.getElementById('auth-status').innerText = 'Profile Account: ' + credentialData.account;

    const listContainer = document.getElementById('project-list');
    listContainer.innerHTML = '';

    if (credentialData.projects.length === 0) {
        listContainer.innerHTML = '<li style="color: #ff3333; cursor: default;">No projects found. Please run "gcloud auth login"</li>';
        return;
    }

    credentialData.projects.forEach(p => {
        const li = document.createElement('li');

        // Append a subtle green checkmark icon indicator if config exists globally
        const statusIndicator = p.exists ? `<span style="color: var(--accent); margin-left: 10px;">✓</span>` : '';
        li.innerHTML = `<span>${p.name} ${statusIndicator}</span><span class="proj-id">${p.id}</span>`;

        const selectRow = () => {
            document.querySelectorAll('#project-list li').forEach(item => item.classList.remove('selected'));
            li.classList.add('selected');
            selectedProjectId = p.id;
            document.getElementById('next-1').disabled = false;

            document.getElementById('console-brand-link').href = `https://console.cloud.google.com/auth/branding?project=${p.id}`;
            document.getElementById('console-client-link').href = `https://console.cloud.google.com/auth/clients/create?project=${p.id}`;
            document.getElementById('console-brand-link-2').href = `https://console.cloud.google.com/auth/branding?project=${p.id}`


            // Auto-populate input boxes with the safe indicators if they exist
            document.getElementById('client-id').value = p.clientIdMask || '';
            document.getElementById('client-secret').value = p.clientSecretMask || '';
            document.getElementById('credential-path').innerHTML = 'Credentials will be save to: ' + credentialData.credentialPath + p.id + '.json'
        };

        li.onclick = selectRow;
        listContainer.appendChild(li);

        // 👉 AUTOMATIC AUTO-SELECT TRIGGER
        if (credentialData.autoSelectId && p.id === credentialData.autoSelectId) {
            selectRow();
        }
    });

    loadLocalFunctions(credentialData.functions)
}

function navigateStep(stepNum) {
    document.querySelectorAll('.step-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`step-${stepNum}`).classList.add('active');
    if (stepNum === 3 || stepNum === '3') {
        loadLocalFunctions(null);
    }
}

async function saveCredentials() {
    const clientId = document.getElementById('client-id').value.trim();
    const clientSecret = document.getElementById('client-secret').value.trim();

    if (!clientId || !clientSecret) {
        alert('Please fill out your OAuth Client data before proceeding.');
        return;
    }

    if (clientId.startsWith('....')) {
        navigateStep('2-5');
        return
    }

    const res = await fetch('/api/save-credentials?t=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId, clientId, clientSecret })
    });
    const result = await res.json();
    if (result.status === 'SUCCESS') {
        navigateStep('2-5'); // Transition seamlessly to the logo asset roulette view
    }
}


let localFunctionsList = [];
let selectedFunctionName = '';


async function loadLocalFunctions(forcedList) {
    const listContainer = document.getElementById('functions-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<li>Scanning cloud-functions matrices...</li>';

    try {
        // If we don't pass a forced cache array, fetch the fresh hybrid environment state
        if (!forcedList) {
            // Append the active project ID so the backend can run the live cross-reference check
            const res = await fetch(`/api/list-functions?t=${Date.now()}&projectId=${selectedProjectId}`);
            const data = await res.json();
            localFunctionsList = data.functions || [];
        } else {
            localFunctionsList = forcedList;
        }

        listContainer.innerHTML = '';

        if (localFunctionsList.length === 0) {
            listContainer.innerHTML = '<li class="list-empty-msg">No valid function folders found inside ./cloud-functions/</li>';
            document.getElementById('install-func-btn').disabled = true;
            document.getElementById('install-all-btn').disabled = true;
            return;
        }

        let anyDeployed = false;
        localFunctionsList.forEach((funcObj, idx) => {
            // Handle both flat array string fallbacks and our new object payload configuration format
            const name = typeof funcObj === 'string' ? funcObj : funcObj.name;
            const isDeployed = typeof funcObj === 'string' ? false : funcObj.isDeployed;
            if (isDeployed) {
                anyDeployed = true;
            }
            const li = document.createElement('li');

            // Map out your status indicator strings cleanly using dedicated classes
            const statusLabel = isDeployed
                ? `<span class="func-status-badge live">LIVE ✓</span>`
                : `<span class="func-status-badge local">LOCAL ONLY</span>`;

            li.innerHTML = `<span>📂 ${name}</span><span class="proj-id">${statusLabel}</span>`;

            const selectFuncRow = () => {
                document.querySelectorAll('#functions-list li').forEach(item => item.classList.remove('selected'));
                li.classList.add('selected');
                selectedFunctionName = name;
                document.getElementById('install-func-btn').disabled = false;

                // Slick UI detail: Change the button label if it's already live to indicate an update run
                document.getElementById('install-func-btn').innerText = isDeployed ? "Sync/Update Function" : "Deploy Selected";
            };

            li.onclick = selectFuncRow;
            listContainer.appendChild(li);

            // Auto-select the first item found by default
            if (idx === 0) selectFuncRow();
        });

        document.getElementById('install-all-btn').disabled = false;

        if (anyDeployed) {
            const btn = document.getElementById('install-func-btn');
            const allBtn = document.getElementById('install-all-btn');
            btn.disabled = false;
            allBtn.disabled = false;
            document.getElementById('back-3').disabled = false;
            document.getElementById('next-3').disabled = false;
        }
    } catch (err) {
        listContainer.innerHTML = `<li class="func-scan-failed">Scan failed: ${err.message}</li>`;
    }
}


const term = document.getElementById('terminal-output');

// Helper to establish connection to the combined server port on demand
function connectLogStream() {
    return new Promise((resolve) => {
        // Pointing straight to port 4000 without independent paths
        const socket = new WebSocket('ws://localhost:4000');

        socket.onopen = () => {
            console.log("📡 Deployment stream connection active.");
            resolve(socket);
        };

        socket.onmessage = (event) => {
            if (term) {
                term.innerText += event.data;
                term.scrollTop = term.scrollHeight;
            }
        };

        socket.onerror = (err) => console.error("Stream disrupted:", err);
    });
}

async function executeDeploymentRequest(functionName) {
    const res = await fetch('/api/deploy-function?t=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId, functionName: functionName })
    });
    return await res.json();
}

async function deploySelectedFunction() {
    if (!selectedFunctionName) return;

    const btn = document.getElementById('install-func-btn');
    const allBtn = document.getElementById('install-all-btn');

    btn.disabled = true;
    allBtn.disabled = true;
    document.getElementById('back-3').disabled = true;

    term.innerText = "";

    // 👉 Open fresh log websocket right on click to stop idle drops
    const logSocket = await connectLogStream();

    try {
        const data = await executeDeploymentRequest(selectedFunctionName);
        if (data.status === 'SUCCESS') {
            term.innerText += `\n\n✅ [${selectedFunctionName}] Live and ready.`;
            document.getElementById('next-3').disabled = false;
        } else {
            term.innerText += `\n\n❌ [${selectedFunctionName}] Failed. Check logs above.`;
            alert(`Deployment of ${selectedFunctionName} failed.`);
        }
    } catch (err) {
        term.innerText += `\n❌ Operational fault: ${err.message}`;
    }

    // Shut down channel connection cleanly when finished
    logSocket.close();

    btn.disabled = false;
    allBtn.disabled = false;
    document.getElementById('back-3').disabled = false;
}

async function deployAllFunctions() {
    if (localFunctionsList.length === 0) return;

    const btn = document.getElementById('install-func-btn');
    const allBtn = document.getElementById('install-all-btn');

    btn.disabled = true;
    allBtn.disabled = true;
    document.getElementById('back-3').disabled = true;

    term.innerText = `🌌 Sequential Batch Deploy Cascade Active for ${localFunctionsList.length} packages...\n`;

    // 👉 Open fresh log websocket right on click to hold the whole cascade
    const logSocket = await connectLogStream();
    let totalSuccess = 0;

    for (const func of localFunctionsList) {
        term.innerText += `\n=============================================\n📦 Processing: [${func}]\n=============================================\n`;

        try {
            const data = await executeDeploymentRequest(func);
            if (data.status === 'SUCCESS') {
                totalSuccess++;
                term.innerText += `\n✅ [${func}] Synchronized.\n`;
            } else {
                term.innerText += `\n❌ [${func}] Broke pipeline chain. Aborting cascade execution.\n`;
                break;
            }
        } catch (err) {
            term.innerText += `\n❌ [${func}] Pipeline Exception: ${err.message}\n`;
            break;
        }
    }

    if (totalSuccess === localFunctionsList.length) {
        term.innerText += `\n\n🎯 ALL SERVERS SYNCED! Spatial studio unlocked.`;
        document.getElementById('next-3').disabled = false;
    }

    // Shut down channel connection cleanly when batch finishes
    logSocket.close();

    btn.disabled = false;
    allBtn.disabled = false;
    document.getElementById('back-3').disabled = false;
}




function testAndRedirect() {
    console.log("🛰️ Initiating production OAuth handshake vector...");
    window.location.href = 'http://localhost:4000/auth';
}



const ILLUSTRIOUS_THEMES = [
    "nebula-galaxy", "cyberpunk-neon", "classical-statue", "surreal-monolith",
    "ancient-pantheon", "steampunk-engine", "cosmic-geometry", "renaissance-art",
    "gothic-spire", "abstract-flux", "mythical-dragon", "minimalist-orbit"
];



const ILLUSTRIOUS_IMAGE_IDS = [
    "1043", "1062", "1069", "1081",
    "111", "142", "212", "301",
    "443", "529", "894", "912"
];


function initializeLogoGenerator() {
    const grid = document.getElementById('logo-grid');
    if (!grid) return;
    grid.innerHTML = '';

    ILLUSTRIOUS_THEMES.forEach((theme, index) => {
        const item = document.createElement('div');
        item.style.position = 'relative';
        item.style.cursor = 'pointer';
        item.style.borderRadius = '6px';
        item.style.overflow = 'hidden';
        item.style.aspectRatio = '1';
        item.style.border = '3px solid transparent';
        item.style.backgroundColor = '#0b0b0e';
        item.style.transition = 'all 0.15s ease';

        // 👉 Add a custom query group modifier (&g=${index}) to bypass the concurrent image caching loop
        const uniqueArtUrl = `https://loremflickr.com/300/300/${theme},art?g=${index}`;

        item.innerHTML = `
            <img src="${uniqueArtUrl}" 
                 alt="${theme}"
                 style="width:100%; height:100%; object-fit:cover; display:block;" 
                 loading="lazy">
            <div class="download-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: var(--accent); font-size: 10px; text-align: center; padding: 6px 0; opacity: 0; transition: opacity 0.2s; font-family: monospace; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">
                Save Theme Logo
            </div>
        `;

        item.onmouseenter = () => { item.querySelector('.download-overlay').style.opacity = '1'; };
        item.onmouseleave = () => { item.querySelector('.download-overlay').style.opacity = '0'; };

        item.onclick = async () => {
            document.querySelectorAll('#logo-grid div').forEach(el => el.style.borderColor = 'transparent');
            item.style.borderColor = 'var(--accent)';

            const activeImgSrc = item.querySelector('img').src;
            console.log(`🎯 Active branding theme selected: ${theme} (${activeImgSrc})`);

            try {
                const response = await fetch(activeImgSrc);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `illustrious-${theme}.jpg`;
                document.body.appendChild(link);
                link.click();

                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } catch (err) {
                window.open(activeImgSrc, '_blank');
            }
        };

        grid.appendChild(item);
    });
}


function initializeLogoGeneratorStatic() {
    const grid = document.getElementById('logo-grid');
    if (!grid) return;
    grid.innerHTML = '';

    ILLUSTRIOUS_IMAGE_IDS.forEach((id) => {
        const item = document.createElement('div');
        item.style.position = 'relative';
        item.style.cursor = 'pointer';
        item.style.borderRadius = '6px';
        item.style.overflow = 'hidden';
        item.style.aspectRatio = '1';
        item.style.border = '3px solid transparent';
        item.style.backgroundColor = '#0b0b0e';
        item.style.transition = 'all 0.15s ease';

        // Target structural 300x300 canvas squares cleanly from the live CDN
        const targetUrl = `https://picsum.photos/id/${id}/300/300`;
        // High-res download source configuration path for your browser download action
        const downloadUrl = `https://picsum.photos/id/${id}/1024/1024.jpg`;

        item.innerHTML = `
            <img src="${targetUrl}" 
                 style="width:100%; height:100%; object-fit:cover; display:block;" 
                 loading="lazy">
            <div class="download-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.75); color: var(--accent); font-size: 10px; text-align: center; padding: 4px 0; opacity: 0; transition: opacity 0.2s; font-family: monospace;">
                CLICK TO DOWNLOAD LOGO
            </div>
        `;

        // Quick css rules injected via JS for hover states
        item.onmouseenter = () => { item.querySelector('.download-overlay').style.opacity = '1'; };
        item.onmouseleave = () => { item.querySelector('.download-overlay').style.opacity = '0'; };

        item.onclick = async () => {
            // Update UI selected borders
            document.querySelectorAll('#logo-grid div').forEach(el => el.style.borderColor = 'transparent');
            item.style.borderColor = 'var(--accent)';
            console.log(`🎯 Active branding identifier target locked: ${downloadUrl}`);

            // Execute automated client-side asset download injection loop
            try {
                const response = await fetch(downloadUrl);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'illustrious-logo.jpg';
                document.body.appendChild(link);
                link.click();

                // Clean browser memory buffers safely
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } catch (err) {
                console.error("Asset download transmission snapped: ", err);
                // Fallback direct tab opening if browser security configurations block fetch loops
                window.open(downloadUrl, '_blank');
            }
        };

        grid.appendChild(item);
    });
}

// Clean initialization cycle hook
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLogoGeneratorStatic);
} else {
    initializeLogoGeneratorStatic();
}

// Intercept your project selection execution loop to clean up runtime bindings
async function initWizard() {
    await loadEnvironment();
    // Your interface hooks run smoothly on initial payload fetch
}

initWizard();

document.getElementById('back-3').addEventListener('click', navigateStep.bind(null, '2-5'))
document.getElementById('next-3').addEventListener('click', testAndRedirect)
document.getElementById('back-2').addEventListener('click', navigateStep.bind(null, 2))
document.getElementById('next-25').addEventListener('click', navigateStep.bind(null, 3))
document.getElementById('back-1').addEventListener('click', navigateStep.bind(null, 1))
document.getElementById('next-2').addEventListener('click', saveCredentials)
document.getElementById('next-1').addEventListener('click', navigateStep.bind(null, 2))
document.getElementById('callback-uri-display').addEventListener('click', () => {
    document.getElementById('callback-uri-display').select();
    document.execCommand('copy');
    alert('Copied to clipboard!');
})

document.getElementById('oauth-secrets').addEventListener('submit', (e) => {
    e.preventDefault()
    e.stopPropagation()
    return false
})

document.getElementById('service-select').addEventListener('submit', (e) => {
    e.preventDefault()
    e.stopPropagation()
    return false
})

document.getElementById('install-func-btn').addEventListener('click', deploySelectedFunction)
document.getElementById('install-all-btn').addEventListener('click', deployAllFunctions)



