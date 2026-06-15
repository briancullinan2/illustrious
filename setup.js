const { execSync, spawn, spawnSync } = require('child_process'); // 👉 Fixed: Added spawnSync
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = 4000;

app.use(express.json());

// Set up unified server wrappers
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

let activeSocket = null;

wss.on('connection', (ws) => {
    activeSocket = ws;
    console.log("🔌 Live log streaming socket handshake locked directly on server instance.");

    ws.on('close', () => {
        if (activeSocket === ws) activeSocket = null;
    });
});

// Intercept incoming HTTP upgrade requests to handle the single-port handshake
server.on('upgrade', (request, socket, head) => {
    console.log("📡 Processing WebSocket upgrade request...");
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

// Set up directory variables for global system credential mapping
const GLOBAL_CRED_DIR = path.join(os.homedir(), '.credentials');

function getGcloudData(cmd) {
    try {
        return execSync(cmd, { stdio: 'pipe' }).toString().trim();
    } catch (e) {
        return null;
    }
}

// 1. Fetch shell project lists, check global creds, mask sensitive data
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

// 2. Persist configurations securely ONLY to global userland directory
app.post('/api/save-credentials', (req, res) => {
    const { projectId, clientId, clientSecret } = req.body;

    if (!projectId) {
        return res.status(400).json({ status: 'ERROR', error: 'Missing projectId' });
    }

    if (!fs.existsSync(GLOBAL_CRED_DIR)) {
        fs.mkdirSync(GLOBAL_CRED_DIR, { recursive: true });
    }

    const projectSpecificFile = path.join(GLOBAL_CRED_DIR, `${projectId}.json`);

    if (fs.existsSync(projectSpecificFile)) {
        try {
            const currentConfig = JSON.parse(fs.readFileSync(projectSpecificFile, 'utf8'));
            let maskedClientId = "";
            let maskedClientSecret = "";
            if (currentConfig.GCP_CLIENT_ID) { // 👉 Fixed: Variable pointer renamed from creds
                maskedClientId = `...${currentConfig.GCP_CLIENT_ID.slice(-4)}`;
            }
            if (currentConfig.GCP_CLIENT_SECRET) { // 👉 Fixed: Variable pointer renamed from creds
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
        REGION: 'us-central1',
        FUNCTIONS_URL: `https://us-central1-${projectId}.cloudfunctions.net/bootGpuWorker`
    };

    fs.writeFileSync(projectSpecificFile, JSON.stringify(runtimeConfig, null, 2));
    res.json({ status: 'SUCCESS', message: 'Credentials safely registered globally!' });
});

function getLocalFunctions() {
    let items = [];
    const functionsDir = path.join(__dirname, 'cloud-functions');

    if (!fs.existsSync(functionsDir)) {
        return items;
    }

    items = fs.readdirSync(functionsDir).filter(item => {
        const fullPath = path.join(functionsDir, item);
        return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'index.js'));
    });

    return items;
}

app.get('/api/list-functions', (req, res) => {
    try {
        res.json({ functions: getLocalFunctions() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/deploy-function', async (req, res) => {
    const { projectId, functionName } = req.body;

    if (!functionName) {
        return res.status(400).json({ status: 'ERROR', error: 'Missing functionName parameter' });
    }

    const functionSourceDir = path.join(__dirname, 'cloud-functions', functionName);
    const entryPoint = functionName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    streamLog(`\n📡 Preparing deployment matrix for: ${functionName}...\n`);

    try {
        streamLog(`⚙️ Verifying required GCP APIs (Cloud Run & Compute Engine)...`);

        // Safely invoke synchronous system updates using correct shell hooks
        spawnSync('gcloud', ['config', 'set', 'project', projectId], { shell: true });
        spawnSync('gcloud', ['services', 'enable', 'cloudfunctions.googleapis.com', 'cloudbuild.googleapis.com', 'compute.googleapis.com', 'run.googleapis.com'], { shell: true });

        const args = [
            'functions', 'deploy', entryPoint,
            '--runtime=nodejs22',
            '--trigger-http',
            '--allow-unauthenticated',
            `--source=${functionSourceDir}`,
            `--entry-point=${entryPoint}`,
            '--region=us-central1'
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

app.get('/', (req, res) => {
    const templatePath = path.join(process.cwd(), 'setup.html');
    try {
        let htmlContent = fs.readFileSync(templatePath, 'utf8');
        const activeAccount = getGcloudData('gcloud config get-value account') || 'Anonymous Profile Context';
        htmlContent = htmlContent.replace('{{AUTH_STATUS_INITIAL}}', activeAccount);
        res.send(htmlContent);
    } catch (err) {
        res.status(500).send(`Configuration asset missing at root/setup.html: ${err.message}`);
    }
});

app.use(express.static(path.join(__dirname)));

// 👉 CRITICAL FIX: Target the 'server' instance wrapper here, NOT 'app'
server.listen(PORT, () => {
    console.log(`🚀 Automated setup studio live on http://localhost:${PORT}`);
    try {
        execSync(`start http://localhost:${PORT}`);
    } catch (e) { }
});