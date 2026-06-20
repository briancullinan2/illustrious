import os
import sys
import argparse
import platform
import json
from pathlib import Path

import torch
import trimesh
import numpy as np
from PIL import Image
from transformers import AutoProcessor, AutoModel

sys.path.insert(0, str(Path(__file__).resolve().parent))
from draco_glb import load_glb_scene

model_id = "HuggingFaceTB/SmolVLM-Instruct"
HF_CACHE_DIR = "hf_cache"
CREDENTIALS_FILE = Path("~/.credentials/huggingface-provider.json").expanduser()

def get_token():
    if CREDENTIALS_FILE.exists():
        with open(CREDENTIALS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f).get("ACCESS_TOKEN", "").strip()
    return None

HF_TOKEN = get_token()
if HF_TOKEN:
    os.environ["HF_TOKEN"] = HF_TOKEN

# ==================== REPAIR & EXTRACTION LOGIC ====================
def compute_scene_bounds(scene):
    mins = np.array([np.inf, np.inf, np.inf])
    maxs = np.array([-np.inf, -np.inf, -np.inf])

    for geom in scene.geometry.values():
        if len(geom.vertices) == 0:
            continue
        verts = np.asarray(geom.vertices)
        if not np.isfinite(verts).all():
            continue
        mins = np.minimum(mins, verts.min(axis=0))
        maxs = np.maximum(maxs, verts.max(axis=0))

    if np.any(np.isinf(mins)) or np.any(np.isinf(maxs)):
        return np.zeros(3), np.ones(3), 1.0

    center = (mins + maxs) * 0.5
    extents = maxs - mins
    extents_norm = np.linalg.norm(extents)
    radius = max(extents_norm * 0.5, 0.001)

    return center, extents, radius

def build_camera_transform(center, distance, pitch_deg, yaw_deg):
    """Computes look-at projection matrices using pitch and yaw angles."""
    pitch = np.radians(pitch_deg)
    yaw = np.radians(yaw_deg)

    dx = distance * np.cos(pitch) * np.sin(yaw)
    dy = -distance * np.cos(pitch) * np.cos(yaw)
    dz = distance * np.sin(pitch)

    cam_pos = center + np.array([dx, dy, dz])
    z = cam_pos - center
    z /= np.linalg.norm(z)

    up = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(z, up)) > 0.99:
        up = np.array([0.0, 1.0, 0.0])

    x = np.cross(up, z)
    x /= np.linalg.norm(x)
    y = np.cross(z, x)

    pose = np.eye(4)
    pose[:3, 0] = x
    pose[:3, 1] = y
    pose[:3, 2] = z
    pose[:3, 3] = cam_pos
    return pose

# ==================== HARDWARE-INDEPENDENT SOFTWARE RASTERIZER ====================
def render_model_to_2d(file_path: str, output_image_path: str = "model_preview.png"):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Asset target not found: {file_path}")

    print(f"🎬 Processing Engine: {os.path.basename(file_path)}")
    
    # Safely unpack Draco-compressed scene metrics via custom loader layer
    trimesh_scene = load_glb_scene(file_path)
    center, extents, radius = compute_scene_bounds(trimesh_scene)
    
    print(f"📐 Scene Center: {np.round(center, 3)} | Calculated Radius: {round(radius, 3)}")

    # Adjust perspective constraints cleanly
    distance = radius * 2.5

    view_angles = [
        {"name": "Front Elevated", "pitch": 25,  "yaw": 35},
        {"name": "Side Profile",   "pitch": 15,  "yaw": 115},
        {"name": "High Angle Top", "pitch": 65,  "yaw": 45},
        {"name": "Low Pitch Angle","pitch": -10, "yaw": 20},
    ]

    captured_images = []

    for view in view_angles:
        try:
            # Build look-at matrix relative to bounding centers
            cam_pose = build_camera_transform(center, distance, view["pitch"], view["yaw"])
            
            # Apply camera transforms directly to camera entity configurations
            trimesh_scene.camera.transform = cam_pose
            trimesh_scene.camera.resolution = [512, 512]
            
            # Pure software vector-to-raster dump (completely bypasses PyOpenGL and driver checks)
            png_bytes = trimesh_scene.save_image(background=[30, 30, 35, 255])
            
            from io import BytesIO
            img = Image.open(BytesIO(png_bytes)).convert("RGB")
            captured_images.append(img)
        except Exception as e:
            print(f"⚠️ View '{view['name']}' software save backup failure: {e}")
            captured_images.append(Image.new('RGB', (512, 512), (50, 50, 60)))

    # Coalesce the views array into a unified 2x2 layout canvas sheet matrix
    grid = Image.new('RGB', (1024, 1024), (30, 30, 35))
    grid.paste(captured_images[0], (0, 0))
    grid.paste(captured_images[1], (512, 0))
    grid.paste(captured_images[2], (0, 512))
    grid.paste(captured_images[3], (512, 512))

    grid.save(output_image_path)
    print(f"✅ Successfully rendered asset sheet layout -> {output_image_path}")
    return output_image_path

# ==================== VISION ANALYSIS PIPELINE ====================
def analyze_image_locally(image_path: str):
    if not os.path.exists(image_path):
        print(f"Error: Target image target context missing: {image_path}", file=sys.stderr)
        sys.exit(1)

    if torch.cuda.is_available():
        device = "cuda"
        dtype = torch.float16
    elif torch.backends.mps.is_available():
        device = "mps"
        dtype = torch.float16
    else:
        device = "cpu"
        dtype = torch.float32
        print("⚠️ Running on execution fallback stack (CPU)")

    print(f"📦 Instantiating model wrapper: {model_id} on engine target {device}...")

    processor = AutoProcessor.from_pretrained(model_id, cache_dir=HF_CACHE_DIR, token=HF_TOKEN)
    model = AutoModel.from_pretrained(
        model_id,
        torch_dtype=dtype,
        _attn_implementation="flash_attention_2" if device == "cuda" else None,
        cache_dir=HF_CACHE_DIR,
        token=HF_TOKEN
    ).to(device)

    raw_image = Image.open(image_path).convert("RGB")

    messages = [{
        "role": "user",
        "content": [
            {"type": "image"},
            {"type": "text", "text": "Is this a 3D model render of a castle, fortress, building, stoneware, or medieval tower? Answer YES or NO + one short reason."}
        ]
    }]

    prompt = processor.apply_chat_template(messages, add_generation_prompt=True)
    inputs = processor(text=prompt, images=raw_image, return_tensors="pt").to(device)

    print("👁️ Launching verification model forward checks...")
    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=120)

    generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    answer = generated_text.split("assistant")[-1].strip()

    print("\n--- LOCAL VISION ANALYSIS ---")
    print(answer)

# ==================== EXECUTION CONTROL GATE ====================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cross-Platform 3D Asset Validation Engine")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--model", type=str, help="Path to target 3D asset (.glb/.obj/.fbx/.stl)")
    group.add_argument("--image", type=str, help="Path to pre-existing verification canvas image")
    parser.add_argument("--output", type=str, default="model_preview.png", help="Output collage path location")

    args = parser.parse_args()
    target_image = args.image

    if args.model:
        try:
            target_image = render_model_to_2d(args.model, args.output)
        except Exception as e:
            print(f"❌ Structural script runtime evaluation failure: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            sys.exit(1)

    #if target_image:
    #    analyze_image_locally(target_image)