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
import threading
import transformers
from transformers import TextIteratorStreamer
# from transformers_cfg.grammar_utils import IncrementalGrammarConstraint
# from transformers_cfg.generation.logits_process import GrammarConstrainedLogitsProcessor
# ERROR: AttributeError: GPT2Tokenizer has no attribute byte_encoder

# --- TRADING BLOCKS FOR PY3.14 BACKWARDS COMPATIBILITY ---

# 1. Patch lmformatenforcer internal tokenizer class updates
if not hasattr(transformers.tokenization_utils, 'PreTrainedTokenizerBase'):
    import transformers.tokenization_utils_base
    transformers.tokenization_utils.PreTrainedTokenizerBase = transformers.tokenization_utils_base.PreTrainedTokenizerBase

# 2. Patch transformers_cfg logging namespace changes
if not hasattr(transformers, 'logging'):
    import transformers.utils.logging
    transformers.logging = transformers.utils.logging

# 3. Native independent implementation of GPT2 byte maps
def get_clean_byte_maps():
    bs = list(range(ord("!"), ord("~") + 1)) + list(range(ord("¡"), ord("¬") + 1)) + list(range(ord("®"), ord("ÿ") + 1))
    cs = bs[:]
    n = 0
    for b in range(256):
        if b not in bs:
            bs.append(b)
            cs.append(256 + n)
            n += 1
    encoder = dict(zip(bs, [chr(x) for x in cs]))
    decoder = {v: k for k, v in encoder.items()}
    return encoder, decoder

byte_encoder_map, byte_decoder_map = get_clean_byte_maps()

# Inject both properties into the base GPT2 classes
for cls_name in ['GPT2Tokenizer', 'GPT2TokenizerFast']:
    if hasattr(transformers, cls_name):
        cls = getattr(transformers, cls_name)
        cls.byte_encoder = byte_encoder_map
        cls.byte_decoder = byte_decoder_map

# --- END PATCH STACK ---

# Safely import the grammar engines now that paths are bridged
from transformers_cfg.grammar_utils import IncrementalGrammarConstraint
from transformers_cfg.generation.logits_process import GrammarConstrainedLogitsProcessor

if not hasattr(transformers.tokenization_utils, 'PreTrainedTokenizerBase'):
    import transformers.tokenization_utils_base
    transformers.tokenization_utils.PreTrainedTokenizerBase = transformers.tokenization_utils_base.PreTrainedTokenizerBase

from lmformatenforcer import TokenEnforcer, RegexParser
from lmformatenforcer.integrations.transformers import build_transformers_prefix_allowed_tokens_fn


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
lora_adapter_path = "loras/spatial_engine" 
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
if HF_TOKEN:
    print(f"Found {HF_TOKEN}, using authenticated HF token...")
    os.environ["HF_TOKEN"] = HF_TOKEN


#os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
#os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

def get_gguf_context(model_id_or_path, hf_token=None, gguf_lora_target = None):
    global gguf_engine

    active_token = hf_token.strip() if hf_token else HF_TOKEN
    if not active_token: 
        active_token = None


    if Llama is None:
        raise ImportError("The 'llama-cpp-python' library is missing. Install it to process GGUF formats.")
        
    # Standardize separator structures from frontend payloads
    model_id_or_path = model_id_or_path.replace("__", "/")
    
    if gguf_engine is not None:
        return gguf_engine

    resolved_path = model_id_or_path
    
    # 1. Handle remote hub downloads if a raw file structure isn't local
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
                token=active_token
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
        
    active_lora_path = None
    
    if os.path.exists(gguf_lora_target):
        print(f"🧬 GGUF LoRA target detected at '{gguf_lora_target}'. Hot-swapping adapter pathways...")
        active_lora_path = gguf_lora_target
    else:
        print("⚠️ No GGUF adapter patch found. Running vanilla model inference tracks.")

    # 3. Instantiate the execution kernel with the active conditional path mapping
    gguf_engine = Llama(
        model_path=resolved_path,
        lora_path=active_lora_path,  # 🛠️ Injects your custom classification rules if the file is present
        n_ctx=2048,        
        n_gpu_layers=gpu_layers,
        verbose=False      
    )
    return gguf_engine



