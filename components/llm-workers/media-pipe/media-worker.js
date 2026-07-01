


globalThis.document = {
	baseURI: 'http://localhost:4000/'
};


async function initLocalStorage() {
	let moduleWorker = false;
	let moduleLoaded = false;

	if(typeof DB_VERSION !== 'undefined') {
		return;
	}

	if(typeof importScripts === 'function') {
		// Classic Web Worker: execution is synchronous, no await needed for script loading
		try {
			importScripts('/components/core/local.js');
			if(typeof getDatabaseMetadata === 'undefined') {
				throw new Error("Classic script loaded, but getDatabaseMetadata namespace is missing.");
			}
			moduleLoaded = true;
		} catch(error) {
			moduleWorker = true;
			if(!(this === undefined))
				console.error("Failed to load database utilities via importScripts:", error);
		}
	}


	if(moduleWorker || !moduleLoaded) {
		try {
			const downloaderModule = await import('../../core/local.js');
			let extracted = null;

			if(downloaderModule && Object.keys(downloaderModule).length > 0) {
				extracted = downloaderModule;
			} else if(typeof globalThis !== 'undefined') {
				extracted = globalThis;
			}

			if(extracted && ('putRecord' in extracted || 'getRecord' in extracted)) {
				// Destructure locally and assign directly to globalThis properties
				const { putRecord, getRecord, DB_STORE_NAME } = extracted;
				Object.assign(globalThis, { putRecord, getRecord, DB_STORE_NAME });
			} else {
				throw new Error("Downloader script loaded, but no valid exports or global namespaces were found.");
			}
		} catch(error) {
			console.error("Failed to dynamically initialize downloader local storage dependencies:", error);
			throw error;
		}
	}
}

const storagePromise = initLocalStorage();

async function initDownloader() {
	let moduleWorker = false;
	let moduleLoaded = false;


	if(typeof importScripts === 'function') {
		// Classic Web Worker: execution is synchronous, no await needed for script loading
		try {
			importScripts('/components/llm-workers/downloader.js');
			if(typeof getDatabaseMetadata === 'undefined') {
				throw new Error("Classic script loaded, but getDatabaseMetadata namespace is missing.");
			}
			moduleLoaded = true;
		} catch(error) {
			moduleWorker = true;
			if(!(this === undefined))
				console.error("Failed to load database utilities via importScripts:", error);
		}
	}

	if(moduleWorker || !moduleLoaded) {
		try {
			const downloaderModule = await import('../downloader.js');
			let extracted = null;

			if(downloaderModule && Object.keys(downloaderModule).length > 0) {
				extracted = downloaderModule;
			} else if(typeof globalThis !== 'undefined') {
				extracted = globalThis;
			}

			if(extracted && ('installDatabaseIfNeeded' in extracted || 'fetchWithFallbackChain' in extracted)) {
				// Destructure locally and assign directly onto globalThis in one clean sweep
				const { installDatabaseIfNeeded, getTfUrl, fetchWithFallbackChain } = extracted;
				Object.assign(globalThis, { installDatabaseIfNeeded, getTfUrl, fetchWithFallbackChain });
			} else {
				throw new Error("Downloader script loaded, but no valid exports or global namespaces were found.");
			}
		} catch(error) {
			console.error("Failed to dynamically initialize downloader network dependencies:", error);
			throw error;
		}
	}
}

const downloaderPromise = initDownloader();

const GGUF_DATABASE = 'gguf';

const ST_FILE = 8;
const ST_DIR = 4;
const FS_DEFAULT = (6 << 3) + (6 << 6) + (6);
const FS_FILE = (ST_FILE << 12) + FS_DEFAULT;
const FS_DIR = (ST_DIR << 12) + FS_DEFAULT;

let visionRecord;


