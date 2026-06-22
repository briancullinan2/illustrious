const fs = require('fs');
const path = require('path');
const os = require('os');

const GLOBAL_CRED_DIR = path.join(os.homedir(), '.credentials');

const CLOUD_PROVIDER_KEYS = [
    { id: 'gcloud-service', prefix: 'gcloud', pattern: /.*-\d+-\d+\.json$/ },
    { id: 'runpod-service', prefix: 'runpod', file: 'runpod-provider.json', key: 'api_key' },
    { id: 'aws-service', prefix: 'aws', file: 'aws-provider.json', key: 'aws_access_key_id' },
    { id: 'azure-service', prefix: 'azure', file: 'azure-provider.json', key: 'client_id' },
    { id: 'oracle-service', prefix: 'oracle', file: 'oracle-provider.json', key: 'fingerprint' },
    { id: 'ibm-service', prefix: 'ibm', file: 'ibm-provider.json', key: 'api_key' },
    { id: 'lambda-service', prefix: 'lambda', file: 'lambda-provider.json', key: 'api_key' },
    { id: 'digitalocean-service', prefix: 'digitalocean', file: 'digitalocean-provider.json', key: 'api_key' },
    { id: 'vultr-service', prefix: 'vultr', file: 'vultr-provider.json', key: 'api_key' },
    { id: 'vast-service', prefix: 'vast', file: 'vast-provider.json', key: 'api_key' },
    { id: 'replicate-service', prefix: 'replicate', file: 'replicate-provider.json', key: 'api_key' },
    { id: 'tencent-service', prefix: 'tencent', file: 'tencent-provider.json', key: 'secret_id' },
    { id: 'paperspace-service', prefix: 'paperspace', file: 'paperspace-provider.json', key: 'api_key' },
    { id: 'coreweave-service', prefix: 'coreweave', file: 'coreweave-provider.json', key: 'api_key' },
    { id: 'runlocal-service', prefix: 'coreweave', file: 'runlocal-provider.json', key: 'api_key' }
];


function loadCredentialsForProvider(providerConfig) {
    console.log(`\n🔍 [DISK READ INIT] Loading storage for configuration target...`);

    // Fix the reference error: swap 'providerId' with 'providerConfig'
    if (typeof providerConfig === 'string') {
        const lookupId = providerConfig;
        providerConfig = CLOUD_PROVIDER_KEYS.find(p => p.id === lookupId);
        console.log(`   » Resolved provider string ID "${lookupId}" to internal metadata blueprint.`);
    }

    if (!providerConfig || !providerConfig.file) {
        console.log(`   » Target handles its own environmental context. Bypassing file parse.`);
        return {};
    }

    const targetFilePath = path.join(GLOBAL_CRED_DIR, providerConfig.file);
    console.log(`   » Target absolute file path resolved to: ${targetFilePath}`);

    if (fs.existsSync(targetFilePath)) {
        try {
            const rawData = fs.readFileSync(targetFilePath, 'utf8');
            const parsed = JSON.parse(rawData);
            console.log(`   ✅ [DISK READ SUCCESS] Found keys on filesystem: [${Object.keys(parsed).join(', ')}]`);
            return parsed;
        } catch (e) {
            console.warn(`   ⚠️ [CONFIG CORRUPTION] Could not parse credentials file for ${providerConfig.id}: ${e.message}`);
        }
    } else {
        console.log(`   ❌ [DISK READ MISS] No file currently exists at target location.`);
    }
    return {};
}

function normalizePayloadWithDisk(providerId, clientFields) {
    console.log(`\n⚙️ [NORMALIZE RUN] Normalizing incoming client payload for: ${providerId}`);

    const provider = CLOUD_PROVIDER_KEYS.find(p => p.id === providerId);
    if (!provider || !provider.file) {
        console.log(`   » No managed layout metadata found for provider. Returning client fields directly.`);
        return clientFields || {};
    }

    const diskData = loadCredentialsForProvider(provider);
    const incomingFields = clientFields || {};

    // 1. Establish the ultimate baseline using ONLY non-empty values from disk
    const mergedPayload = {};
    Object.keys(diskData).forEach(key => {
        const diskVal = String(diskData[key] || '').trim();
        if (diskVal !== '' && !diskVal.includes('••••')) {
            mergedPayload[key] = diskData[key]; // Preserve valid stored data
        }
    });

    // 2. Loop through every expected key for this provider to evaluate incoming values
    // Use the keys from diskData or fall back to incoming fields keys if disk is empty
    const allPossibleKeys = new Set([...Object.keys(mergedPayload), ...Object.keys(incomingFields)]);

    allPossibleKeys.forEach(key => {
        const clientVal = incomingFields[key] !== undefined ? String(incomingFields[key]) : null;

        // Scenario A: Client provided a brand new, clean, non-empty value
        if (clientVal !== null && clientVal.trim() !== '' && !clientVal.includes('••••')) {
            console.log(`   » Key [${key}] updated by client payload input.`);
            mergedPayload[key] = incomingFields[key];
        }
        // Scenario B: Client sent a mask or empty string, let's see if we have a valid backup
        else if (clientVal !== null && (clientVal.trim() === '' || clientVal.includes('••••'))) {
            const backupVal = mergedPayload[key] !== undefined ? String(mergedPayload[key]).trim() : '';

            if (backupVal !== '' && !backupVal.includes('••••')) {
                console.log(`   ↳ Key [${key}] masked/empty from client. Preserved working value from local disk storage.`);
                // Keep the backup value already set in mergedPayload
            } else {
                console.log(`   ⚠️ Key [${key}] is vacant in both incoming payload and local disk. Stripping completely.`);
                delete mergedPayload[key]; // Ensure it's not passed as a blank string ""
            }
        }
    });

    // 3. Final sanitization pass: purge anything that somehow remained empty or whitespace-only
    Object.keys(mergedPayload).forEach(key => {
        const finalVal = String(mergedPayload[key] || '').trim();
        if (finalVal === '' || finalVal.includes('••••')) {
            delete mergedPayload[key];
        }
    });

    console.log(`⚙️ [NORMALIZE COMPLETE] Payload pipeline object sealed. Outgoing keys: [${Object.keys(mergedPayload).join(', ')}]`);
    return mergedPayload;
}


const PROVIDER_HANDLERS = {
    'runpod-service': require('./host-runpod.js'),
    'gcloud-service': require('./host-google.js')
};





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
    PROVIDER_HANDLERS,
    CLOUD_PROVIDER_KEYS,
    normalizePayloadWithDisk,
    authenticateCloudProvider,
    loadCredentialsForProvider,
    GLOBAL_CRED_DIR
};