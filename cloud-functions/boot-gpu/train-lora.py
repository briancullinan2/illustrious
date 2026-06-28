import os
import argparse
import torch
from pathlib import Path
from datasets import load_dataset

from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig
import transformers
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    TextIteratorStreamer
)
from datasets import Dataset

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



# ============================================================================
# Configuration
# ============================================================================
BASE_MODEL = "Goekdeniz-Guelmez/Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1"
DATASET_FOLDER = "loras/spatial_engine/dataset"
OUTPUT_DIR = "loras/spatial_engine"
HF_CACHE_DIR = "hf_cache"

CREDENTIALS_FILE = Path("~/.credentials/huggingface-provider.json").expanduser()

def get_token():
    if CREDENTIALS_FILE.exists():
        with open(CREDENTIALS_FILE, 'r', encoding='utf-8') as f:
            import json
            return json.load(f).get("ACCESS_TOKEN", "").strip()
    return None

HF_TOKEN = get_token()
if HF_TOKEN:
    print(f"Found {HF_TOKEN}, using authenticated HF token...")
    os.environ["HF_TOKEN"] = HF_TOKEN


import glob
import json



def check_datasets(model_path=BASE_MODEL):
    
    # Fallback/Target directory check
    log_folder_path = Path(DATASET_FOLDER)
    json_files = [str(p) for p in log_folder_path.glob("*.json")]
        
    schema_tracker = {}
    mismatch_found = False

    # Grammar validation compilation for dataset string auditing
    grammar_path = Path(OUTPUT_DIR) / "grammar.bnf"
    use_grammar_constraints = True  
    
    compiled_regex = None
    grammar_validator = None

    active_tokenizer = AutoTokenizer.from_pretrained(model_path, cache_dir=HF_CACHE_DIR, token=HF_TOKEN)
    

    if grammar_path.exists() and use_grammar_constraints:
        print(f"🧱 Loading formal context-free GBNF grammar rules for dataset verification from {grammar_path}...")
        with open(grammar_path, "r", encoding="utf-8") as f:
            gbnf_grammar_string = f.read()
        try:
            if not hasattr(active_tokenizer, 'byte_encoder'):
                active_tokenizer.byte_encoder = byte_encoder_map
            if not hasattr(active_tokenizer, 'byte_decoder'):
                active_tokenizer.byte_decoder = byte_decoder_map

            grammar_validator = IncrementalGrammarConstraint(
                gbnf_grammar_string, 
                "root", 
                active_tokenizer
            )
            
            print(f"✅ Grammar validator initialized successfully: {type(grammar_validator).__name__}")
            print(f"   Has accept_token_ids: {hasattr(grammar_validator, 'accept_token_ids')}")
        except Exception as e:
            print(f"❌ Initialization Error: Failed to compile GBNF validation constraints: {e}")
            mismatch_found = True

    elif use_grammar_constraints:
        print(f"🌐 Compiling fallback spatial regex validation layout for dataset verification...")
        spatial_regex = (
            r"^("                                        # Start of total sequence
            r"\s*\[[a-z0-9_-]+\]"                        # Primitive tag: e.g., [sphere]
            r"(\s*\[(abs|@[0-9]+(,\s*@[0-9]+)*)\])?"     # Optional Anchor tag: e.g., [abs] or [@1, @2]
            r"(\s*\["                                    # Start of Coordinate/Vector Block
              r"[a-zA-Z0-9_\-\s.,*+()=/]*"               # Match floats, expressions, and assignments
              r"(\[[a-zA-Z0-9_\-\s.,*+()=/]*\])?"        # Match ONE level of nested vectors: e.g., [[1,1,1.5]]
              r"[a-zA-Z0-9_\-\s.,*+()=/]*"               # Match trailing expressions or properties
            r"\]\s*)"                                    # End of Coordinate Block
            r")+$"                                       # Ensure full string matching from start to end
        )
        try:
            import re
            compiled_regex = re.compile(spatial_regex)
        except Exception as e:
            print(f"❌ Initialization Error: Failed to compile spatial fallback regex: {e}")
            mismatch_found = True
    else:
        print(f"⚠️ Dataset verification running without grammar target restrictions.")

    print(f"Scanning inner schemas across {len(json_files)} files...")

    for filepath in json_files:
        with open(filepath, 'r', encoding='utf-8') as raw_f:
            file_content = raw_f.read()
        with open(filepath, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                
                if not isinstance(data, list):
                    print(f"❌ Structural Base Mismatch: File root must be an array list `[]`. Found {type(data).__name__} in {filepath}")
                    mismatch_found = True
                    continue

                for item_idx, item in enumerate(data):
                    if not isinstance(item, dict):
                        print(f"❌ Type Mismatch: Expected object row inside root array, found {type(item).__name__} in {filepath} at index {item_idx}")
                        mismatch_found = True
                        continue
                    
                    # Track structural layout of root keys
                    for key, value in item.items():
                        current_type = type(value).__name__
                        schema_key = f"root.{key}"
                        
                        if schema_key in schema_tracker and schema_tracker[schema_key] != current_type:
                            print(f"❌ SCHEMA CONFLICT in {filepath} at row index {item_idx}:")
                            print(f"   Property '{key}' swapped column layout structure from '{schema_tracker[schema_key]}' to '{current_type}'")
                            mismatch_found = True
                        else:
                            schema_tracker[schema_key] = current_type

                    # Deep verification of the Hugging Face CausalLM message format
                    if "messages" in item and isinstance(item["messages"], list):
                        for msg_idx, msg in enumerate(item["messages"]):
                            if not isinstance(msg, dict):
                                print(f"❌ Format Error in {filepath} [Row {item_idx}, Msg {msg_idx}]: Messages list elements must be explicit dictionary objects.")
                                mismatch_found = True
                                continue
                            
                            # Validate inner message row entries match schema properties exactly
                            for inner_key, inner_val in msg.items():
                                inner_type = type(inner_val).__name__
                                msg_schema_key = f"messages.item.{inner_key}"
                                
                                if msg_schema_key in schema_tracker and schema_tracker[msg_schema_key] != inner_type:
                                    print(f"❌ DEEP SCHEMATIC COLLISION in {filepath} [Row {item_idx}, Msg {msg_idx}]:")
                                    print(f"   Message property '{inner_key}' changed formatting signature from '{schema_tracker[msg_schema_key]}' to '{inner_type}'")
                                    mismatch_found = True
                                else:
                                    schema_tracker[msg_schema_key] = inner_type

                            # Verify target assistant text blocks obey inference constraints
                            if use_grammar_constraints and msg.get("role") == "assistant" and isinstance(msg.get("content"), str):
                                assistant_text = msg["content"]

                                char_idx = file_content.find(f'"content": "{assistant_text}"')
                                if char_idx == -1:
                                    # Fallback if quotes vary or text uses escapes
                                    char_idx = file_content.find(assistant_text)
                                
                                if char_idx != -1:
                                    # Count newlines up to that character sequence
                                    line_no = file_content.count('\n', 0, char_idx) + 1
                                
                                if grammar_validator is not None:
                                    try:
                                        test_text = assistant_text
                                        # Many tokenizers need a leading space for assistant content
                                        if not test_text.startswith((" ", "[", "[]")):
                                            test_text = " " + test_text
                                        
                                        encoded_tokens = active_tokenizer.encode(test_text, add_special_tokens=False)
                                        
                                        is_valid = grammar_validator.accept_token_ids(encoded_tokens, as_string=False)
                                        
                                        if is_valid:
                                            pass  # good
                                        else:
                                            print(f"❌ GRAMMAR VIOLATION in {filepath} [Row {item_idx}, Msg {msg_idx}]:")
                                            print(f"   Text: {repr(assistant_text[:400])}...")
                                            mismatch_found = True
                                            
                                    except ValueError as ve:
                                        print(f"❌ GRAMMAR VIOLATION in {filepath} [Line {line_no}, Row {item_idx}, Msg {msg_idx}]:")
                                        print(f"   {str(ve)[:300]}...")
                                        print(f"   Offending text: {repr(assistant_text[:350])}...")
                                        mismatch_found = True
                                    except Exception as ge:
                                        print(f"❌ GRAMMAR PARSING EXCEPTION ... {ge}")
                                        mismatch_found = True


                                # 2. Validate against Spatial Layout Regex if active
                                elif compiled_regex is not None:
                                    if not compiled_regex.match(assistant_text):
                                        print(f"❌ REGEX CONSTRAINT VIOLATION in {filepath} [Line {line_no}, Row {item_idx}, Msg {msg_idx}]:")
                                        print(f"   Assistant text layout failed to match spatial token schema constraints.")
                                        print(f"   Offending String: {repr(assistant_text)}")
                                        mismatch_found = True
                                    
            except json.JSONDecodeError as jde:
                print(f"❌ Broken JSON Syntax Error in {filepath}: {jde}")
                mismatch_found = True
            except Exception as e:
                print(f"❌ Execution error while scanning file {filepath}: {e}")
                mismatch_found = True

    if not mismatch_found:
        print("✓ All structural schemas, conversation lists, and inner data types match perfectly!")


def run_lora_alignment(model_path=BASE_MODEL):
    # Load all JSON files
    log_folder_path = Path(DATASET_FOLDER)
    json_files = [str(p) for p in log_folder_path.glob("*.json")]
    print(f"DEBUG: Found physical file array count: {len(json_files)}")

    if not json_files:
        raise FileNotFoundError(f"No .json files found in {DATASET_FOLDER}")
    
    print(f"Found {len(json_files)} JSON files. Loading dataset...")

    try:
        # load_dataset returns an already instantiated Hugging Face Dataset object on success
        dataset = load_dataset(
            "json", 
            data_files=json_files, 
            split="train", 
            cache_dir=HF_CACHE_DIR, 
            token=HF_TOKEN,
            download_mode="force_redownload"
        )
    except Exception as e:
        print(f"❌ Failed downloading datasets via Hugging Face loader: {e}")
        print("🔄 Falling back to reading JSON files manually from disk...")
        
        all_records = []
        for f_path in json_files:
            with open(f_path, 'r', encoding='utf-8') as f:
                file_data = json.load(f)
                if isinstance(file_data, list):
                    all_records.extend(file_data)
                else:
                    all_records.append(file_data)
                    
        # Only parse manually from the local list if the main loader exception fired
        dataset = Dataset.from_list(all_records)

    # Shuffle + take more samples (personality needs repetition)
    dataset = dataset.shuffle(seed=42).select(range(min(8000, len(dataset))))  # Increase this as you add data
    print(f"🔍 Rows parsed by Hugging Face table: {len(dataset)}")


    tokenizer = AutoTokenizer.from_pretrained(model_path, cache_dir=HF_CACHE_DIR, token=HF_TOKEN)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Ensure Llama-3 chat template is set
    if not tokenizer.chat_template:
        print("Setting default Llama-3 chat template...")
        tokenizer.chat_template = "{% for message in messages %}\n{% if message['role'] == 'user' %}{{ '<|start_header_id|>user<|end_header_id|>\n\n' + message['content'] | trim + '<|eot_id|>' }}{% elif message['role'] == 'system' %}{{ '<|start_header_id|>system<|end_header_id|>\n\n' + message['content'] | trim + '<|eot_id|>' }}{% elif message['role'] == 'assistant' %}{{ '<|start_header_id|>assistant<|end_header_id|>\n\n' + message['content'] | trim + '<|eot_id|>' }}{% endif %}\n{% endfor %}"

    jinji_path = Path(OUTPUT_DIR + "/chat_template.jinja")
    if jinji_path.exists():
        print(f"🕵️ Jinji found at '{jinji_path}'. Applying template...")
        with open(jinji_path, "r", encoding="utf-8") as file:
            tokenizer.chat_template = file.read()
    else:
        print(f"⚠️ Jinji NOT found at '{jinji_path}'. Skipping...")


    # Model loading
    if torch.cuda.is_available():
        print("Using GPU with 4-bit QLoRA...")
        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        base_model = AutoModelForCausalLM.from_pretrained(
            model_path,
            quantization_config=quant_config,
            device_map="auto",
            cache_dir=HF_CACHE_DIR,
            token=HF_TOKEN,
            torch_dtype=torch.float16,
        )
        base_model = prepare_model_for_kbit_training(base_model)
    else:
        print("Falling back to CPU...")
        base_model = AutoModelForCausalLM.from_pretrained(
            model_path,
            device_map="cpu",
            torch_dtype=torch.float32,
            cache_dir=HF_CACHE_DIR,
            token=HF_TOKEN,
        )

    os.environ["OMP_NUM_THREADS"] = "6"
    os.environ["MKL_NUM_THREADS"] = "6"


    if torch.cuda.is_available():

        lora_config = LoraConfig(
            r=16,                         
            lora_alpha=32,                
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
        )

        sft_config = SFTConfig(
            output_dir="./training_outputs",
            per_device_train_batch_size=4,   # Bumped up from 1 to saturate GPU cores
            gradient_accumulation_steps=4,   # Effective batch size of 16 per device
            
            use_cpu=False,
            bf16=True,                       # Native mixed precision for A100/H100/L4 GPUs
            fp16=False,
            optim="paged_adamw_8bit",        # Fast GPU optimizer with memory tracking
            
            warmup_ratio=0.1,
            num_train_epochs=3,              # Let it converge over real epochs now

            learning_rate=2e-4,
            lr_scheduler_type="cosine",
            logging_steps=1,
            save_strategy="epoch",           # Save checkpoints per epoch on cloud disk
            report_to="none",
            
            max_length=4096,                 # Expanded headroom for complex structural layouts
            packing=True,                    # Concatenate sequences to optimize VRAM sequences
            
            dataloader_num_workers=4,        # Move data loading to CPU workers
            dataloader_pin_memory=True,      # Fast pinned memory staging to GPU VRAM
        )

    else:

        lora_config = LoraConfig(
            r=16,                     # 💡 Dropped slightly from 32 to 16. Saves huge compute/RAM on CPU.
            #r=32,
            lora_alpha=32,            # Placed perfectly at 2x rank
            #lora_alpha=64,
            #target_modules=["q_proj", "v_proj"], # 💡 Trimming to attention-only drops trainable matrices immensely
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
        )

        sft_config = SFTConfig(
            output_dir="./training_outputs",
            per_device_train_batch_size=1,
            #per_device_train_batch_size=4,
            #gradient_accumulation_steps=2,
            gradient_accumulation_steps=4,  # Keep high to keep gradient steps stable
            #gradient_accumulation_steps=16,
            
            use_cpu=not torch.cuda.is_available(),
            #use_cpu=True,                   # Force runtime away from raw system wrappers
            #bf16=True,                      # 🔥 SWAP TO BF16 MIXED PRECISION FOR CPU SPEED
            bf16=False,
            fp16=torch.cuda.is_available(),
            optim="adafactor",              # 🔥 SWAP OPTIMIZER to drop massive RAM/Compute states
            
            #warmup_steps=10,
            warmup_ratio=0.1,
            #max_steps=50,                          # Much better than 3
            #max_steps=200,
            #num_train_epochs=3,
            num_train_epochs=1,

            learning_rate=2e-4,
            lr_scheduler_type="cosine",
            logging_steps=1,
            save_strategy="no",
            report_to="none",
            
            # 📏 Context Truncation Controls:
            max_length=2048,                 # 💡 Keep at 128! 512 context on CPU is quadratically slower.
            #packing=True,
            
            # 📁 Data Loader Multiprocessing:
            #dataloader_num_workers=4,       # Parallelize disk data extraction off the main execution core
            dataloader_num_workers=0,
            dataloader_pin_memory=False,    # Disabled since we have no GPU VRAM targets to stream to
        )

    def formatting_prompts_func(example):
        # If SFTTrainer runs with batched=False, it processes a single dict record row
        # If it is running with batched=True, example will be a dict of lists
        
        # We use an empty string but handle it elegantly or pass a space to avoid formatting issues
        system_message = {"role": "system", "content": ""}

        # Check if we are dealing with a batch of rows (batched=True)
        is_batch = isinstance(example["messages"], list) and len(example["messages"]) > 0 and isinstance(example["messages"][0], list)

        if is_batch:
            texts = []
            for conversation in example["messages"]:
                # Prepend system prompt if the conversation doesn't already start with one
                if not conversation or conversation[0].get("role") != "system":
                    conversation = [system_message] + conversation

                formatted = tokenizer.apply_chat_template(
                    conversation,
                    tokenize=False,
                    add_generation_prompt=False,
                )
                texts.append(formatted)
            return {"text": texts}

        else:
            # Handling a single scalar row mapping (batched=False)
            conversation = example["messages"]
            
            # Guard clause against corrupted rows
            if not conversation or not isinstance(conversation, list):
                return ""

            # Prepend system prompt if not already present
            if conversation[0].get("role") != "system":
                conversation = [system_message] + conversation

            formatted = tokenizer.apply_chat_template(
                conversation,
                tokenize=False,
                add_generation_prompt=False
            )
            return formatted
        
        
    print("Initializing SFTTrainer...")
    trainer = SFTTrainer(
        model=base_model,
        train_dataset=dataset,
        peft_config=lora_config,
        args=sft_config,
        formatting_func=formatting_prompts_func,
        #tokenizer=tokenizer,   # don't use tokenizer with formatting func
    )

    print("Starting training...")
    trainer.train()

    print(f"Saving LoRA to {OUTPUT_DIR}")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    trainer.model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("Training complete!")

    # Optional: Merge LoRA into base model
    # from peft import PeftModel
    # merged_model = PeftModel.from_pretrained(base_model, OUTPUT_DIR).merge_and_unload()
    # merged_model.save_pretrained(OUTPUT_DIR + "_merged")
    # tokenizer.save_pretrained(OUTPUT_DIR + "_merged")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default=BASE_MODEL)
    parser.add_argument("--check", type=lambda x: (str(x).lower() == 'true'), default=False)
    args = parser.parse_args()
    
    target_model = args.model.strip()
    # Add your GGUF/base model logic here if needed...
    
    if args.check:
        check_datasets()
    elif len(target_model) > 0:
        run_lora_alignment(model_path=target_model)
    else:
        print("Use --model")