async function downloadVisionModel(payload, forceUpdate = false) {
	const url = payload.visionModelUrl;
	if(!url) return null;

	const modelPath = getTfUrl(url);

	if(!forceUpdate && !globalThis.visionRecord) {
		globalThis.visionRecord = await getRecord(DB_STORE_NAME, modelPath, GGUF_DATABASE);
	}

	let buffer = globalThis.visionRecord?.contents;
	if(!buffer) {
		buffer = await fetchWithFallbackChain(url, 'TFLite');
		globalThis.visionRecord = {
			path: modelPath,
			timestamp: new Date(),
			mode: FS_FILE,
			contents: new Uint8Array(buffer),
			parent: modelPath.substring(0, modelPath.lastIndexOf('/')) || '/'
		};
		await putRecord(DB_STORE_NAME, globalThis.visionRecord, GGUF_DATABASE);
	}

	console.warn(`Vision Model Processing Complete: ${modelPath}`);
	return buffer;
}

/**
 * Slices a single ImageBitmap source into a 2x2 grid (4 quadrants).
 * This operation is synchronous, hardware-accelerated, and completely worker-safe.
 * * @param {ImageBitmap} sourceBitmap - The raw fully decoded incoming image asset.
 * @returns {Promise<ImageBitmap[]>} An array containing [TopLeft, TopRight, BottomLeft, BottomRight]
 */
async function splitBitmapIntoQuadGrid(sourceBitmap) {
	const w = sourceBitmap.width;
	const h = sourceBitmap.height;

	// Calculate split boundaries
	const halfWidth = Math.floor(w / 2);
	const halfHeight = Math.floor(h / 2);

	// Sub-rect configuration slices: [sx, sy, sw, sh]
	const quadrants = [
		{ x: 0, y: 0, w: halfWidth, h: halfHeight }, // 0: Top-Left
		{ x: halfWidth, y: 0, w: w - halfWidth, h: halfHeight }, // 1: Top-Right
		{ x: 0, y: halfHeight, w: halfWidth, h: h - halfHeight }, // 2: Bottom-Left
		{ x: halfWidth, y: halfHeight, w: w - halfWidth, h: h - halfHeight }  // 3: Bottom-Right
	];

	// Fire off crop tasks concurrently via native browser threading
	const cropPromises = quadrants.map(q =>
		createImageBitmap(sourceBitmap, q.x, q.y, q.w, q.h)
	);

	return Promise.all(cropPromises);
}


let objectDetectorInstance = null;
let imageSegmenterInstance = null;

async function initModel(payload) {
	const visionBuf = await downloadVisionModel(payload);

	if(!visionBuf) {
		throw new Error("Initialization failed: visionModelUrl payload parameter is required.");
	}

	// Import the dedicated vision tasks bundle
	const visionModule = await import("./vision_bundle.mjs");

	// Resolve constructors whether exported natively or attached to the global/module namespace
	const FilesetResolver = visionModule.FilesetResolver || self.FilesetResolver;
	const ObjectDetector = visionModule.ObjectDetector || self.ObjectDetector;
	const ImageSegmenter = visionModule.ImageSegmenter || self.ImageSegmenter;

	if(!FilesetResolver || !ObjectDetector || !ImageSegmenter) {
		throw new Error("Failed to extract MediaPipe Vision constructors from the imported module bundle.");
	}

	// Locate the underlying core WASM task filesets
	const visionFileset = await FilesetResolver.forVisionTasks(
		"."
	);

	// Convert cached IndexedDB tflite buffer into a transient local object URL
	const visionBlobUrl = URL.createObjectURL(new Blob([visionBuf], { type: 'application/octet-stream' }));

	// Conditional initialization based on task mode request parameters
	if(payload.visionTaskType === "SEGMENTER") {
		imageSegmenterInstance = await ImageSegmenter.createFromOptions(visionFileset, {
			baseOptions: {
				modelAssetPath: visionBlobUrl,
				delegate: payload.visionDelegate || "GPU",
			},
			canvas: globalThis['glCanvas'],
			runningMode: "IMAGE",
			outputCategoryMask: payload.outputCategoryMask !== undefined ? payload.outputCategoryMask : true,
			outputConfidenceMasks: payload.outputConfidenceMasks !== undefined ? payload.outputConfidenceMasks : false
		});
	} else {
		// Fallback default: Object Detection
		objectDetectorInstance = await ObjectDetector.createFromOptions(visionFileset, {
			baseOptions: {
				modelAssetPath: visionBlobUrl,
				delegate: payload.visionDelegate || "GPU",
			},
			maxResults: 4,
			scoreThreshold: payload.visionScoreThreshold || 0.08,
			runningMode: "IMAGE",
			canvas: globalThis['glCanvas']
		});
	}
}

