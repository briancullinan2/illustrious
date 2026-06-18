import os
import argparse
import torch
from pathlib import Path
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig

# ============================================================================
# Configuration
# ============================================================================
BASE_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"
DATASET_FOLDER = "chat_logs"
OUTPUT_DIR = "loras/hot_ex_girlfriend"
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

def run_lora_alignment(model_path=BASE_MODEL):
    # Load all JSON files
    log_folder_path = Path(DATASET_FOLDER)
    json_files = [str(p) for p in log_folder_path.glob("*.json")]
    
    if not json_files:
        raise FileNotFoundError(f"No .json files found in {DATASET_FOLDER}")
    
    print(f"Found {len(json_files)} JSON files. Loading dataset...")
    dataset = load_dataset("json", data_files=json_files, split="train", cache_dir=HF_CACHE_DIR, token=HF_TOKEN)
    
    # Shuffle + take more samples (personality needs repetition)
    dataset = dataset.shuffle(seed=42).select(range(min(1600, len(dataset))))  # Increase this as you add data
    
    print(f"Loaded {len(dataset)} examples.")

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

    lora_config = LoraConfig(
        r=16,                     # 💡 Dropped slightly from 32 to 16. Saves huge compute/RAM on CPU.
        #r=32,
        lora_alpha=32,            # Placed perfectly at 2x rank
        #lora_alpha=64,
        target_modules=["q_proj", "v_proj"], # 💡 Trimming to attention-only drops trainable matrices immensely
        #target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
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
        max_steps=10,                          # Much better than 3
        #max_steps=200,
        #num_train_epochs=3,

        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        logging_steps=1,
        save_strategy="no",
        report_to="none",
        
        # 📏 Context Truncation Controls:
        max_length=128,                 # 💡 Keep at 128! 512 context on CPU is quadratically slower.
        #packing=True,
        
        # 📁 Data Loader Multiprocessing:
        #dataloader_num_workers=4,       # Parallelize disk data extraction off the main execution core
        dataloader_num_workers=0,
        dataloader_pin_memory=False,    # Disabled since we have no GPU VRAM targets to stream to
    )


    def formatting_prompts_func(example):
        texts = []
        # If processing a batch array of conversations
        if isinstance(example["messages"], list) and len(example["messages"]) > 0 and isinstance(example["messages"][0], list):
            for i, conversation in enumerate(example["messages"]):

                # This teaches the model ALL styles conditionally!
                #if i % 3 == 0:
                #    current_persona = "trump"
                #elif i % 3 == 1:
                current_persona = "hot_ex"
                #else:
                #    current_persona = "layout_core"

                formatted = tokenizer.apply_chat_template(
                    conversation, # 🎯 Passes the individual item correctly
                    tokenize=False,
                    add_generation_prompt=False,
                    persona=current_persona
                )
                texts.append(formatted)
        return texts

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
    args = parser.parse_args()
    
    target_model = args.model.strip()
    # Add your GGUF/base model logic here if needed...
    
    run_lora_alignment(model_path=target_model)