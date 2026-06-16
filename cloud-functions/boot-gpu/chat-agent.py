import io
import os
import time
import threading
import json  
import torch
import platform
from fastapi import FastAPI, Form
from fastapi.responses import HTMLResponse
from fastapi.responses import StreamingResponse
from transformers import (
    AutoModelForCausalLM, 
    AutoTokenizer, 
    TextIteratorStreamer,
    BitsAndBytesConfig
)
from peft import PeftModel
from pathlib import Path

# Try importing llama_cpp dynamically to keep the script resilient if not yet installed
try:
    from llama_cpp import Llama
except ImportError:
    Llama = None

app = FastAPI(title="Illustrious Hybrid Llama/GGUF Worker")

# ⏱️ Idle Autoclose Configuration
IDLE_TIMEOUT_SECONDS = 600  
last_activity_time = time.time()

# Global Context State Containers
model = None
tokenizer = None
gguf_engine = None  # ⚙️ Independent layout context for loaded GGUF engine instances

base_model_path = "meta-llama/Meta-Llama-3-8B-Instruct"  
lora_adapter_path = "loras/code_classifier_lora" 

CREDENTIALS_FILE = Path("~/.credentials/huggingface-provider.json").expanduser()

def load_stored_hf_token():
    """Reads the local token value out of user home path structures safely."""
    if CREDENTIALS_FILE.exists():
        try:
            with open(CREDENTIALS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("ACCESS_TOKEN", "").strip()
        except Exception as e:
            print(f"⚠️ Failed reading credentials layout file: {e}")
    return ""

# Initialize global script token profile baseline configuration
HF_TOKEN = load_stored_hf_token()


def get_gguf_context(model_path):
    """Initializes and returns a hardware-accelerated local GGUF execution engine."""
    global gguf_engine
    if Llama is None:
        raise ImportError("The 'llama-cpp-python' library is missing. Install it to process GGUF formats.")
        
    if gguf_engine is None:
        print(f"📦 Intercepting GGUF Pipeline Engine initialization: {model_path}...")
        
        # Determine GPU layer offloading profiles depending on available hardware
        gpu_layers = 0
        if torch.cuda.is_available():
            gpu_layers = -1  # Offload ALL model layers straight into NVIDIA VRAM
            print("🎛️ CUDA available. Offloading full GGUF layer stack directly into VRAM allocation slots.")
        elif platform.system() == "Darwin":
            gpu_layers = -1  # Offload everything directly into Apple Silicon Unified Memory
            print("🍏 Metal available. Offloading full GGUF stack straight to Apple Silicon.")
            
        # Initialize the underlying binary layout matrix
        gguf_engine = Llama(
            model_path=model_path,
            n_ctx=2048,        # Total context window allocation parameters
            n_gpu_layers=gpu_layers,
            verbose=False      # Suppresses messy internal C++ print loops
        )
    return gguf_engine


def get_llm_context(hf_token=None, model_path=base_model_path):
    global model, tokenizer
    
    if not model_path:
        model_path = base_model_path
        
    if model is None or tokenizer is None:
        current_os = platform.system()
        print(f"⚡ Initializing Tokenizer and Base Model Context: {model_path}...")
        
        tokenizer = AutoTokenizer.from_pretrained(
            model_path, 
            token=hf_token
        )
        
        quantization_config = None
        if current_os == "Linux" and torch.cuda.is_available():
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4"
            )

        if current_os == "Darwin":
            print("🍏 Binding context to Apple Silicon MPS...")
            model = AutoModelForCausalLM.from_pretrained(
                model_path,
                torch_dtype=torch.float16,
                device_map="auto",
                token=hf_token
            )
        elif current_os in ["Linux", "Windows"]:
            if torch.cuda.is_available():
                print(f"🎛️ Context bound to {current_os}. Activating native NVIDIA CUDA pipeline...")
                model = AutoModelForCausalLM.from_pretrained(
                    model_path,
                    quantization_config=quantization_config,
                    device_map="auto",
                    token=hf_token
                )
            else:
                print(f"🚨 {current_os} CUDA Unavailable! Dropping down to Host CPU core backup processing...")
                model = AutoModelForCausalLM.from_pretrained(
                    model_path,
                    torch_dtype=torch.float32,  
                    device_map="cpu",           
                    token=hf_token
                )
        else:
            raise NotImplementedError(f"Operating system environment '{current_os}' not supported.")

        if os.path.exists(lora_adapter_path):
            print(f"🧬 Injecting active low-rank adaptation matrix from: {lora_adapter_path}")
            model = PeftModel.from_pretrained(model, lora_adapter_path, adapter_name="code_classifier")
            print("🎯 LoRA layers successfully merged into active attention pathways.")
        else:
            print("⚠️ No LoRA adapter directory discovered. Processing via base model layers only.")

    return model, tokenizer

