import os
import sys
import argparse
import platform
import json
from pathlib import Path

# Clear any legacy or conflicting PyOpenGL/pyrender configuration keys instantly
for env_key in ["PYOPENGL_PLATFORM", "PYRENDER_BACKEND", "PYOPENGL_FORCE_NO_EGL"]:
    if env_key in os.environ:
        del os.environ[env_key]

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
    """Computes layout look-at camera tracking matrices matching Blender metrics."""
    pitch = np.radians(pitch_deg)
    yaw = np.radians(yaw_deg)

    dx = distance * np.cos(pitch) * np.sin(yaw)
    dy = -distance * np.cos(pitch) * np.cos(yaw)
    dz = distance * np.sin(pitch)

    cam_pos = center + np.array([dx, dy, dz])
    
    forward = center - cam_pos
    f_norm = np.linalg.norm(forward)
    if f_norm < 1e-6:
        forward = np.array([0.0, -1.0, 0.0])
    else:
        forward = forward / f_norm

    world_up = np.array([0.0, 0.0, 1.0])
    right = np.cross(forward, world_up)
    r_norm = np.linalg.norm(right)
    
    if r_norm < 1e-6:
        alternative_up = np.array([1.0, 0.0, 0.0])
        right = np.cross(forward, alternative_up)
        right /= max(np.linalg.norm(right), 1e-6)
    else:
        right = right / r_norm

    true_up = np.cross(right, forward)
    true_up /= max(np.linalg.norm(true_up), 1e-6)

    pose = np.eye(4)
    pose[:3, 0] = right
    pose[:3, 1] = true_up
    pose[:3, 2] = -forward
    pose[:3, 3] = cam_pos
    return pose


def build_view_pose(center, distance, pitch_deg, yaw_deg):
    """Computes camera look-at transformation matrix targets using yaw and pitch.
    
    Coordinates map pitch and yaw directly to match standard Blender tracking metrics.
    """
    # Map coordinates to align with standard pitch/yaw angle frames
    pitch = np.radians(pitch_deg)
    yaw = np.radians(yaw_deg)

    # Calculate spherical offsets relative to target scene center bounding boxes
    dx = distance * np.cos(pitch) * np.sin(yaw)
    dy = -distance * np.cos(pitch) * np.cos(yaw)
    dz = distance * np.sin(pitch)

    camera_position = center + np.array([dx, dy, dz])
    
    # Compute look-at forward vector (-Z is forward in camera space)
    forward = center - camera_position
    f_norm = np.linalg.norm(forward)
    if f_norm < 1e-6:
        forward = np.array([0.0, -1.0, 0.0])
    else:
        forward = forward / f_norm

    # Calculate right vector using standard world-up vector (+Z is world-up)
    world_up = np.array([0.0, 0.0, 1.0])
    right = np.cross(forward, world_up)
    r_norm = np.linalg.norm(right)
    
    if r_norm < 1e-6:
        alternative_up = np.array([1.0, 0.0, 0.0])
        right = np.cross(forward, alternative_up)
        right /= max(np.linalg.norm(right), 1e-6)
    else:
        right = right / r_norm

    # Re-orthogonalize the true camera up vector
    true_up = np.cross(right, forward)
    true_up /= max(np.linalg.norm(true_up), 1e-6)

    # Assemble transformation matrix
    pose = np.eye(4)
    pose[:3, 0] = right
    pose[:3, 1] = true_up
    pose[:3, 2] = -forward  # Camera looks down its native -Z axis
    pose[:3, 3] = camera_position

    return pose



def render_model_to_2d(file_path: str, output_image_path: str = "model_preview.png"):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Asset target not found: {file_path}")

    print(f"🎬 Processing Engine: {os.path.basename(file_path)}")
    
    # Safely unpack Draco-compressed scene metrics via custom loader layer
    trimesh_scene = load_glb_scene(file_path)
    center, extents, radius = compute_scene_bounds(trimesh_scene)
    
    print(f"📐 Scene Center: {np.round(center, 3)} | Calculated Radius: {round(radius, 3)}")

    # Keep a non-zero fill baseline bounding track distance factor
    distance = radius * 2.5

    # Direct port of Blender angle vectors tracking metrics
    view_angles = [
        {"name": "Front Elevated", "pitch": 8,   "yaw": 0},
        {"name": "Side Profile",   "pitch": 5,   "yaw": 90},
        {"name": "High Angle Top", "pitch": 75,  "yaw": 45},
        {"name": "Low Pitch Angle", "pitch": -12, "yaw": 35},
    ]

    captured_images = []

    for view in view_angles:
        try:
            # Re-initialize a clean perspective transformation frame copy
            view_scene = trimesh_scene.copy()
            
            # Build look-at matrix relative to bounding centers
            cam_pose = build_view_pose(center, distance, view["pitch"], view["yaw"])
            
            # Direct scene-graph property update for the active camera node
            view_scene.camera_transform = cam_pose
            view_scene.camera.resolution = [512, 512]
            
            # Pure software vector-to-raster dump (completely bypasses PyOpenGL and driver checks)
            png_bytes = view_scene.save_image(background=[30, 30, 35, 255])
            
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