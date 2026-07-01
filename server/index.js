
const express = require('express');
const { requireReactiveCredentials } = require('../cloud-functions/cluster-manager/host-google.js');
const { app, server, PORT, serveErrorScreen } = require('./server.js');
require('../setup/setup.js'); // Mounts setup wizard routes cleanly
require('./generate-favicon.js');
const { google } = require('googleapis');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const session = require('express-session');

// Import and initialize the file-backed session store
const FileStore = require('session-file-store')(session);

const CREDENTIALS_DIR = path.join(os.homedir(), '.credentials');
const DUAL_STORE_PATH = path.join(CREDENTIALS_DIR, 'illustrious-users.json');
const SESSIONS_DIR = path.join(CREDENTIALS_DIR, 'sessions'); // Isolated folder for raw browser sessions

const hasFileStore = false;
try {
	if(!fs.existsSync(SESSIONS_DIR)) {
		fs.mkdirSync(SESSIONS_DIR, { recursive: true });
	}
	hasFileStore = true;
}
catch(e) {
	console.error('Could not create session storage directory: ');
	console.error(e);
}

// Helper to load the full keyed dictionary file
function loadAllUsersDictionary() {
	try {
		if(fs.existsSync(DUAL_STORE_PATH)) {
			const data = fs.readFileSync(DUAL_STORE_PATH, 'utf8');
			return JSON.parse(data);
		}
	} catch(err) {
		console.error("Failed to read master users dictionary file:", err);
	}
	return {};
}

// Helper to write the updated dictionary back to disk
function saveUserToDictionary(email, tokens) {
	if(!email) return;
	try {
		if(!fs.existsSync(CREDENTIALS_DIR)) {
			fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
		}

		const dictionary = loadAllUsersDictionary();
		dictionary[email] = tokens;

		fs.writeFileSync(DUAL_STORE_PATH, JSON.stringify(dictionary, null, 2), 'utf8');
		console.log(`🔒 Storage synced. Updated credentials dictionary key for: ${email}`);
	} catch(err) {
		console.error(`Failed to write tokens to dictionary for ${email}:`, err);
	}
}

class IllustriousJsonStore extends session.Store {
	constructor() {
		super();
	}

	get(sid, callback) {
		try {
			const fileData = loadAllUsersDictionary();
			const sessions = fileData.__sessions || {};
			if(!sessions[sid]) {
				return callback(null, null);
			}
			return callback(null, sessions[sid]);
		} catch(err) {
			return callback(err);
		}
	}

	set(sid, sessionData, callback) {
		try {
			if(!fs.existsSync(CREDENTIALS_DIR)) {
				fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
			}
			const fileData = loadAllUsersDictionary();
			if(!fileData.__sessions) {
				fileData.__sessions = {};
			}

			// Create a lightweight copy of the session data to strip the redundancy
			const leanSession = { ...sessionData };

			// Delete the massive duplicated tokens property before it writes to disk
			if(leanSession.tokens) {
				delete leanSession.tokens;
			}

			fileData.__sessions[sid] = leanSession;

			fs.writeFileSync(DUAL_STORE_PATH, JSON.stringify(fileData, null, 2), 'utf8');
			if(callback) callback(null);
		} catch(err) {
			if(callback) callback(err);
		}
	}

	destroy(sid, callback) {
		try {
			const fileData = loadAllUsersDictionary();
			if(fileData.__sessions && fileData.__sessions[sid]) {
				delete fileData.__sessions[sid];
				fs.writeFileSync(DUAL_STORE_PATH, JSON.stringify(fileData, null, 2), 'utf8');
			}
			if(callback) callback(null);
		} catch(err) {
			if(callback) callback(err);
		}
	}
}



app.use(session({
	store: !hasFileStore ?
		new IllustriousJsonStore()
		: new FileStore({
			path: SESSIONS_DIR,
			retries: 0,
			ttl: 86400 // Sessions survive 24 hours
		}),
	secret: process.env.SESSION_SECRET || 'fallback-local-dev-secret',
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		sameSite: 'lax'
	}
}));

// 2. Automatic Dictionary Lookup Middleware
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
	res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

	// Essential for SharedArrayBuffer / Cross-Origin Isolation
	res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
	res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

	// This tells the browser it's okay to load this resource
	// even when the requesting page has a COEP policy
	res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

	res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-eval' 'sha256-iN7wpJdxHlpujRppkOA8N0+Mzp0ZqZr3lCtxM00Y63c='; worker-src 'self' blob:;");

	res.setHeader('Permissions-Policy', 'cross-origin-isolated=(*)');

	// Handle preflight OPTIONS requests immediately
	if(req.method === 'OPTIONS') {
		res.statusCode = 204;
		return res.end();
	}


	if(!req.session.tokens && req.session.userEmail) {
		const dictionary = loadAllUsersDictionary();
		const userTokens = dictionary[req.session.userEmail];

		if(userTokens) {
			req.session.tokens = userTokens;
			console.log(`🔄 Recovered session tokens from dictionary for: ${req.session.userEmail}`);
		}
	}
	next();
});

// 4. Authorization Endpoint
app.get('/auth', requireReactiveCredentials, (req, res) => {
	const authUrl = req.oauth2Client.generateAuthUrl({
		access_type: 'offline',
		prompt: 'consent',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email'
		],
	});
	res.redirect(authUrl);
});


