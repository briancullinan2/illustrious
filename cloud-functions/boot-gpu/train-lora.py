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
from trl import SFTTrainer, SFTConfig  # 🛠️ Added SFTConfig here

# ============================================================================
# Core Training Infrastructure Configuration
# ============================================================================
BASE_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"  # Or "Qwen/Qwen2.5-Coder-7B-Instruct"
#DATASET_PATH = "cloud-functions/boot-gpu"
DATASET_FOLDER = "chat_logs"
OUTPUT_DIR = "loras/hot_ex_girlfriend"
HF_CACHE_DIR = "hf_cache"

# 🔑 Pull from your secure environment token configuration setup
CREDENTIALS_FILE = Path("~/.credentials/huggingface-provider.json").expanduser()
def get_token():
    if CREDENTIALS_FILE.exists():
        with open(CREDENTIALS_FILE, 'r', encoding='utf-8') as f:
            import json
            return json.load(f).get("ACCESS_TOKEN", "").strip()
    return None

HF_TOKEN = get_token()



def run_lora_alignment(model_path = BASE_MODEL):
    # 🗂️ Collect every single .json file inside your chat_logs folder
    log_folder_path = Path(DATASET_FOLDER)
    json_files = [str(p) for p in log_folder_path.glob("*.json")]
    
    if not json_files:
        raise FileNotFoundError(f"❌ No .json files found inside the directory: '{DATASET_FOLDER}'")
        
    print(f"📡 Found {len(json_files)} log profiles. Appending dataset rows dynamically...")
    
    # 🛠️ Hugging Face merges the list of files seamlessly into a single dataset split
    dataset = load_dataset("json", data_files=json_files, split="train")
    print(f"🎯 Unified dataset loaded successfully. Total training samples: {len(dataset)}")

    print(f"⚡ Initializing base model layers: {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_path, cache_dir=HF_CACHE_DIR, token=HF_TOKEN)
    tokenizer.pad_token = tokenizer.eos_token

    # 🎛️ Dynamic Hardware Allocation Layer
    if torch.cuda.is_available():
        print("🚀 NVIDIA CUDA Detected! Activating efficient 4-bit QLoRA training parameters...")
        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True
        )
        
        # 🟢 PURE BASE MODEL ONLY FOR TRAINING
        base_model = AutoModelForCausalLM.from_pretrained(
            model_path,
            quantization_config=quant_config,
            device_map="auto",
            cache_dir=HF_CACHE_DIR,
            token=HF_TOKEN
        )
        # Prepare model configurations for low-rank token adjustments
        base_model = prepare_model_for_kbit_training(base_model)
    else:
        print("🚨 CUDA Unavailable! Dropping down to Host CPU processing matrix...")
        
        # 🟢 PURE BASE MODEL ONLY FOR TRAINING
        base_model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float32,
            dtype=torch.float32,
            device_map={"": "cpu"},  
            cache_dir=HF_CACHE_DIR,
            token=HF_TOKEN
        )

    lora_config = LoraConfig(
        r=16,                  # Rank size
        lora_alpha=32,         # Weight scaling factor
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"], 
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )

    sft_config = SFTConfig(
        output_dir="./training_outputs",
        per_device_train_batch_size=1,  
        gradient_accumulation_steps=1,
        warmup_steps=0,                 # 🛠️ Set to 0 so small datasets hit full learning rate instantly
        #max_steps=3,
        num_train_epochs=1,             # 🛠️ Stick to 1 pass on CPU to avoid massive processing delays
        learning_rate=2e-4,
        fp16=False,                    
        use_cpu=True,                  
        logging_steps=1,
        save_strategy="no",    
        report_to="none",
        max_length=128,
        # dataset_text_field="messages"  # 🛠️ REMOVED: This was breaking your formatting_func!
    )

    print("🚀 Initializing SFT Trainer core pipeline...")

    def formatting_prompts_func(example):
        # SFTTrainer will pass rows from your dataset here. 
        # Since your dataset script outputs a list of dictionaries containing "messages", 
        # we pull that list and format it using Qwen's specific template syntax.
        output_texts = []
        
        # If processing a batch (depending on dataset loading style), iterate over rows
        if isinstance(example["messages"], list) and len(example["messages"]) > 0 and isinstance(example["messages"][0], list):
            for messages_list in example["messages"]:
                formatted_text = tokenizer.apply_chat_template(
                    messages_list, 
                    tokenize=False, 
                    add_generation_prompt=False  # Keep False during training so it includes the assistant's answer!
                )
                output_texts.append(formatted_text)
            return output_texts
        else:
            # Fallback for a single row execution
            formatted_text = tokenizer.apply_chat_template(
                example["messages"], 
                tokenize=False, 
                add_generation_prompt=False
            )
            return [formatted_text]

    # 🛠️ FIX: Pass the raw base_model here. TRL uses peft_config to instrument the matrices safely.
    trainer = SFTTrainer(
        model=base_model,
        train_dataset=dataset,
        peft_config=lora_config,
        args=sft_config,
        formatting_func=formatting_prompts_func
    )

    print("🔥 Commencing weight gradient execution loops...")
    trainer.train()

    print(f"💾 Saving finalized code_classifier_lora matrix file states to: {OUTPUT_DIR}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    trainer.model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("🎯 Training workflow complete.")


    

if __name__ == "__main__":
    # ⚙️ Set up the CLI argument parsing engine
    parser = argparse.ArgumentParser(description="Illustrious LoRA Alignment Training CLI")
    
    parser.add_argument(
        "--model", 
        type=str, 
        default="meta-llama/Meta-Llama-3-8B-Instruct",
        help="Hugging Face repository string ID, dynamic GGUF path, or absolute local volume path"
    )
    
    args = parser.parse_args()
    target_model = args.model.strip()
    
    # 🛠️ GGUF Path Translation Layer
    # If it ends with .gguf, we know it's a dynamic path from the frontend dropdown
    if target_model.endswith(".gguf") or "/q" in target_model.lower():
        print(f"🔄 Intercepted GGUF format path: '{target_model}'")
        
        # Split the string down (e.g., ['Qwen', 'Qwen2.5-Coder-7B-Instruct-GGUF', 'filename.gguf'])
        parts = target_model.replace("__", "/").split("/")
        if len(parts) >= 2:
            author = parts[0]
            repo = parts[1]
            
            # Scrub the trailing '-GGUF' tag to reveal the original base model name
            if repo.endswith("-GGUF"):
                repo = repo[:-5]
            elif repo.endswith("-gguf"):
                repo = repo[:-5]
                
            # Reconstruct the definitive base model identifier
            target_model = f"{author}/{repo}"
            print(f"🎯 Successfully mapped GGUF target to Base Training Model: '{target_model}'")
        else:
            print("⚠️ Path structure unparseable. Falling back to default baseline model profiles.")
            target_model = BASE_MODEL

    # Pass the scrubbed target model string straight into your alignment loop execution
    run_lora_alignment(model_path=target_model)