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
from huggingface_hub import hf_hub_download, HfApi

try:
    from llama_cpp import Llama
except ImportError:
    Llama = None

app = FastAPI(title="Illustrious Hybrid Llama/GGUF Worker")

IDLE_TIMEOUT_SECONDS = 600  
last_activity_time = time.time()

model = None
tokenizer = None
gguf_engine = None  

base_model_path = "meta-llama/Meta-Llama-3-8B-Instruct"  
lora_adapter_path = "/mnt/vault/loras/code_classifier_lora" 
HF_CACHE_DIR = "hf_cache"

CREDENTIALS_FILE = Path("~/.credentials/huggingface-provider.json").expanduser()

def load_stored_hf_token():
    if CREDENTIALS_FILE.exists():
        try:
            with open(CREDENTIALS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("ACCESS_TOKEN", "").strip()
        except Exception as e:
            print(f"⚠️ Failed reading credentials layout file: {e}")
    return ""

HF_TOKEN = load_stored_hf_token()


def get_gguf_context(model_id_or_path, hf_token=None):
    global gguf_engine
    if Llama is None:
        raise ImportError("The 'llama-cpp-python' library is missing. Install it to process GGUF formats.")
        
    # Standardize separator structures from frontend payloads
    model_id_or_path = model_id_or_path.replace("__", "/")
    
    if gguf_engine is not None:
        # If model is already loaded, drop out cleanly
        return gguf_engine

    resolved_path = model_id_or_path
    
    if "/" in model_id_or_path and not os.path.exists(model_id_or_path):
        try:
            print(f"📡 Resolving GGUF target file from Hugging Face Hub: {model_id_or_path}...")
            os.makedirs(HF_CACHE_DIR, exist_ok=True)
            
            parts = model_id_or_path.split("/")
            repo_id = f"{parts[0]}/{parts[1]}"
            filename = parts[2]
            
            resolved_path = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                cache_dir=HF_CACHE_DIR,
                token=hf_token
            )
            print(f"📦 Binary mapped successfully: {resolved_path}")
        except Exception as e:
            print(f"❌ Failed downloading GGUF binary from Hub: {e}")
            raise FileNotFoundError(f"Could not locate model target string: {model_id_or_path}")

    print(f"📦 Intercepting GGUF Pipeline Engine initialization: {resolved_path}...")
    
    gpu_layers = 0
    if torch.cuda.is_available():
        gpu_layers = -1  
        print("🎛️ CUDA available. Offloading full GGUF layer stack directly into VRAM.")
    elif platform.system() == "Darwin":
        gpu_layers = -1  
        print("🍏 Metal available. Offloading full GGUF stack to Apple Silicon.")
        
    gguf_engine = Llama(
        model_path=resolved_path,
        n_ctx=2048,        
        n_gpu_layers=gpu_layers,
        verbose=False      
    )
    return gguf_engine


def get_llm_context(model_path=base_model_path, hf_token=None):
    global model, tokenizer
    if not model_path:
        model_path = base_model_path
        
    if model is None or tokenizer is None:
        current_os = platform.system()
        print(f"⚡ Initializing Tokenizer and Base Model Context: {model_path}...")
        
        tokenizer = AutoTokenizer.from_pretrained(model_path, token=hf_token)
        
        quantization_config = None
        if current_os == "Linux" and torch.cuda.is_available():
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4"
            )

        if current_os == "Darwin":
            model = AutoModelForCausalLM.from_pretrained(
                model_path, torch_dtype=torch.float16, device_map="auto", token=hf_token
            )
        elif current_os in ["Linux", "Windows"]:
            if torch.cuda.is_available():
                model = AutoModelForCausalLM.from_pretrained(
                    model_path, quantization_config=quantization_config, device_map="auto", token=hf_token
                )
            else:
                model = AutoModelForCausalLM.from_pretrained(
                    model_path, torch_dtype=torch.float32, device_map="cpu", token=hf_token
                )
        
        if os.path.exists(lora_adapter_path):
            model = PeftModel.from_pretrained(model, lora_adapter_path, adapter_name="code_classifier")

    return model, tokenizer

def record_activity():
    global last_activity_time
    last_activity_time = time.time()


