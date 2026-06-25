

const ST_FILE = 8;
const ST_DIR = 4;
const FS_DEFAULT = (6 << 3) + (6 << 6) + (6);
const FS_FILE = (ST_FILE << 12) + FS_DEFAULT;
const FS_DIR = (ST_DIR << 12) + FS_DEFAULT;



let unauthorizedSent = false


let putRecord, getRecord, DB_STORE_NAME, DB_SCHEME


async function initLocalStorage() {
    try {
        // Attempt to dynamically import the downloader file
        const downloaderModule = await import('../../core/local.js');

        // If it exported properties natively, unpack them
        if (downloaderModule && Object.keys(downloaderModule).length > 0) {
            ({ putRecord, getRecord, DB_STORE_NAME, DB_SCHEME } = downloaderModule);
        }
        // Fallback: If it executed as a classic script and bound to the global namespace
        else if (typeof self !== 'undefined' && self) {
            ({ putRecord, getRecord, DB_STORE_NAME, DB_SCHEME } = self);
        } else {
            throw new Error("Downloader script loaded, but no valid exports or global namespaces were found.");
        }
    } catch (error) {
        console.error("Failed to dynamically initialize multimodal downloader dependencies:", error);
        throw error;
    }
}

// Execute the async bootstrap chain before running your dependent logic
await initLocalStorage();

let loadedDatabases = {}

async function downloadAndStoreModel(item, selectedDb) {
    // 1. Parse the owner and repo from the originalUrl to determine the database name
    // Example: https://github.com/EulalieCoevoet/AdaptiveMerging/blob/...
    let urlObj
    try {
        urlObj = new URL(item.originalUrl);
    } catch (e) {
        return { success: false, path: item.originalUrl, db: dbName, reason: 'Invalid URL format: ' + e.message + ' for ' + item.originalUrl };
    }
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);

    if (pathSegments.length < 2) {
        return { success: false, path: urlObj.pathname, db: dbName, reason: 'Invalid URL format: ' + item.originalUrl };
    }

    const owner = pathSegments[0];
    const repo = pathSegments[1];
    const dbName = owner + '/' + repo;
    const fileName = pathSegments[2] === 'blob'
        ? pathSegments.slice(4).join('/') || `model.${item.fileType}`
        : pathSegments.slice(2).join('/') || `model.${item.fileType}`;

    try {

        if (!loadedDatabases[selectedDb || dbName])
            try {
                const databases = await getDatabaseMetadata();
                console.log('⚙️ [CONVERTER] Extracted internal IndexedDB metadata dictionaries:', databases);
                const shouldInstall = (await needsInstall(selectedDb || dbName, DB_SCHEME)).item3
                if (databases.filter(d => d.key == selectedDb || dbName).length == 0
                    || shouldInstall) {
                    console.warn(`⚠️ [CONVERTER] Target database "${selectedDb || dbName}" missing. Initializing core database maps now.`);
                    await deleteOldDatabase(selectedDb || dbName)
                    await setupDatabase(selectedDb || dbName, DB_SCHEME);
                    console.log(`✅ [CONVERTER] Target database infrastructure initialized cleanly.`);
                }
                loadedDatabases[selectedDb || dbName] = true
            } catch (dbSetupErr) {
                console.error('❌ [CONVERTER] Database lookup/instantiation failure loop caught:', dbSetupErr);
            }


        const existingEntity = await getRecord(DB_STORE_NAME, fileName, selectedDb || dbName)
        if (existingEntity) {
            return { success: true, path: fileName, db: dbName };
        }

        // 3. Fetch the file data
        const response = await fetch(item.downloadUrl);
        if (!response.ok) {
            if (response.status === 401
                || response.status === 403
            ) {
                throw new Error('UNAUTHORIZED_ACCESS');
            }
            throw new Error(`HTTP_ERROR: Failed to fetch model asset: ${response.status} ${response.statusText}`);
        }

        // Grab the file content payload as a Blob (ideal for IDB storage of binaries)
        const fileBlob = await response.arrayBuffer();


        // 4. Write the file record into IndexedDB
        // Passing dbName as the target repository override if selected isn't explicitly provided
        await putRecord(DB_STORE_NAME, {
            path: fileName,
            timestamp: new Date(),
            mode: FS_FILE, // Assuming standard file identifier opposite of FS_DIR
            parent: fileName.substring(0, fileName.lastIndexOf('/')),
            contents: fileBlob,
            sha: item.sha256 || null
        }, selectedDb || dbName);

        return { success: true, path: fileName, db: dbName };

    } catch (error) {
        if (error.message.includes('UNAUTHORIZED_ACCESS')) {
            unauthorizedSent = true
            self.postMessage({ type: 'UNAUTHORIZED' });
        }
        console.error("Worker Model Downloader Error:", error);
        return { success: false, path: fileName, db: dbName };
    }
}

