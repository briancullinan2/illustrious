import torch
from diffusers import StableDiffusionXLPipeline, AutoencoderKL

# 1. Load the lightweight baseline diffusion canvas engine
pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0", 
    torch_dtype=torch.float32 # Forces stable desktop execution processing tracks
)
pipe.to("cpu") # Fallback to standard execution if processing without VRAM arrays

# 2. Seamlessly snap your custom facial weights onto the base cross-attention paths
pipe.load_lora_weights("./my_face_lora_output", weight_name="bjcullinan_face.safetensors", adapter_name="my_face")

# 3. Fire off the prompt using your unique anchor token trigger word!
prompt = "A high-quality cinematic film shot of bjcullinan man as a retro astronaut standing on the surface of Mars, looking at Earth, dramatic lighting, sharp focus"

print("🎨 Synthesizing custom facial composition matrix...")
image = pipe(prompt, num_inference_steps=30, guidance_scale=7.5).images[0]

# 4. Export the finalized composition to disk
image.save("./bjcullinan_on_mars.png")
print("🚀 Done! Image compiled and written to drive.")