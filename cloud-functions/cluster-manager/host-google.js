const fs = require('fs');
const path = require('path');
const os = require('os');
const { google } = require('googleapis');

const GLOBAL_CRED_DIR = path.join(os.homedir(), '.credentials');
const DEFAULT_URI = 'http://localhost:4000/';
const DEFAULT_ENDPOINT = DEFAULT_URI + 'oauth2callback';
const GLOBAL_SETTINGS = path.join(__dirname, '../..', 'illustrious-config.json');
const CREDENTIALS_DIR = path.join(os.homedir(), '.credentials');


async function listProjectsFromGoogle(req, clientOpts) {
	let projects = [];

	console.log(`[DEBUG: listProjectsFromGoogle] Initializing project discovery loop using Google SDK initialization options.`);

	try {
		// Dynamically import the resource manager client layer to remain consistent with your compute layer pattern
		const { ProjectsClient } = require('@google-cloud/resource-manager');

		console.log(`[DEBUG: listProjectsFromGoogle] Instantiating ProjectsClient with provided execution profile context.`);
		const projectsClient = new ProjectsClient(clientOpts);

		console.log(`[DEBUG: listProjectsFromGoogle] Dispatching searchProjects request to Resource Manager via SDK...`);

		// searchProjects searches across all reachable resources under the active credential scope
		const [responseArray] = await projectsClient.searchProjects({});
		projects = responseArray || [];

		console.log(`[DEBUG: listProjectsFromGoogle] Successfully fetched projects from SDK. Total items parsed: ${projects.length}`);
	} catch(apiErr) {
		console.error(`[DEBUG: listProjectsFromGoogle CRITICAL] Native SDK discovery call rejected: ${apiErr.message}`);
		console.error(apiErr.stack);
	}

	console.log(`[DEBUG: listProjectsFromGoogle] Entering local filesystem mapping layer for ${projects.length} project items.`);
	return projects.map((p, index) => {
		// Note: The Resource Manager SDK returns 'projectId' directly on the project model properties
		const pid = p.projectId || p.id;
		const expectedCredFile = path.join(GLOBAL_CRED_DIR, `${pid}.json`);
		let hasSavedCreds = fs.existsSync(expectedCredFile);
		let maskedClientId = "";
		let maskedClientSecret = "";

		console.log(`   ├─ [Project Entry #${index}] Parsing: ${pid} (${p.displayName || p.name || 'No Name'})`);
		console.log(`   │  └─ Checking local credential mapping file path: ${expectedCredFile} -> Exists: ${hasSavedCreds}`);

		if(hasSavedCreds) {
			try {
				const creds = JSON.parse(fs.readFileSync(expectedCredFile, 'utf8'));
				const cid = creds.GCP_CLIENT_ID || creds.client_id;
				const secret = creds.GCP_CLIENT_SECRET || creds.private_key_id;

				if(cid) maskedClientId = `...${String(cid).slice(-4)}`;
				if(secret) maskedClientSecret = `...${String(secret).slice(-4)}`;
			} catch(e) {
				console.error(`   │  ⚠️ Failed to parse credential file on disk for ${pid}: ${e.message}`);
			}
		}

		return {
			id: pid,
			name: p.displayName || p.name,
			exists: hasSavedCreds,
			clientIdMask: maskedClientId,
			clientSecretMask: maskedClientSecret
		};
	});
}




