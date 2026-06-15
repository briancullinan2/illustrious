// index.js
const { app, server, PORT, loadAppCredentials } = require('./server');
require('./setup'); // Mounts setup wizard routes cleanly
const { google } = require('googleapis');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// In-memory persistent reference for the active OAuth2 client session
let oauth2ClientInstance = null;
let cachedClientId = null;
let cachedClientSecret = null;

/**
 * Custom Error Template Generator
 * Spits out a unified centered dialogue canvas using your exact token palette variables
 */
function serveErrorScreen(res, title, description, showSetupButton = true) {
    const actionButton = showSetupButton
        ? `<button class="primary" onclick="window.location.href='/setup'" style="margin-top: 20px; max-width: 200px;">Launch Setup Wizard</button>`
        : `<button class="secondary" onclick="window.location.href='/'" style="margin-top: 20px; max-width: 200px;">Return Home</button>`;

    return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} // Illustrious Error Matrix</title>
            <link rel="stylesheet" href="/main.css" />
            <style>
                body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: var(--bg); color: var(--text); }
                .error-dialog { width: 100%; max-width: 500px; background: var(--panel); border: 1px solid #ff3355; border-radius: 12px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6); text-align: center; }
                h2 { color: #ff5577; font-size: 20px; margin-bottom: 12px; font-weight: 700; }
                p { color: var(--text-dim); font-size: 14px; line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class="error-dialog">
                <h2>⚠️ ${title}</h2>
                <p>${description}</p>
                <div style="display:flex; justify-content:center;">
                    ${actionButton}
                </div>
            </div>
        </body>
        </html>
    `);
}

/**
 * ⚡ HOT-RELOADING CREDENTIALS MIDDLEWARE
 * Runs on every request using credentials to intercept fresh profile modifications instantly
 */
const requireReactiveCredentials = (req, res, next) => {
    const credentials = loadAppCredentials();

    if (!credentials) {
        return serveErrorScreen(
            res,
            "GCP Credentials Missing",
            "No active workspace tracking record found inside your system directory boundary. Please initialize environment configurations before accessing the studio."
        );
    }

    // If the credentials changed in setup, tear down and hot-swap the OAuth client object
    if (!oauth2ClientInstance || credentials.GCP_CLIENT_ID !== cachedClientId || credentials.GCP_CLIENT_SECRET !== cachedClientSecret) {
        console.log(`⚡ Hot-swapping active OAuth client to target project: ${credentials.PROJECT_ID}`);

        oauth2ClientInstance = new google.auth.OAuth2(
            credentials.GCP_CLIENT_ID,
            credentials.GCP_CLIENT_SECRET,
            `http://localhost:${PORT}/oauth2callback`
        );

        cachedClientId = credentials.GCP_CLIENT_ID;
        cachedClientSecret = credentials.GCP_CLIENT_SECRET;

        // Refresh global authorization default settings context
        google.options({ auth: oauth2ClientInstance });
    }

    // Expose active configuration profiles down the routing stream line
    req.gcpCredentials = credentials;
    req.oauth2Client = oauth2ClientInstance;
    next();
};

// ==========================================
// 🔐 CORE OAUTH & SITE NAVIGATION SYSTEM
// ==========================================

// Main Entry Point
app.get('/', requireReactiveCredentials, (req, res) => {
    // Check if memory has dynamic token session allocations loaded
    if (!req.oauth2Client.credentials || !req.oauth2Client.credentials.access_token) {
        return res.redirect('/auth');
    }

    // Serve your beautiful separate index.html studio canvas file from disk
    const appIndex = path.join(__dirname, 'index.html');
    if (fs.existsSync(appIndex)) {
        return res.sendFile(appIndex);
    }

    // Fallback display canvas if index.html isn't present
    res.send(`
        <div style="background: #0b0b0e; color: #f0f0f5; font-family: sans-serif; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <h1 style="color: #00ffcc; letter-spacing: 1px;">🌌 Illustrious Studio Engine Live</h1>
            <p style="color: #6a6a7a;">Project Boundary: <b>${req.gcpCredentials.PROJECT_ID}</b></p>
            <div style="background: #050508; border: 1px solid #1e1e26; padding: 20px; border-radius: 6px; font-family: monospace; color: #3bf53b;">
                Tokens verified. Cluster pipeline communication loops open.
            </div>
        </div>
    `);
});

// OAuth Initialization Gateway Link
app.get('/auth', requireReactiveCredentials, (req, res) => {
    const authUrl = req.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/cloud-platform'
        ],
    });
    res.redirect(authUrl);
});

// Secure Callback Handshake Return Target Route
app.get('/oauth2callback', requireReactiveCredentials, (req, res) => {
    const { code } = req.query;
    if (!code) {
        return serveErrorScreen(res, "Invalid Handshake Request", "The incoming authorization code from Google's endpoint context was broken or expired.", false);
    }

    req.oauth2Client.getToken(code, (err, tokens) => {
        if (err) {
            return serveErrorScreen(res, "Handshake Verification Collapsed", `Token mapping runtime exception: ${err.message}`, false);
        }

        req.oauth2Client.setCredentials(tokens);
        console.log("🎯 OAuth Access & Refresh tokens successfully locked into active memory frame!");
        res.redirect('/');
    });
});

// ==========================================
// 🛠️ EXPANDING PRODUCTION STUDIO ROUTE STUBS
// ==========================================

/**
 * GET /api/user-profile
 */
app.get('/api/user-profile', requireReactiveCredentials, async (req, res) => {
    try {
        if (!req.oauth2Client.credentials.access_token) {
            return res.status(401).json({ error: 'Unauthenticated session profile context.' });
        }
        res.json({ status: 'STUB', project: req.gcpCredentials.PROJECT_ID, message: 'User pipeline ready.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


const { clusterManager } = require('./cloud-functions/cluster-manager');
const { bootGpu } = require('./cloud-functions/boot-gpu');


app.get('/api/local-debug/boot-gpu', requireReactiveCredentials, (req, res) => {
    // Inject the current project ID into the environment variable slots 
    // that the cloud function expects to read from
    process.env.GCP_PROJECT_ID = req.gcpCredentials.PROJECT_ID;

    // Execute the cloud function code right inside your local Express thread!
    bootGpu(req, res);
});


app.get('/api/local-debug/cluster', requireReactiveCredentials, (req, res) => {
    // Inject the current project ID into the environment variable slots 
    // that the cloud function expects to read from
    process.env.GCP_PROJECT_ID = req.gcpCredentials.PROJECT_ID;
    process.env.BOOT_GPU_FUNCTION_URL = `http://localhost:${PORT}/api/local-debug/boot-gpu`; // Proxy redirect

    // Execute the cloud function code right inside your local Express thread!
    clusterManager(req, res);
});

server.listen(PORT, () => {
    console.log(`🚀 Illustrious Execution Hub spinning up on http://localhost:${PORT}`);
    try {
        execSync(`start http://localhost:${PORT}`);
    } catch (e) { }
});