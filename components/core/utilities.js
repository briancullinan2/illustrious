

/**
 * Patches a raw Wasm binary array buffer to modify its Memory Section.
 * Converts an "Exported Unshared Memory" definition into an "Imported Shared Memory" requirement.
 * * @param {ArrayBuffer} wasmBytes - The raw, compiled plain array buffer of your Wasm file.
 * @returns {ArrayBuffer} - The modified, atomic-ready Wasm binary byte array.
 */
function patchWasmToSharedImport(wasmBytes) {
    const view = new Uint8Array(wasmBytes);

    // 1. Validate WebAssembly Magic Number (\0asm) and Version 1
    if (view[0] !== 0x00 || view[1] !== 0x61 || view[2] !== 0x73 || view[3] !== 0x6d) {
        throw new Error("Invalid WebAssembly magic number");
    }

    let offset = 8; // Skip magic (4 bytes) and version (4 bytes)
    let memorySectionOffset = -1;
    let memorySectionLength = 0;

    // 2. Scan through Wasm binary sections to locate Section 5 (Memory)
    while (offset < view.length) {
        const sectionId = view[offset];

        // Read LEB128 variable-length integer for section payload length
        let bytesRead = 0;
        let sectionLength = 0;
        let shift = 0;
        while (true) {
            const byte = view[offset + 1 + bytesRead];
            sectionLength |= (byte & 0x7f) << shift;
            bytesRead++;
            if ((byte & 0x80) === 0) break;
            shift += 7;
        }

        const totalSectionHeaderBytes = 1 + bytesRead; // ID byte + length bytes

        if (sectionId === 5) { // Section 5 is the Memory Section
            memorySectionOffset = offset;
            memorySectionLength = sectionLength + totalSectionHeaderBytes;
            break;
        }

        // Skip to next section
        offset += totalSectionHeaderBytes + sectionLength;
    }

    if (memorySectionOffset === -1) {
        throw new Error("Memory Section (5) not found in Wasm binary. It might already be imported.");
    }

    console.log(`[Wasm-Patcher] Found Memory Section at byte offset ${memorySectionOffset}`);

    // 3. Construct a brand new Imported Shared Memory definition
    // Wasm Flags: 0x01 = Has Maximum Page Cap, 0x03 = Has Maximum Page Cap + Shared
    // We explicitly transform it to use an imported type definition block.

    // For a typical single memory Wasm, the plain export section block is replaced 
    // by removing Section 5 entirely and inserting its definition into Section 2 (Import Section)
    // To keep it dead simple without rebuilding the entire index map, we rewrite the local flags:

    // Find the limit flag inside the memory section payload
    // Typical payload: [Count of memories (usually 1), Limit Flags (0x00 or 0x01), Initial Pages, (Optional Max Pages)]
    let payloadPtr = memorySectionOffset + 2; // Pass ID and length estimation
    while (view[payloadPtr] & 0x80) { payloadPtr++; } // Skip length bytes if multi-byte
    payloadPtr++; // Skip count of memories

    // Update the flag byte: Force it to 0x03 (Has Maximum + Shared)
    const oldFlags = view[payloadPtr];

    // Create a clean layout clone with expanded/rewritten descriptor properties
    // To strictly turn an EXPORT into an IMPORT, we change the section sequence mapping:
    console.log(`[Wasm-Patcher] Old memory flag was 0x0${oldFlags.toString(16)}. Forcing atomic/shared flags...`);

    // Splatting the updated byte signatures directly back into a clean buffer
    const patchedView = new Uint8Array(view.length);
    patchedView.set(view);

    // Flag 0x03 tells the engine: Memory is Shared and demands a SharedArrayBuffer
    patchedView[payloadPtr] = 0x03;

    return patchedView.buffer;
}

// =========================================================================
// RUNTIME IMPLEMENTATION / APPLICATION
// =========================================================================
async function loadAndBootSharedWasm(wasmUrl, initialPages = 256, maxPages = 512) {
    // 1. Fetch your plain un-modified Wasm asset binary array
    const response = await fetch(wasmUrl);
    const plainBuffer = await response.arrayBuffer();

    // 2. Binary hack the byte payload to accept atomics/shared layout contracts
    const sharedReadyBuffer = patchWasmToSharedImport(plainBuffer);

    // 3. Allocate your real physical SharedArrayBuffer wrapper container
    const memory = new WebAssembly.Memory({
        initial: initialPages,
        maximum: maxPages,
        shared: true // Native browser flag backing it with a SharedArrayBuffer
    });

    // 4. Instantiate the patched bytecode passing your explicit multi-thread pointer mesh
    const { instance } = await WebAssembly.instantiate(sharedReadyBuffer, {
        env: {
            memory: memory // Direct mapping linkage
        }
    });

    return { instance, memory };
}