async function evaluateWorkerPool(computeClient, projectId, zone) {
	console.log(`📡 [API CALL] Mapping horizon compute instances inside: ${zone}`);
	const CONFIG_INSTANCE_BASE_NAME = process.env.INSTANCE_BASE_NAME || 'illustrious-worker';

	let vms = [];
	try {
		const [response] = await computeClient.list({
			project: projectId,
			zone,
			filter: `name eq "${CONFIG_INSTANCE_BASE_NAME}.*"`
		});
		vms = response || [];
	} catch(err) {
		console.warn(`⚠️ Instance enumeration collapsed: ${err.message}`);
		return [];
	}

	return Promise.all(vms.map(async (vm, index) => {
		const publicIp = vm.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || null;
		let diagnosticMsg = null;

		console.log(`   └─ Trace -> [${index}] ${vm.name} | Status: ${vm.status}`);

		if(['STOPPING', 'TERMINATED', 'STOPPED'].includes(vm.status)) {
			if(typeof parseDiagnosticStream === 'function') {
				diagnosticMsg = await parseDiagnosticStream(computeClient, projectId, zone, vm.name);
			}
		}

		return {
			name: vm.name,
			status: vm.status,
			ip: publicIp,
			endpoint: publicIp ? `http://${publicIp}:8000` : null,
			diagnostic: diagnosticMsg
		};
	}));
}



async function fetchGcloudAvailableGPUs(computeClient, projectId) {
	if(!projectId) {
		throw new Error("Missing required Google Cloud Project ID.");
	}

	try {
		console.log(`Starting GPU inventory for project: ${projectId}...`);

		const gpuInventory = {};

		// 👉 FIX: Call the stream method directly on the client instance
		const aggregatedStream = computeClient.aggregatedListAsync({
			project: projectId,
		});

		// The stream yields [scope, scopedList] pairs (e.g., ["zones/us-central1-a", { acceleratorTypes: [...] }])
		for await(const [scope, data] of aggregatedStream) {
			if(!data || !data.acceleratorTypes || data.acceleratorTypes.length === 0) {
				continue;
			}

			// Extract zone name (e.g., "us-central1-a")
			const zoneName = scope.split('/').pop().toLowerCase();
			// Extract region from zone name (e.g., "us-central1")
			const regionName = zoneName.split('-').slice(0, 2).join('-');

			if(!gpuInventory[regionName]) {
				gpuInventory[regionName] = {};
			}

			// Format GPU information from this zone boundary
			const gpusInZone = data.acceleratorTypes.map(acc => {
				return {
					name: acc.name,
					description: acc.description,
					maximumCardsPerInstance: acc.maximumCardsPerInstance
				};
			});

			gpuInventory[regionName][zoneName] = gpusInZone;
		}

		// Flattens into your exact operational "zoneKey" display map signature
		const flattenedReport = {};
		for(const [region, zones] of Object.entries(gpuInventory)) {
			for(const [zone, gpus] of Object.entries(zones)) {
				const gpuString = gpus.map(g => {
					return g.name
						.replace(/-/g, ' ')
						.replace(/\b\w/g, c => c.toUpperCase())
						.replace(/Gpu/g, 'GPU');
				}).join(', ');

				flattenedReport[zone] = `${region} Region Cluster / Available GPUs: [${gpuString}]`;
			}
		}

		return flattenedReport;
	} catch(error) {
		console.error("Failed to fetch Google Cloud GPU availability:", error);
		throw error;
	}
}



async function verifyGpuQuota(RegionsClient, projectId, region = 'us-central1') {
	try {
		const regionsClient = new RegionsClient({ project: projectId });

		console.log(`📊 [QUOTA ENGINE] Polling complete regional data matrix for: ${region}`);
		const [regionData] = await regionsClient.get({
			project: projectId,
			region: region
		});

		if(!regionData.quotas || regionData.quotas.length === 0) {
			throw new Error(`GCP returned an empty quota matrix for region: ${region}`);
		}

		// Gather EVERY single metric containing the "GPU" string signature
		const gpuQuotas = regionData.quotas.filter(q =>
			q.metric && q.metric.toUpperCase().includes('GPU')
		);

		// Map the array into a clean key-value dictionary for fast evaluation and logging
		const quotaReport = {};

		gpuQuotas.forEach(q => {
			const limit = Number(q.limit);
			const usage = Number(q.usage);
			const available = limit - usage;

			quotaReport[q.metric] = {
				limit: limit,
				usage: usage,
				available: available
			};

			console.log(`   ├─ 🏷️  [METRIC] ${q.metric} -> Max: ${limit} | In-Use: ${usage} | Available: ${available}`);
		});

		// Fail-safe validation check: make sure we aren't flying completely blind
		if(Object.keys(quotaReport).length === 0) {
			console.warn(`⚠️ [QUOTA ENGINE] No metrics containing 'GPU' signature found inside ${region}.`);
		}

		// Return the full object payload down the pipe to your manager loop status response
		return quotaReport;

	} catch(err) {
		console.error("🚨 [QUOTA ENGINE ERROR] Execution trace failed:", err.message);
		throw err;
	}
}




