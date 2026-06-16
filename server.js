// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global System Credential Directory (Safe from repo tracking)
const GLOBAL_CRED_DIR = path.join(os.homedir(), '.credentials');


// Shared utility to look up runtime environmental profile tokens safely
function loadAppCredentials() {
    const anchorPath = path.join(__dirname, 'illustrious-config.json');
    if (!fs.existsSync(anchorPath)) return null;

    try {
        // Read the target pointer first
        const anchorData = JSON.parse(fs.readFileSync(anchorPath, 'utf8'));
        const activeProjectId = anchorData.ACTIVE_PROJECT_ID;

        const realConfigFile = path.join(GLOBAL_CRED_DIR, `${activeProjectId}.json`);
        if (!fs.existsSync(realConfigFile)) return null;

        return JSON.parse(fs.readFileSync(realConfigFile, 'utf8'));
    } catch (e) {
        console.error("❌ Failed to parse active configuration matrix tracker:", e.message);
        return null;
    }
}



const http = require('http');
const server = http.createServer(app);

module.exports = {
    app,
    server, // 👉 Added to pass the raw socket listener down
    PORT,
    GLOBAL_CRED_DIR,
    loadAppCredentials
};