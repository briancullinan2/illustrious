// setup.js
const { app, server, GLOBAL_CRED_DIR } = require('./server'); // 👉 Clean require tracking
const { execSync, spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Set up an isolated WebSocket server that piggybacks onto the shared server container
const wss = new WebSocket.Server({ noServer: true });
let activeSocket = null;

wss.on('connection', (ws) => {
    activeSocket = ws;
    console.log("🔌 Live log streaming socket handshake locked directly on setup sub-instance.");

    ws.on('close', () => {
        if (activeSocket === ws) activeSocket = null;
    });
});

// Intercept incoming HTTP upgrade requests to handle the single-port handshake
server.on('upgrade', (request, socket, head) => {
    // Only upgrade the request if it's hitting our setup domain context or handle it globally
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

function streamLog(message) {
    console.log(message.trim());
    if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
        activeSocket.send(message);
    }
}

function getGcloudData(cmd) {
    try {
        return execSync(cmd, { stdio: 'pipe' }).toString().trim();
    } catch (e) {
        return null;
    }
}

function getLocalFunctions() {
    let items = [];
    const functionsDir = path.join(__dirname, 'cloud-functions');

    if (!fs.existsSync(functionsDir)) {
        return items;
    }

    return fs.readdirSync(functionsDir).filter(item => {
        const fullPath = path.join(functionsDir, item);
        return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'index.js'));
    });
}

// ==========================================
// 🛰️ WIZARD NAVIGATION ROUTE INTERCEPTORS
// ==========================================

// Explicitly serve your setup.html view layout over the clean /setup route path
app.get('/setup', (req, res) => {
    const templatePath = path.join(__dirname, 'setup', 'index.html');
    try {
        let htmlContent = fs.readFileSync(templatePath, 'utf8');
        const activeAccount = getGcloudData('gcloud config get-value account') || 'Anonymous Profile Context';
        htmlContent = htmlContent.replace('{{AUTH_STATUS_INITIAL}}', activeAccount);
        res.send(htmlContent);
    } catch (err) {
        res.status(500).send(`Configuration asset missing at root/setup/index.html: ${err.message}`);
    }
});

// ==========================================
// 🛰️ API ENDPOINTS
// ==========================================

app.get('/api/local-env', (req, res) => {
    const activeAccount = getGcloudData('gcloud config get-value account');
    const rawProjects = getGcloudData('gcloud projects list --format="json"');

    let projects = [];
    if (rawProjects) {
        try { projects = JSON.parse(rawProjects); } catch (err) { }
    }

    const processedProjects = projects.map(p => {
        const expectedCredFile = path.join(GLOBAL_CRED_DIR, `${p.projectId}.json`);
        let hasSavedCreds = false;
        let maskedClientId = "";
        let maskedClientSecret = "";

        if (fs.existsSync(expectedCredFile)) {
            try {
                const creds = JSON.parse(fs.readFileSync(expectedCredFile, 'utf8'));
                hasSavedCreds = true;

                if (creds.GCP_CLIENT_ID) {
                    maskedClientId = `...${creds.GCP_CLIENT_ID.slice(-4)}`;
                }
                if (creds.GCP_CLIENT_SECRET) {
                    maskedClientSecret = `...${creds.GCP_CLIENT_SECRET.slice(-4)}`;
                }
            } catch (e) { }
        }

        return {
            id: p.projectId,
            name: p.name,
            exists: hasSavedCreds,
            clientIdMask: maskedClientId,
            clientSecretMask: maskedClientSecret
        };
    });

    const autoSelectProject = processedProjects.find(p => p.exists)?.id || "";

    res.json({
        authenticated: !!activeAccount,
        account: activeAccount || 'Not logged in. Run "gcloud auth login" locally.',
        projects: processedProjects,
        autoSelectId: autoSelectProject,
        credentialPath: GLOBAL_CRED_DIR + path.sep,
        functions: getLocalFunctions()
    });
});



app.post('/api/save-credentials', (req, res) => {
    const { projectId, clientId, clientSecret, redirectUri } = req.body; // Add redirectUri here


    if (!projectId) {
        return res.status(400).json({ status: 'ERROR', error: 'Missing projectId' });
    }

    if (!fs.existsSync(GLOBAL_CRED_DIR)) {
        fs.mkdirSync(GLOBAL_CRED_DIR, { recursive: true });
    }

    const projectSpecificFile = path.join(GLOBAL_CRED_DIR, `${projectId}.json`);
    const activeProjectAnchorFile = path.join(GLOBAL_CRED_DIR, 'illustrious-config.json');
    fs.writeFileSync(activeProjectAnchorFile, JSON.stringify({ ACTIVE_PROJECT_ID: projectId }, null, 2));

    if (fs.existsSync(projectSpecificFile)) {
        try {
            const currentConfig = JSON.parse(fs.readFileSync(projectSpecificFile, 'utf8'));
            let maskedClientId = "";
            let maskedClientSecret = "";
            if (currentConfig.GCP_CLIENT_ID) {
                maskedClientId = `...${currentConfig.GCP_CLIENT_ID.slice(-4)}`;
            }
            if (currentConfig.GCP_CLIENT_SECRET) {
                maskedClientSecret = `...${currentConfig.GCP_CLIENT_SECRET.slice(-4)}`;
            }
            if (clientId === maskedClientId && clientSecret === maskedClientSecret) {
                return res.json({ status: 'SUCCESS', message: 'Credentials unchanged.' });
            }
        } catch (e) { }
    }

    const runtimeConfig = {
        PROJECT_ID: projectId,
        GCP_CLIENT_ID: clientId,
        GCP_CLIENT_SECRET: clientSecret,
        REDIRECT_URI: redirectUri || 'http://localhost:4000/', // Lock it inside your ~/.credentials profile record
        REGION: 'us-central1',
        FUNCTIONS_URL: `https://us-central1-${projectId}.cloudfunctions.net/bootGpuWorker`
    };

    fs.writeFileSync(projectSpecificFile, JSON.stringify(runtimeConfig, null, 2));

    res.json({ status: 'SUCCESS', message: 'Credentials safely registered globally!' });
});