async function getActiveAccountFromGoogle(req, clientOpts) {
	const authHeader = req?.headers?.authorization || (req?.oauth2Client?.credentials?.access_token ? `Bearer ${req.oauth2Client.credentials.access_token}` : null);

	// If there's no interactive user token header, check if we're using an offline service account key file
	if(!authHeader) {
		if(clientOpts?.keyFilename) {
			try {
				const fs = require('fs');
				const keyData = JSON.parse(fs.readFileSync(clientOpts.keyFilename, 'utf8'));
				return keyData.client_email || "Service Account Keyfile";
			} catch(e) {
				return "Unauthenticated Session";
			}
		}
		return "Unauthenticated Session";
	}

	try {
		const identityResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			method: 'GET',
			headers: { 'Authorization': authHeader }
		});

		if(identityResponse.ok) {
			const profile = await identityResponse.json();
			if(profile.email) return profile.email;
		}
	} catch(err) {
		console.warn("[AUTH ENGINE WARNING] Token profile lookup failed:", err.message);
	}

	return "Unauthenticated Session";
}

async function fetchTelemetry(config, req) {
	console.log(`[Telemetry] Entry trace initialized.`);
	console.log(`[Telemetry] Raw Incoming Config Payload:`, JSON.stringify(config));

	// Fix 1: Pre-evaluate target project token identity to resolve configuration fallbacks early
	const initialConfigProjectId = config?.project_id || config?.projectId;

	console.log(`[Telemetry] Intercepting options state setup before dispatching network tasks...`);
	// Pass the initial project context down to resolve filesystem keys early
	const clientOpts = getGcpClientOptions(req, initialConfigProjectId);

	console.log(`[Telemetry] Resolving Active Google Account...`);
	const authenticatedAccount = await getActiveAccountFromGoogle(req, clientOpts);
	console.log(`[Telemetry] Resolved Account: ${authenticatedAccount}`);

	// If we have no active identity context, halt execution before wasting network requests
	if(authenticatedAccount === "Unauthenticated Session") {
		console.error(`[DEBUG: Telemetry BOUNDARY FAILURE] Security validation failed: Unauthenticated credentials payload context.`);
		return {
			authenticated: false,
			status: 'UNAUTHENTICATED',
			message: 'No valid security key or token structure attached to request context.',
			account: authenticatedAccount,
			projects: [],
			activeVMs: [],
			quotas: null,
			zone: config?.zone || 'us-central1-a'
		};
	}

	// Fix 2: Inject resolved client auth parameters directly back into the request context stream if needed by listProjectsFromGoogle
	if(clientOpts?.auth) {
		req.oauth2Client = clientOpts.auth;
	}


	console.log(`[Telemetry] Fetching Project Matrix List from Google...`);
	const processedProjects = await listProjectsFromGoogle(req, clientOpts);
	console.log(`[Telemetry] Found ${processedProjects?.length || 0} project entries on disk/session.`);


	// Explicitly print the entire dataset structure to see exactly what is floating around in memory
	console.log(`[Telemetry] Complete Projects Array:`, JSON.stringify(processedProjects, null, 2));

	// Extract the project ID from the loaded keyfile metadata explicitly
	let keyfileProjectId = null;
	if(clientOpts?.keyFilename) {
		try {
			const fs = require('fs');
			const keyData = JSON.parse(fs.readFileSync(clientOpts.keyFilename, 'utf8'));
			keyfileProjectId = keyData.project_id || keyData.PROJECT_ID;
		} catch(e) {
			// Ignore descriptor read errors
		}
	}

	// Scan the processed array to see if our keyfile or config matches any entries by ID or Name
	const matchedProject = processedProjects?.find(p =>
		p?.id === initialConfigProjectId ||
		p?.id === keyfileProjectId ||
		p?.name === initialConfigProjectId
	);

	// Dynamic resolution hierarchy: configuration string, matched array object, or direct keyfile fallback
	const targetProjectId = initialConfigProjectId || matchedProject?.id || keyfileProjectId;

	console.log(`[Telemetry] Comprehensive Project Evaluation Table:`);
	console.log(`   ├─ Incoming Config Token String:   ${initialConfigProjectId || 'NOT PROVIDED'}`);
	console.log(`   ├─ Active Keyfile Disk Reference:   ${keyfileProjectId || 'NOT FOUND'}`);
	console.log(`   ├─ API Array Intersection Match:   ${matchedProject ? JSON.stringify(matchedProject) : 'NONE'}`);
	console.log(`   └─ WINNING RESOLVED TARGET ID:     ${targetProjectId}`);

	const targetZone = config?.zone || 'us-central1-a';
	const targetRegion = targetZone.split('-').slice(0, 2).join('-');
	console.log(`[Telemetry] Geometric Layout -> Zone: ${targetZone} | Region: ${targetRegion}`);

	let activeVMs = [];
	let quotaInfo = null;
	let poolStatus = 'READY';
	let poolMessage = 'Hardware infrastructure loop verified.';
	let availability = {};

	if(!targetProjectId) {
		console.warn(`[DEBUG: Telemetry BOUNDARY FAILURE] targetProjectId evaluated to empty. Halting downstream API calls.`);
		return {
			authenticated: true,
			status: 'UNCONFIGURED',
			message: 'No active workspace project tracking context available.',
			account: authenticatedAccount,
			projects: processedProjects,
			activeVMs: [],
			quotas: null,
			zone: targetZone
		};
	}

	try {
		console.log(`[Telemetry] Dynamically loading Google Cloud Compute SDK clients...`);
		const { InstancesClient, RegionsClient, DisksClient, ZonesClient, AcceleratorTypesClient } = require('@google-cloud/compute');

		console.log(`[Telemetry] Instantiating SDK Clients with pre-built options matrix payload.`);
		const computeClient = new InstancesClient(clientOpts);
		const disksClient = new DisksClient(clientOpts);
		const zonesClient = new ZonesClient(clientOpts);
		const accelClient = new AcceleratorTypesClient(clientOpts);

		// 1. Fetch raw, complete quota dictionary object
		console.log(`[DEBUG: Telemetry API CALL] Dispatching verifyGpuQuota to Regions Client...`);
		quotaInfo = await verifyGpuQuota(RegionsClient, targetProjectId, targetRegion);
		console.log(`[DEBUG: Telemetry API SUCCESS] Received Quotas payload. Size: ${Object.keys(quotaInfo || {}).length} metrics tracked.`);

		// 2. Fire background zombie drive cleanups
		if(typeof purgeStaleStagingDisks === 'function') {
			console.log(`[DEBUG: Telemetry PIPELINE] Launching async purgeStaleStagingDisks drive routine...`);
			purgeStaleStagingDisks(disksClient, targetProjectId, targetZone).catch(err =>
				console.warn("[CLEANUP TRACE] Background drive purger stalled:", err.message)
			);
		} else {
			console.log(`[Telemetry] Skipping storage purges. 'purgeStaleStagingDisks' function definition missing in frame.`);
		}

		// 3. Evaluate worker pool instances natively
		console.log(`[DEBUG: Telemetry API CALL] Dispatching evaluateWorkerPool to Instances Client...`);
		activeVMs = await evaluateWorkerPool(computeClient, targetProjectId, targetZone);
		console.log(`[DEBUG: Telemetry API SUCCESS] Received VM compute frame payload array. Total instances parsed: ${activeVMs?.length || 0}`);
		availability = await fetchGcloudAvailableGPUs(accelClient, targetProjectId);

		const activeWorkers = activeVMs.filter(node => ['RUNNING', 'PROVISIONING', 'STAGING'].includes(node.status));
		console.log(`[POOL ANALYSIS] Active/Staging nodes count: ${activeWorkers.length}`);

		// 4. Intercept state grids for blocked recovery locks
		console.log(`[Telemetry] Checking compute stack for structural node gridlocks...`);
		const lingeringNode = activeVMs.find(n => ['STOPPING', 'TERMINATED', 'STOPPED'].includes(n.status));
		if(lingeringNode) {
			console.log(`[HOLD] Gridlock detected on item: ${lingeringNode.name} Status: ${lingeringNode.status}`);
			poolStatus = 'POOL_BLOCKED';
			poolMessage = `Hardware pool stalled. Reason: ${lingeringNode.diagnostic || 'Node requires a cloud hypervisor clear.'}`;
		} else {
			console.log(`[Telemetry] Zero compute pool locks caught.`);
		}

	} catch(err) {
		console.error(`[CRITICAL BREAK: fetchTelemetry INTERNAL COLLAPSE] Telemetry gather pipeline intercepted error state:`);
		console.error(`   ├─ Message: ${err.message}`);
		console.error(`   └─ Stack Trace:`, err.stack);

		return {
			authenticated: true,
			status: 'ERROR',
			message: err.message,
			account: authenticatedAccount,
			projects: processedProjects,
			activeVMs: [],
			quotas: null,
			zone: targetZone,
			availability: availability
		};
	}

	console.log(`[Telemetry] Constructing pipeline return payload...`);
	return {
		authenticated: true,
		status: poolStatus,
		message: poolMessage,
		account: authenticatedAccount,
		projects: processedProjects,
		activeVMs: activeVMs,
		quotas: quotaInfo,
		zone: targetZone,
		availability: availability
	};
}


