const fs = require('fs');
const path = require('path');
const os = require('os');

const GLOBAL_CRED_DIR = path.join(os.homedir(), '.credentials');

const CLOUD_PROVIDER_KEYS = [
    { id: 'gcloud-service', prefix: 'gcloud', pattern: /.*-\d+-\d+\.json$/ },
    { id: 'aws-service', prefix: 'aws', file: 'aws-provider.json', key: 'aws_access_key_id' },
    { id: 'azure-service', prefix: 'azure', file: 'azure-provider.json', key: 'client_id' },
    { id: 'oracle-service', prefix: 'oracle', file: 'oracle-provider.json', key: 'fingerprint' },
    { id: 'ibm-service', prefix: 'ibm', file: 'ibm-provider.json', key: 'api_key' },
    { id: 'runpod-service', prefix: 'runpod', file: 'runpod-provider.json', key: 'api_key' },
    { id: 'lambda-service', prefix: 'lambda', file: 'lambda-provider.json', key: 'api_key' },
    { id: 'digitalocean-service', prefix: 'digitalocean', file: 'digitalocean-provider.json', key: 'api_key' },
    { id: 'vultr-service', prefix: 'vultr', file: 'vultr-provider.json', key: 'api_key' },
    { id: 'vast-service', prefix: 'vast', file: 'vast-provider.json', key: 'api_key' },
    { id: 'replicate-service', prefix: 'replicate', file: 'replicate-provider.json', key: 'api_key' },
    { id: 'tencent-service', prefix: 'tencent', file: 'tencent-provider.json', key: 'secret_id' },
    { id: 'paperspace-service', prefix: 'paperspace', file: 'paperspace-provider.json', key: 'api_key' },
    { id: 'coreweave-service', prefix: 'coreweave', file: 'coreweave-provider.json', key: 'api_key' }
];

/**
 * Normalizes user form payloads by unmasking untouched data keys using local storage files.
 */
function normalizePayloadWithDisk(providerId, clientFields) {
    const provider = CLOUD_PROVIDER_KEYS.find(p => p.id === providerId);
    if (!provider || !provider.file) return clientFields;

    const fullPath = path.join(GLOBAL_CRED_DIR, provider.file);
    let diskData = {};

    if (fs.existsSync(fullPath)) {
        try {
            diskData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        } catch (e) {
            diskData = {};
        }
    }

    const mergedPayload = { ...clientFields };

    // Loop fields to look up and strip user dashboard dummy character masks
    Object.keys(mergedPayload).forEach(key => {
        const val = String(mergedPayload[key]);
        if (val.includes('••••') || val.trim() === '') {
            // Restore from active storage frame if available
            if (diskData[key]) {
                mergedPayload[key] = diskData[key];
            }
        }
    });

    return mergedPayload;
}



const PROVIDER_HANDLERS = {
    'runpod-service': require('./host-runpod.js'),
    'gcloud-service': require('./host-google.js')
};

/**
 * Agnostic Validation Broker. Maps incoming key data blocks directly to live cloud provider APIs.
 */
async function authenticateCloudProvider(providerId, payload) {
    console.log(`\n=================== [TELEMETRY ENGINE: ${providerId}] ===================`);
    const config = normalizePayloadWithDisk(providerId, payload);

    const handler = PROVIDER_HANDLERS[providerId];
    if (!handler) {
        console.log(`[DEBUG] No explicit telemetry tracker for ${providerId}. Cascading to static mock bypass.`);
        return {
            success: true,
            meta: {
                authenticated: false,
                account: 'Mock Verification Lane',
                projects: [],
                activeVMs: [],
                quotas: null
            }
        };
    }

    try {
        const telemetry = await handler.fetchTelemetry(config);
        console.log(`=================== [TELEMETRY END: SUCCESS] ===================\n`);
        return { success: true, meta: telemetry };
    } catch (err) {
        console.error(`[TELEMETRY FAILURE] ${providerId} pipeline threw exception:`, err.message);
        throw err;
    }
}



module.exports = {
    CLOUD_PROVIDER_KEYS,
    authenticateCloudProvider,
    GLOBAL_CRED_DIR
};