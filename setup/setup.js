// setup.js
const express = require('express');
const { authenticateCloudProvider, CLOUD_PROVIDER_KEYS, loadCredentialsForProvider } = require('../cloud-functions/cluster-manager/cloud-manager.js');
const { app, server, GLOBAL_CRED_DIR, serveErrorScreen } = require('../server/server.js');
const { execSync, spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const DEFAULT_ZONE = 'us-central1-a'
const DEFAULT_REGION = 'us-central1'
const DEFAULT_URI = 'http://localhost:4000/'
const DEFAULT_ENDPOINT = DEFAULT_URI + 'oauth2callback'
const GLOBAL_SETTINGS = path.join(__dirname, '..', 'illustrious-config.json');


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
    const functionsDir = path.join(__dirname, '..', 'cloud-functions');

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
    const templatePath = path.join(__dirname, '..', 'setup', 'index.html');
    try {
        let htmlContent = fs.readFileSync(templatePath, 'utf8');
        const activeAccount = getGcloudData('gcloud config get-value account') || 'Anonymous Profile Context';
        htmlContent = htmlContent.replace('{{AUTH_STATUS_INITIAL}}', activeAccount);
        res.send(htmlContent);
    } catch (err) {
        res.status(500).send(serveErrorScreen(res, 'Configuration Asset Missing', `Configuration asset missing at root/setup/index.html: ${err.message}`));
    }
});



async function getActiveAccountFromGcloudCLI() {
    const activeAccount = getGcloudData('gcloud config get-value account');
    return activeAccount
}


async function listProjectsFromGcloudCLI() {
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

    return processedProjects
}


app.post('/api/cluster/verify-and-save', async (req, res) => {
    const { providerId, fields } = req.body;

    try {
        // 1. Initial platform check (Allow Google Cloud which doesn't use a static file property)
        const provider = CLOUD_PROVIDER_KEYS.find(p => p.id === providerId);
        if (!provider) {
            console.error(`🛑 [VERIFY REJECTED] Unknown platform target requested: ${providerId}`);
            return res.status(400).json({ error: 'Unknown platform target.' });
        }

        // 2. Fetch existing credentials configuration if a file layout is managed for it
        const existingData = loadCredentialsForProvider(providerId);

        // 3. Resolve masking boundaries from the UI elements
        const cleanFields = { ...fields };
        Object.keys(cleanFields).forEach(k => {
            if (String(cleanFields[k]).includes('••••') || cleanFields[k] === '') {
                cleanFields[k] = existingData[k] || '';
            }
        });

        // 4. Fire live handshake verification using the clean flat keys
        const authStatus = await authenticateCloudProvider(providerId, cleanFields);

        // 5. Commit states to local filesystem dictionary ONLY if it utilizes a file profile target
        if (authStatus.success && provider.file) {
            if (!fs.existsSync(GLOBAL_CRED_DIR)) {
                fs.mkdirSync(GLOBAL_CRED_DIR, { recursive: true });
            }
            const targetFilePath = path.join(GLOBAL_CRED_DIR, provider.file);

            fs.writeFileSync(
                targetFilePath,
                JSON.stringify({ ...existingData, ...cleanFields }, null, 4),
                'utf8'
            );
            console.log(`📝 [SETUP SUCCESS] Local file profile synchronized for: ${providerId}`);
        }

        // Returns { success: true, meta: { account, projects, activeVMs, quotas } }
        return res.json(authStatus);

    } catch (err) {
        console.error(`❌ [SETUP EXCEPTION] Verification loop broken for ${providerId}:`, err);
        return res.status(500).json({ error: err.message });
    }
});

function scanCloudCredentials() {

    const providerStatusMap = {};

    // Ensure directory existence before looping execution blocks
    if (!fs.existsSync(GLOBAL_CRED_DIR)) {
        CLOUD_PROVIDER_KEYS.forEach(p => providerStatusMap[p.id] = null);
        return providerStatusMap;
    }

    const directoryFiles = fs.readdirSync(GLOBAL_CRED_DIR);

    for (const provider of CLOUD_PROVIDER_KEYS) {
        try {
            let hint = null;

            // Handle Dynamic Google Regex Key Scan
            if (provider.pattern) {
                const matchFile = directoryFiles.find(file => provider.pattern.test(file));
                if (matchFile) {
                    const fullPath = path.join(GLOBAL_CRED_DIR, matchFile);
                    const rawData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    // Display project name/id safely as the operational hint
                    hint = rawData.project_id || matchFile.split('-')[0];
                }
            }
            // Handle standard JSON configuration files
            else if (provider.file && fs.existsSync(path.join(GLOBAL_CRED_DIR, provider.file))) {
                const fullPath = path.join(GLOBAL_CRED_DIR, provider.file);
                const rawData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                const primarySecret = rawData[provider.key];

                // FIX: Explicitly ensure the secret actually exists, is a string, and contains actual characters
                if (primarySecret && typeof primarySecret === 'string' && primarySecret.trim().length > 0) {
                    const cleanSecret = primarySecret.trim();
                    if (cleanSecret.length > 4) {
                        hint = `•••• ${cleanSecret.slice(-4)}`;
                    } else {
                        hint = `•••• Active`;
                    }
                } else {
                    // If the key is an empty string, null, or whitespace, it's NOT configured
                    hint = null;
                }
            }

            providerStatusMap[provider.id] = hint;

        } catch (err) {
            // Log parse errors internally but don't crash, report back as unconfigured
            providerStatusMap[provider.id] = null;
        }
    }

    return providerStatusMap;
}







