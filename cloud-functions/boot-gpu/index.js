// cloud-functions/boot-gpu/index.js
const { InstancesClient, DisksClient, ImagesClient, AcceleratorTypesClient } = require('@google-cloud/compute');
const path = require('path');
const fs = require('fs');

const CONFIG = {
    DEFAULT_ZONE: 'us-central1-a',
    ZONE_FAILOVER_POOL: ['us-central1-a', 'us-central1-f', 'us-east1-c'],
    INSTANCE_NAME: 'illustrious-juggernaut-worker-node',
    SEED_INSTANCE_NAME: 'illustrious-model-seeder-temp',
    MODEL_DISK_NAME: 'illustrious-juggernaut-z-vault',
    MACHINE_TYPE: 'n1-standard-4',
    GPU_TYPE: 'nvidia-tesla-t4',
    GPU_COUNT: 1,
    DISK_SIZE_GB: 100,
    VAULT_DISK_SIZE_GB: 50,
    EXTENDED_RAM_MB: 0, // Optional, remove if not needed
};

exports.bootGpu = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    console.log("🛰️ [BOOT-GPU] Allocation orchestration triggered.");

    const projectId = process.env.GCP_PROJECT_ID || process.env.GCP_PROJECT;
    if (!projectId) {
        return res.status(500).json({ status: 'ERROR', error: 'GCP_PROJECT_ID environment variable not set' });
    }

    let clientOptions = { project: projectId };
    if (req.oauth2Client?.credentials?.access_token) {
        clientOptions.authClient = req.oauth2Client;
    }

    const instancesClient = new InstancesClient(clientOptions);
    const disksClient = new DisksClient(clientOptions);
    const imagesClient = new ImagesClient(clientOptions);
    const acceleratorTypesClient = new AcceleratorTypesClient(clientOptions);

    try {
        // 1. Resolve zone with GPU capacity
        const activeZone = await resolveOperationalZone(acceleratorTypesClient, projectId, CONFIG.ZONE_FAILOVER_POOL);
        console.log(`🌍 [ZONE] Using zone: ${activeZone}`);

        // 2. Resolve latest compatible image
        const resolvedImageUri = await resolveActiveImage(imagesClient);
        console.log(`🖼️ [IMAGE] Using: ${resolvedImageUri}`);

        // 3. Ensure model vault disk is ready (create seeder if needed)
        const vaultStatus = await ensureVaultReady(disksClient, instancesClient, projectId, activeZone, resolvedImageUri);

        if (vaultStatus === 'INITIALIZING_STORAGE') {
            return res.status(202).json({
                status: 'INITIALIZING_STORAGE',
                message: 'Vault disk staging in progress. Retry shortly.'
            });
        }

        if (vaultStatus === 'SEEDING_IN_PROGRESS') {
            return res.status(202).json({
                status: 'SEEDING_IN_PROGRESS',
                message: 'Model download in progress.'
            });
        }

        // 4. Deploy or check worker
        const workerStatus = await deployGpuWorker(instancesClient, projectId, activeZone, resolvedImageUri);

        return res.status(workerStatus.statusCode).json(workerStatus.body);

    } catch (err) {
        console.error("❌ [ERROR]", err);
        return res.status(500).json({ status: 'ERROR', error: err.message });
    }
};

// =============================================
// HELPERS
// =============================================

async function resolveOperationalZone(acceleratorClient, project, pool) {
    for (const zone of pool) {
        try {
            // Probe for accelerator availability
            await acceleratorClient.list({
                project,
                zone,
                pageSize: 1
            });
            return zone;
        } catch (e) {
            console.warn(`⚠️ Zone ${zone} unavailable for GPU:`, e.message);
        }
    }
    console.warn(`Falling back to default zone: ${pool[0]}`);
    return pool[0];
}

async function resolveActiveImage(imagesClient) {
    const targetProjects = ['deeplearning-platform-release', 'debian-cloud'];
    const targetFamilies = ['common-cpu-debian-11', 'debian-11', 'common-cpu-debian-11-py310'];

    for (const proj of targetProjects) {
        for (const family of targetFamilies) {
            try {
                const [imageMeta] = await imagesClient.getFromFamily({
                    project: proj,
                    family
                });
                if (imageMeta?.selfLink) {
                    return imageMeta.selfLink;
                }
            } catch (e) {
                // Silent fail
            }
        }
    }
    throw new Error("Failed to resolve any compatible OS image.");
}

