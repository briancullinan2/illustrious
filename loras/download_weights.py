import os
from pathlib import Path
from huggingface_hub import snapshot_download

# Get the absolute path to the directory containing this script
current_dir = Path(__file__).resolve().parent
HF_CACHE_DIR = "hf_cache"

# Resolve the target folder path cleanly using your parent directory jump
target_cache_path = (current_dir / ".." / HF_CACHE_DIR).resolve()

print(f"Setting HF_HOME cache root layout to: {target_cache_path}")

# Force the Hugging Face library to use this target folder for raw cache storage
os.environ["HF_HOME"] = str(target_cache_path)

# Download the model weights directly into the raw cache layout
snapshot_download(
    repo_id="Goekdeniz-Guelmez/Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1",
    repo_type="model"
)

print("Download complete. Raw cache structure populated successfully.")