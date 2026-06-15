// cloud-functions/boot-gpu/index.js
const { Compute } = require('@google-cloud/compute');
const path = require('path');
const fs = require('fs');

// ==========================================
// 🛰️ RIGID TOPOLOGY COST-SAVING CONSTANTS
// ==========================================
const CONFIG = {
    ZONE: 'us-central1-a',
    INSTANCE_NAME: 'illustrious-juggernaut-worker-node',
    SEED_INSTANCE_NAME: 'illustrious-model-seeder-temp',
    MODEL_DISK_NAME: 'illustrious-juggernaut-z-vault', // Shared global volume
    MACHINE_TYPE: 'n1-standard-4',
    EXTENDED_RAM_MB: 22528,        // Force-inject 22GB RAM over SDK boundary
    GPU_TYPE: 'nvidia-tesla-t4',
    GPU_COUNT: 1,
    DISK_SIZE_GB: 100,             // Main boot drive capacity
    VAULT_DISK_SIZE_GB: 50,        // Dedicated space for model storage block
    IMAGE_PROJECT: 'deeplearning-platform-release',
    IMAGE_FAMILY: 'common-cu121-debian-11-py310'
};

exports.bootGpu = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    try {
        const compute = new Compute();
        const zone = compute.zone(CONFIG.ZONE);

        // References to our dynamic nodes and persistent volumes
        const vm = zone.vm(CONFIG.INSTANCE_NAME);
        const modelDisk = zone.disk(CONFIG.MODEL_DISK_NAME);

        // ==========================================
        // 🛠️ STEP 1: VERIFY OR INITIALIZE THE MODEL VAULT
        // ==========================================
        const [diskExists] = await modelDisk.exists();

        if (!diskExists) {
            console.log(`✨ [MODE A] Target asset disk "${CONFIG.MODEL_DISK_NAME}" not found. Initializing seed infrastructure...`);

            // Check if the temporary initialization machine is already active
            const seedVm = zone.vm(CONFIG.SEED_INSTANCE_NAME);
            const [seedMetadata] = await seedVm.getMetadata().catch(() => [null]);

            if (seedMetadata && (seedMetadata.status === 'RUNNING' || seedMetadata.status === 'PROVISIONING')) {
                return res.status(200).json({
                    status: 'SEEDING_IN_PROGRESS',
                    message: 'The model storage vault is currently downloading Juggernaut-Z from Hugging Face. Please wait a few minutes.'
                });
            }

            // Shell script to format the empty volume, install python libraries, and pull the 6B parameter model weights
            const seedStartupScript = `#!/bin/bash
                echo "⚡ Formatting and seeding persistent model asset storage..."
                
                # Format our secondary block device cleanly to ext4
                mkfs.ext4 -F /dev/sdb
                mkdir -p /mnt/vault
                mount /dev/sdb /mnt/vault
                
                # Setup python environment downloads
                pip install -U diffusers transformers accelerate torch
                
                python3 -c "
from diffusers import DiffusionPipeline
import torch
print('📥 Pulling Juggernaut-Z files straight from Hugging Face...')
pipe = DiffusionPipeline.from_pretrained('RunDiffusion/Juggernaut-Z-Image', torch_dtype=torch.float16, variant='fp16')
pipe.save_pretrained('/mnt/vault/Juggernaut-Z')
print('🎯 Storage block initialization successful!')
"
                # Flush changes and unmount volume safely
                sync
                umount /mnt/vault
                
                # Self-destruct sequence: Instruct GCP to kill this machine instantly to prevent runtime billing bleed
                gcloud compute instances delete $(hostname) --zone=${CONFIG.ZONE} --quiet
            `;

            const seedConfig = {
                machineType: `zones/${CONFIG.ZONE}/machineTypes/${CONFIG.MACHINE_TYPE}`,
                disks: [
                    {
                        initializeParams: {
                            sourceImage: `projects/${CONFIG.IMAGE_PROJECT}/global/images/family/${CONFIG.IMAGE_FAMILY}`,
                            diskSizeGb: CONFIG.DISK_SIZE_GB,
                            diskType: `zones/${CONFIG.ZONE}/diskTypes/pd-ssd`
                        },
                        boot: true,
                        type: 'PERSISTENT'
                    },
                    {
                        // Create the permanent master shared vault disk block directly inline!
                        initializeParams: {
                            diskName: CONFIG.MODEL_DISK_NAME,
                            diskSizeGb: CONFIG.VAULT_DISK_SIZE_GB,
                            diskType: `zones/${CONFIG.ZONE}/diskTypes/pd-ssd`
                        },
                        boot: false,
                        type: 'PERSISTENT',
                        mode: 'READ_WRITE' // Needs write access initially to save the downloaded model
                    }
                ],
                networkInterfaces: [{
                    network: 'global/networks/default',
                    accessConfigs: [{ type: 'ONE_TO_ONE_NAT', name: 'External NAT' }]
                }],
                metadata: {
                    items: [{ key: 'startup-script', value: seedStartupScript }]
                }
            };

            await zone.createVM(CONFIG.SEED_INSTANCE_NAME, seedConfig);
            return res.status(201).json({
                status: 'INITIALIZING_STORAGE',
                message: 'Created a background seeder to initialize your Juggernaut-Z disk vault. Retrying this request shortly will mount it automatically.'
            });
        }

        // ==========================================
        // 🚀 STEP 2: MULTI-ATTACH HIGH SPEED PRODUCTION PRODUCTION LAUNCH
        // ==========================================
        const [metadata] = await vm.getMetadata().catch(() => [null]);

        if (metadata && (metadata.status === 'RUNNING' || metadata.status === 'PROVISIONING')) {
            const publicIp = metadata.networkInterfaces[0].accessConfigs[0].natIP;
            return res.status(200).json({
                status: 'ACTIVE',
                message: 'Cluster worker already hot and serving operations.',
                endpoint: `http://${publicIp}:8000`,
                timestamp: new Date().toISOString()
            });
        }

        const agentScriptPath = path.join(__dirname, 'worker-agent.py');
        const agentScriptContent = fs.existsSync(agentScriptPath)
            ? fs.readFileSync(agentScriptPath, 'utf8')
            : '# Agent script payload missing';

        const startupScript = `#!/bin/bash
echo "⚡ Initiating Headless Spatial Inference Workspace..."
export HOME=/root
cd /root

cat << 'EOF' > /root/worker-agent.py
${agentScriptContent}
EOF

apt-get update && apt-get install -y python3-pip python3-dev
pip install -U diffusers transformers accelerate fastapi uvicorn pillow torch

echo "🖼️ Mounting pre-seeded model storage layer at hyper-speed..."
mkdir -p /mnt/models
# Mount the secondary /dev/sdb volume as a Read-Only system disk
mount -o ro /dev/sdb /mnt/models

echo "🚀 Starting headless API pipeline on port 8000..."
python3 /root/worker-agent.py > /root/worker.log 2>&1 &
`;

        const vmConfig = {
            machineType: `zones/${CONFIG.ZONE}/machineTypes/${CONFIG.MACHINE_TYPE}`,
            memoryMb: CONFIG.EXTENDED_RAM_MB,
            disks: [
                {
                    initializeParams: {
                        sourceImage: `projects/${CONFIG.IMAGE_PROJECT}/global/images/family/${CONFIG.IMAGE_FAMILY}`,
                        diskSizeGb: CONFIG.DISK_SIZE_GB,
                        diskType: `zones/${CONFIG.ZONE}/diskTypes/pd-ssd`
                    },
                    boot: true,
                    type: 'PERSISTENT'
                },
                {
                    // 👉 THE GOLDEN TIED LOOP: Attach the existing asset vault instantly in READ_ONLY mode
                    source: `zones/${CONFIG.ZONE}/disks/${CONFIG.MODEL_DISK_NAME}`,
                    boot: false,
                    type: 'PERSISTENT',
                    mode: 'READ_ONLY' // Allows dozens of concurrent worker clusters to snap onto this exact volume simultaneously
                }
            ],
            guestAccelerators: [{
                acceleratorType: `zones/${CONFIG.ZONE}/acceleratorTypes/${CONFIG.GPU_TYPE}`,
                acceleratorCount: CONFIG.GPU_COUNT
            }],
            networkInterfaces: [{
                network: 'global/networks/default',
                accessConfigs: [{ type: 'ONE_TO_ONE_NAT', name: 'External NAT' }]
            }],
            scheduling: {
                preemptible: true, // Spot billing protection active
                onHostMaintenance: 'TERMINATE'
            },
            metadata: {
                items: [
                    { key: 'startup-script', value: startupScript },
                    { key: 'install-nvidia-driver', value: 'true' }
                ]
            }
        };

        console.log(`📡 Orchestrating SPOT worker node instance allocation matrix...`);
        const [operation] = await zone.createVM(CONFIG.INSTANCE_NAME, vmConfig);

        return res.status(202).json({
            status: 'INITIALIZING',
            message: 'Spot cluster allocation sequence dispatched successfully.',
            operationId: operation.id,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("❌ Cloud allocation cluster tracking failure:", err.message);
        return res.status(500).json({ status: 'ERROR', error: err.message });
    }
};