// Complementary execution handler to route segmentation processing tasks
async function runVisionSegmentation(payload) {
	const { imageBitmap, dataUri, uuid } = payload;

	if(!imageSegmenterInstance) {
		self.postMessage({ type: 'ERROR', payload: { message: 'Vision image segmenter model layer not initialized.' } });
		return;
	}

	try {
		if(!(imageBitmap || dataUri)) {
			throw new Error("Missing structural input source parameter: imageBitmap");
		}

		const blob = typeof dataUri === 'string' ? await createImageBitmap(await (await fetch(dataUri)).blob()) : undefined;

		const segmentationResult = imageSegmenterInstance.segment(imageBitmap || blob);

		// Extract category or confidence masks from the result payload structure
		const mask = segmentationResult.categoryMask || segmentationResult.confidenceMasks;

		self.postMessage({
			type: 'VISION_SEGMENTATION_COMPLETE',
			payload: {
				uuid,
				result: {
					width: mask.width,
					height: mask.height,
					// The mask data uses a Uint8Array where each item maps to a category index
					maskData: mask.getAsUint8Array()
				}
			}
		});
	} catch(err) {
		console.error(err);
		self.postMessage({ type: 'ERROR', payload: { uuid, message: 'Segmentation execution failed: ' + err.message } });
	}
}

async function checkVersion(payload) {
	if(!payload.visionModelUrl) return false;

	function parseHfUrl(url) {
		try {
			const hfRegex = /huggingface\.co\/(?:api\/)?(models|datasets)\/([^\/]+)\/([^\/]+)(?:\/resolve\/|\/revision\/)?([^\/]+)?/;
			const match = url.match(hfRegex);
			if(!match) return null;

			return {
				repoType: match[1],
				owner: match[2],
				repo: match[3],
				branch: match[4] && !match[4].includes('.') ? match[4] : 'main'
			};
		} catch(e) {
			console.error("Failed to parse URL string:", url, e);
			return null;
		}
	}

	const visionPath = getTfUrl(payload.visionModelUrl);
	try {
		visionRecord = await getRecord(DB_STORE_NAME, visionPath, GGUF_DATABASE);
	} catch { }

	const hfMeta = parseHfUrl(payload.visionModelUrl);
	if(!hfMeta || !visionRecord || !visionRecord.timestamp) {
		return false;
	}

	try {
		const remoteCommitDate = await getBranchVersion(hfMeta.repoType, hfMeta.owner, hfMeta.repo, hfMeta.branch);
		const localTimestamp = new Date(visionRecord.timestamp);
		return localTimestamp < remoteCommitDate;
	} catch(err) {
		console.error("[Version Check] Failed to complete remote timestamp check:", err);
		return false;
	}
}



