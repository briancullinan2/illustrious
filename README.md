# 🌌 Illustrious Studio Engine


## 🚀 Overview
This repository contains the dynamic, fault-tolerant Google Cloud orchestration matrix for the Illustrious Studio Engine's spatial rendering workers. It completely automates the lifecycle of headless, GPU-accelerated (Nvidia Tesla T4) Spot instances running the Lumina2/Juggernaut-Z diffusion pipeline. 

Instead of burning cash on idle compute, this system implements **Zero-to-One Auto-Scaling**. It tracks hardware availability, dynamically hops across geographic zones to find cheap Spot capacity, seeds persistent model storage on-the-fly, and securely proxies frontend HTTPs traffic down to raw backend worker sockets.

---

## 🏗️ Architecture & Core Components

The backend is decoupled into three distinct microservice routes (runnable locally for debug or deployable as separate Google Cloud Functions):

### 1. `clusterManager` (The Brain)
* **Endpoint:** `/api/cluster/status`
* **Role:** Tracks the live state of the compute horizon. 
* **Mechanics:** * Queries GCP for running or staging worker instances (`illustrious-juggernaut-worker-node`).
  * If the pool is empty, it triggers the `bootGpu` service to scale up.
  * **Failover Engine:** If the default zone (`us-central1-a`) is exhausted of Spot GPUs, it automatically pivots the entire infrastructure pool to backup zones (e.g., `us-central1-f`, `us-east1-c`).
  * **Diagnostic extraction:** Intercepts serial port boot logs for crashed machines to pass raw kernel/preemption errors down to the client canvas.

### 2. `bootGpu` (The Muscle)
* **Endpoint:** `/api/cluster/allocate` (Usually triggered internally by `clusterManager`)
* **Role:** Provisions the physical hardware, handles disk orchestration, and bootstraps the ML environment.
* **Mechanics:**
  * **Image Recon:** Dynamically queries Google's public registries to find the latest valid `debian-11` OS image, bypassing hardcoded deprecation traps.
  * **Mode A (Seeding):** If the permanent Juggernaut-Z vault (`illustrious-juggernaut-z-vault`) is missing or unformatted in the target zone, it spins up a temporary seeder node, formats the SSD to `ext4`, pulls the 6B parameter weights directly from HuggingFace, and self-destructs.
  * **Mode B (Production):** Once the disk is `READY`, it attaches the vault in `READ_ONLY` mode (allowing concurrent multi-node attachment) and boots the GPU worker with an injected Python FastAPI agent.

### 3. `spatialRelay` (The Network Bridge)
* **Endpoint:** `/api/spatial/relay`
* **Role:** Bypasses browser Mixed-Content (HTTPS -> HTTP) security blocks.
* **Mechanics:** Acts as a secure, streaming pass-through. It accepts `multipart/form-data` (spatial coordinates and image slices) from the secure frontend canvas, pipes it directly into the raw IP of the active worker node, and streams the generated JPEG binary back to the user seamlessly.

### 4. `worker-agent.py` (The Artist)
* **Role:** The headless FastAPI inference engine running directly on the GPU node.
* **Mechanics:** * Loads `RunDiffusion/Juggernaut-Z-Image` into VRAM at `fp16` precision.
  * Accepts spatial coordinate maps (X, Y, W, H) and base image slices.
  * Executes the diffusion pipeline and composites the generated "infected layer" back into the staging matrix before streaming it back.

---

## ⚔️ The War Room: Challenges Solved

We didn't just write a script; we fought through the GCP hypervisor to make it bulletproof. Here is the historical ledger of dragons slain:

* **The SDK Client Migration:** Bypassed the legacy `new Compute()` monolithic wrapper (which threw `not a constructor` errors locally) and successfully migrated to the modern Gapic sub-clients (`InstancesClient`, `DisksClient`, `ImagesClient`).
* **The Auth Matrix Bypass:** Solved Windows local Application Default Credentials (ADC) failures by extracting active OAuth2 session tokens from the Express middleware and piping them directly into the Google Cloud API constructors in real-time.
* **The OS Image Deprecation Trap:** Google quietly deleted the `common-cu121-debian-11-py310` image families. Built a dynamic `resolveActiveImage` scanner that queries multiple projects to ensure the system always finds a bootable OS.
* **The Ghost Disk Locks:** Fixed a race condition where GCP threw a `400 Bad Request: resourceInUseByAnotherResource`. The manager now actively scans for "zombie" seeder disks that failed to detach properly, issuing asynchronous purge commands to shred them before attempting a new worker boot.
* **The `ZONE_RESOURCE_POOL_EXHAUSTED` Drought:** When Google ran entirely out of cheap Tesla T4 cards in `us-central1-a`, the script threw cryptic serial port lockouts. Built a multi-region failover matrix (`resolveOperationalZone`) that actively queries hardware availability and shifts the infrastructure to a new zone instantly.

---

## 🔮 Future Plans & Next Steps

1. **Frontend Canvas Hookup:** Wire the React/Web application to consume the `CLUSTER_MANAGER_URL` and map the visual hardware staging states (`STAGING`, `INITIALIZING_STORAGE`, `ACTIVE`).
2. **Telemetry Dashboards:** Add a real-time log ingestion view to the front-end so users can watch the `worker.log` `apt-get` and `pip` installation streams as the node boots.
3. **Scaling the Horizon:** Currently hardcoded to `GPU_COUNT: 1` and a single node setup. The `READ_ONLY` disk architecture supports dozens of simultaneous nodes—ready to be upgraded to a load-balanced array once user demand spikes.
4. **Automated Reaper:** Implement a background cron-job that pings the `clusterManager` to kill any workers that have been idle for more than 15 minutes to aggressively protect billing quotas.

---
*Built for the Illustrious Studio Engine.*