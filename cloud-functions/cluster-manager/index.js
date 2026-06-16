// cloud-functions/cluster-manager/index.js
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

exports.clusterManager = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    console.log("------------------------------------------------------------");
    console.log(`📡 [MANAGER LOG] Incoming target execution sequence initiated.`);

    try {
        const projectId = process.env.GCP_PROJECT_ID || process.env.GCP_PROJECT;

        if (!projectId) {
            return res.status(500).json({ status: 'ERROR', error: 'GCP_PROJECT_ID environment variable not set' });
        }


        const clientOptions = getGcpClientOptions(req, projectId);
        const { InstancesClient, DisksClient, RegionsClient } = require('@google-cloud/compute');
        const computeClient = new InstancesClient(clientOptions);
        const disksClient = new DisksClient(clientOptions);

        // 1. Determine active running zone based on capacity state checks
        const targetZone = await resolveZoneTelemetry(computeClient, projectId);
        console.log(`🌍 [ZONE RESOLUTION] Routing engine operations straight to: ${targetZone}`);

        // Extract the regional code block out of the active zone string (e.g., 'us-central1-a' -> 'us-central1')
        const targetRegion = targetZone.split('-').slice(0, 2).join('-');

        let quotaInfo
        try {
            quotaInfo = await verifyGpuQuota(RegionsClient, projectId, targetRegion);
        } catch (quotaErr) {
            console.warn(`🛑 [QUOTA HALT] Cluster manager intercepted strict resource boundaries: ${quotaErr.message}`);
            return res.status(403).json({
                status: 'QUOTA_EXCEEDED',
                message: quotaErr.message,
                remediation: "https://console.cloud.google.com/iam-admin/quotas",
                zone: targetZone
            });
        }

        // Fire background routine to drop old zombie seeder boot disks out of our quotas
        purgeStaleStagingDisks(disksClient, projectId, targetZone).catch(err =>
            console.warn("⚠️ [CLEANUP TRACE] Background drive purger stalled:", err.message)
        );

        // 2. Parse active pool nodes across threads
        const instancePool = await evaluateWorkerPool(computeClient, projectId, targetZone);
        const activeWorkers = instancePool.filter(node => ['RUNNING', 'PROVISIONING', 'STAGING'].includes(node.status));
        console.log(`📊 [POOL ANALYSIS] Active/Staging nodes count: ${activeWorkers.length}`);

        if (activeWorkers.length === 0) {
            console.log("🌌 [POOL DEPLETED] Zero active components online.");
            return handleEmptyPoolEvaluation(res, instancePool, targetZone, quotaInfo);
        }

        return res.status(200).json({
            status: 'POOL_AVAILABLE',
            instances: instancePool,
            zone: targetZone
        });

    } catch (err) {
        console.error("❌ [CRITICAL BREAK] Cluster manager enumeration loop snapped:", err);
        return res.status(500).json({ status: 'ERROR', error: err.message });
    }
};


async function evaluateWorkerPool(computeClient, projectId, zone) {
    console.log(`📡 [API CALL] Mapping horizon compute instances inside: ${zone}`);
    const [vms] = await computeClient.list({
        project: projectId,
        zone,
        filter: `name eq "${CONFIG.INSTANCE_BASE_NAME}.*"`
    });

    return Promise.all((vms || []).map(async (vm, index) => {
        const publicIp = vm.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || null;
        let diagnosticMsg = null;

        console.log(`   └─ Trace -> [${index}] ${vm.name} | Status: ${vm.status}`);

        if (['STOPPING', 'TERMINATED', 'STOPPED'].includes(vm.status)) {
            diagnosticMsg = await parseDiagnosticStream(computeClient, projectId, zone, vm.name);
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

function getGcpClientOptions(req, projectId) {
    // Correct the parameter to use standard 'projectId' for @google-cloud libraries
    let options = { projectId: projectId };

    // 1. Resolve path to check inside ~/.credentials/
    const homeDir = os.homedir();

    // Look for files matching format: ~/.credentials/projectId-*.json or exactly named
    const credentialsDir = path.join(homeDir, '.credentials');
    let keyFilePath = null;

    if (fs.existsSync(credentialsDir)) {
        const files = fs.readdirSync(credentialsDir);
        // Find a file that begins with the targeted projectId and ends with .json
        const matchingFile = files.find(file => file.startsWith(projectId) && file.endsWith('.json'));
        if (matchingFile) {
            keyFilePath = path.join(credentialsDir, matchingFile);
        }
    }

    // 2. Conditionally assign the absolute best authentication context
    if (keyFilePath && fs.existsSync(keyFilePath)) {
        // High priority local machine configuration link
        options.keyFilename = keyFilePath;
        console.log(`🔑 [AUTH ENGINE] Hot-swapped execution layer to keyfile: ${keyFilePath}`);
    } else if (req.oauth2Client?.credentials?.access_token) {
        // Fallback to active interactive guest session thread context
        options.auth = req.oauth2Client;
    }

    return options;
}

async function verifyGpuQuota(RegionsClient, projectId, region = 'us-central1') {
    try {
        const regionsClient = new RegionsClient({ project: projectId });

        console.log(`📊 [QUOTA ENGINE] Polling complete regional data matrix for: ${region}`);
        const [regionData] = await regionsClient.get({
            project: projectId,
            region: region
        });

        if (!regionData.quotas || regionData.quotas.length === 0) {
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
        if (Object.keys(quotaReport).length === 0) {
            console.warn(`⚠️ [QUOTA ENGINE] No metrics containing 'GPU' signature found inside ${region}.`);
        }

        // Return the full object payload down the pipe to your manager loop status response
        return quotaReport;

    } catch (err) {
        console.error("🚨 [QUOTA ENGINE ERROR] Execution trace failed:", err.message);
        throw err;
    }
}


function handleEmptyPoolEvaluation(res, instancePool, zone, quotaInfo) {
    console.log("🌌 [POOL VACANT] Zero operational assets currently online.");

    const lingeringNode = instancePool.find(n => ['STOPPING', 'TERMINATED'].includes(n.status));
    if (lingeringNode) {
        console.log("🛑 [HOLD] Gridlock detected. Node requires a cloud hypervisor clear.");
        return res.status(200).json({
            status: 'POOL_BLOCKED',
            quota: quotaInfo,
            message: `Hardware pool stalled. Reason: ${lingeringNode.diagnostic}`,
            instances: instancePool,
            zone: zone
        });
    }

    // Explicitly note that boot-gpu auto-scaling trigger code is commented out right here
    return res.status(200).json({
        status: 'POOL_EMPTY',
        quota: quotaInfo,
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
