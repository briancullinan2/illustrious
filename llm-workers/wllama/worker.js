

globalThis.document = {
    baseURI: 'http://localhost:4000/'
}



const wllamaWasm = 'llm-workers/wllama/wllama.wasm';


let putRecord, getRecord, DB_STORE_NAME, Wllama


async function initWLLaMa() {
    const WllamaLoaded = await import('./index.min.js');
    Wllama = WllamaLoaded.Wllama
}

async function initLocalStorage() {
    try {
        // Attempt to dynamically import the downloader file
        const downloaderModule = await import('../../local.js');

        // If it exported properties natively, unpack them
        if (downloaderModule && Object.keys(downloaderModule).length > 0) {
            ({ putRecord, getRecord, DB_STORE_NAME } = downloaderModule);
        }
        // Fallback: If it executed as a classic script and bound to the global namespace
        else if (typeof self !== 'undefined' && self) {
            ({ putRecord, getRecord, DB_STORE_NAME } = self);
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


let installDatabaseIfNeeded, getGGUFModel, fetchWithFallbackChain;


async function initDownloader() {
    try {
        // Attempt to dynamically import the downloader file
        const downloaderModule = await import('../downloader.js');

        // If it exported properties natively, unpack them
        if (downloaderModule && Object.keys(downloaderModule).length > 0) {
            ({ installDatabaseIfNeeded, getGGUFModel, fetchWithFallbackChain } = downloaderModule);
        }
        // Fallback: If it executed as a classic script and bound to the global namespace
        else if (typeof self !== 'undefined' && self) {
            ({ installDatabaseIfNeeded, getGGUFModel, fetchWithFallbackChain } = self);
        } else {
            throw new Error("Downloader script loaded, but no valid exports or global namespaces were found.");
        }
    } catch (error) {
        console.error("Failed to dynamically initialize multimodal downloader dependencies:", error);
        throw error;
    }
}

// Execute the async bootstrap chain before running your dependent logic
await initDownloader();

//https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-q8_0.gguf
//https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF/resolve/main/smollm2-360m-instruct-q8_0.gguf?download=true

const GGUF_DATABASE = 'gguf'

const ST_FILE = 8;
const ST_DIR = 4;
const FS_DEFAULT = (6 << 3) + (6 << 6) + (6);
const FS_FILE = (ST_FILE << 12) + FS_DEFAULT;
const FS_DIR = (ST_DIR << 12) + FS_DEFAULT;

let wllama;


self.onmessage = async (e) => {
    const { type, payload, baseURI } = e.data;

    if (type === 'LOAD_MODEL') {

        globalThis.document.baseURI = baseURI
        await initWLLaMa()

        try {
            await installDatabaseIfNeeded(GGUF_DATABASE);

            const ggufModelPath = getGGUFModel(payload.modelUrl); // define this helper if needed
            let myCachedArrayBuffer = (await getRecord(DB_STORE_NAME, ggufModelPath, GGUF_DATABASE))?.contents;

            if (!myCachedArrayBuffer) {
                myCachedArrayBuffer = await fetchWithFallbackChain(payload.modelUrl, 'GGUF');
                putRecord(DB_STORE_NAME, {
                    path: ggufModelPath,
                    timestamp: new Date(),
                    mode: FS_FILE,
                    contents: new Uint8Array(myCachedArrayBuffer),
                    parent: ggufModelPath.substring(0, ggufModelPath.lastIndexOf('/')) || '/'
                }, GGUF_DATABASE)
            }

            const modelBlob = new Blob([myCachedArrayBuffer], { type: 'application/octet-stream' });

            //const loraBuffer = (await getRecord(DB_STORE_NAME, payload.loraUrl, GGUF_DATABASE))?.contents;
            //const loraBlob = new Blob([loraBuffer], { type: 'application/octet-stream' });

            /*
            git clone https://github.com/ggerganov/llama.cpp.git
            cd llama.cpp
            pip install -r requirements/requirements-convert-lora.txt
            python convert-lora-to-gguf.py /path/to/your/OUTPUT_DIR --outfile /path/to/your/output_folder/my_adapter.gguf
            */


            /*
            python export-lora.py \
              --model-base /path/to/your/base_model.gguf \
              --lora /path/to/your/my_adapter.gguf \
              --outfile /path/to/your/final_merged_model.gguf
            */


            if (!wllama) {
                wllama = new Wllama(
                    {
                        // Tell the main path compiler where the base WASM asset is located
                        default: wllamaWasm,
                    },
                    {
                        // 👉 CRITICAL FIX: Stop Wllama from trying to auto-discover paths using `document`
                        suppressInitialDownload: true,

                        // Explicitly provide the pre-resolved asset strings for its internal threads
                        workerResources: {
                            // Wllama uses its own code file to spawn its backend math sub-workers
                            wllamaWorkerUrl: '/llm-workers/wllama/index.min.js',
                            wasmSingleUrl: wllamaWasm,
                            wasmMultiUrl: wllamaWasm,
                        }
                    }
                );
            }

            await wllama.loadModel([
                modelBlob
            ], {
                n_ctx: 2048,
                n_threads: 4,
                lora: typeof loraBlob !== 'undefined' ? [
                    {
                        data: loraBlob,
                        scale: 1.0, // You can dial the strength of this specific training set up or down!
                    }
                ] : void 0
            });

            self.postMessage({ type: 'MODEL_READY' });
        } catch (err) {
            console.error(err);
            self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || err.stacktrace) } });
        }
    }

    if (type === 'RUN_INFERENCE') {
        if (!wllama) {
            self.postMessage({ type: 'ERROR', payload: { message: 'Model not loaded' } });
            return;
        }
        try {
            const promptText = payload.input_text || payload.prompt || "";

            const messages = [
                { role: 'system', content: 'You are a concise assistant inside a game canvas engine.' },
                { role: 'user', content: payload.input_text }
            ];

            // 👉 Wllama v3 flat configuration signature
            const completion = await wllama.createCompletion({
                //prompt: payload.input_text,
                messages: messages,
                nPredict: parseInt(payload.maxTokens) || 1000,
                temperature: 0.0,
                grammar: payload.gbnfGrammar || undefined, // Ensure it is undefined if empty
                stream: true,
                onData: (chunk) => {
                    // chunk follows the standard OpenAI chunk formatting dictionary 
                    const tokenText = chunk.choices[0]?.delta?.content || chunk.choices[0]?.text || "";

                    if (tokenText) {
                        self.postMessage({
                            type: 'TOKEN_STREAM',
                            payload: {
                                delta: tokenText,
                                tokenId: chunk.choices[0]?.index // Handled automatically by tokenText resolution
                            }
                        });
                    }
                }
            });

            self.postMessage({ type: 'GENERATION_COMPLETE' });
            //self.postMessage({ type: 'TOKEN_STREAM', payload: { delta: completion } });
        } catch (err) {
            self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.style || err.stack || '') } });
        }
    }
};



self.postMessage({ type: 'WORKER_READY' });