// Helper Function: Extracts user identity and enforces expiration/refresh validation
function fetchAndValidateIdentity(req, callback) {
	const tokens = req.session.tokens;

	if(!tokens || !tokens.access_token) {
		return callback(new Error('Missing session tokens context'), null);
	}

	// Check if the access token has expired based on its timestamp boundary
	const isExpired = tokens.expiry_date && Date.now() >= tokens.expiry_date;

	if(isExpired) {
		// If expired and we don't have a refresh token to fix it silently, it's a hard dead-end
		if(!tokens.refresh_token) {
			return callback(new Error('Token completely expired without offline renewal capacity'), null);
		}
		console.log("⏳ Current access token expired. Relying on background offline refresh loops...");
	}

	// Mount tokens statefully onto the request's client wrapper
	req.oauth2Client.setCredentials(tokens);
	const oauth2 = google.oauth2({ version: 'v2', auth: req.oauth2Client });

	oauth2.userinfo.get((err, userInfo) => {
		if(err) {
			// If the API call fails explicitly because the token is invalid, bubble up the failure
			return callback(err, null);
		}

		if(!userInfo.data || !userInfo.data.email) {
			return callback(new Error('Could not extract user email profile from Google context'), null);
		}

		// Return the clean profile information
		return callback(null, userInfo.data);
	});
}

// 1. Root Gateway Route with dynamic string template replacement
app.get('/', requireReactiveCredentials, (req, res) => {
	if(!req.session.tokens || !req.session.tokens.access_token) {
		return res.redirect('/auth');
	}

	fetchAndValidateIdentity(req, (err, profile) => {
		if(err) {
			console.error("Pipeline access collapsed during landing check:", err.message);
			// Clear out local cache state to force a clean re-auth handshake
			req.session.tokens = null;
			return res.redirect('/auth');
		}

		const appIndex = path.join(__dirname, '..', 'index.html');
		if(fs.existsSync(appIndex)) {
			let htmlPayload = fs.readFileSync(appIndex, 'utf8');

			// Dynamic string injection mapping on load
			const welcomeBanner = `<div id="welcome-banner">Welcome back, ${profile.email}!</div>`;
			htmlPayload = htmlPayload.replace('{{USER}}', welcomeBanner);

			return res.send(htmlPayload);
		}

		res.send(`
            <div class="fallback-stage-wrapper">
                <h1 class="fallback-stage-title">🌌 Illustrious Studio Engine Live</h1>
                <p class="fallback-stage-meta">Project Boundary: <b>${req.gcpCredentials.PROJECT_ID}</b></p>
                <p class="fallback-stage-user">Active Pilot: <b>Welcome back ${profile.email}!</b></p>
                <div class="fallback-stage-terminal">
                    Tokens verified. Cluster pipeline communication loops open.
                </div>
            </div>
        `);
	});
});

// 2. Profile API Endpoint
app.get('/api/user-profile', requireReactiveCredentials, (req, res) => {
	fetchAndValidateIdentity(req, (err, profile) => {
		if(err) {
			return res.status(401).json({
				error: 'Unauthenticated or expired session profile context.',
				details: err.message
			});
		}

		res.json({
			status: 'READY',
			project: req.gcpCredentials.PROJECT_ID,
			message: 'User pipeline ready.',
			user: {
				email: profile.email,
				name: profile.name,
				picture: profile.picture
			}
		});
	});
});

// 3. Secure Callback Handshake Endpoint
app.get('/oauth2callback', requireReactiveCredentials, (req, res) => {
	const { code } = req.query;
	if(!code) {
		return serveErrorScreen(res, "Invalid Handshake Request", "The incoming authorization code from Google's endpoint context was broken or expired.", false);
	}

	req.oauth2Client.getToken(code, (err, tokens) => {
		if(err) {
			return serveErrorScreen(res, "Handshake Verification Collapsed", `Token mapping runtime exception: ${err.message}`, false);
		}

		// Drop the raw tokens briefly into the session so the validation helper can evaluate them
		req.session.tokens = tokens;

		fetchAndValidateIdentity(req, (infoErr, profile) => {
			if(infoErr) {
				req.session.tokens = null;
				return serveErrorScreen(res, "Identity Retrieval Failed", `Profile extraction crash: ${infoErr.message}`, false);
			}

			const email = profile.email;
			req.session.userEmail = email;

			// Commit the updated token state safely into your clean master JSON store file
			saveUserToDictionary(email, tokens);

			console.log(`🎯 OAuth Access & Refresh tokens successfully locked into dictionary for: ${email}`);

			// Force the session store to persist before redirecting
			req.session.save((saveErr) => {
				if(saveErr) {
					console.error("Session save failure during redirect handshake:", saveErr);
					return serveErrorScreen(res, "Session Save Failed", saveErr.message, false);
				}
				res.redirect('/');
			});
		});
	});
});

const { clusterManager } = require('../cloud-functions/cluster-manager');
const { bootGpu } = require('../cloud-functions/boot-gpu');
const { spatialRelay } = require('../cloud-functions/spatial-relay');

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

app.use(express.static(path.join(__dirname, '..')));

server.listen(PORT, () => {
	console.log(`🚀 Illustrious Execution Hub spinning up on http://localhost:${PORT}`);
	try {
		//execSync(`start http://localhost:${PORT}`);
	} catch(e) { }
});
