// cloud-functions/boot-gpu/index.js

// 💡 Abstracted Configuration independent of the cloud provider infrastructure
const RUNPOD_CONFIG = {
    API_KEY: process.env.RUNPOD_API_KEY,
    GPU_TYPE: 'NVIDIA GeForce RTX 4090', // Or 'NVIDIA Tesla T4' with zero quota blocks
    GPU_COUNT: 1,
    IMAGE_NAME: 'runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04',
    DOCKER_ARGS: `-v /mnt/vault/Juggernaut-Z:/root/model` // Direct asset bindings
};



async function deployAgnosticWorker() {

    const axios = require('axios');

    console.log(`🛰️ [RUNPOD] Orchestrating hardware allocation for: ${RUNPOD_CONFIG.GPU_TYPE}`);

    // GraphQL payload to spawn a container instantly via RunPod's control plane
    const query = `
    mutation {
        podFindAndDeploy(input: {
            gpuTypeId: "${RUNPOD_CONFIG.GPU_TYPE}",
            gpuCount: ${RUNPOD_CONFIG.GPU_COUNT},
            imageName: "${RUNPOD_CONFIG.IMAGE_NAME}",
            dockerArgs: "${RUNPOD_CONFIG.DOCKER_ARGS}",
            ports: "8000/http",
            volumeInGb: 50
        }) {
            id
            desiredStatus
            runtime {
                ports {
                    ip
                    isPublic
                    publicPort
                }
            }
        }
    }`;

    const response = await axios.post(
        'https://api.runpod.io/v1/gce-graphql',
        { query },
        { headers: { 'Authorization': `Bearer ${RUNPOD_CONFIG.API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const pod = response.data?.data?.podFindAndDeploy;
    if (!pod) throw new Error("Hardware provider rejected container allocation layer.");

    // Parse out the public execution routing endpoint dynamically
    const httpPort = pod.runtime?.ports?.find(p => p.privatePort === 8000);
    const publicEndpoint = httpPort ? `http://${httpPort.ip}:${httpPort.publicPort}` : null;

    return {
        statusCode: 202,
        body: {
            status: 'INITIALIZING',
            podId: pod.id,
            endpoint: publicEndpoint,
            message: "Agnostic cluster worker successfully spawned via decentralized mesh."
        }
    };
}



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
    USE_SPOT: true,
};



// ============================================================================
// GLOBAL STATE CACHE (Persists inside the Cloud Function memory isolation layer)
// ============================================================================
let cachedImageUri = null;
let cacheExpirationTime = null;
let activeImageScanPromise = null; // The Mutex Lock

const CACHE_DURATION_MS = 2 * 24 * 60 * 60 * 1000; // 💡 Exactly 2 Days

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



    const { InstancesClient, DisksClient, ImagesClient, AcceleratorTypesClient } = require('@google-cloud/compute');
    const instancesClient = new InstancesClient(clientOptions);
    const disksClient = new DisksClient(clientOptions);
    const imagesClient = new ImagesClient(clientOptions);
    const acceleratorTypesClient = new AcceleratorTypesClient(clientOptions);

    try {
        // 1. Resolve zone with GPU capacity
        const activeZone = await resolveOperationalZone(acceleratorTypesClient, projectId, CONFIG.ZONE_FAILOVER_POOL);
        console.log(`🌍 [ZONE] Using zone: ${activeZone}`);

        // 2. Resolve latest compatible image (Idempotent & Mutex Locked)
        let resolvedImageUri = null;
        const now = Date.now();

        if (cachedImageUri && cacheExpirationTime && now < cacheExpirationTime) {
            console.log(`⚡ [RESOLVER CACHE] Hot memory hit! Reusing baseline layer: ${cachedImageUri}`);
            resolvedImageUri = cachedImageUri;
        } else {
            // Check if another parallel request is already processing the Registry scan
            if (activeImageScanPromise) {
                console.warn(`🛑 [MUTEX LOCK] Concurrent poll detected. Chaining onto active in-flight registry stream...`);
                resolvedImageUri = await activeImageScanPromise;
            } else {
                console.log(`🚀 [RESOLVER CACHE] Cache cold or expired. Securing exclusive scan lock...`);

                // Create the lock promise
                activeImageScanPromise = resolveActiveImage(imagesClient);

                try {
                    resolvedImageUri = await activeImageScanPromise;

                    // Commit to long-term memory cache
                    cachedImageUri = resolvedImageUri;
                    cacheExpirationTime = Date.now() + CACHE_DURATION_MS;
                    console.log(`💾 [RESOLVER CACHE] Registry locked down. Values cached for 2 days.`);
                } finally {
                    // CRITICAL: Always release the lock so future failures can try again
                    activeImageScanPromise = null;
                }
            }
        }

        console.log(`🖼️ [IMAGE LAYER BOUND] Using: ${resolvedImageUri}`);

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
        console.error("❌ [ORCHESTRATOR ERROR]", err);
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
    const targetProject = 'deeplearning-platform-release';
    console.log(`🔍 [RESOLVER] Initializing highly verbose registry scan...`);

    // Use the broadest safe filter possible to get all active images over the wire
    const apiFilter = 'status = "READY"';
    console.log(`📡 [RESOLVER API] Filter string passing to GCP: '${apiFilter}'`);

    try {
        const imagesPager = imagesClient.listAsync({
            project: targetProject,
            filter: apiFilter
        });

        let totalInspected = 0;
        let skippedCpu = 0;
        let skippedDeprecated = 0;
        let candidateImages = [];

        for await (const image of imagesPager) {
            totalInspected++;

            // 1. Drop obvious CPU-only architectures right away
            if (image.name.includes('cpu')) {
                skippedCpu++;
                continue;
            }

            // 2. Drop broken/deprecated releases
            if (image.deprecated) {
                skippedDeprecated++;
                continue;
            }

            // Calculate a preference score to sort choices intelligently later
            let score = 0;
            if (image.name.includes('nvidia')) score += 100;
            if (image.name.includes('cu12')) score += 50;  // Prefer modern CUDA 12 stacks
            if (image.name.includes('debian-12')) score += 20; // Prefer stable Debian 12
            if (image.name.includes('ubuntu')) score += 10;

            // Log every viable candidate with its calculated metrics
            console.log(`   💡 [VIABLE IMAGE FOUND] Name: "${image.name}" | Score: ${score} | Created: ${image.creationTimestamp}`);

            candidateImages.push({
                name: image.name,
                selfLink: image.selfLink,
                score: score,
                creationTimestamp: new Date(image.creationTimestamp)
            });
        }

        console.log(`\n📊 [RESOLVER METRICS] Pipeline Scan Complete.`);
        console.log(`   ├─ Total Raw Objects Inspected: ${totalInspected}`);
        console.log(`   ├─ Skipped (CPU-bound): ${skippedCpu}`);
        console.log(`   ├─ Skipped (Deprecated): ${skippedDeprecated}`);
        console.log(`   └─ Total Gathered Candidates: ${candidateImages.length}\n`);

        if (candidateImages.length > 0) {
            // Sort primary by capability score, and secondary by freshness
            candidateImages.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return b.creationTimestamp - a.creationTimestamp;
            });

            // Log the top 3 items to confirm the sorting math works out in your terminal
            console.log(`🔝 Top Candidates evaluated:`);
            candidateImages.slice(0, 3).forEach((img, idx) => {
                console.log(`   [${idx}] Score: ${img.score} | Name: ${img.name}`);
            });

            const chosenImage = candidateImages[0];
            console.log(`\n🎯 [RESOLVER SELECTION]`);
            console.log(`   └─ Image Name: ${chosenImage.name}`);
            console.log(`   └─ URI Link  : ${chosenImage.selfLink}\n`);

            return chosenImage.selfLink;
        }

        throw new Error("Zero live registry objects survived the base filtration criteria.");

    } catch (err) {
        console.error(`❌ [RESOLVER ERROR] Scan execution failed:`, err);
        console.log(`🔄 [RESOLVER] Falling back to known-stable targets...`);

        const targetFamilies = [
            'common-cu129-debian-12-nvidia-580', // Built for the Debian 12 images you found
            'common-cu129-ubuntu-2404-nvidia-580',
            'pytorch-2-9-cu129-ubuntu-2404-nvidia-580'
        ];

        for (const family of targetFamilies) {
            try {
                const [imageMeta] = await imagesClient.getFromFamily({
                    project: targetProject,
                    family
                });

                if (imageMeta?.selfLink) {
                    console.log(`🎯 [RESOLVER] Fallback Family Match Found: ${family}`);
                    return imageMeta.selfLink;
                }
            } catch (familyErr) {
                console.warn(`   ℹ️ Family ${family} not matching family pointer. Trying next...`);
            }
        }

        console.warn("🚨 [RESOLVER] Deep learning registries unreachable. Invoking emergency infrastructure backup...");
        const [fallbackMeta] = await imagesClient.getFromFamily({
            project: 'debian-cloud',
            family: 'debian-12'
        });

        if (fallbackMeta?.selfLink) return fallbackMeta.selfLink;
        throw new Error("Orchestration Engine Halted: Deep learning registries completely offline.");
    }
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

    const bootScriptPath = path.join(__dirname, 'start-gpu.sh');
    const bootScriptContent = fs.existsSync(bootScriptPath)
        ? fs.readFileSync(bootScriptPath, 'utf8')
        : '# No custom boot script found';

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
                // Match deviceName to disk name so GCP creates the predictable symlink
                deviceName: CONFIG.MODEL_DISK_NAME,
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
            // 💡 Dynamic scheduling options dependent on your debug config toggle
            preemptible: CONFIG.USE_SPOT,
            provisioningModel: CONFIG.USE_SPOT ? 'SPOT' : 'STANDARD',
            onHostMaintenance: CONFIG.USE_SPOT ? 'TERMINATE' : 'TERMINATE',
            automaticRestart: !CONFIG.USE_SPOT
        },
        metadata: {
            items: [
                { key: 'startup-script', value: bootScriptContent },
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
            message: `GPU worker deployment started in ${zone} (Spot: ${CONFIG.USE_SPOT})`,
            timestamp: new Date().toISOString()
        }
    };
}