

globalThis.document = {
    baseURI: 'http://localhost:4000/'
}



import { Wllama } from './index.min.js';
const wllamaWasm = 'llm-workers/wllama/wllama.wasm';


import { putRecord, getRecord, DB_STORE_NAME } from '../../local.js'; // still relative for now
import { installDatabaseIfNeeded, getGGUFModel, fetchWithFallbackChain } from '../downloader.js'; // still relative for now

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
    const { type, payload } = e.data;

    if (type === 'LOAD_MODEL') {
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
                nPredict: parseInt(payload.maxTokens) || 128,
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