let oauth2ClientInstance = null;
let cachedClientId = null;
let cachedClientSecret = null;




function resolveActiveProjectContext() {
	// 1. Check process environment variables first
	if(process.env.GCP_PROJECT_ID) {
		return { projectId: process.env.GCP_PROJECT_ID, source: 'ENV' };
	}

	// 2. Fall back to reading the system workspace anchor pointer
	const anchorPath = path.join(__dirname, '..', 'illustrious-config.json');
	if(fs.existsSync(anchorPath)) {
		try {
			const anchorData = JSON.parse(fs.readFileSync(anchorPath, 'utf8'));
			if(anchorData.ACTIVE_PROJECT_ID) {
				return { projectId: anchorData.ACTIVE_PROJECT_ID, source: 'ANCHOR_CONFIG' };
			}
		} catch(e) {
			console.error("Failed to parse active configuration matrix tracker:", e.message);
		}
	}

	// 3. Scan the global credentials folder directly for service account keys if no anchor exists
	if(fs.existsSync(GLOBAL_CRED_DIR)) {
		const files = fs.readdirSync(GLOBAL_CRED_DIR);
		// Match a standalone service account json string pattern or explicitly look for known prefixes
		const saFile = files.find(file => file.endsWith('.json') && !file.includes('illustrious-config'));
		if(saFile) {
			try {
				const fileData = JSON.parse(fs.readFileSync(path.join(GLOBAL_CRED_DIR, saFile), 'utf8'));
				const resolvedId = fileData.project_id || fileData.PROJECT_ID;
				if(resolvedId) {
					return { projectId: resolvedId, source: 'SCAN', fileName: saFile };
				}
			} catch(e) {
				// Ignore parsing errors during standard fallback traversal
			}
		}
	}

	// 4. Hardcoded ultimate fallback
	return { projectId: 'illustrious-499422', source: 'HARDCODED_FALLBACK' };
}

