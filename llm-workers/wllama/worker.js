

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

        let loraArrayBuffer
        try {

            const loraModelPath = getGGUFModel(payload.loraUrl)
            loraArrayBuffer = (await getRecord(DB_STORE_NAME, loraModelPath, GGUF_DATABASE))?.contents;
            if (!loraArrayBuffer) {
                loraArrayBuffer = await fetchWithFallbackChain(payload.loraUrl, 'GGUF');
                putRecord(DB_STORE_NAME, {
                    path: loraModelPath,
                    timestamp: new Date(),
                    mode: FS_FILE,
                    contents: new Uint8Array(loraArrayBuffer),
                    parent: loraModelPath.substring(0, loraModelPath.lastIndexOf('/')) || '/'
                }, GGUF_DATABASE)
            }

            console.warn('Lora Detected: ' + loraModelPath)
        } catch (e) {
            console.error(e)
        }


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

            const loraBlob = loraArrayBuffer ? new Blob([loraArrayBuffer], { type: 'application/octet-stream' }) : void 0;


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
                        scale: 1.4, // You can dial the strength of this specific training set up or down!
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
                { role: 'system', content: '' },
                { role: 'user', content: promptText }
            ];

            // Consolidated Template Selection
            /*
            let rawJinjaTemplate = payload.chatTemplate || wllama.model?.metadata?.['tokenizer.chat_template'] || null;
            let formattedPrompt = "";

            console.log("ℹ️ [DEBUG] Starting Inference Setup...");
            console.log("ℹ️ [DEBUG] Active Messages:", JSON.stringify(messages));
            console.log("ℹ️ [DEBUG] Chat Template Source:", payload.chatTemplate ? "Payload LoRA" : (wllama.model?.metadata?.['tokenizer.chat_template'] ? "GGUF Metadata" : "None"));

            if (rawJinjaTemplate) {
                try {
                    formattedPrompt = wllama.utils.template(rawJinjaTemplate, {
                        messages: messages,
                        add_generation_prompt: true
                    });
                    console.log("✅ [DEBUG] Successfully compiled Jinja template.");
                } catch (templateErr) {
                    console.error("❌ [DEBUG] Failed to compile Jinja template, using structural fallback:", templateErr);
                    formattedPrompt = messages.map(m => `<|im_start|>${m.role}\n${m.content}<|im_end|>`).join('\n') + '\n<|im_start|>assistant\n';
                }
            } else {
                console.warn("⚠️ [DEBUG] No template found anywhere. Defaulting to raw ChatML syntax fallback layout.");
                formattedPrompt = messages.map(m => `<|im_start|>${m.role}\n${m.content}<|im_end|>`).join('\n') + '\n<|im_start|>assistant\n';
            }

            console.log("🔍 [DEBUG] Evaluated Prompt Structure being fed to model:\n", formattedPrompt);\
            */
            if (payload.chatTemplate) {
                console.log("✏️ [DEBUG] Overriding default model template with custom payload template.");
                wllama.chatTemplate = payload.chatTemplate;
            } else if (wllama.model?.metadata?.['tokenizer.chat_template']) {
                console.log("✏️ [DEBUG] Defaulting to internal GGUF file metadata template configuration.");
                wllama.chatTemplate = wllama.model.metadata['tokenizer.chat_template'];
            }

            // Run completion with explicit stop parameters to prevent infinite looping strings
            const completion = await wllama.createCompletion({
                //prompt: formattedPrompt,
                messages: messages,
                nPredict: parseInt(payload.maxTokens) || 1000,
                temperature: 0.1,
                //grammar: payload.gbnfGrammar || undefined,
                jinja: true,
                stream: true,
                // 👉 FIX: Force stop matching Qwen ChatML formatting paradigms
                stop: ["<|im_end|>", "<|endoftext|>", "assistant:", "user:"],
                onData: (chunk) => {
                    const tokenText = chunk.choices[0]?.delta?.content || chunk.choices[0]?.text || "";
                    if (tokenText) {
                        self.postMessage({
                            type: 'TOKEN_STREAM',
                            payload: {
                                delta: tokenText,
                                tokenId: chunk.choices[0]?.index
                            }
                        });
                    }
                }
            });

            console.log("✅ [DEBUG] Model generation phase finalized smoothly.");
            self.postMessage({ type: 'GENERATION_COMPLETE' });
        } catch (err) {
            console.error("❌ [DEBUG] Fatal error caught inside Worker inference pipeline:", err);
            self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || '') } });
        }
    }
};



self.postMessage({ type: 'WORKER_READY' });

