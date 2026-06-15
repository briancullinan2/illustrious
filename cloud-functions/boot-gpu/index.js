// cloud-functions/boot-gpu/index.js
const { InstancesClient, DisksClient, ImagesClient } = require('@google-cloud/compute');
const path = require('path');
const fs = require('fs');

// ==========================================================
// 🛰️ RIGID TOPOLOGY CORE TOPOLOGY (DYNAMICS AGNOSTIC SETS)
// ==========================================================
const CONFIG = {
    ZONE: 'us-central1-a',
    INSTANCE_NAME: 'illustrious-juggernaut-worker-node',
    SEED_INSTANCE_NAME: 'illustrious-model-seeder-temp',
    MODEL_DISK_NAME: 'illustrious-juggernaut-z-vault',
    MACHINE_TYPE: 'n1-standard-4',
    EXTENDED_RAM_MB: 22528,        // Force-inject 22GB RAM over SDK boundary
    GPU_TYPE: 'nvidia-tesla-t4',
    GPU_COUNT: 1,
    DISK_SIZE_GB: 100,             // Main boot drive capacity
    VAULT_DISK_SIZE_GB: 50         // Dedicated space for model storage block
};

exports.bootGpu = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    console.log("------------------------------------------------------------");
    console.log("🛰️ [BOOT-GPU LOG] Allocation orchestration engine triggered.");

    try {
        const projectId = process.env.GCP_PROJECT_ID || process.env.GCP_PROJECT;
        console.log(`🆔 [BOOT-GPU LOG] Context Project Identification: ${projectId}`);

        let clientOptions = { project: projectId };
        if (req.oauth2Client && req.oauth2Client.credentials && req.oauth2Client.credentials.access_token) {
            console.log("🔓 [BOOT-GPU LOG] Injecting verified OAuth2 memory authorization tokens...");
            clientOptions.authClient = req.oauth2Client;
        }

        const computeClient = new InstancesClient(clientOptions);
        const disksClient = new DisksClient(clientOptions);
        const imagesClient = new ImagesClient(clientOptions);

        // ==========================================================
        // 🔮 DYNAMIC IMAGE QUERY ENGINE (AUTOMATED RESOLVER)
        // ==========================================================
        console.log("🔍 [IMAGE RECON] Interrogating public registry to resolve valid deep learning families...");
        let resolvedImageUri = null;

        // Strategy: Query multiple public imaging projects to catch structural deprecation changes automatically
        const targetProjects = ['deeplearning-platform-release', 'debian-cloud'];
        const targetFamilies = ['common-cpu-debian-11', 'debian-11', 'common-cpu-debian-11-py310'];

        for (const project of targetProjects) {
            for (const family of targetFamilies) {
                try {
                    console.log(`   ├─ Probing: projects/${project}/global/images/family/${family}`);
                    const [imageMeta] = await imagesClient.getFromFamily({ project, family });
                    if (imageMeta && imageMeta.selfLink) {
                        resolvedImageUri = imageMeta.selfLink;
                        console.log(`🎯 [IMAGE RECON] SUCCESS! Mapped active image resource link: ${resolvedImageUri}`);
                        break;
                    }
                } catch (e) {
                    // Fail silently to keep testing the rest of our prioritization matrix lines
                }
            }
            if (resolvedImageUri) break;
        }

        if (!resolvedImageUri) {
            console.error("❌ [CRITICAL] Failed to dynamically query any operational OS images across registries.");
            return res.status(500).json({ status: 'ERROR', error: 'Dynamic platform image query mapping returned zero active resources.' });
        }


        // ==========================================
        // 🛠️ STEP 1: VERIFY OR INITIALIZE THE MODEL VAULT
        // ==========================================
        let diskExists = false;
        let diskIsReady = false;

        console.log(`💾 [DISK CHECK] Looking up existing asset vault disk: "${CONFIG.MODEL_DISK_NAME}"...`);
        try {
            const [disk] = await disksClient.get({ project: projectId, zone: CONFIG.ZONE, disk: CONFIG.MODEL_DISK_NAME });
            if (disk && disk.status !== 'DELETING') {
                diskExists = true;
                console.log(`✅ [DISK CHECK] Target storage volume detected. Status: ${disk.status}`);
                if (disk.status === 'READY') {
                    diskIsReady = true;
                }
            }
        } catch (e) {
            console.log(`ℹ️ [DISK CHECK] Vault disk lookups failed (Volume is absent or needs structural creation).`);
        }

        // 👉 NEW ATTACHMENT LOCK CLEANER: Check if the temporary seeder VM is locking our disk resources
        let seederVmMetadata = null;
        try {
            [seederVmMetadata] = await computeClient.get({ project: projectId, zone: CONFIG.ZONE, instance: CONFIG.SEED_INSTANCE_NAME });
        } catch (e) { /* Instance already deleted safely */ }

        if (seederVmMetadata && seederVmMetadata.status !== 'TERMINATED') {
            console.log(`⚠️ [DISK LOCK OUT] Sibling seeder "${CONFIG.SEED_INSTANCE_NAME}" is currently lingering in state: ${seederVmMetadata.status}.`);

            // If the seeder is done running its script but hasn't fully detached, clear it out of the zone engine
            if (diskIsReady) {
                console.log(`🧹 [CLEANUP ENGAGED] Issuing immediate asynchronous deletion instructions for stale machine: ${CONFIG.SEED_INSTANCE_NAME}...`);
                try {
                    await computeClient.delete({ project: projectId, zone: CONFIG.ZONE, instance: CONFIG.SEED_INSTANCE_NAME });
                } catch (delErr) {
                    console.error("❌ Cleanup instruction call rejected:", delErr.message);
                }
            }

            return res.status(202).json({
                status: 'INITIALIZING_STORAGE',
                message: 'Detaching background staging components and clearing persistent volume locks. Standing by...'
            });
        }

        // Proceed to checking standard Mode A initialization if the disk is completely missing
        if (!diskExists || !diskIsReady) {
            if (diskExists && !diskIsReady) {
                console.log(`⏳ [DISK STAGING] Disk is present but unready. Locking execution threads until initialization loop completes.`);
                return res.status(202).json({
                    status: 'INITIALIZING_STORAGE',
                    message: 'The persistent model vault disk is currently being allocated by Google Cloud. Please standby for 30-60 seconds.'
                });
            }

            console.log(`✨ [MODE A] Target asset disk "${CONFIG.MODEL_DISK_NAME}" not found. Initializing seed infrastructure...`);


            let seedMetadata = null;
            try {
                console.log("🔍 [SEED NODE CHECK] Scanning zone horizons for active seeders...");
                [seedMetadata] = await computeClient.get({ project: projectId, zone: CONFIG.ZONE, instance: CONFIG.SEED_INSTANCE_NAME });
                console.log(`📊 [SEED NODE CHECK] Match found. Name: ${CONFIG.SEED_INSTANCE_NAME} | Operational State: ${seedMetadata.status}`);
            } catch (e) { }

            if (seedMetadata && (seedMetadata.status === 'RUNNING' || seedMetadata.status === 'PROVISIONING' || seedMetadata.status === 'STAGING')) {
                console.log("⏳ [SEED RUNNING] Execution blocked: A background seeder is already handling initialization matrices.");
                return res.status(200).json({
                    status: 'SEEDING_IN_PROGRESS',
                    message: 'The model storage vault is currently downloading JUGGERNAUT-Z from Hugging Face. Please wait a few minutes.'
                });
            }

            const seedStartupScript = `#!/bin/bash
                echo "⚡ Formatting and seeding persistent model asset storage..."
                mkfs.ext4 -F /dev/sdb
                mkdir -p /mnt/vault
                mount /dev/sdb /mnt/vault
                pip install -U diffusers transformers accelerate torch
                python3 -c "
from diffusers import DiffusionPipeline
import torch
pipe = DiffusionPipeline.from_pretrained('RunDiffusion/Juggernaut-Z-Image', torch_dtype=torch.float16, variant='fp16')
pipe.save_pretrained('/mnt/vault/Juggernaut-Z')
"
                sync && umount /mnt/vault
                gcloud compute instances delete $(hostname) --zone=${CONFIG.ZONE} --quiet
            `;

            const seedConfig = {
                machineType: `zones/${CONFIG.ZONE}/machineTypes/${CONFIG.MACHINE_TYPE}`,
                disks: [
                    {
                        initializeParams: {
                            sourceImage: resolvedImageUri, // Dynamic resource injection
                            diskSizeGb: CONFIG.DISK_SIZE_GB,
                            diskType: `zones/${CONFIG.ZONE}/diskTypes/pd-ssd`
                        },
                        boot: true,
                        type: 'PERSISTENT'
                    },
                    {
                        initializeParams: {
                            diskName: CONFIG.MODEL_DISK_NAME,
                            diskSizeGb: CONFIG.VAULT_DISK_SIZE_GB,
                            diskType: `zones/${CONFIG.ZONE}/diskTypes/pd-ssd`
                        },
                        boot: false,
                        type: 'PERSISTENT',
                        mode: 'READ_WRITE'
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

            console.log(`📡 [API CALL] Dispatching creation instruction insert array for: ${CONFIG.SEED_INSTANCE_NAME}`);
            await computeClient.insert({ project: projectId, zone: CONFIG.ZONE, instanceResource: { name: CONFIG.SEED_INSTANCE_NAME, ...seedConfig } });

            return res.status(201).json({
                status: 'INITIALIZING_STORAGE',
                message: 'Created a background seeder to initialize your Juggernaut-Z disk vault. Retrying this request shortly will mount it automatically.'
            });
        }

        // ==========================================
        // 🚀 STEP 2: MULTI-ATTACH PRODUCTION RUN TIME LAUNCH
        // ==========================================
        console.log("🚀 [MODE B] Active storage block verified. Assessing production production worker profile...");
        let metadata = null;
        try {
            [metadata] = await computeClient.get({ project: projectId, zone: CONFIG.ZONE, instance: CONFIG.INSTANCE_NAME });
            console.log(`📊 [WORKER CHECK] Worker instance matched. Operational Status: ${metadata.status}`);
        } catch (e) { }

        if (metadata && (metadata.status === 'RUNNING' || metadata.status === 'PROVISIONING' || metadata.status === 'STAGING')) {
            const publicIp = metadata.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP;
            console.log(`🛰️ [WORKER HOT] Worker is hot and responding. Forwarding IP route directly: ${publicIp}`);
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
            mkdir -p /mnt/models
            mount -o ro /dev/sdb /mnt/models
            python3 /root/worker-agent.py > /root/worker.log 2>&1 &
        `;

        const vmConfig = {
            machineType: `zones/${CONFIG.ZONE}/machineTypes/${CONFIG.MACHINE_TYPE}`,
            memoryMb: CONFIG.EXTENDED_RAM_MB,
            disks: [
                {
                    initializeParams: {
                        sourceImage: resolvedImageUri, // Dynamic resource injection
                        diskSizeGb: CONFIG.DISK_SIZE_GB,
                        diskType: `zones/${CONFIG.ZONE}/diskTypes/pd-ssd`
                    },
                    boot: true,
                    type: 'PERSISTENT'
                },
                {
                    source: `zones/${CONFIG.ZONE}/disks/${CONFIG.MODEL_DISK_NAME}`,
                    boot: false,
                    type: 'PERSISTENT',
                    mode: 'READ_ONLY'
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
                preemptible: true,
                onHostMaintenance: 'TERMINATE'
            },
            metadata: {
                items: [
                    { key: 'startup-script', value: startupScript },
                    { key: 'install-nvidia-driver', value: 'true' }
                ]
            }
        };

        console.log(`📡 [API CALL] Dispatching Spot compute infrastructure insert node: ${CONFIG.INSTANCE_NAME}`);
        await computeClient.insert({ project: projectId, zone: CONFIG.ZONE, instanceResource: { name: CONFIG.INSTANCE_NAME, ...vmConfig } });

        return res.status(202).json({
            status: 'INITIALIZING',
            message: 'Spot cluster allocation sequence dispatched successfully.',
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("❌ [CRITICAL HARDWARE FAILURE] Allocation pipeline snapped inside try-catch scope:");
        console.error(err);
        return res.status(500).json({ status: 'ERROR', error: err.message, raw: err });
    }
};