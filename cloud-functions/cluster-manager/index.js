const { GLOBAL_CRED_DIR, loadCredentialsForProvider, CLOUD_PROVIDER_KEYS, normalizePayloadWithDisk } = require('./cloud-manager.js')
const { verifyGpuQuota, evaluateWorkerPool, getGcpClientOptions } = require('./host-google.js')
const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');
const https = require('https');

const CONFIG = {
    DEFAULT_ZONE: 'us-central1-a',
    ZONE_FAILOVER_POOL: ['us-central1-f', 'us-east1-c', 'us-west1-b'],
    INSTANCE_BASE_NAME: 'illustrious-juggernaut-worker-node',
    BOOT_GPU_URL: process.env.BOOT_GPU_FUNCTION_URL
};


const PROVIDER_HANDLERS = {
    'runpod-service': require('./host-runpod.js'),
    'gcloud-service': require('./host-google.js')
};

// Global in-memory cache map to store telemetry states across all providers
const telemetryCache = {
    // Structure per provider: 
    // 'provider-id': { data: null, expiresAt: 0, inflight: null }
};



// Updated getCoalescedTelemetry to make sure results are written immediately to the memory cache object
function getCoalescedTelemetry(providerId, handler, config) {
    if (!telemetryCache[providerId]) {
        telemetryCache[providerId] = { data: null, expiresAt: 0, inflight: null };
    }

    const cache = telemetryCache[providerId];
    const now = Date.now();

    if (cache.data && now < cache.expiresAt) {
        return Promise.resolve(cache.data);
    }

    if (cache.inflight) {
        return cache.inflight;
    }

    console.log(`📡 [CACHE MISS] Dispatching live telemetry fetch for: ${providerId}`);
    cache.inflight = handler.fetchTelemetry(config)
        .then(result => {
            // Update cache memory instantly on resolution
            cache.data = result;
            cache.expiresAt = Date.now() + (10 * 60 * 1000);
            cache.inflight = null;
            return result;
        })
        .catch(err => {
            cache.inflight = null;
            console.error(`⚠️ [TELEMETRY FAILURE] Provider ${providerId} failed:`, err.message);

            // Build a clean, un-nested flat error payload so it doesn't break JSON serialization
            const errorPayload = {
                success: false,
                provider: providerId,
                error: err.message || 'Unknown execution trace failure.'
            };
            cache.data = errorPayload; // Save the error to cache so it populates the dashboard fields
            return errorPayload;
        });

    return cache.inflight;
}

