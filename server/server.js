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


const http = require('http');
const server = http.createServer(app);

module.exports = {
    app,
    server, // 👉 Added to pass the raw socket listener down
    PORT,
    GLOBAL_CRED_DIR,
    serveErrorScreen
};