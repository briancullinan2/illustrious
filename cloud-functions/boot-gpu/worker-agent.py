# worker-agent.py
import io
import torch
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from PIL import Image, ImageDraw
from diffusers import DiffusionPipeline

app = FastAPI(title="Illustrious Juggernaut-Z Spatial Worker")

# Global session matrix cache
pipe = None

def get_pipeline():
    global pipe
    if pipe is None:
        print("⚡ Loading RunDiffusion/Juggernaut-Z-Image into VRAM context...")
        
        # Pulling the optimized half-precision variant to keep execution blindingly fast
        pipe = DiffusionPipeline.from_pretrained(
            "RunDiffusion/Juggernaut-Z-Image",
            torch_dtype=torch.float16, # Use float16 or bfloat16 depending on T4 driver bindings
            variant="fp16",
            use_safetensors=True
        )
        
        # Route processing parameters straight to the CUDA cluster
        pipe.to("cuda")
        
        # Optional VRAM optimization safety loop
        if torch.cuda.get_device_properties(0).total_memory < 16000000000:
            pipe.enable_model_cpu_offload()
            
    return pipe

@app.post("/api/spatial/multicast")
async def multicast_slice(
    prompt: str = Form(...),
    x: int = Form(...),
    y: int = Form(...),
    w: int = Form(...),
    h: int = Form(...),
    file: UploadFile = File(...)
):
    # 1. Capture the incoming 3D canvas stage visual snapshot
    image_bytes = await file.read()
    base_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    width, height = base_image.size

    # 2. Translate percentage-based text controls into precise pixel space coordinates
    px_x = int((x / 100) * width)
    px_y = int((y / 100) * height)
    px_w = int((w / 100) * width)
    px_h = int((h / 100) * height)

    print(f"📡 Mapping Juggernaut-Z focus viewport: X:{px_x} Y:{px_y} W:{px_w} H:{px_h}")

    # 3. Handle the Image Generation/Inpainting loop
    # NOTE: Since Juggernaut-Z utilizes the ultra-modern Lumina2 transformer layers, 
    # we can pass our target crop slice right down the pipeline options array.
    pipeline = get_pipeline()
    
    # We craft an editorial, presentation-ready scene using recommended configuration guidelines
    output = pipeline(
        prompt=prompt,
        guidance_scale=6.0,       # Custom tuned sweet spot for Juggernaut Z
        num_inference_steps=35,   # Recommended range for presentation-ready focus
    ).images[0]

    # 4. Extract the generation matrix and composite it back into your spatial location frame
    # This replaces just the "infected layer slice" section while preserving the surrounding canvas state
    cropped_generation = output.resize((px_w, px_h), Image.Resampling.LANCZOS)
    base_image.paste(cropped_generation, (px_x, px_y))

    # 5. Stream the freshly infected binary JPEG map straight back to your browser canvas
    buffer = io.BytesIO()
    base_image.save(buffer, format="JPEG", quality=90)
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="image/jpeg")

@app.get("/api/health")
def health_check():
    return {
        "status": "READY", 
        "architecture": "lumina2/ZImagePipeline",
        "gpu_available": torch.cuda.is_available()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)