exports.clusterManager = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    console.log("------------------------------------------------------------");
    console.log(`📡 [MANAGER LOG] Monolithic multi-provider evaluation triggered.`);

    try {
        const providerKeys = Object.keys(PROVIDER_HANDLERS);

        const taskPromises = providerKeys.map(key => {
            const flatConfig = normalizePayloadWithDisk(key, {});

            console.log(`🔑 [CREDENTIAL CHECK] Provider: ${key} | Keys Loaded: [${Object.keys(flatConfig).join(', ') || 'NONE'}]`);

            return getCoalescedTelemetry(key, PROVIDER_HANDLERS[key], flatConfig)
                .then(result => ({ key, result }));
        });

        // 1. Race to catch whichever returns first
        const fastestResponse = await Promise.race(taskPromises);
        console.log(`⚡ [RACE WINNER] First telemetry block yielded by: ${fastestResponse.key}`);

        // 2. Allow a tiny macro-task delay (0ms) so that any synchronously resolving companion promises 
        // can save their payload modifications directly into the telemetryCache mapping
        await new Promise(resolve => setTimeout(resolve, 0));

        const aggregatedMeta = {
            authenticated: true,
            status: "AGGREGATED_LOAD",
            providersCount: providerKeys.length,
            services: {}
        };

        // 3. Re-read directly from the master telemetryCache map for ALL providers
        providerKeys.forEach(key => {
            const cacheEntry = telemetryCache[key];
            if (cacheEntry && cacheEntry.data) {
                aggregatedMeta.services[key] = cacheEntry.data;
            } else if (key === fastestResponse.key) {
                aggregatedMeta.services[key] = fastestResponse.result;
            }
        });

        return res.status(200).json({
            success: true,
            meta: aggregatedMeta
        });

    } catch (err) {
        console.error("❌ [CRITICAL BREAK] Monolithic manager compilation failed:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

function handleEmptyPoolEvaluation(res, instancePool, zone, quotaInfo) {
    console.log("🌌 [POOL VACANT] Zero operational assets currently online.");

    const lingeringNode = instancePool.find(n => ['STOPPING', 'TERMINATED'].includes(n.status));
    if (lingeringNode) {
        console.log("🛑 [HOLD] Gridlock detected. Node requires a cloud hypervisor clear.");
        return res.status(200).json({
            status: 'POOL_BLOCKED',
            quotas: quotaInfo,
            message: `Hardware pool stalled. Reason: ${lingeringNode.diagnostic}`,
            instances: instancePool,
            zone: zone
        });
    }

    // Explicitly note that boot-gpu auto-scaling trigger code is commented out right here
    return res.status(200).json({
        status: 'POOL_EMPTY',
        quotas: quotaInfo,
        message: "No active nodes detected. Safe for manual claim optimization.",
        instances: [],
        zone: zone
    });
}


// ============================================================================
// 🛠️ ISOLATED SUB-ROUTINES (STRICT TELEMETRY MANAGEMENT PACK)
// ============================================================================

async function resolveZoneTelemetry(computeClient, project) {
    try {
        const [defaultVmCheck] = await computeClient.list({
            project,
            zone: CONFIG.DEFAULT_ZONE,
            filter: `name eq "${CONFIG.INSTANCE_BASE_NAME}.*"`
        });

        const brokenNode = defaultVmCheck?.find(vm => ['STOPPED', 'TERMINATED'].includes(vm.status));

        if (brokenNode) {
            console.log(`🚨 [DYNAMIC HORIZON] Default Zone '${CONFIG.DEFAULT_ZONE}' flagged with exhausted worker states. Shifting failover maps...`);
            return CONFIG.ZONE_FAILOVER_POOL[0];
        }
    } catch (e) {
        console.warn("⚠️ Dynamic zone resolution probe missed, falling back to basic bounds:", e.message);
    }
    return CONFIG.DEFAULT_ZONE;
}

async function parseDiagnosticStream(computeClient, project, zone, instanceName) {
    let message = "Spot Preemption / Capacity Deficit: Resource allocation pool exhausted.";
    try {
        const [serialData] = await computeClient.getSerialPortOutput({
            project, zone, instance: instanceName, port: 1
        });

        if (serialData?.contents) {
            const logs = serialData.contents;
            if (logs.includes("NVIDIA-SMI has failed")) {
                message = "NVIDIA Driver Binding Error: Kernel mismatch on driver load headers.";
            } else if (logs.includes("Preemption") || logs.includes("preempted")) {
                message = "Spot capacity reclamation: Google dropped instance line via high demand load.";
            } else {
                const lines = logs.trim().split('\n');
                message = `Console trace: ... ${lines.slice(-2).join(' | ')}`;
            }
        }
    } catch (err) {
        if (err.message?.includes("not ready") || err.code === 400) {
            message = "Hypervisor Lockout: Instance is undergoing immediate preemption shutdown or hardware reclamation.";
        } else {
            message = `Diagnostic failure: ${err.message}`;
        }
    }
    return message;
}

async function purgeStaleStagingDisks(disksClient, project, zone) {
    console.log("🧹 [CLEANUP] Scanning storage matrices for dangling seeder boot disk footprints...");
    const [disks] = await disksClient.list({
        project,
        zone,
        filter: 'name eq "illustrious-model-seeder-temp.*"'
    });

    for (const disk of (disks || [])) {
        if (!disk.users || disk.users.length === 0) {
            console.log(`🗑️ [CLEANUP] Found unattached zombie staging volume: "${disk.name}". Purging drive asset...`);
            await disksClient.delete({ project, zone, disk: disk.name });
            console.log(`🎯 [CLEANUP] Successfully unbundled and shredded disk: ${disk.name}`);
        }
    }
}


async function makeGoogleCloudReservation(req, res, targetZone) {

    // Inject the dynamic failover zone variable directly into the boot scope environment
    process.env.TARGET_GCP_ZONE = targetZone;


    const liveBootUrl = process.env.BOOT_GPU_FUNCTION_URL || CONFIG.BOOT_GPU_URL;
    const isLocalEnvironment = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');

    if (isLocalEnvironment) {
        console.log("💻 [ENVIRONMENT] Local sandbox detected. Executing inline direct module loop bypass...");
        try {
            const { bootGpu } = require('../boot-gpu/index');
            await bootGpu(req, res);
            return;
        } catch (importErr) {
            console.warn("⚠️ Sibling bootGpu require path dropped. Attempting standard HTTP relay fallback...", importErr.message);
        }
    }

    if (!liveBootUrl) {
        return res.status(500).json({ status: 'ERROR', error: 'Internal configuration error: Boot link variable not defined.' });
    }

    await new Promise((resolve) => {
        const networkClient = liveBootUrl.startsWith('https') ? https : http;
        const bootReq = networkClient.get(liveBootUrl, () => resolve());
        const bootReqErr = () => resolve();
        bootReq.on('error', bootReqErr);
        bootReq.setTimeout(4000, () => { bootReq.destroy(); resolve(); });
    });

    return res.status(202).json({
        status: 'SCALING_UP',
        message: `No active workers found in ${targetZone}. Triggering allocation matrix...`,
        instances: [],
        zone: targetZone
    });

}
