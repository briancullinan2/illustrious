

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

            await wllama.loadModel([modelBlob], {
                n_ctx: 2048,
                n_threads: 4,
                jinja: true,                    // ← Enable Jinja parsing
                chat_template: payload.chatTemplate || undefined,  // custom override
                lora: loraBlob ? [{ data: loraBlob, scale: 1.4 }] : undefined,
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
                { role: 'system', content: payload.systemPrompt || '' },
                { role: 'user', content: promptText }
            ];

            if (payload.chatTemplate) {
                console.log("✏️ [DEBUG] Overriding default model template with custom payload template.");
                wllama.chatTemplate = payload.chatTemplate;
            } else if (wllama.model?.metadata?.['tokenizer.chat_template']) {
                console.log("✏️ [DEBUG] Defaulting to internal GGUF file metadata template configuration.");
                wllama.chatTemplate = wllama.model.metadata['tokenizer.chat_template'];
            }

            //const formattedPrompt = applySimpleChatTemplate(messages, payload.chatTemplate);
            //const completion = await wllama.createCompletion({
            //    prompt: formattedPrompt,

            const completion = await wllama.createChatCompletion({
                messages: messages,
                max_tokens: parseInt(payload.maxTokens) || 1000,
                temperature: 0.1,
                stream: true,
                jinja: true,                    // ← Important
                // chat_template: payload.chatTemplate || undefined,  // override if needed (string)
                // chat_template_kwargs: { add_generation_prompt: true }, // if your template needs extra vars
                grammar: payload.gbnfGrammar || undefined,   // should work alongside jinja
                stop: ["<|im_end|>", "<|endoftext|>", "<|eot_id|>", "assistant:", "user:"],

                onData: (chunk) => {   // or however the stream callback works in your version
                    const tokenText = chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.text || "";
                    if (tokenText) {
                        self.postMessage({
                            type: 'TOKEN_STREAM',
                            payload: { delta: tokenText }
                        });
                    }
                }
            });

            self.postMessage({ type: 'GENERATION_COMPLETE' });
        } catch (err) {
            console.error(err);
            self.postMessage({ type: 'ERROR', payload: { message: err.message + '\n' + (err.stack || '') } });
        }
    }
};

function applySimpleChatTemplate(messages, customTemplate = null) {
    if (customTemplate) {
        // Very basic Jinja-like replacement (expand as needed)
        let prompt = customTemplate;
        // Replace common variables
        prompt = prompt.replace(/\{\{\s*add_generation_prompt\s*\}\}/g, 'true');
        // You can add more sophisticated replacement here
        return prompt; // or implement a tiny Jinja subset
    }

    // Default ChatML-style fallback (works for many models)
    return messages.map(m => {
        if (m.role === 'system') return `<|im_start|>system\n${m.content}<|im_end|>`;
        if (m.role === 'user') return `<|im_start|>user\n${m.content}<|im_end|>`;
        if (m.role === 'assistant') return `<|im_start|>assistant\n${m.content}<|im_end|>`;
        return '';
    }).join('\n') + '\n<|im_start|>assistant\n';
}

self.postMessage({ type: 'WORKER_READY' });

