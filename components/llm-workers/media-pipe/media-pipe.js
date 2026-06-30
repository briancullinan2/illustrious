globalThis.document = {
	baseURI: 'http://localhost:4000/'
};

let putRecord, getRecord, DB_STORE_NAME;

async function initLocalStorage() {
	try {
		const downloaderModule = await import('../../core/local.js');
		if(downloaderModule && Object.keys(downloaderModule).length > 0) {
			({ putRecord, getRecord, DB_STORE_NAME } = downloaderModule);
		}
		else if(typeof self !== 'undefined' && self) {
			({ putRecord, getRecord, DB_STORE_NAME } = self);
		} else {
			throw new Error("Downloader script loaded, but no valid exports or global namespaces were found.");
		}
	} catch(error) {
		console.error("Failed to dynamically initialize downloader local storage dependencies:", error);
		throw error;
	}
}

await initLocalStorage();

let installDatabaseIfNeeded, getTfUrl, fetchWithFallbackChain;

async function initDownloader() {
	try {
		const downloaderModule = await import('../downloader.js');
		if(downloaderModule && Object.keys(downloaderModule).length > 0) {
			({ installDatabaseIfNeeded, getTfUrl, fetchWithFallbackChain } = downloaderModule);
		}
		else if(typeof self !== 'undefined' && self) {
			({ installDatabaseIfNeeded, getTfUrl, fetchWithFallbackChain } = self);
		} else {
			throw new Error("Downloader script loaded, but no valid exports or global namespaces were found.");
		}
	} catch(error) {
		console.error("Failed to dynamically initialize downloader network dependencies:", error);
		throw error;
	}
}

await initDownloader();

const GGUF_DATABASE = 'gguf';

const ST_FILE = 8;
const ST_DIR = 4;
const FS_DEFAULT = (6 << 3) + (6 << 6) + (6);
const FS_FILE = (ST_FILE << 12) + FS_DEFAULT;
const FS_DIR = (ST_DIR << 12) + FS_DEFAULT;

let visionRecord;
let objectDetectorInstance = null;

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


let objectDetectorInstance = null;
let imageSegmenterInstance = null;

async function initModel(payload) {
	const visionBuf = await downloadVisionModel(payload);

	if(!visionBuf) {
		throw new Error("Initialization failed: visionModelUrl payload parameter is required.");
	}

	// Import the dedicated vision tasks bundle
	const visionModule = await import("./vision_bundle.js");

	// Resolve constructors whether exported natively or attached to the global/module namespace
	const FilesetResolver = visionModule.FilesetResolver || self.FilesetResolver;
	const ObjectDetector = visionModule.ObjectDetector || self.ObjectDetector;
	const ImageSegmenter = visionModule.ImageSegmenter || self.ImageSegmenter;

	if(!FilesetResolver || !ObjectDetector || !ImageSegmenter) {
		throw new Error("Failed to extract MediaPipe Vision constructors from the imported module bundle.");
	}

	// Locate the underlying core WASM task filesets
	const visionFileset = await FilesetResolver.forVisionTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
	);

	// Convert cached IndexedDB tflite buffer into a transient local object URL
	const visionBlobUrl = URL.createObjectURL(new Blob([visionBuf], { type: 'application/octet-stream' }));

	// Conditional initialization based on task mode request parameters
	if(payload.visionTaskType === "SEGMENTER") {
		imageSegmenterInstance = await ImageSegmenter.createFromOptions(visionFileset, {
			baseOptions: {
				modelAssetPath: visionBlobUrl,
				delegate: payload.visionDelegate || "GPU"
			},
			runningMode: "IMAGE",
			outputCategoryMask: payload.outputCategoryMask !== undefined ? payload.outputCategoryMask : true,
			outputConfidenceMasks: payload.outputConfidenceMasks !== undefined ? payload.outputConfidenceMasks : false
		});
	} else {
		// Fallback default: Object Detection
		objectDetectorInstance = await ObjectDetector.createFromOptions(visionFileset, {
			baseOptions: {
				modelAssetPath: visionBlobUrl,
				delegate: payload.visionDelegate || "GPU"
			},
			scoreThreshold: payload.visionScoreThreshold || 0.5,
			runningMode: "IMAGE"
		});
	}
}

// Complementary execution handler to route segmentation processing tasks
async function runVisionSegmentation(payload) {
	if(!imageSegmenterInstance) {
		self.postMessage({ type: 'ERROR', payload: { message: 'Vision image segmenter model layer not initialized.' } });
		return;
	}

	try {
		const { imageBitmap, uuid } = payload;
		if(!imageBitmap) {
			throw new Error("Missing structural input source parameter: imageBitmap");
		}

		// Segmentation runs synchronously over the bitmap array
		const segmentationResult = imageSegmenterInstance.segment(imageBitmap);

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
		self.postMessage({ type: 'ERROR', payload: { message: 'Segmentation execution failed: ' + err.message } });
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

self.onmessage = async (e) => {
	const { type, payload, baseURI } = e.data;

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
		if(!objectDetectorInstance) {
			self.postMessage({ type: 'ERROR', payload: { message: 'Vision object detector model layer not initialized.' } });
			return;
		}

		try {
			const { imageBitmap, uuid } = payload;
			if(!imageBitmap) {
				throw new Error("Missing structural input source parameter: imageBitmap");
			}

			const detectionResult = objectDetectorInstance.detect(imageBitmap);

			self.postMessage({
				type: 'VISION_DETECTION_COMPLETE',
				payload: { uuid, result: detectionResult }
			});
		} catch(err) {
			console.error(err);
			self.postMessage({ type: 'ERROR', payload: { message: 'Vision tracking failed: ' + err.message } });
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