def record_activity():
    """Resets the idle clock whenever an active endpoint sequence is pinged."""
    global last_activity_time
    last_activity_time = time.time()

def idle_monitor_loop():
    """Background daemon thread that terminates the host context on silent timeouts."""
    print(f"⏰ Hybrid Idle monitor activated. Timeout baseline set to {IDLE_TIMEOUT_SECONDS}s.")
    while True:
        time.sleep(30)
        idle_duration = time.time() - last_activity_time
        if idle_duration > IDLE_TIMEOUT_SECONDS:
            print(f"🛑 Engine idle for {int(idle_duration)}s. Initiating cloud platform shutdown...")
            os.system("sudo shutdown -h now")

threading.Thread(target=idle_monitor_loop, daemon=True).start()


@app.post("/api/spatial/multicast")
async def generate_text_stream(
    prompt: str = Form(...),
    use_lora: bool = Form(True),
    hf_token: str = Form(""),
    model_path: str = Form(...)
):
    record_activity()  
    
    # 🔍 Check if the selected item path targets a local GGUF file model blueprint
    is_gguf = model_path.endswith(".gguf") or "gguf" in model_path.lower()

    if is_gguf:
        # 🚀 ------------------------------------------------------------------
        # ENGINE ALPHA: GGUF Stream Engine Processing Block
        # 🚀 ------------------------------------------------------------------
        engine = get_gguf_context(model_path)
        
        # Map our payload template into standard conversational array schemas
        formatted_prompt = f"<|system|>\nYou are a precise system architecture assistant.<|user|>\n{prompt}<|assistant|>\n"
        
        def gguf_stream_generator():
            # Trigger llama-cpp non-blocking generator pass loops
            response_chunks = engine(
                prompt=formatted_prompt,
                max_tokens=64,
                temperature=0.1,
                top_p=0.9,
                stream=True
            )
            for chunk in response_chunks:
                text_piece = chunk["choices"][0]["text"]
                if text_piece:
                    yield text_piece

        return StreamingResponse(gguf_stream_generator(), media_type="text/plain")

    else:
        # 🧬 ------------------------------------------------------------------
        # ENGINE BETA: HF Transformers Pipeline Execution Block
        # 🧬 ------------------------------------------------------------------
        active_token = hf_token.strip() if hf_token else ""
        if not active_token:
            active_token = HF_TOKEN  
            
        if not active_token:
            active_token = None

        active_model, active_tokenizer = get_llm_context(active_token, model_path)

        if isinstance(active_model, PeftModel):
            if use_lora:
                active_model.set_adapter("code_classifier")
            else:
                active_model.disable_adapter()

        messages = [
            {"role": "system", "content": "You are a precise, token-efficient system architecture assistant."},
            {"role": "user", "content": prompt}
        ]
        
        input_ids = active_tokenizer.apply_chat_template(
            messages, 
            add_generation_prompt=True, 
            return_tensors="pt"
        ).to(active_model.device)

        streamer = TextIteratorStreamer(active_tokenizer, skip_prompt=True, skip_special_tokens=True)

        generation_kwargs = dict(
            input_ids=input_ids,
            streamer=streamer,
            max_new_tokens=64, 
            temperature=0.1,   
            top_p=0.9
        )

        thread = threading.Thread(target=active_model.generate, kwargs=generation_kwargs)
        thread.start()

        def transformers_stream_generator():
            for token_text in streamer:
                yield token_text

        return StreamingResponse(transformers_stream_generator(), media_type="text/plain")


@app.get("/api/health")
def health_check():
    return {
        "status": "READY",
        "architecture": "transformers/llama_cpp_dual_engine",
        "gpu_available": torch.cuda.is_available()
    }