async function ensureVaultReady(disksClient, instancesClient, project, zone, sourceImage) {
    let diskExists = false;
    let diskReady = false;

    try {
        const [disk] = await disksClient.get({
            project,
            zone,
            disk: CONFIG.MODEL_DISK_NAME
        });
        diskExists = true;
        diskReady = disk.status === 'READY';
    } catch (e) {
        // Disk doesn't exist
    }

    // Check for lingering seeder
    let seederExists = false;
    try {
        const [seeder] = await instancesClient.get({
            project,
            zone,
            instance: CONFIG.SEED_INSTANCE_NAME
        });
        seederExists = seeder && seeder.status !== 'TERMINATED';

        if (seederExists && diskReady) {
            // Cleanup stale seeder
            await instancesClient.delete({
                project,
                zone,
                instance: CONFIG.SEED_INSTANCE_NAME
            }).catch(() => { });
        }
    } catch (e) {
        // No seeder
    }

    if (diskReady) {
        return 'READY';
    }

    // Need to seed
    if (seederExists) {
        return 'SEEDING_IN_PROGRESS';
    }

    console.log(`[VAULT] Creating seeder for ${CONFIG.MODEL_DISK_NAME}`);

    const seedStartupScript = `#!/bin/bash
echo "⚡ Formatting and seeding model vault..."
mkfs.ext4 -F /dev/sdb
mkdir -p /mnt/vault
mount /dev/sdb /mnt/vault
apt-get update && apt-get install -y python3-pip
pip install -U diffusers transformers accelerate torch
python3 -c '
from diffusers import DiffusionPipeline
import torch
pipe = DiffusionPipeline.from_pretrained("RunDiffusion/Juggernaut-Z-Image", torch_dtype=torch.float16, variant="fp16")
pipe.save_pretrained("/mnt/vault/Juggernaut-Z")
'
sync && umount /mnt/vault
gcloud compute instances delete $(hostname) --zone=${zone} --quiet
`;

    const seedConfig = {
        name: CONFIG.SEED_INSTANCE_NAME,
        machineType: `zones/${zone}/machineTypes/${CONFIG.MACHINE_TYPE}`,
        disks: [
            {
                boot: true,
                initializeParams: {
                    sourceImage,
                    diskSizeGb: CONFIG.DISK_SIZE_GB,
                    diskType: `zones/${zone}/diskTypes/pd-ssd`
                }
            },
            {
                boot: false,
                initializeParams: {
                    diskName: CONFIG.MODEL_DISK_NAME,
                    diskSizeGb: CONFIG.VAULT_DISK_SIZE_GB,
                    diskType: `zones/${zone}/diskTypes/pd-ssd`
                }
            }
        ],
        networkInterfaces: [{
            network: 'global/networks/default',
            accessConfigs: [{ type: 'ONE_TO_ONE_NAT' }]
        }],
        metadata: {
            items: [{ key: 'startup-script', value: seedStartupScript }]
        }
    };

    await instancesClient.insert({
        project,
        zone,
        instanceResource: seedConfig
    });

    return 'INITIALIZING_STORAGE';
}

async function deployGpuWorker(instancesClient, project, zone, sourceImage) {
    // Check if worker already running
    let workerMetadata = null;
    try {
        [workerMetadata] = await instancesClient.get({
            project,
            zone,
            instance: CONFIG.INSTANCE_NAME
        });
    } catch (e) { }

    if (workerMetadata && (workerMetadata.status === 'RUNNING' ||
        workerMetadata.status === 'PROVISIONING' ||
        workerMetadata.status === 'STAGING')) {
        const publicIp = workerMetadata.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP;
        return {
            statusCode: 200,
            body: {
                status: 'ACTIVE',
                message: 'Worker is already running.',
                endpoint: publicIp ? `http://${publicIp}:8000` : null,
                timestamp: new Date().toISOString()
            }
        };
    }

    // Read worker agent script if exists
    const agentScriptPath = path.join(__dirname, 'worker-agent.py');
    const agentScriptContent = fs.existsSync(agentScriptPath)
        ? fs.readFileSync(agentScriptPath, 'utf8')
        : '# No custom agent script found';

    const startupScript = `#!/bin/bash
echo "🚀 Starting Juggernaut-Z GPU worker..."
export HOME=/root
cd /root

cat << 'EOF' > /root/worker-agent.py
${agentScriptContent}
EOF

echo "⚡ Mounting model vault..."
mkdir -p /mnt/vault
mount /dev/sdb /mnt/vault

apt-get update && apt-get install -y python3-pip
pip install -U diffusers transformers accelerate fastapi uvicorn pillow torch torchvision torchaudio python-multipart

python3 /root/worker-agent.py > /root/worker.log 2>&1 &
`;

    const vmConfig = {
        name: CONFIG.INSTANCE_NAME,
        machineType: `zones/${zone}/machineTypes/${CONFIG.MACHINE_TYPE}`,
        disks: [
            {
                boot: true,
                initializeParams: {
                    sourceImage,
                    diskSizeGb: CONFIG.DISK_SIZE_GB,
                    diskType: `zones/${zone}/diskTypes/pd-ssd`
                }
            },
            {
                boot: false,
                source: `projects/${project}/zones/${zone}/disks/${CONFIG.MODEL_DISK_NAME}`,
                mode: 'READ_ONLY'
            }
        ],
        guestAccelerators: [{
            acceleratorType: `zones/${zone}/acceleratorTypes/${CONFIG.GPU_TYPE}`,
            acceleratorCount: CONFIG.GPU_COUNT
        }],
        networkInterfaces: [{
            network: 'global/networks/default',
            accessConfigs: [{ type: 'ONE_TO_ONE_NAT' }]
        }],
        scheduling: {
            preemptible: true,
            onHostMaintenance: 'TERMINATE',
            automaticRestart: false
        },
        metadata: {
            items: [
                { key: 'startup-script', value: startupScript },
                { key: 'install-nvidia-driver', value: 'true' }
            ]
        }
    };

    await instancesClient.insert({
        project,
        zone,
        instanceResource: vmConfig
    });

    return {
        statusCode: 202,
        body: {
            status: 'INITIALIZING',
            message: `Spot GPU worker deployment started in ${zone}`,
            timestamp: new Date().toISOString()
        }
    };
}