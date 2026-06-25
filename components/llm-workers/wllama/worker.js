

globalThis.document = {
    baseURI: 'http://localhost:4000/'
}



const wllamaWasm = 'components/llm-workers/wllama/wllama.wasm';


async function initWLLaMa() {
    const WllamaLoaded = await import('./index.min.js');
    Wllama = WllamaLoaded.Wllama
}

let putRecord, getRecord, DB_STORE_NAME, Wllama


async function initLocalStorage() {
    try {
        // Attempt to dynamically import the downloader file
        const downloaderModule = await import('../../core/local.js');

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


async function initModel(payload) {

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


    let mmprojBlob = null;
    if (payload.mmprojUrl) {
        try {
            const mmprojPath = getGGUFModel(payload.mmprojUrl);
            let mmprojArrayBuffer = (await getRecord(DB_STORE_NAME, mmprojPath, GGUF_DATABASE))?.contents;
            if (!mmprojArrayBuffer) {
                mmprojArrayBuffer = await fetchWithFallbackChain(payload.mmprojUrl, 'GGUF');
                putRecord(DB_STORE_NAME, {
                    path: mmprojPath,
                    timestamp: new Date(),
                    mode: FS_FILE,
                    contents: new Uint8Array(mmprojArrayBuffer),
                    parent: mmprojPath.substring(0, mmprojPath.lastIndexOf('/')) || '/'
                }, GGUF_DATABASE);
            }
            mmprojBlob = new Blob([mmprojArrayBuffer], { type: 'application/octet-stream' });
            console.warn('Vision Projector Layer Loaded: ' + mmprojPath);
        } catch (err) {
            console.error("Failed to load vision projector layer asset:", err);
        }
    }



    try {

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
                        wllamaWorkerUrl: '/components/llm-workers/wllama/index.min.js',
                        wasmSingleUrl: wllamaWasm,
                        wasmMultiUrl: wllamaWasm,
                    }
                }
            );
        }

        const filesToLoad = [modelBlob];
        if (mmprojBlob) {
            filesToLoad.push(mmprojBlob);
        }



        await wllama.loadModel(filesToLoad, {
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



async function runInference(payload) {
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

        const formattedPrompt = applySimpleChatTemplate(messages, payload.chatTemplate);
        const completion = await wllama.createCompletion({
            prompt: formattedPrompt,

            //const completion = await wllama.createChatCompletion({
            //    messages: messages,
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




self.onmessage = async (e) => {
    const { type, payload, baseURI } = e.data;

    if (type === 'LOAD_MODEL') {

        globalThis.document.baseURI = baseURI
        await initWLLaMa()
        await installDatabaseIfNeeded(GGUF_DATABASE);
        await initModel(payload)
    }

    if (type === 'RUN_INFERENCE') {
        await runInference(payload)
    }


    // Add this branch alongside your 'LOAD_MODEL' and 'RUN_INFERENCE' conditionals
    else if (type === 'UNLOAD_MODEL') {
        try {
            await terminateModel()
            self.postMessage({ type: 'UNLOAD_COMPLETE' });
        } catch (err) {
            console.error("Error encountered during forced worker cleanup sequence:", err);
            self.postMessage({ type: 'ERROR', payload: { message: 'Cleanup failed: ' + err.message } });
        }
        return; // Fast exit
    }


};




async function terminateModel() {
    if (wllama) {
        console.warn('⚠️ Shutting down active Wllama instance and sub-workers...');

        // 1. Internal Wllama teardown routine to kill backend threads and free memory
        if (typeof wllama.exit === 'function') {
            await wllama.exit();
        }

        // 2. Break references for garbage collection
        wllama = null;
    }

    // 3. Clear transient local buffers if needed
    Wllama = null;


}





function applySimpleChatTemplate(messages, customTemplate = null) {
    // If no template is provided, cleanly fall back to structural defaults
    if (!customTemplate) {
        return messages.map(m => {
            return `<|im_start|>${m.role}\n${m.content}<|im_end|>`;
        }).join('\n') + '\n<|im_start|>assistant\n';
    }

    let output = '';
    const lines = customTemplate.split('\n');

    // Split the template into token sections to handle control blocks
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();

        // 1. 👉 HANDLE MESSAGES LOOP
        if (line.startsWith('{%- for message in messages %}')) {
            i++; // move past loop head
            let loopLines = [];

            // Gather all rules up to the loop end tag
            while (i < lines.length && !lines[i].trim().startsWith('{%- endfor %}')) {
                loopLines.push(lines[i]);
                i++;
            }

            // Execute the gathered loop block for every message passed
            for (const msg of messages) {
                let loopIndex = 0;
                let skipElse = false;

                while (loopIndex < loopLines.length) {
                    const innerLine = loopLines[loopIndex].trim();

                    // Check role conditional markers
                    if (innerLine.startsWith('{%- if message.role ==')) {
                        const targetRole = innerLine.match(/'([^']+)'/)?.[1] || "";
                        if (msg.role === targetRole) {
                            skipElse = true;
                            loopIndex++;
                            // Process inside IF block until else or endif bounds
                            while (loopIndex < loopLines.length) {
                                const activeLine = loopLines[loopIndex].trim();
                                if (activeLine.startsWith('{%- else %}') || activeLine.startsWith('{%- endif %}')) break;
                                output += parseJinjaExpression(activeLine, msg);
                                loopIndex++;
                            }
                        } else {
                            // Skip past the IF block directly to the else segment
                            while (loopIndex < loopLines.length && !loopLines[loopIndex].trim().startsWith('{%- else %}')) {
                                loopIndex++;
                            }
                        }
                    } else if (innerLine.startsWith('{%- else %}')) {
                        loopIndex++;
                        if (!skipElse) {
                            while (loopIndex < loopLines.length && !loopLines[loopIndex].trim().startsWith('{%- endif %}')) {
                                output += parseJinjaExpression(loopLines[loopIndex].trim(), msg);
                                loopIndex++;
                            }
                        }
                    } else if (innerLine.startsWith('{%- endif %}')) {
                        loopIndex++;
                    } else {
                        output += parseJinjaExpression(innerLine, msg);
                        loopIndex++;
                    }
                }
            }
        }
        // 2. 👉 HANDLE GENERATION PROMPT END TRAIL
        else if (line.startsWith('{%- if add_generation_prompt %}')) {
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('{%- endif %}')) {
                output += parseJinjaExpression(lines[i].trim());
                i++;
            }
        }
        // 3. Fallback tracking for lines outside formal block control declarations
        else {
            if (line !== '' && !line.startsWith('{%-')) {
                output += parseJinjaExpression(line);
            }
        }
        i++;
    }

    return output;
}

// Helper routine to strip expression indicators and resolve strings/variables safely
function parseJinjaExpression(exprLine, messageContext = null) {
    if (!exprLine.includes('{{-')) return '';

    // Extract everything between {{- and }}
    let rawContent = exprLine.match(/\{\{-\s*(.*?)\s*\}\}/)?.[1];
    if (!rawContent) return '';

    let evaluatedStr = '';

    // Split compound lines by plus token connectors safely
    const tokens = rawContent.split('+').map(t => t.trim());

    for (const token of tokens) {
        if (token.startsWith("'") && token.endsWith("'")) {
            // Unescape structural newline codes inside the literal tokens safely
            evaluatedStr += token.slice(1, -1).replace(/\\n/g, '\n');
        } else if (token === 'message.role' && messageContext) {
            evaluatedStr += messageContext.role;
        } else if (token === 'message.content' && messageContext) {
            // Append the actual dynamic prompt content array safely here
            evaluatedStr += messageContext.content;
        }
    }

    return evaluatedStr;
}


self.postMessage({ type: 'WORKER_READY' });