app.get('/api/list-functions', (req, res) => {
    const { projectId } = req.query;
    const localFolders = getLocalFunctions();

    let deployedFunctions = [];

    if (projectId) {
        try {
            const rawCloudFuncs = execSync(`gcloud functions list --project=${projectId} --format="json"`, { stdio: 'pipe' }).toString().trim();
            if (rawCloudFuncs) {
                deployedFunctions = JSON.parse(rawCloudFuncs);
            }
        } catch (e) {
            console.log("⚠️ Could not query cloud functions list from gcloud CLI.");
        }
    }

    const mappedFunctions = localFolders.map(folderName => {
        const expectedCloudName = folderName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const isLive = deployedFunctions.some(f => {
            const shortName = f.name.split('/').pop();
            return shortName.toLowerCase() === expectedCloudName.toLowerCase();
        });

        return {
            name: folderName,
            isDeployed: isLive
        };
    });

    res.json({ functions: mappedFunctions });
});


app.post('/api/deploy-function', async (req, res) => {
    const { projectId, functionName } = req.body;

    if (!functionName) {
        return res.status(400).json({ status: 'ERROR', error: 'Missing functionName parameter' });
    }

    // 👉 Pull your target project configuration file directly from disk
    const expectedCredFile = path.join(GLOBAL_CRED_DIR, `${projectId}.json`);
    if (!fs.existsSync(expectedCredFile)) {
        return res.status(400).json({ status: 'ERROR', error: `No client secrets found matching project: ${projectId}` });
    }

    const projectCreds = JSON.parse(fs.readFileSync(expectedCredFile, 'utf8'));
    const functionSourceDir = path.join(__dirname, 'cloud-functions', functionName);
    const entryPoint = functionName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    streamLog(`\n📡 Preparing deployment matrix for: ${functionName}...\n`);

    try {
        const expectedCredFile = path.join(GLOBAL_CRED_DIR, `${projectId}.json`);
        if (!fs.existsSync(expectedCredFile)) {
            return res.status(400).json({ status: 'ERROR', error: `No client secrets found matching project: ${projectId}` });
        }

        const projectCreds = JSON.parse(fs.readFileSync(expectedCredFile, 'utf8'));
        const functionSourceDir = path.join(__dirname, 'cloud-functions', functionName);
        const entryPoint = functionName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

        streamLog(`\n📡 Preparing deployment matrix for: ${functionName}...\n`);

        streamLog(`⚙️ Verifying required GCP APIs (Cloud Run & Compute Engine)...`);
        spawnSync('gcloud', ['config', 'set', 'project', projectId], { shell: true });
        spawnSync('gcloud', ['services', 'enable', 'cloudfunctions.googleapis.com', 'cloudbuild.googleapis.com', 'compute.googleapis.com', 'run.googleapis.com'], { shell: true });

        // 👉 Build variables array injecting your dynamic REDIRECT_URI straight to the function container
        const args = [
            'functions', 'deploy', entryPoint,
            '--runtime=nodejs22',
            '--trigger-http',
            '--allow-unauthenticated',
            `--source=${functionSourceDir}`,
            `--entry-point=${entryPoint}`,
            '--region=us-central1',
            `--set-env-vars=GCP_CLIENT_ID="${projectCreds.GCP_CLIENT_ID}",GCP_CLIENT_SECRET="${projectCreds.GCP_CLIENT_SECRET}",GCP_PROJECT_ID="${projectId}",REDIRECT_URI="${projectCreds.REDIRECT_URI || 'http://localhost:4000/'}"`
        ];

        const child = spawn('gcloud', args, { shell: true });
        child.stdout.on('data', (data) => streamLog(data.toString()));
        child.stderr.on('data', (data) => streamLog(data.toString()));

        child.on('close', (code) => {
            if (code === 0) {
                res.json({ status: 'SUCCESS', message: `Successfully deployed ${functionName}` });
            } else {
                res.status(500).json({ status: 'ERROR', error: `Process exited with error code: ${code}` });
            }
        });

    } catch (err) {
        streamLog(`❌ Deployment Initialization Error: ${err.message}`);
        res.status(500).json({ status: 'ERROR', error: err.message });
    }
});

console.log("⚙️ Setup installer matrix endpoints successfully registered.");