# 📡 New Endpoint: Hardware-Smart Hugging Face Registry Lookup Filter
@app.post("/api/models/search")
async def search_huggingface_hub(
    query: str = Form(...),
    hf_token: str = Form("")
):
    record_activity()
    active_token = hf_token.strip() if hf_token else HF_TOKEN
    if not active_token:
        active_token = None
        
    api = HfApi(token=active_token)
    search_term = f"{query} GGUF"
    
    print(f"🔍 Searching Hugging Face Hub for query matches: '{search_term}'...")
    
    try:
        # Query matching repository profiles tagged with GGUF properties
        models = api.list_models(
            search=search_term,
            sort="downloads",
            direction=-1,
            limit=12
        )
        
        filtered_results = []
        
        for m in models:
            # Query target internal binary file paths inside the chosen matching repository 
            try:
                files = api.list_repo_files(repo_id=m.id)
                # Find the most ideal localized quantization type file variant matching lower-end constraints
                gguf_files = [f for f in files if f.endswith(".gguf")]
                
                for f in gguf_files:
                    # Filter target files based on size layers
                    # Isolating medium-small parameters (Q4_K_M or Q5_K_M profiles matching 3GB to 6GB)
                    if any(tag in f.lower() for tag in ["q4_k_m", "q5_k_m", "q4_0", "q8_0"]):
                        # Get exact binary property sizing summaries to avoid massive downloads
                        info = api.model_info(repo_id=m.id, files_metadata=True)
                        
                        file_meta = next((item for item in info.siblings if item.rfilename == f), None)
                        if file_meta and getattr(file_meta, "size", None):
                            size_bytes = file_meta.size
                            size_gb = round(size_bytes / (1024 ** 3), 2)
                            
                            # 🛑 CRITICAL SAFETY VALVE: If file size exceeds 6.5 GB, skip it
                            # to prevent forceful process death via Windows Virtual OOM triggers.
                            if size_gb > 6.5 or size_gb < 1.5:
                                continue
                                
                            filtered_results.append({
                                "repo": m.id,
                                "file": f,
                                "size_gb": size_gb,
                                # Structured dynamic routing parameter string
                                "computed_path": f"{m.id}/{f}"
                            })
            except Exception:
                continue # Skip dead repositories or unparseable metadata states
                
        return {"results": filtered_results[:6]} # Cap output array entries
        
    except Exception as err:
        print(f"❌ Core Search failure against hub components: {err}")
        return {"results": [], "error": str(err)}


@app.post("/api/spatial/multicast")
async def generate_text_stream(
    prompt: str = Form(...),
    use_lora: bool = Form(True),
    hf_token: str = Form(""),
    model_path: str = Form(...)
):
    record_activity()  
    is_gguf = model_path.endswith(".gguf") or "gguf" in model_path.lower()

    if is_gguf:
        active_token = hf_token.strip() if hf_token else HF_TOKEN
        engine = get_gguf_context(model_path, hf_token=active_token)
        formatted_prompt = f"<|system|>\nYou are a precise assistant.<|user|>\n{prompt}<|assistant|>\n"
        
        def gguf_stream_generator():
            response_chunks = engine(
                prompt=formatted_prompt, max_tokens=64, temperature=0.1, top_p=0.9, stream=True
            )
            for chunk in response_chunks:
                text_piece = chunk["choices"][0]["text"]
                if text_piece:
                    yield text_piece
        return StreamingResponse(gguf_stream_generator(), media_type="text/plain")

    else:
        active_token = hf_token.strip() if hf_token else HF_TOKEN
        if not active_token: active_token = None

        active_model, active_tokenizer = get_llm_context(model_path, hf_token=active_token)
        if isinstance(active_model, PeftModel):
            if use_lora: active_model.set_adapter("code_classifier")
            else: active_model.disable_adapter()

        messages = [
            {"role": "system", "content": "You are a precise system architecture assistant."},
            {"role": "user", "content": prompt}
        ]
        input_ids = active_tokenizer.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt").to(active_model.device)
        streamer = TextIteratorStreamer(active_tokenizer, skip_prompt=True, skip_special_tokens=True)
        generation_kwargs = dict(input_ids=input_ids, streamer=streamer, max_new_tokens=64, temperature=0.1, top_p=0.9)

        threading.Thread(target=active_model.generate, kwargs=generation_kwargs).start()

        def transformers_stream_generator():
            for token_text in streamer: yield token_text
        return StreamingResponse(transformers_stream_generator(), media_type="text/plain")


@app.get("/", response_class=HTMLResponse)
def serve_test_interface():
    record_activity()  
    
    # 🏢 __file__ is the path to chat-agent.py. .parent gets the folder it sits in.
    script_directory = Path(__file__).parent
    template_path = script_directory.joinpath("index.html")
    
    if template_path.exists():
        with open(template_path, "r", encoding="utf-8") as file:
            return file.read()
            
    # Helpful fallback message showing exactly where it looked on your drive
    return f"<h1>❌ Error: index.html missing. Expected location: {template_path}</h1>"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)