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
from trl import SFTTrainer

# ============================================================================
# Core Training Infrastructure Configuration
# ============================================================================
BASE_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"  # Or "Qwen/Qwen2.5-Coder-7B-Instruct"
DATASET_PATH = "dataset.json"
OUTPUT_DIR = "loras/code_classifier_lora"

# 🔑 Pull from your secure environment token configuration setup
CREDENTIALS_FILE = Path("~/.credentials/huggingface-provider.json").expanduser()
def get_token():
    if CREDENTIALS_FILE.exists():
        with open(CREDENTIALS_FILE, 'r') as f:
            import json
            return json.load(f).get("ACCESS_TOKEN", "")
    return None

HF_TOKEN = get_token()

def run_lora_alignment():
    print(f"📡 Loading custom dataset from: {DATASET_PATH}")
    dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

    print(f"⚡ Initializing quantized base model layers: {BASE_MODEL}")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, token=HF_TOKEN)
    tokenizer.pad_token = tokenizer.eos_token

    # Compress the base weights into 4-bit arrays to save VRAM overhead
    quant_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True
    )

    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        quantization_config=quant_config,
        device_map="auto",
        token=HF_TOKEN
    )

    # Prepare model configurations for low-rank token adjustments
    base_model = prepare_model_for_kbit_training(base_model)

    # 🧬 Define the explicit LoRA target matrix maps
    lora_config = LoraConfig(
        r=16,                  # Rank size (higher = more memory, lower = more rigid)
        lora_alpha=32,         # Weight scaling factor constant
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"], # Target core self-attention nodes
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )

    print("🧬 Blending low-rank structural parameters into attention paths...")
    model = get_peft_model(base_model, lora_config)
    model.print_trainable_parameters()

    # Configure training execution boundaries
    training_args = TrainingArguments(
        output_dir="./training_outputs",
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=10,
        max_steps=100,         # Run a tight optimization sweep over the specialized tokens
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        save_strategy="no",    # Only save the definitive final adapter layer set
        report_to="none"
    )

    print("🚀 Initializing SFT Trainer core pipeline...")
    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        peft_config=lora_config,
        max_seq_length=512,    # Cap code snippets length to prevent out-of-memory issues
        tokenizer=tokenizer,
        args=training_args,
    )

    print("🔥 Commencing weight gradient execution loops...")
    trainer.train()

    print(f"💾 Saving finalized code_classifier_lora matrix file states to: {OUTPUT_DIR}")
    trainer.model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("🎯 Training workflow complete.")

if __name__ == "__main__":
    run_lora_alignment()