/*

async function decimateGeometry() {
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
    import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';


    // Initialize loader
    const loader = new GLTFLoader();

    // Load the asset
    loader.load(
        'path/to/model.gltf',
        function (gltf) {
            const rawModel = gltf.scene;

            // 1. Decimate the geometry before adding to the scene
            decimateModelGeometry(rawModel, 0.5); // Reduce vertex count by 50%

            // 2. Safe to insert into the scene now
            scene.add(rawModel);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened during loading:', error);
        }
    );


}

*/


/**
 * Traverses the model and decimates any mesh geometry found.
 * @param {THREE.Object3D} model 
 * @param {number} reductionFactor - Percentage to reduce (e.g., 0.5 = 50% fewer vertices)
 */


function decimateModelGeometry(model, reductionFactor) {
    const modifier = new SimplifyModifier();

    model.traverse((child) => {
        if (child.isMesh) {
            try {
                // Ensure geometry is a BufferGeometry
                const oldGeometry = child.geometry;

                // Calculate target vertex count
                const currentVertexCount = oldGeometry.attributes.position.count;
                const targetCount = Math.floor(currentVertexCount * (1 - reductionFactor));

                // Generate simplified geometry
                const simplifiedGeometry = modifier.modify(oldGeometry, targetCount);

                // Swap the geometry out safely
                child.geometry = simplifiedGeometry;
                oldGeometry.dispose();
            } catch (error) {
                console.warn('Could not decimate mesh:', child.name, error);
            }
        }
    });
}



let offscreenCanvas;
let ctx;

// Replace this with your actual WebGPU/WebGL super-resolution library instance
// e.g., import { WebSR } from 'websr'; 
let upscalerPipeline;

self.onmessage = async (e) => {
    const { type, canvas, bitmap, payload } = e.data;

    if (type === 'LOAD_CONVERT') {

        self.postMessage({ type: 'CONVERT_LOADED' });

    }

    if (type === 'DOWNLOAD_SEARCH') {
        const results = []
        for (let item of payload || []) {
            const result = await downloadAndStoreModel(item)
            results.push(result)
        }
        self.postMessage({ type: 'DOWNLOAD_FINISHED', payload: results });
    }


    if (type === 'init') {
        offscreenCanvas = canvas;
        ctx = offscreenCanvas.getContext('2d'); // Or 'webgpu' / 'webgl2'

        // Initialize your upscaler framework here
        // upscalerPipeline = new WebSR({ canvas: offscreenCanvas });
    }

    if (type === 'frame' && ctx) {
        // 1. Process and Upscale
        // In a pure WebGL/WebGPU setup, you bind the bitmap as a texture,
        // run the upscale shader fragment, and output to the canvas viewport.

        // Simple fallback fallback representation:
        ctx.drawImage(bitmap, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

        // Crucial: Clean up the bitmap resource immediately in the worker
        bitmap.close();
    }
};




self.postMessage({ type: 'WORKER_READY' });


