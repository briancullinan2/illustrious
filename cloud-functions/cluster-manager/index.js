// cloud-functions/cluster-manager/index.js
const { InstancesClient, DisksClient } = require('@google-cloud/compute');
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
        let clientOptions = { project: projectId };

        if (req.oauth2Client?.credentials?.access_token) {
            clientOptions.authClient = req.oauth2Client;
        }

        const computeClient = new InstancesClient(clientOptions);
        const disksClient = new DisksClient(clientOptions);

        // 1. Determine active running zone based on capacity state checks
        const targetZone = await resolveZoneTelemetry(computeClient, projectId);
        console.log(`🌍 [ZONE RESOLUTION] Routing engine operations straight to: ${targetZone}`);

        // Fire background routine to drop old zombie seeder boot disks out of our quotas
        purgeStaleStagingDisks(disksClient, projectId, targetZone).catch(err =>
            console.warn("⚠️ [CLEANUP TRACE] Background drive purger stalled:", err.message)
        );

        console.log(`📡 [API CALL] Enumerate compute horizon nodes...`);
        const [vms] = await computeClient.list({
            project: projectId,
            zone: targetZone,
            filter: `name eq "${CONFIG.INSTANCE_BASE_NAME}.*"`
        });

        // 2. Parse active pool nodes across threads
        const instancePool = await Promise.all((vms || []).map(async (vm, index) => {
            const publicIp = vm.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || null;
            let criticalDiagnosticMessage = null;

            console.log(`   └─ Worker [${index}] Found: "${vm.name}" | Status: ${vm.status}`);

            if (['STOPPING', 'TERMINATED', 'STOPPED'].includes(vm.status)) {
                criticalDiagnosticMessage = await parseDiagnosticStream(computeClient, projectId, targetZone, vm.name);
            }

            return {
                name: vm.name,
                status: vm.status,
                ip: publicIp,
                endpoint: publicIp ? `http://${publicIp}:8000` : null,
                diagnostic: criticalDiagnosticMessage
            };
        }));

        const activeWorkers = instancePool.filter(node =>
            ['RUNNING', 'PROVISIONING', 'STAGING'].includes(node.status)
        );
        console.log(`📊 [POOL ANALYSIS] Active/Staging nodes count: ${activeWorkers.length}`);

        // 3. Auto-Scale Handlers
        if (activeWorkers.length === 0) {
            console.log("🌌 [POOL DEPLETED] Zero active components online.");

            const lingeringNode = instancePool.find(n => ['STOPPING', 'TERMINATED'].includes(n.status));
            if (lingeringNode) {
                console.log("🛑 [HOLD] A node is currently trapped in a problem state. Relaying log flags down channel.");
                return res.status(200).json({
                    status: 'POOL_BLOCKED',
                    message: `Hardware pool stalled. Reason: ${lingeringNode.diagnostic}`,
                    instances: instancePool,
                    zone: targetZone
                });
            }

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
                bootReq.on('error', () => resolve());
                bootReq.setTimeout(4000, () => { bootReq.destroy(); resolve(); });
            });

            return res.status(202).json({
                status: 'SCALING_UP',
                message: `No active workers found in ${targetZone}. Triggering allocation matrix...`,
                instances: [],
                zone: targetZone
            });
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

// ============================================================================
// 🛠️ ISOLATED SUB-ROUTINES (STRICT TELEMETRY MANAGEMENT PACK)
// ============================================================================

/**
 * Dynamic Capacity Broker: Scans historical instance failure vectors to automatically shift zones
 */
async function resolveZoneTelemetry(computeClient, project) {
    try {
        // Query default zone first to inspect what state the current hardware profile is returning
        const [defaultVmCheck] = await computeClient.list({
            project,
            zone: CONFIG.DEFAULT_ZONE,
            filter: `name eq "${CONFIG.INSTANCE_BASE_NAME}.*"`
        });

        // Check if our last attempt was terminated or stopped immediately in default zone
        const brokenNode = defaultVmCheck?.find(vm => ['STOPPED', 'TERMINATED'].includes(vm.status));

        if (brokenNode) {
            console.log(`🚨 [DYNAMIC HORIZON] Default Zone '${CONFIG.DEFAULT_ZONE}' flagged with exhausted worker states. Shifting failover maps...`);
            // Walk your active backup regions until a clear line is mapped
            return CONFIG.ZONE_FAILOVER_POOL[0];
        }
    } catch (e) {
        console.warn("⚠️ Dynamic zone resolution probe missed, falling back to basic bounds:", e.message);
    }
    return CONFIG.DEFAULT_ZONE;
}

/**
 * Serial Port Output Stream Collector: Safeguards transitions against 400 runtime locks
 */
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

/**
 * Persistent Volume Cleaner: Searches for detached seeder boot drives and purges them out of project metrics
 */
async function purgeStaleStagingDisks(disksClient, project, zone) {
    console.log("🧹 [CLEANUP] Scanning storage matrices for dangling seeder boot disk footprints...");
    const [disks] = await disksClient.list({
        project,
        zone,
        filter: 'name eq "illustrious-model-seeder-temp.*"'
    });

    for (const disk of (disks || [])) {
        // If the disk exists but has no active compute attachments, it's safe to destroy
        if (!disk.users || disk.users.length === 0) {
            console.log(`🗑️ [CLEANUP] Found unattached zombie staging volume: "${disk.name}". Purging drive asset...`);
            await disksClient.delete({ project, zone, disk: disk.name });
            console.log(`🎯 [CLEANUP] Successfully unbundled and shredded disk: ${disk.name}`);
        }
    }
}