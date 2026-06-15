// index.js
const { app, server, PORT, loadAppCredentials } = require('./server');

// 👉 Mount your standalone installer engine into the active Express layer
require('./setup');
const { google } = require('googleapis');
const { execSync } = require('child_process');

// Hot-load environment mapping profiles 
const credentials = loadAppCredentials();

let oauth2Client = null;
if (credentials) {
    oauth2Client = new google.auth.OAuth2(
        credentials.GCP_CLIENT_ID,
        credentials.GCP_CLIENT_SECRET,
        `http://localhost:${PORT}/oauth2callback`
    );
    // Bind globally across the entire googleapis runtime context instance
    google.options({ auth: oauth2Client });
} else {
    console.warn("⚠️ Warning: No valid active credentials mapped inside ~/.credentials/ yet. Please complete /setup first.");
}

// ==========================================
// 🔐 CORE OAUTH & SITE NAVIGATION SYSTEM
// ==========================================

// Main Entry Point
app.get('/', (req, res) => {
    // If credentials aren't generated yet, kick them directly to the independent setup wizard
    if (!credentials) {
        return res.redirect('/setup');
    }

    // If we have credentials but no token session state yet, force authentication login flow
    if (!oauth2Client || !oauth2Client.credentials || !oauth2Client.credentials.access_token) {
        return res.redirect('/auth');
    }

    // Success state: Serve main UI workspace canvas
    res.send(`
        <div style="background: #0b0b0e; color: #f0f0f5; font-family: sans-serif; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <h1 style="color: #00ffcc; letter-spacing: 1px;">🌌 Illustrious Studio Engine Live</h1>
            <p style="color: #6a6a7a;">Project Boundary: <b>${credentials.PROJECT_ID}</b></p>
            <div style="background: #050508; border: 1px solid #1e1e26; padding: 20px; border-radius: 6px; font-family: monospace; color: #3bf53b;">
                Tokens verified. Cluster pipeline communication loops open.
            </div>
        </div>
    `);
});

// OAuth Initialization Gateway Link
app.get('/auth', (req, res) => {
    if (!oauth2Client) {
        return res.status(400).send("GCP credentials missing. Run setup workspace tracking first.");
    }

    const authUrl = oauth2Client.generateAuthUrl({
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
app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    if (!code || !oauth2Client) {
        return res.status(400).send("Invalid callback request parameters.");
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        console.log("🎯 OAuth Access & Refresh tokens successfully locked in memory frame!");
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Handshake token translation collapsed: " + err.message);
    }
});

// ==========================================
// 🛠️ EXPANDING PRODUCTION STUDIO ROUTE STUBS
// ==========================================

/**
 * STUB: Fetch authenticated profile metadata details
 * GET /api/user-profile
 */
app.get('/api/user-profile', async (req, res) => {
    try {
        // TODO: Wire up google.oauth2('v2').userinfo.get() to pull active avatar profiles
        res.json({ status: 'STUB', message: 'User metadata profile pipeline ready for allocation.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * STUB: Trigger Compute Instance provisioning commands via authorized client context
 * POST /api/cluster/provision
 */
app.post('/api/cluster/provision', async (req, res) => {
    try {
        // TODO: Implement authorized compute.instances.insert thread mapping targets
        res.json({ status: 'STUB', message: 'Compute orchestration cluster stub hooked successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * STUB: Query status telemetry blocks for running cloud node targets
 * GET /api/cluster/status
 */
app.get('/api/cluster/status', async (req, res) => {
    try {
        // TODO: Add cluster telemetry logging streams here
        res.json({ status: 'STUB', instances: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



server.listen(PORT, () => {
    console.log(`🚀 Illustrious Execution Hub spinning up on http://localhost:${PORT}`);
    try {
        execSync(`start http://localhost:${PORT}`);
    } catch (e) { }
});


