// index.js
import express from 'express';
import open from 'open';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

// Read config injected by setup dashboard
const configPath = path.join(process.cwd(), 'config.json');
if (!fs.existsSync(configPath)) {
    console.error("❌ No config.json found! Please run 'npm run setup' first to build project credentials.");
    process.exit(1);
}
const runtimeEnv = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const oauth2Client = new google.auth.OAuth2(
    runtimeEnv.GCP_CLIENT_ID,
    runtimeEnv.GCP_CLIENT_SECRET,
    `http://localhost:${PORT}/oauth2callback`
);

app.use(express.json());

// Main Entry Point
app.get('/', (req, res) => {
    if (!oauth2Client.credentials.access_token) {
        // Redirect cleanly to login flow
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Demands persistent refresh tokens for worker maintenance
            scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/cloud-platform'],
        });
        return res.redirect(authUrl);
    }
    // User authenticated successfully -> serve layout frontend
    res.send(`<h1>Illustrious Core Engine Active for ${runtimeEnv.PROJECT_ID}</h1><p>Tokens Captured. Dispatching instances...</p>`);
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Handshake verification broken: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Illustrious Execution Engine running on http://localhost:${PORT}`);
    open(`http://localhost:${PORT}`);
});

