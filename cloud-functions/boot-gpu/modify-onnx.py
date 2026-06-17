from datasets import load_dataset
from sentence_transformers import SentenceTransformer, losses, InputExample
from torch.utils.data import DataLoader
from peft import LoraConfig, get_peft_model

# 1. Load the base PyTorch model
base_model = SentenceTransformer("BAAI/bge-small-en-v1.5")

# 2. Define LoRA configuration targeting the attention layers
peft_config = LoraConfig(
    r=8, 
    lora_alpha=16, 
    target_modules=["query", "value"], 
    lora_dropout=0.05, 
    bias="none"
)

# 3. Wrap the underlying transformer with PEFT
# SentenceTransformers stores the core transformer in the first element of the pipeline
base_model[0].auto_model = get_peft_model(base_model[0].auto_model, peft_config)

# 4. (Optional) Run your training loop here using your dataset and losses.SimpleContrastiveLoss
# ... train the model ...

# 5. Save the trained adapter weights
base_model[0].auto_model.save_pretrained("./bge-lora-adapter")


from transformers import AutoModel
from peft import PeftModel

# Load the original base transformer model
base_transformer = AutoModel.from_pretrained("BAAI/bge-small-en-v1.5")

# Load the adapter weights onto the base model
peft_model = PeftModel.from_pretrained(base_transformer, "./bge-lora-adapter")

# Merge the LoRA weights permanently into the base weights and unload the adapter architecture
merged_model = peft_model.merge_and_unload()

# Save the unified PyTorch model
merged_model.save_pretrained("./bge-fused-model")

#pip install optimum[onnxruntime]

#optimum-cli export onnx \
#  --model ./bge-fused-model \
#  --task feature-extraction \
#  --optimize O2 \
#  ./bge-onnx-output/