def get_llm_context(model_path=base_model_path, hf_token=None, active_lora_path=None):
    global model, tokenizer
    active_token = hf_token.strip() if hf_token else HF_TOKEN
    if not active_token:
        active_token = None

    if not model_path:
        model_path = base_model_path
        
    if model is None or tokenizer is None:
        current_os = platform.system()
        print(f"⚡ Initializing Tokenizer and Base Model Context: {model_path}...")
        
        tokenizer = AutoTokenizer.from_pretrained(model_path, cache_dir=HF_CACHE_DIR, token=active_token)
        
        quantization_config = None
        if current_os == "Linux" and torch.cuda.is_available():
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4"
            )

        # Load the base weights cleanly
        if current_os == "Darwin":
            base = AutoModelForCausalLM.from_pretrained(
                model_path, torch_dtype=torch.float16, device_map="auto", cache_dir=HF_CACHE_DIR, token=active_token
            )
        elif current_os in ["Linux", "Windows"]:
            if torch.cuda.is_available():
                # GPU Mode: Use 16-bit precision instead of 4-bit quantization.
                # Qwen 0.5B easily fits in VRAM, and this fixes the merging crash.
                print("Using CUDA GPU accelerated execution environment...")
                
                # Check if your GPU supports modern bfloat16, otherwise fallback to float16
                compute_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
                
                base = AutoModelForCausalLM.from_pretrained(
                    model_path, 
                    torch_dtype=compute_dtype, 
                    device_map="auto", 
                    cache_dir=HF_CACHE_DIR, 
                    token=active_token
                )
            else:
                # CPU Mode: Explicitly use float32.
                # Windows CPUs will throw massive precision warnings or errors on float16.
                print("No CUDA GPU detected. Falling back to native CPU float32 environment...")
                base = AutoModelForCausalLM.from_pretrained(
                    model_path, 
                    torch_dtype=torch.float32, 
                    device_map={"": "cpu"}, 
                    cache_dir=HF_CACHE_DIR, 
                    token=active_token
                )
        
        if os.path.exists(active_lora_path):
            try:
                if quantization_config is not None:
                    # 4-bit layers cannot be merged. Keep the wrapper intact for dynamic runtime math.
                    print(f"🧬 Loading active runtime adapter path: {active_lora_path}...")
                    model = PeftModel.from_pretrained(base, active_lora_path, cache_dir=HF_CACHE_DIR)
                    print("Active LoRA adapters:", model.active_adapters())
                else:
                    # Unquantized tracks (CPU/Mac) can be merged cleanly for a performance boost
                    print(f"🧬 Fusing custom adapter layers natively into base model architecture: {active_lora_path}...")
                    peft_wrapper = PeftModel.from_pretrained(base, active_lora_path, cache_dir=HF_CACHE_DIR)
                    
                    # --- EMERGENCY AMPLIFIER FOR UNDERBAKED WEIGHTS ---
                    adapter_name = peft_wrapper.active_adapter or "default"
                    
                    from peft.tuners.lora.layer import LoraLayer
                    scaled_count = 0
                    scale = 1.4

                    for module in peft_wrapper.modules():
                        if isinstance(module, LoraLayer):
                            # Override the ratio calculation directly to give the tiny 0.06 weights a massive megaphone
                            module.scaling[adapter_name] = scale  # Training baseline was 2.0
                            scaled_count += 1
                    
                    print(f"🎛️ Forced adapter scaling matrix override to {scale} across {scaled_count} layers.")
                    
                    model = peft_wrapper.merge_and_unload()
                    print("🎯 Model weights consolidated successfully.")
            except Exception as e:
                print(f"⚠️ Safe fusion bypassed due to environment constraints: {e}")
                model = base
                
        else:
            model = base

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