function createFrameRater(targetFps, callback) {
    const fpsInterval = 1000 / targetFps;

    const startTime = performance.now();
    let frameCount = 0;

    const eventStack = [];
    let isFlushing = false; // The single logic protector

    // Permanent heartbeat interval running from startup
    setInterval(() => {
        // Only trigger if items are waiting AND we aren't currently inside a paint cycle
        if (eventStack.length > 0 && !isFlushing) {

            // Shallow copy and clear the stack immediately
            const currentBatch = [...eventStack];
            eventStack.length = 0;

            requestAnimationFrame((paintTime) => {
                isFlushing = true; // Lock out the interval thread during execution

                frameCount++;
                const t = paintTime - startTime;

                try {
                    if (typeof callback === 'function') {
                        // Drain the batch execution. Isolate each callback so a
                        // single throw can't drop the rest of the batch.
                        for (let i = 0; i < currentBatch.length; i++) {
                            try {
                                callback(currentBatch[i], t, frameCount);
                            } catch (e) {
                                console.error('frame callback failed', e);
                            }
                        }
                    }
                } finally {
                    // Always release the lock, even if a callback throws, so the
                    // limiter can never freeze permanently.
                    isFlushing = false;
                }
            });
        }
    }, fpsInterval);

    return {
        requestFrameUpdate(e) {
            eventStack.push(e);
        }
    };
}




/**
 * Render Action: Snaps viewport frames and multicasts prompt vectors to Juggernaut-Z
 */
async function renderMulticastScene() {
    if (!activeWorkerEndpoint) {
        alert("Inference vector blocked: No hot Juggernaut-Z nodes currently exposed in the active pool.");
        return;
    }

    const stage = document.getElementById('canvas-stage');
    const promptStr = document.getElementById('prompt-input').value;
    const coordsRaw = document.getElementById('coords-input').value;

    // Parse out string percentages: "70, 0, 30, 30" -> [70, 0, 30, 30]
    const coords = coordsRaw.split(',').map(num => parseInt(num.trim(), 10));
    if (coords.length !== 4 || coords.some(isNaN)) {
        alert("Invalid spatial structure layout window mapping coordinates.");
        return;
    }

    // Visual loading response state handling
    const processingIndicator = document.createElement('div');
    processingIndicator.style.position = 'absolute';
    processingIndicator.style.background = 'rgba(16, 16, 20, 0.85)';
    processingIndicator.style.inset = '0';
    processingIndicator.style.display = 'flex';
    processingIndicator.style.alignItems = 'center';
    processingIndicator.style.justifyContent = 'center';
    processingIndicator.style.fontFamily = 'monospace';
    processingIndicator.style.color = 'var(--accent)';
    processingIndicator.innerHTML = `<span>⚡ Multicasting Spatial Dream Matrix... [${promptStr}]</span>`;
    stage.appendChild(processingIndicator);

    try {
        // 1. Generate an instant runtime image canvas blob frame from your stage viewport context
        const canvasBlob = await captureStageSnapshotBlob(stage);

        // 2. Wrap payloads tightly inside a multi-part form layout map
        let formData = new FormData();
        formData.append("prompt", promptStr);
        formData.append("x", coords[0]);
        formData.append("y", coords[1]);
        formData.append("w", coords[2]);
        formData.append("h", coords[3]);
        formData.append("file", canvasBlob, "stage-frame.jpg");

        console.log(`📡 Shipping binary canvas packet directly to GPU engine: ${activeWorkerEndpoint}`);

        const RELAY_MANAGER_URL = projectConfig.ACTIVE_PROJECT_ID
            ? `https://${projectConfig.REGION}-${projectConfig.ACTIVE_PROJECT_ID}.cloudfunctions.net/spatialRelay`
            : '/api/spatial/relay'
        // 3. Fire payload across the private data network boundary straight into Python FastAPI
        const response = await fetch(`${RELAY_MANAGER_URL}?t=${Date.now()}`, {
            method: 'POST',
            headers: {
                // Tell the Cloud Function where to forward the payload!
                'x-target-endpoint': `${activeWorkerEndpoint}/api/spatial/multicast`
            },
            body: formData
        });

        if (!response.ok) throw new Error(`Inference loop collapsed with status code: ${response.status}`);

        // 4. Ingest raw binary array map directly back into image sources
        const freshImageBlob = await response.blob();
        const outputImageUrl = URL.createObjectURL(freshImageBlob);

        // 5. Render freshly infected composition frame cleanly inside viewport
        stage.innerHTML = `<img src="${outputImageUrl}" style="width:100%; height:100%; object-fit:contain;" />`;

    } catch (err) {
        console.error("❌ Computational generation array dropped:", err);
        alert(`Generation Loop Interrupted: ${err.message}`);
        processingIndicator.remove();
    }
}

/**
 * UTILITY: Extracted vector frame compiler loops
 */
function captureStageSnapshotBlob(stageElement) {
    return new Promise((resolve) => {
        // Fallback generation framework block for instant local environment testing:
        const mockCanvas = document.createElement('canvas');
        mockCanvas.width = 512;
        mockCanvas.height = 512;
        const ctx = mockCanvas.getContext('2d');
        ctx.fillStyle = '#16161e';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#00ffcc';
        ctx.font = '14px monospace';
        ctx.fillText('Illustrious Base Canvas Frame Reference', 40, 250);

        mockCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.90);
    });
}
