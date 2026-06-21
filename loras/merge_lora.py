import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import os

base_model_path = r"C:\Users\megam\illustrious\hf_cache\models--Goekdeniz-Guelmez--Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1\snapshots\a42fe88f75b3ab545466ca5692fef0b4d7bc8009"
lora_path = r"C:\Users\megam\illustrious\loras\spatial_engine"
output_path = r"C:\Users\megam\illustrious\hf_cache\josiefied-qwen-merged-spatial"

print("📥 Loading base model (CPU mode)...")
# Force CPU usage explicitly and load configuration parameters
model = AutoModelForCausalLM.from_pretrained(
    base_model_path,
    torch_dtype=torch.float32,
    device_map={"": "cpu"}
)
tokenizer = AutoTokenizer.from_pretrained(base_model_path)

print("🔗 Attaching LoRA Weights...")
model = PeftModel.from_pretrained(model, lora_path)

print("🔥 Fusing matrices permanently (Pre-baking)...")
model = model.merge_and_unload()

print(r"💾 Saving pre-baked architecture to temporary folder...")
os.makedirs(output_path, exist_ok=True)
model.save_pretrained(output_path)
tokenizer.save_pretrained(output_path)

print("✨ Successfully merged and baked! Copying template next...")