async function runVisionDetection(payload) {
	if(!objectDetectorInstance) {
		self.postMessage({ type: 'ERROR', payload: { message: 'Vision object detector model layer not initialized.' } });
		return;
	}


	let { imageBitmap, dataUri, uuid } = payload;
	if(!(imageBitmap || dataUri)) {
		throw new Error("Missing structural input source parameter: imageBitmap");
	}

	imageBitmap ||= typeof dataUri === 'string' ? await createImageBitmap(await (await fetch(dataUri)).blob(),
		{
			colorSpaceConversion: 'none',
			premultipliedAlpha: 'none',
			//imageOrientation: 'flipY'
		}) : undefined;

	const subBitmaps = await splitBitmapIntoQuadGrid(imageBitmap);

	const globalDetections = [];
	const halfWidth = Math.floor(imageBitmap.width / 2);
	const halfHeight = Math.floor(imageBitmap.height / 2);

	// Quad spatial offsets mapping for coordinate translation: [offsetX, offsetY]
	const quadOffsets = [
		[0, 0],                 // 0: Top-Left
		[halfWidth, 0],         // 1: Top-Right
		[0, halfHeight],        // 2: Bottom-Left
		[halfWidth, halfHeight] // 3: Bottom-Right
	];

	// SERIALLY INVOKE: Run each quadrant one by one to protect WebGL state
	for(let i = 0; i < subBitmaps.length; i++) {
		const quadBitmap = subBitmaps[i];

		// Run the detection on the isolated sub-region
		const quadResult = objectDetectorInstance.detect(quadBitmap);

		if(quadResult && quadResult.detections) {
			const [offsetX, offsetY] = quadOffsets[i];

			for(const detection of quadResult.detections) {
				const box = detection.boundingBox;

				// Translate local quad pixel origins back to global image coordinates
				const globalBox = {
					originX: box.originX + offsetX,
					originY: box.originY + offsetY,
					width: box.width,
					height: box.height,
					angle: box.angle || 0
				};

				// Clone the detection structure and inject the corrected global box
				globalDetections.push({
					...detection,
					boundingBox: globalBox
				});
			}
		}

		// Clean up GPU allocation for this sub-slice immediately
		quadBitmap.close();
	}

	// Clean up parent image handle
	imageBitmap.close();

	// Ship the combined, re-mapped coordinate dataset back to the UI thread
	self.postMessage({ type: 'VISION_DETECTION_COMPLETE', payload: { uuid, detections: globalDetections } });
}



self.onmessage = async (e) => {
	const { type, payload, baseURI, uuid, canvas } = e.data;
	await downloaderPromise;
	await storagePromise;

	if(type === 'VERSION_CHECK') {
		await installDatabaseIfNeeded(GGUF_DATABASE);
		const needsUpdate = await checkVersion(payload);
		self.postMessage({ type: 'MODEL_VERSION', payload: { needsUpdate } });
	}

	if(type === 'DOWNLOAD_MODELS') {
		await installDatabaseIfNeeded(GGUF_DATABASE);
		await downloadVisionModel(payload, true);
		self.postMessage({ type: 'DOWNLOAD_READY', payload: { needsUpdate: false } });
	}

	if(type === 'LOAD_MODEL') {
		globalThis.document.baseURI = baseURI;
		await installDatabaseIfNeeded(GGUF_DATABASE);
		const needsUpdate = await checkVersion(payload);

		if(canvas) {
			globalThis['glCanvas'] = canvas;
			//globalThis['glContext'] = canvas.getContext("webgl2") || canvas.getContext("webgl");
		}
		try {
			await initModel(payload);
			self.postMessage({ type: 'MODEL_READY', payload: { needsUpdate } });
		} catch(err) {
			console.error(err);
			self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || err.stacktrace) } });
		}

	}

	if(type === "RUN_VISION_SEGMENTATION") {
		await runVisionSegmentation(payload);
	}

	if(type === 'RUN_VISION_DETECTION') {
		try {
			await runVisionDetection(payload);
		} catch(err) {
			console.error(err);
			self.postMessage({ type: 'ERROR', payload: { uuid, message: 'Vision tracking failed: ' + err.message } });
		}
	}

	if(type === 'UNLOAD_MODEL') {
		try {
			if(objectDetectorInstance) {
				objectDetectorInstance.close();
				objectDetectorInstance = null;
			}
			self.postMessage({ type: 'UNLOAD_COMPLETE' });
		} catch(err) {
			console.error("Error encountered during forced worker cleanup sequence:", err);
			self.postMessage({ type: 'ERROR', payload: { message: 'Cleanup failed: ' + err.message } });
		}
	}
};

self.postMessage({ type: 'WORKER_READY' });