@app.get("/", response_class=HTMLResponse)
def serve_test_interface():
    record_activity()  
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Illustrious Token Engine Playground</title>
        <style>
            body { background: #101014; color: #f0f0f5; font-family: monospace; padding: 40px; max-width: 700px; margin: 0 auto; }
            h1 { color: #00ffcc; font-size: 20px; border-bottom: 1px solid #2e2e3f; padding-bottom: 10px; }
            label { display: block; margin: 20px 0 6px; font-weight: bold; color: #a0a0b5; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            textarea { width: 100%; height: 120px; background: #16161e; border: 1px solid #2e2e3f; border-radius: 6px; color: #fff; padding: 12px; font-family: monospace; resize: none; box-sizing: border-box; }
            textarea:focus, select:focus, input[type="password"]:focus { outline: none; border-color: #00ffcc; }
            select, input[type="password"] { width: 100%; background: #16161e; border: 1px solid #2e2e3f; border-radius: 6px; color: #fff; padding: 12px; font-family: monospace; box-sizing: border-box; font-size: 13px; }
            .option-row { margin: 15px 0; display: flex; align-items: center; gap: 8px; }
            button { background: #00ffcc; color: #000; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: monospace; width: 100%; margin-top: 15px; }
            button:hover { background: #00ddb0; }
            #output-panel { margin-top: 25px; background: #0d0d11; border: 1px solid #2e2e3f; border-radius: 6px; padding: 20px; min-height: 60px; white-space: pre-wrap; color: #33ff33; }
        </style>
    </head>
    <body>
        <h1>🌌 Illustrious Multi-Engine Workspace Gateway</h1>
        
        <label>Hugging Face User Access Token (HF_TOKEN):</label>
        <input type="password" id="hf-token" placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" autocomplete="off" />

        <label>Target Core Engine Model Base:</label>
        <select id="model-select">
            <optgroup label="General Chat Infrastructure (Transformers)">
                <option value="meta-llama/Meta-Llama-3-8B-Instruct">Meta Llama 3 8B Instruct</option>
                <option value="google/gemma-2-9b-it">Google Gemma 2 9B IT</option>
                <option value="mistralai/Mistral-7B-Instruct-v0.3">Mistral 7B Instruct v0.3</option>
            </optgroup>
            <optgroup label="Code Specialized Architecture (Transformers)">
                <option value="Qwen/Qwen2.5-Coder-7B-Instruct">Qwen 2.5 Coder 7B Instruct</option>
                <option value="mistralai/Codestral-22B-v0.1">Mistral Codestral 22B</option>
            </optgroup>
            <optgroup label="Local Optimized Micro-Kernels (GGUF)">
                <option value="C:\\models\\llama-3-8b-instruct.Q4_K_M.gguf">Local Q4 Llama-3 (.gguf Path)</option>
                <option value="C:\\models\\qwen2.5-coder-7b.Q5_K_M.gguf">Local Q5 Qwen Coder (.gguf Path)</option>
            </optgroup>
        </select>

        <label>Input Code Payload or Prompt Text:</label>
        <textarea id="prompt-payload" placeholder="Paste your code file snippet or instruction here..."></textarea>
        
        <div class="option-row">
            <input type="checkbox" id="toggle-lora" checked>
            <label for="toggle-lora" style="margin: 0; display: inline;">Activate Low-Rank Adaptation Classifier Matrices (use_lora)</label>
        </div>
        
        <button id="trigger-inference">Dispatch Text Stream Sequence</button>
        
        <label>Active Output Stream Terminal:</label>
        <div id="output-panel">Waiting for stream transaction initialization...</div>

        <script>
            document.getElementById('trigger-inference').addEventListener('click', async () => {
                const prompt = document.getElementById('prompt-payload').value;
                const useLora = document.getElementById('toggle-lora').checked;
                const hfToken = document.getElementById('hf-token').value;
                const modelPath = document.getElementById('model-select').value;
                const outputPanel = document.getElementById('output-panel');
                
                outputPanel.innerText = "Connecting to pipeline...";
                
                const formData = new FormData();
                formData.append('prompt', prompt);
                formData.append('use_lora', useLora);
                formData.append('hf_token', hfToken);
                formData.append('model_path', modelPath);
                
                try {
                    const response = await fetch('/api/spatial/multicast', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        outputPanel.innerText = `Execution Rejected: HTTP ${response.status}`;
                        return;
                    }
                    
                    outputPanel.innerText = "";
                    
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        outputPanel.innerText += decoder.decode(value, { stream: true });
                    }
                } catch (err) {
                    outputPanel.innerText = `Pipeline Network Exception: ${err.message}`;
                }
            });
        </script>
    </body>
    </html>
    """


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("cloud-functions.boot-gpu.chat-agent:app", host="0.0.0.0", port=8000, reload=True)