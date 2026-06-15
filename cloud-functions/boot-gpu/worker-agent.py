import io
import os
import time
import threading
import torch
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from PIL import Image
from diffusers import DiffusionPipeline
import platform

app = FastAPI(title="Illustrious Juggernaut-Z Spatial Worker")

# ⏱️ Idle Autoclose Configuration
IDLE_TIMEOUT_SECONDS = 600  # 10 minutes of silence before shutting down
last_activity_time = time.time()

# Global session matrix cache
pipe = None

def get_pipeline():
    global pipe
    if pipe is None:
        current_os = platform.system()
        
        print("⚡ Loading RunDiffusion/Juggernaut-Z into VRAM context...")
        pipe = DiffusionPipeline.from_pretrained(
            "/mnt/vault/Juggernaut-Z",
            torch_dtype=torch.float16,
            variant="fp16",
            use_safetensors=True
        )
        if current_os == "Darwin":
            print("🍏 Context bound to Apple Silicon. Activating Metal (MPS) device pipeline...")
            pipe.to("mps")
            
        # 🐧 Handle Cloud Linux execution layer
        elif current_os == "Linux":
            print("🐧 Context bound to Cloud Linux. Activating native NVIDIA CUDA cluster...")
            pipe.to("cuda")
            # Keep your cloud-specific VRAM optimization step here safely
            if torch.cuda.is_available() and torch.cuda.get_device_properties(0).total_memory < 16000000000:
                pipe.enable_model_cpu_offload()
                
        else:
            raise NotImplementedError(f"Operating system topology '{current_os}' not supported by current backend configuration.")
            
    return pipe

def record_activity():
    """Resets the idle clock whenever the frontend hits a core endpoint."""
    global last_activity_time
    last_activity_time = time.time()

def idle_monitor_loop():
    """Background thread that kills the instance if it remains idle."""
    print(f"⏰ Idle monitor started. Timeout set to {IDLE_TIMEOUT_SECONDS}s.")
    while True:
        time.sleep(30)
        idle_duration = time.time() - last_activity_time
        if idle_duration > IDLE_TIMEOUT_SECONDS:
            print(f"🛑 Worker idle for {int(idle_duration)}s. Initiating self-shutdown...")
            # Commands the host OS to shut down immediately
            os.system("sudo shutdown -h now")

# Spin up the monitor as a daemon thread so it doesn't block FastAPI startup
threading.Thread(target=idle_monitor_loop, daemon=True).start()


@app.post("/api/spatial/multicast")
async def multicast_slice(
    prompt: str = Form(...),
    x: int = Form(...),
    y: int = Form(...),
    w: int = Form(...),
    h: int = Form(...),
    file: UploadFile = File(...)
):
    record_activity() # ⚡ Reset the clock!
    
    image_bytes = await file.read()
    base_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    width, height = base_image.size

    px_x = int((x / 100) * width)
    px_y = int((y / 100) * height)
    px_w = int((w / 100) * width)
    px_h = int((h / 100) * height)

    print(f"📡 Mapping Juggernaut-Z focus viewport: X:{px_x} Y:{px_y} W:{px_w} H:{px_h}")

    pipeline = get_pipeline()
    output = pipeline(
        prompt=prompt,
        guidance_scale=6.0,
        num_inference_steps=35,
    ).images[0]

    cropped_generation = output.resize((px_w, px_h), Image.Resampling.LANCZOS)
    base_image.paste(cropped_generation, (px_x, px_y))

    buffer = io.BytesIO()
    base_image.save(buffer, format="JPEG", quality=90)
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="image/jpeg")

@app.get("/api/health")
def health_check():
    # Optional: You can choose whether health checks reset the idle timer.
    # If your frontend polls health continuously on an interval, do NOT record_activity() here
    # or the machine will never turn off.
    return {
        "status": "READY", 
        "architecture": "lumina2/ZImagePipeline",
        "gpu_available": torch.cuda.is_available()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)