def format_gguf_prompt(model_path: str, messages: list) -> str:
    path_lower = model_path.lower()
    
    # 1. Llama 3 Format
    if "llama-3" in path_lower or "llama3" in path_lower:
        prompt = "<|begin_of_text|>"
        for msg in messages:
            prompt += f"<|start_header_id|>{msg['role']}<|end_header_id|>\n\n{msg['content']}<|eot_id|>"
        prompt += "<|start_header_id|>assistant<|end_header_id|>\n\n"
        return prompt
        
    # 2. ChatML Format (Qwen, DeepSeek, Yi)
    elif any(tag in path_lower for tag in ["qwen", "deepseek", "yi", "chatml"]):
        prompt = ""
        for msg in messages:
            prompt += f"<|im_start|>{msg['role']}\n{msg['content']}<|im_end|>\n"
        prompt += "<|im_start|>assistant\n"
        return prompt
        
    # 3. Llama 2 / Mistral / Basic Fallback
    elif any(tag in path_lower for tag in ["llama-2", "llama2", "mistral", "mixtral"]):
        # Standard generic fallback if it doesn't match known structures
        system_content = next((m["content"] for m in messages if m["role"] == "system"), "You are a precise assistant.")
        user_content = next((m["content"] for m in messages if m["role"] == "user"), "")
        return f"<s>[INST] <<SYS>>\n{system_content}\n<</SYS>>\n\n{user_content} [/INST]"
    
    # Robust Fallback: If signature is unknown, resolve ONLY the tokenizer configuration mapping
    else:
        print(f"🕵️ Unknown GGUF signature for '{model_path}'. Resolving lightweight tokenizer fallback template...")
        return None



async def generate_gguf_stream(
    prompt: str,
    use_lora: bool,
    hf_token: str,
    model_path: str,
    start_message = None
):
    active_token = hf_token.strip() if hf_token else HF_TOKEN
    if not active_token: 
        active_token = None

    if use_lora:
        engine = get_gguf_context(model_path, hf_token=active_token, gguf_lora_target=lora_adapter_path + '.gguf')
    else:
        engine = get_gguf_context(model_path, hf_token=active_token)
        formatted_prompt = format_gguf_prompt(model_path, start_message)
    
    if formatted_prompt is None:
        fallback_tokenizer = AutoTokenizer.from_pretrained(model_path, cache_dir=HF_CACHE_DIR, token=active_token)
        if use_lora:
            jinji_path = Path(lora_adapter_path + "/chat_template.jinja")
            if jinji_path.exists():
                print(f"🕵️ Jinji found at '{jinji_path}'. Applying template...")
                with open(jinji_path, "r", encoding="utf-8") as file:
                    fallback_tokenizer.chat_template = file.read()
            else:
                print(f"⚠️ Jinji NOT found at '{jinji_path}'. Skipping...")

        formatted_prompt = fallback_tokenizer.apply_chat_template(
            start_message, 
            tokenize=False, 
            add_generation_prompt=True,
            persona="hot_ex"
        )

    def gguf_stream_generator():
        response_chunks = engine(
            prompt=formatted_prompt, max_tokens=64, temperature=0.1, top_p=0.9, stream=True
        )
        for chunk in response_chunks:
            text_piece = chunk["choices"][0]["text"]
            if text_piece:
                yield text_piece
    return StreamingResponse(gguf_stream_generator(), media_type="text/plain")






