// index.js
const express = require('express');
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

const session = require('express-session');

// 1. Ensure you have a session middleware to isolate user states
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-local-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax' // Core protection against CSRF
    }
}));

function serveErrorScreen(res, title, description, showSetupButton = true) {
    // FIXED: Corrected closing tags from </button> to </a>
    const actionButton = showSetupButton
        ? `<a class="primary err-action-btn" href="/setup">Launch Setup Wizard</a>`
        : `<a class="secondary err-action-btn" href="/">Return Home</a>`;

    return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} // Illustrious Error</title>
            <link rel="stylesheet" href="/main.css" />
        </head>
        <body class="error-screen-body">
            <div class="error-dialog">
                <h2 class="error-dialog-title">⚠️ ${title}</h2>
                <p class="error-dialog-text">${description}</p>
                <div class="err-action-wrapper">
                    ${actionButton}
                </div>
            </div>
        </body>
        </html>
    `);
}

app.get('/', requireReactiveCredentials, (req, res) => {
    // Check if this specific request/session has dynamic token allocations loaded
    if (!req.session.tokens || !req.session.tokens.access_token) {
        return res.redirect('/auth');
    }

    // Serve your beautiful separate index.html studio canvas file from disk
    const appIndex = path.join(__dirname, 'index.html');
    if (fs.existsSync(appIndex)) {
        return res.sendFile(appIndex);
    }

    // Fallback display canvas if index.html isn't present
    res.send(`
        <div class="fallback-stage-wrapper">
            <h1 class="fallback-stage-title">🌌 Illustrious Studio Engine Live</h1>
            <p class="fallback-stage-meta">Project Boundary: <b>${req.gcpCredentials.PROJECT_ID}</b></p>
            <div class="fallback-stage-terminal">
                Tokens verified. Cluster pipeline communication loops open.
            </div>
        </div>
    `);
});



function requireReactiveCredentials(req, res, next) {
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

        // Instantiate a completely isolated client for this specific request thread
        const oauth2Client = new google.auth.OAuth2(
            credentials.GCP_CLIENT_ID,
            credentials.GCP_CLIENT_SECRET,
            `http://localhost:${PORT}/oauth2callback`
        );


        cachedClientId = credentials.GCP_CLIENT_ID;
        cachedClientSecret = credentials.GCP_CLIENT_SECRET;

        // If this specific user session already has tokens, inject them into the client
        if (req.session && req.session.tokens) {
            oauth2Client.setCredentials(req.session.tokens);
        }

        // Attach the isolated client directly to the request object
        req.oauth2Client = oauth2Client;
    }

    // Fallback or explicit project ID config
    req.gcpCredentials = {
        PROJECT_ID: process.env.GCP_PROJECT_ID || 'illustrious-499422'
    };

    next();
}



app.get('/auth', requireReactiveCredentials, (req, res) => {
    const authUrl = req.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            //'https://www.googleapis.com/auth/cloud-platform'
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

        req.session.tokens = tokens;
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
        if (!req.session.tokens.access_token) {
            return res.status(401).json({ error: 'Unauthenticated session profile context.' });
        }
        res.json({ status: 'STUB', project: req.gcpCredentials.PROJECT_ID, message: 'User pipeline ready.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


const { clusterManager } = require('./cloud-functions/cluster-manager');
const { bootGpu } = require('./cloud-functions/boot-gpu');
const { spatialRelay } = require('./cloud-functions/spatial-relay');

app.get('/api/cluster/allocate', requireReactiveCredentials, (req, res) => {
    process.env.GCP_PROJECT_ID = req.gcpCredentials.PROJECT_ID;
    process.env.GCP_PROJECT = req.gcpCredentials.PROJECT_ID;

    // Execute boot-gpu passing the augmented express context wrapper natively
    bootGpu(req, res);
});

app.get('/api/cluster/status', requireReactiveCredentials, (req, res) => {
    // Inject parameters before calling the module execution block
    process.env.GCP_PROJECT_ID = req.gcpCredentials.PROJECT_ID;
    process.env.GCP_PROJECT = req.gcpCredentials.PROJECT_ID;
    process.env.BOOT_GPU_FUNCTION_URL = `http://localhost:${PORT}/api/cluster/allocate`;

    // Execute cluster manager with hot credentials attached
    clusterManager(req, res);
});

app.get('/api/spatial/relay', requireReactiveCredentials, (req, res) => {
    // Inject parameters before calling the module execution block
    process.env.GCP_PROJECT_ID = req.gcpCredentials.PROJECT_ID;
    process.env.GCP_PROJECT = req.gcpCredentials.PROJECT_ID;
    process.env.BOOT_GPU_FUNCTION_URL = `http://localhost:${PORT}/api/cluster/allocate`;

    // Execute cluster manager with hot credentials attached
    spatialRelay(req, res);
});

app.use(express.static(path.join(__dirname)));

server.listen(PORT, () => {
    console.log(`🚀 Illustrious Execution Hub spinning up on http://localhost:${PORT}`);
    try {
        execSync(`start http://localhost:${PORT}`);
    } catch (e) { }
});