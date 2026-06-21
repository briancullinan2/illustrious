# Clone the repository
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Install conversion dependencies
pip install -r requirements.txt

pip install huggingface_hub
huggingface-cli download Goekdeniz-Guelmez/Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1 --local-dir ./Josiefied-Qwen

python convert_hf_to_gguf.py ./Josiefied-Qwen --outtype f16 --outfile ./josiefied-qwen-f16.gguf

# For Linux/macOS
make llama-quantize

# Alternatively, if you use CMake:
# cmake -B build && cmake --build build --config Release --target llama-quantize

./llama-quantize ./josiefied-qwen-f16.gguf ./josiefied-qwen-q4_k_m.gguf Q4_K_M

./llama-quantize ./josiefied-qwen-f16.gguf ./josiefied-qwen-q5_k_m.gguf Q5_K_M

pip install transformers peft torch

python convert_hf_to_gguf.py ./Josiefied-Qwen-Merged --outtype f16 --outfile ./josiefied-qwen-merged-f16.gguf

# For your ~315 MB target size (Highly Recommended)
./llama-quantize ./josiefied-qwen-merged-f16.gguf ./josiefied-qwen-merged-q4_k_m.gguf Q4_K_M

# For your ~360 MB target size
./llama-quantize ./josiefied-qwen-merged-f16.gguf ./josiefied-qwen-merged-q5_k_m.gguf Q5_K_M

python convert_lora_to_gguf.py ./path_to_your_lora --outfile ./my_lora.gguf

python convert_lora_to_gguf.py ./path_to_your_lora_folder --outfile ./my_custom_lora.gguf


python ..\illustrious\loras\download_weights.py

python convert_hf_to_gguf.py ..\illustrious\hf_cache\models--Goekdeniz-Guelmez--Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1\snapshots\a42fe88f75b3ab545466ca5692fef0b4d7bc8009\ --outtype f16 --outfile ..\illustrious\hf_cache\models--Goekdeniz-Guelmez--Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1\josiefied-qwen-f16.gguf

./llama-quantize ..\illustrious\hf_cache\models--Goekdeniz-Guelmez--Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1\josiefied-qwen-f16.gguf ..\illustrious\hf_cache\models--Goekdeniz-Guelmez--Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1\josiefied-qwen-q4_k_m.gguf Q4_K_M

 python convert_lora_to_gguf.py ..\illustrious\loras\spatial_engine\ --outfile ..\illustrious\hf_cache\models--Goekdeniz-Guelmez--Josiefied-Qwen2.5-0.5B-Instruct-abliterated-v1\my_custom_lora.gguf

 

