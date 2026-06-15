// cloud-functions/cluster-manager/index.js
const { InstancesClient } = require('@google-cloud/compute');
const http = require('http');
const https = require('https');

const CONFIG = {
    ZONE: 'us-central1-a',
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
        if (req.oauth2Client && req.oauth2Client.credentials && req.oauth2Client.credentials.access_token) {
            clientOptions.authClient = req.oauth2Client;
        }

        const computeClient = new InstancesClient(clientOptions);

        console.log(`📡 [API CALL] Dispatched list query request to zone ${CONFIG.ZONE}...`);
        const [vms] = await computeClient.list({
            project: projectId,
            zone: CONFIG.ZONE,
            filter: `name eq "${CONFIG.INSTANCE_BASE_NAME}.*"`
        });

        // =============================================================
        // 🔍 ENGINE LOG UPGRADE: Ingest serial console arrays on failure
        // =============================================================
        const instancePool = await Promise.all((vms || []).map(async (vm, index) => {
            const publicIp = vm.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || null;
            let criticalDiagnosticMessage = null;

            console.log(`   └─ Worker [${index}] Found: "${vm.name}" | Status: ${vm.status}`);

            if (vm.status === 'STOPPING' || vm.status === 'TERMINATED' || vm.status === 'STOPPED') {
                console.log(`🚩 [DIAGNOSTIC] Node "${vm.name}" enters problem state [${vm.status}]. Pulling telemetry...`);

                // Default assumption for immediate Spot drops
                criticalDiagnosticMessage = "Spot Preemption / Capacity Deficit: Zone us-central1-a cannot fulfill T4 GPU allocation right now.";

                try {
                    const [serialData] = await computeClient.getSerialPortOutput({
                        project: projectId,
                        zone: CONFIG.ZONE,
                        instance: vm.name,
                        port: 1
                    });

                    if (serialData && serialData.contents) {
                        const logs = serialData.contents;
                        if (logs.includes("NVIDIA-SMI has failed")) {
                            criticalDiagnosticMessage = "NVIDIA Driver Binding Error: GPU driver installation mismatched.";
                        } else if (logs.includes("Preemption") || logs.includes("preempted")) {
                            criticalDiagnosticMessage = "Spot capacity restriction: Google reclaimed the resource due to high zone load.";
                        } else {
                            const lines = logs.trim().split('\n');
                            criticalDiagnosticMessage = `Console trailing logs: ... ${lines.slice(-3).join(' | ')}`;
                        }
                    }
                } catch (serialErr) {
                    // 👉 CORE FIX: Trap the transit lock error quietly
                    if (serialErr.message?.includes("not ready") || serialErr.code === 400) {
                        console.log(`⏳ [DIAGNOSTIC] Serial bus locked by hypervisor during transition state.`);
                        criticalDiagnosticMessage = "Hypervisor Lockout: Instance is undergoing immediate preemption shutdown or hardware reclamation.";
                    } else {
                        criticalDiagnosticMessage = `Diagnostic fetch failure: ${serialErr.message}`;
                    }
                }
            }

            return {
                name: vm.name,
                status: vm.status,
                ip: publicIp,
                endpoint: publicIp ? `http://${publicIp}:8000` : null,
                diagnostic: criticalDiagnosticMessage // 👉 PASSED STRAIGHT DOWN TO CLIENT CANVAS CONTROLS
            };
        }));

        const activeWorkers = instancePool.filter(node =>
            node.status === 'RUNNING' || node.status === 'PROVISIONING' || node.status === 'STAGING'
        );
        console.log(`📊 [POOL ANALYSIS] Active/Staging nodes count: ${activeWorkers.length}`);

        // 2. Auto-Scale On Access Core Trigger
        if (activeWorkers.length === 0) {
            console.log("🌌 [POOL DEPLETED] Zero active components online.");

            const liveBootUrl = process.env.BOOT_GPU_FUNCTION_URL || CONFIG.BOOT_GPU_URL;
            const isLocalEnvironment = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');

            // If there is an existing machine but it's dead/stopping, don't keep firing boot requests into a loop
            const lingeringNode = instancePool.find(n => n.status === 'STOPPING' || n.status === 'TERMINATED');
            if (lingeringNode) {
                console.log("🛑 [HOLD] A node is currently spinning down or blocked. Holding auto-scale dispatch to prevent resource thrashing.");
                return res.status(200).json({
                    status: 'POOL_BLOCKED',
                    message: `Hardware pool stalled. Node entering shutdown state. Reason: ${lingeringNode.diagnostic || 'Evaluating console logs...'}`,
                    instances: instancePool
                });
            }

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
                const reqTimer = Date.now();
                const networkClient = liveBootUrl.startsWith('https') ? https : http;
                const bootReq = networkClient.get(liveBootUrl, (bootRes) => {
                    resolve();
                });
                bootReq.on('error', (e) => { resolve(); });
                bootReq.setTimeout(4000, () => { bootReq.destroy(); resolve(); });
            });

            return res.status(202).json({
                status: 'SCALING_UP',
                message: 'No active workers found. Triggering baseline hardware allocation script.',
                instances: []
            });
        }

        return res.status(200).json({
            status: 'POOL_AVAILABLE',
            instances: instancePool
        });

    } catch (err) {
        console.error("❌ [CRITICAL BREAK] Cluster manager enumeration loop snapped:");
        console.error(err);
        return res.status(500).json({ status: 'ERROR', error: err.message, stack: err.stack });
    }
};