import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model_path = "./Josiefied-Qwen"  # Path to your local base model folder
lora_model_path = "./path_to_your_lora" # Path to your LoRA adapter folder
output_path = "./Josiefied-Qwen-Merged" # Where to save the combined model

print("Loading base model...")
model = AutoModelForCausalLM.from_pretrained(
    base_model_path,
    torch_dtype=torch.bfloat16, # Match the original model precision
    device_map="cpu"            # CPU is fine for merging and avoids VRAM limits
)
tokenizer = AutoTokenizer.from_pretrained(base_model_path)

print("Loading LoRA adapter...")
model = PeftModel.from_pretrained(model, lora_model_path)

print("Merging weights...")
model = model.merge_and_unload()

print("Saving merged model...")
model.save_pretrained(output_path)
tokenizer.save_pretrained(output_path)
print("Done!")