async def generate_llm_stream(
    prompt: str,
    use_lora: bool,
    hf_token: str,
    model_path: str,
    start_message = None
):
    active_token = hf_token.strip() if hf_token else HF_TOKEN
    if not active_token: 
        active_token = None

    target_model_path = base_model_path
    if model_path and model_path.strip():
        target_model_path = model_path.strip()

    if use_lora:
        active_model, active_tokenizer = get_llm_context(
            model_path=target_model_path, 
            hf_token=active_token,
            active_lora_path=lora_adapter_path
        )
        jinji_path = Path(lora_adapter_path + "/chat_template.jinja")
        if jinji_path.exists():
            with open(jinji_path, "r", encoding="utf-8") as file:
                active_tokenizer.chat_template = file.read()
    else:
        active_model, active_tokenizer = get_llm_context(
            model_path=target_model_path, 
            hf_token=active_token
        )

    tokenized_payload = active_tokenizer.apply_chat_template(
        start_message, 
        add_generation_prompt=True, 
        return_tensors="pt"
    )
    
    raw_input_ids = tokenized_payload["input_ids"].to(active_model.device)
    raw_attention_mask = tokenized_payload["attention_mask"].to(active_model.device)
    
    streamer = TextIteratorStreamer(
        active_tokenizer, 
        skip_prompt=True, 
        skip_special_tokens=True
    )

    grammar_path = Path(lora_adapter_path) / "grammar.bnf"
    use_grammar_constraints = True  

    # Generation argument buckets
    processors_list = []
    prefix_function = None

    if grammar_path.exists() and use_grammar_constraints:
        print(f"🧱 Enforcing formal context-free GBNF grammar rules from {grammar_path}...")
        with open(grammar_path, "r", encoding="utf-8") as f:
            gbnf_grammar_string = f.read()

        if not hasattr(active_tokenizer, 'byte_encoder'):
            active_tokenizer.byte_encoder = byte_encoder_map
        if not hasattr(active_tokenizer, 'byte_decoder'):
            active_tokenizer.byte_decoder = byte_decoder_map

        grammar_constraint = IncrementalGrammarConstraint(
            gbnf_grammar_string, 
            "root", 
            active_tokenizer
        )
        logits_processor = GrammarConstrainedLogitsProcessor(grammar_constraint)
        processors_list = [logits_processor]

    elif use_grammar_constraints:
        print(f"🌐 Enforcing fallback string regex validation layout constraints...")
        
        # This regex mimics: [primitive] optionally [anchor] [vector contents] with loose gaps
        spatial_regex = (
            r"(\s*\[[a-z0-9_-]+\]"                       # Primitive element
            r"(\s*\[(abs|@[0-9]+(,\s*@[0-9]+)*)\])?"     # Anchor element
            r"\s*\[[^\]]+\]\s*)*"                        # Vector coordinates matrix
        )

        parser = RegexParser(spatial_regex)
        prefix_function = build_transformers_prefix_allowed_tokens_fn(
            active_tokenizer, 
            parser
        )

    else:
        print(f"⚠️ Running model without grammar constraint layers.")

    explicit_generation_kwargs = {
        "input_ids": raw_input_ids,
        "attention_mask": raw_attention_mask,
        "streamer": streamer,
        "max_new_tokens": 1000,
        "temperature": 0.1,
        "top_p": 0.9,
        "do_sample": False,
        "logits_processor": processors_list,
        "prefix_allowed_tokens_fn": prefix_function  # Hooked up safely here
    }

    threading.Thread(
        target=active_model.generate, 
        kwargs=explicit_generation_kwargs
    ).start()

    def transformers_stream_generator():
        for token_text in streamer: 
            yield token_text
            
    return StreamingResponse(transformers_stream_generator(), media_type="text/plain")


@app.post("/api/spatial/multicast")
async def generate_text_stream(
    prompt: str = Form(...),
    use_lora: bool = Form(True),
    hf_token: str = Form(""),
    model_path: str = Form(...)
):
    record_activity()
    is_gguf = model_path.endswith(".gguf") or "gguf" in model_path.lower()

    messages = [
        {"role": "system", "content": ""},
        {"role": "user", "content": prompt}
    ]

    if is_gguf:
        return await generate_gguf_stream(prompt, use_lora, hf_token, model_path, messages)

    else:
        return await generate_llm_stream(prompt, use_lora, hf_token, model_path, messages)
    


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