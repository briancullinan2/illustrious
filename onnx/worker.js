// Import the ONNX Runtime Web library from a CDN
importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.min.js');

// Configure ONNX Runtime to explicitly use WebGPU
ort.env.wasm.numThreads = 4; 

let session = null;

// Listen for messages from the main UI thread
self.onmessage = async function(e) {
    const { type, payload } = e.data;

    if (type === 'LOAD_MODEL') {
        try {
            const modelUrl = payload.modelUrl;
            
            // 1. Fetch the model with manual progress tracking
            const response = await fetch(modelUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const contentLength = response.headers.get('content-length');
            const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
            
            const reader = response.body.getReader();
            let receivedBytes = 0;
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                receivedBytes += value.length;

                if (totalBytes > 0) {
                    const percentComplete = Math.round((receivedBytes / totalBytes) * 100);
                    // Send progress up to the UI thread
                    self.postMessage({ type: 'DOWNLOAD_PROGRESS', payload: { percent: percentComplete } });
                }
            }

            // 2. Combine chunks into a single Uint8Array buffer
            const modelBuffer = new Uint8Array(receivedBytes);
            let position = 0;
            for (const chunk of chunks) {
                modelBuffer.set(chunk, position);
                position += chunk.length;
            }

            // Notify UI that compile/initialization is starting
            self.postMessage({ type: 'COMPILING_MODEL' });

            // 3. Instantiate the ONNX Inference Session using the loaded buffer
            session = await ort.InferenceSession.create(modelBuffer.buffer, {
                executionProviders: ['webgpu']
            });

            self.postMessage({ type: 'MODEL_READY' });

        } catch (error) {
            self.postMessage({ type: 'ERROR', payload: { message: error.message } });
        }
    }

    if (type === 'RUN_INFERENCE') {
        if (!session) {
            self.postMessage({ type: 'ERROR', payload: { message: 'Model not loaded yet.' } });
            return;
        }

        try {
            // Setup execution inputs (Adapting to your model's specific input names/shapes)
            const inputFeeds = {};
            for (const [key, val] of Object.entries(payload.inputs)) {
                inputFeeds[key] = new ort.Tensor(val.type, val.data, val.dims);
            }

            // Run math execution block directly over WebGPU
            const outputResults = await session.run(inputFeeds);
            
            // Format results safely for postMessage transfer
            const serializedOutputs = {};
            for (const [key, tensor] of Object.entries(outputResults)) {
                serializedOutputs[key] = {
                    data: Array.from(tensor.data),
                    dims: tensor.dims
                };
            }

            self.postMessage({ type: 'INFERENCE_COMPLETE', payload: { outputs: serializedOutputs } });

        } catch (error) {
            self.postMessage({ type: 'ERROR', payload: { message: error.message } });
        }
    }
};