app.get('/api/local-env', async (req, res) => {

    const activeAccount = await getActiveAccountFromGcloudCLI()
    const processedProjects = await listProjectsFromGcloudCLI(req, res)
    const autoSelectProject = processedProjects.find(p => p.exists)?.id || "";

    let existing = {}
    try {
        existing = JSON.parse(fs.readFileSync(GLOBAL_SETTINGS))
    } catch (e) {
        console.error(e)
    }


    res.json(Object.assign({
        authenticated: !!activeAccount,
        account: activeAccount || 'Not logged in. Run "gcloud auth login" locally.',
        projects: processedProjects,
        autoSelectId: autoSelectProject,
        credentialPath: GLOBAL_CRED_DIR + path.sep,
        functions: getLocalFunctions(),
        providerCredentials: scanCloudCredentials(),

    }, existing));
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
    const redirectURL = new Url(redirectUri)
    let oauthEndpoint = redirectUri || process.env.REDIRECT_URI || DEFAULT_ENDPOINT
    let callbackEndpoint = process.env.CALLBACK_URI || DEFAULT_URI
    let existing = {}
    try {
        existing = JSON.parse(fs.readFileSync(GLOBAL_SETTINGS))
        callbackEndpoint = existing?.CALLBACK_URI
        oauthEndpoint = existing?.REDIRECT_URI
    } catch (e) {
        console.error(e)
    }


    fs.writeFileSync(GLOBAL_SETTINGS, JSON.stringify(Object.assign(existing, {
        REGION: DEFAULT_REGION,
        ACTIVE_PROJECT_ID: projectId,
        CALLBACK_URI: callbackEndpoint,
        PUBLIC_URI: existing.PUBLIC_URI || redirectURL.origin,
        REDIRECT_URI: redirectUri || oauthEndpoint
            || (`https://${DEFAULT_REGION}-${projectId}.cloudfunctions.net/oauthGateway`)
            || (`${redirectURL.origin}/oauth2callback`)
    }), null, 2));

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


    let endpoint = process.env.REDIRECT_URI || DEFAULT_ENDPOINT
    try {
        endpoint = JSON.parse(fs.readFileSync(GLOBAL_SETTINGS))?.REDIRECT_URI
    } catch (e) {
        console.error(e)
    }


    const runtimeConfig = {
        PROJECT_ID: projectId,
        GCP_CLIENT_ID: clientId,
        GCP_CLIENT_SECRET: clientSecret,
        REDIRECT_URI: redirectUri || REDIRECT_URI,
        REGION: DEFAULT_REGION,
        FUNCTIONS_URL: `https://${DEFAULT_REGION}-${projectId}.cloudfunctions.net/bootGpu`
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
    const functionSourceDir = path.join(__dirname, '..', 'cloud-functions', functionName);
    const entryPoint = functionName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    streamLog(`\n📡 Preparing deployment matrix for: ${functionName}...\n`);

    try {
        const expectedCredFile = path.join(GLOBAL_CRED_DIR, `${projectId}.json`);
        if (!fs.existsSync(expectedCredFile)) {
            return res.status(400).json({ status: 'ERROR', error: `No client secrets found matching project: ${projectId}` });
        }

        const projectCreds = JSON.parse(fs.readFileSync(expectedCredFile, 'utf8'));
        const functionSourceDir = path.join(__dirname, '..', 'cloud-functions', functionName);
        const entryPoint = functionName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

        streamLog(`\n📡 Preparing deployment matrix for: ${functionName}...\n`);

        streamLog(`⚙️ Verifying required GCP APIs (Cloud Run & Compute Engine)...`);
        spawnSync('gcloud', ['config', 'set', 'project', projectId], { shell: true });
        spawnSync('gcloud', ['services', 'enable', 'cloudfunctions.googleapis.com', 'cloudbuild.googleapis.com', 'compute.googleapis.com', 'run.googleapis.com'], { shell: true });


        let endpoint = projectCreds.REDIRECT_URI || process.env.REDIRECT_URI || DEFAULT_ENDPOINT
        try {
            endpoint = JSON.parse(fs.readFileSync(GLOBAL_SETTINGS))?.REDIRECT_URI
        } catch (e) {
            console.error(e)
        }



        // 👉 Build variables array injecting your dynamic REDIRECT_URI straight to the function container
        const args = [
            'functions', 'deploy', entryPoint,
            '--runtime=nodejs22',
            '--trigger-http',
            '--allow-unauthenticated',
            `--source=${functionSourceDir}`,
            `--entry-point=${entryPoint}`,
            `--region=${DEFAULT_REGION}`,
            `--set-env-vars=GCP_CLIENT_ID="${projectCreds.GCP_CLIENT_ID}",GCP_CLIENT_SECRET="${projectCreds.GCP_CLIENT_SECRET}",GCP_PROJECT_ID="${projectId}",REDIRECT_URI="${endpoint}"`
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


if (path.basename(process.argv[1]) === 'setup.js') {
    // This file asset stream only mounts if 'node setup.js' was executed in the CLI
    app.use(express.static(path.join(__dirname)));
    console.log('📡 Static assets mounted successfully inside the active setup environment.');
}