/**
 * Assembles unified client option configurations across both background Service Accounts and User OAuth layers
 */
function getGcpClientOptions(req, targetProjectId) {
	const projectId = targetProjectId || resolveActiveProjectContext().projectId;
	const options = { projectId };

	// Priority 1: Service Account credential mapping
	if(fs.existsSync(GLOBAL_CRED_DIR)) {
		const files = fs.readdirSync(GLOBAL_CRED_DIR);
		const matchingFile = files.find(file => file.startsWith(projectId) && file.endsWith('.json'));

		if(matchingFile) {
			options.keyFilename = path.join(GLOBAL_CRED_DIR, matchingFile);
			console.log(`[AUTH ENGINE] Linked execution layer to keyfile: ${options.keyFilename}`);
			return options;
		}
	}

	// Priority 2: OAuth2 Client Session verification
	const oauthClient = req?.oauth2Client || oauth2ClientInstance;
	const hasAccessToken = oauthClient?.credentials?.access_token || req?.session?.tokens?.access_token;

	if(oauthClient && hasAccessToken) {
		if(!oauthClient.credentials?.access_token && req?.session?.tokens) {
			oauthClient.setCredentials(req.session.tokens);
		}
		options.auth = oauthClient;
		console.log(`[AUTH ENGINE] Linked execution layer to active OAuth2 Client Session`);
		return options;
	}

	console.warn(`[AUTH ENGINE WARNING] No valid credential context or keyfile found for project: ${projectId}`);
	return options;
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

function requireReactiveCredentials(req, res, next) {
	const context = resolveActiveProjectContext();
	let credentials = null;

	console.log(`\n\x1b[36m[OAuth Debug]\x1b0m Checking credentials for route: ${req.originalUrl}`);

	// Load structure payload data safely
	try {
		const realConfigFile = path.join(GLOBAL_CRED_DIR, context.fileName || `${context.projectId}.json`);
		if(fs.existsSync(realConfigFile)) {
			credentials = JSON.parse(fs.readFileSync(realConfigFile, 'utf8'));
			console.log(`\x1b[32m[OAuth Debug]\x1b0m Loaded GCP client secrets from file: ${realConfigFile}`);
		} else {
			console.warn(`\x1b[33m[OAuth Debug]\x1b0m Client secrets configuration file not found at: ${realConfigFile}`);
		}
	} catch(e) {
		console.error("\x1b[31m[OAuth Debug]\x1b0m Failed downstream file load profile read logic:", e.message);
	}

	// Reject processing if credentials cannot be derived from local contexts
	if(!credentials && context.source === 'HARDCODED_FALLBACK') {
		console.error(`\x1b[31m[OAuth Debug]\x1b0m Halting: No credentials parsed and context source is HARDCODED_FALLBACK.`);
		return serveErrorScreen(
			res,
			"GCP Credentials Missing",
			"No active workspace tracking record found inside your system directory boundary. Please initialize environment configurations before accessing the studio."
		);
	}

	const clientId = credentials?.GCP_CLIENT_ID || credentials?.client_id;
	const clientSecret = credentials?.GCP_CLIENT_SECRET || credentials?.private_key;
	let endpoint = process.env.REDIRECT_URI || DEFAULT_ENDPOINT;
	try {
		if(fs.existsSync(GLOBAL_SETTINGS)) {
			endpoint = JSON.parse(fs.readFileSync(GLOBAL_SETTINGS))?.REDIRECT_URI || endpoint;
		}
	} catch(e) {
		console.error("\x1b[31m[OAuth Debug]\x1b0m Failed reading GLOBAL_SETTINGS redirect URI:", e.message);
	}

	// Instantiate OAuth application client state safely if flags require modification
	if(clientId && clientSecret && (!oauth2ClientInstance || clientId !== cachedClientId)) {
		console.log(`\x1b[35m[OAuth Debug]\x1b0m Initializing fresh Google OAuth2 client instance for client ID: ${clientId.substring(0, 15)}...`);
		oauth2ClientInstance = new google.auth.OAuth2(
			clientId,
			clientSecret,
			endpoint || DEFAULT_ENDPOINT
		);
		cachedClientId = clientId;
		cachedClientSecret = clientSecret;
	}

	// SESSION VERIFICATION LOGGING
	if(!req.session) {
		console.warn("\x1b[33m[OAuth Debug]\x1b0m WARNING: req.session is completely undefined. Check session store middleware execution order.");
	} else if(!req.session.tokens) {
		console.warn("\x1b[33m[OAuth Debug]\x1b0m WARNING: req.session.tokens is completely empty. Stored token was missing or cleared.");
	} else {
		const t = req.session.tokens;
		const isExpired = t.expiry_date ? Date.now() >= t.expiry_date : true;
		const timeRemaining = t.expiry_date ? Math.round((t.expiry_date - Date.now()) / 1000) : 0;

		console.log(`\x1b[32m[OAuth Debug]\x1b0m Session tokens located:`);
		console.log(`   - Access Token:  ${t.access_token ? '✓ Present' : '✗ Missing'}`);
		console.log(`   - Refresh Token: ${t.refresh_token ? '✓ Present (Can auto-refresh)' : '✗ Missing (WILL force re-login upon expiration)'}`);
		console.log(`   - Expiration:    ${t.expiry_date ? new Date(t.expiry_date).toISOString() : 'Unknown'} (${timeRemaining}s remaining) [Expired: ${isExpired}]`);
	}

	if(req.session && req.session.tokens && oauth2ClientInstance) {
		oauth2ClientInstance.setCredentials(req.session.tokens);

		// Listen for internal token updates (like auto-refresh)
		oauth2ClientInstance.removeAllListeners('tokens');
		oauth2ClientInstance.on('tokens', (newTokens) => {
			console.log("\x1b[35m[OAuth Debug]\x1b0m ⚡ oauth2Client triggered a automatic 'tokens' refresh event:");
			console.log(`   - New Access Token: ${newTokens.access_token ? '✓ Received' : '✗ Unchanged'}`);
			console.log(`   - New Refresh Token: ${newTokens.refresh_token ? '✓ Received' : '✗ Unchanged (Using existing)'}`);

			const updatedTokens = { ...req.session.tokens, ...newTokens };
			req.session.tokens = updatedTokens;
			if(req.session.userEmail) {
				console.log(`\x1b[32m[OAuth Debug]\x1b0m Saving newly refreshed credentials back into user dictionary for: ${req.session.userEmail}`);
				saveUserToDictionary(req.session.userEmail, updatedTokens);
			} else {
				console.warn("\x1b[33m[OAuth Debug]\x1b0m Cannot commit refreshed tokens to master dictionary: req.session.userEmail is missing.");
			}
		});
	}

	req.oauth2Client = oauth2ClientInstance;
	req.gcpCredentials = {
		PROJECT_ID: context.projectId
	};

	next();
}


module.exports = {
	requireReactiveCredentials,
	getActiveAccountFromGoogle,
	listProjectsFromGoogle,
	evaluateWorkerPool,
	verifyGpuQuota,
	getGcpClientOptions,
	fetchTelemetry,
	fetchAndValidateIdentity,
	saveUserToDictionary,
	CREDENTIALS_DIR
};

