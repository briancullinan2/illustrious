// cloud-functions/cluster-manager/index.js
const { InstancesClient } = require('@google-cloud/compute'); // 👉 Destructure the root class name
const http = require('http');

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

    try {
        const projectId = process.env.GCP_PROJECT_ID || process.env.GCP_PROJECT;

        // 👉 Instantiate the formal API client mapped out in your log
        const computeClient = new InstancesClient({ projectId });

        // 1. Enumerate all running or staging worker services inside the zone horizon
        // The gRPC/GAPIC client requires parameters wrapped cleanly inside a payload mapping object
        const [vms] = await computeClient.list({
            project: projectId,
            zone: CONFIG.ZONE,
            filter: `name eq "${CONFIG.INSTANCE_BASE_NAME}.*"`
        });

        // Map the modern response parameters directly to your client payload keys
        const instancePool = (vms || []).map(vm => {
            const publicIp = vm.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || null;
            return {
                name: vm.name,
                status: vm.status, // PROVISIONING, STAGING, RUNNING, TERMINATED
                ip: publicIp,
                endpoint: publicIp ? `http://${publicIp}:8000` : null
            };
        });

        // Filter out nodes that are actively running or booting up right now
        const activeWorkers = instancePool.filter(node =>
            node.status === 'RUNNING' || node.status === 'PROVISIONING' || node.status === 'STAGING'
        );

        // 2. Auto-Scale On Access: If the pool is completely dry, poke your separate boot-gpu service
        if (activeWorkers.length === 0 && CONFIG.BOOT_GPU_URL) {
            console.log("🌌 Pool empty. Relaying baseline initialization call directly to boot-gpu service...");

            http.get(CONFIG.BOOT_GPU_URL, (bootRes) => {
                console.log(`📡 bootGpu module responded with baseline status code: ${bootRes.statusCode}`);
            }).on('error', (e) => {
                console.error("❌ Failed to broadcast background request to bootGpu endpoint:", e.message);
            });

            return res.status(202).json({
                status: 'SCALING_UP',
                message: 'No active workers found. Triggering baseline hardware allocation script.',
                instances: []
            });
        }

        // 3. Return the clean enumeration payload mapping directly back to the front-end layout
        return res.status(200).json({
            status: 'POOL_AVAILABLE',
            instances: instancePool
        });

    } catch (err) {
        console.error("❌ Cluster manager enumeration loop snapped:", err.message);
        return res.status(500).json({ status: 'ERROR', error: err.message });
    }
};

