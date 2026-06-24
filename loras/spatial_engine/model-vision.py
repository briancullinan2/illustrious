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
from transformers import AutoProcessor, AutoModel, AutoModelForImageTextToText

from huggingface_hub import hf_hub_download
from llama_cpp import Llama
from llama_cpp.llama_chat_format import MoondreamChatHandler  # Handles the vision projection layer
from llama_cpp.llama_chat_format import Llava15ChatHandler   # or Llava16ChatHandler
from llama_cpp.llama_chat_format import MTMDChatHandler

sys.path.insert(0, str(Path(__file__).resolve().parent))
from draco_glb import load_glb_scene


# --- Global Engine State ---
processor = None
model = None

# Variables for the specific files needed
GGUF_REPO_PATH = "ggml-org/SmolVLM2-2.2B-Instruct-GGUF"
GGUF_MODEL_PATH = "SmolVLM2-2.2B-Instruct-Q4_K_M.gguf"
GGUF_MMPROJ_PATH = "mmproj-SmolVLM2-2.2B-Instruct-Q8_0.gguf"
GGUF_ORIGINAL_PATH = "HuggingFaceTB/SmolVLM2-2.2B-Instruct"

model_id = "HuggingFaceTB/SmolVLM-Instruct"
HF_CACHE_DIR = "hf_cache"
CREDENTIALS_FILE = Path("~/.credentials/huggingface-provider.json").expanduser()



processor = None
model = None
device = None
dtype = None



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



def analyze_image_locally(image_path: str):
    global processor, model, device, dtype

    if not os.path.exists(image_path):
        print(f"Error: Target image missing: {image_path}", file=sys.stderr)
        sys.exit(1)

    # Lazy Initialization
    if model is None or processor is None:
        if torch.cuda.is_available():
            device = "cuda"
            dtype = torch.bfloat16
            attn_impl = "flash_attention_2"
        elif torch.backends.mps.is_available():
            device = "mps"
            dtype = torch.float16
            attn_impl = None
        else:
            device = "cpu"
            dtype = torch.float32
            attn_impl = None
            print("Running on CPU...")

        print(f"Loading SmolVLM on {device}...")

        processor = AutoProcessor.from_pretrained(
            model_id, 
            cache_dir=HF_CACHE_DIR, 
            token=HF_TOKEN
        )

        model = AutoModelForImageTextToText.from_pretrained(   # ← Updated class
            model_id,
            torch_dtype=dtype,
            _attn_implementation=attn_impl,
            cache_dir=HF_CACHE_DIR,
            token=HF_TOKEN,
            # device_map="auto",   # Good for low VRAM
        ).to(device)

        if device == "cpu":
            num_cores = os.cpu_count() or 4
            torch.set_num_threads(max(1, num_cores // 2))
            try:
                model = torch.compile(model)
                print("Model compiled.")
            except Exception:
                pass

    raw_image = Image.open(image_path).convert("RGB")

    messages = [{
        "role": "user",
        "content": [
            {"type": "image"},
            {"type": "text", "text": "Categorize the image with descriptive adjectives and nouns. Respond quickly with only the whitespace delimited list of words."}
        ]
    }]

    prompt = processor.apply_chat_template(messages, add_generation_prompt=True)
    
    inputs = processor(text=prompt, images=raw_image, return_tensors="pt").to(device)

    if "pixel_values" in inputs:
        inputs["pixel_values"] = inputs["pixel_values"].to(dtype)

    print("Running inference...")
    with torch.no_grad():
        generated_ids = model.generate(
            **inputs, 
            max_new_tokens=120,
            do_sample=False,
            temperature=0.0,
        )

    generated_ids_trimmed = [
        out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
    ]
    answer = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True)[0].strip()

    print("\n--- LOCAL VISION ANALYSIS ---")
    print(answer)
    return answer


def analyze_image_gguf(image_path: str):
    global model

    if not os.path.exists(image_path):
        print(f"Error: Image missing: {image_path}", file=sys.stderr)
        sys.exit(1)

    if model is None:
        print("Loading SmolVLM GGUF on CPU (optimized for i7)...")
        num_cores = os.cpu_count() or 4
        optimal_threads = max(1, num_cores // 2)

        # Download model + mmproj
        local_model_path = hf_hub_download(
            repo_id=GGUF_REPO_PATH,
            filename=GGUF_MODEL_PATH,
            cache_dir=HF_CACHE_DIR,
            token=HF_TOKEN
        )

        local_mmproj_path = hf_hub_download(
            repo_id=GGUF_REPO_PATH,
            filename=GGUF_MMPROJ_PATH,
            cache_dir=HF_CACHE_DIR,
            token=HF_TOKEN
        )

        # Use the correct chat handler for SmolVLM / Moondream-style models
        chat_handler = MTMDChatHandler(
            clip_model_path=local_mmproj_path,
            verbose=False
        )

        model = Llama(
            model_path=local_model_path,
            chat_handler=chat_handler,
            n_ctx=2048,
            n_threads=optimal_threads,
            n_gpu_layers=0,        # CPU only
            verbose=False,
        )

    # Better prompt for SmolVLM + force image inclusion
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Categorize the image with descriptive adjectives and nouns. Respond quickly with only the whitespace delimited list of words."},
                #{"type": "image", "image": os.path.abspath(image_path)},
                {"type": "image_url", "image_url": {"url": f"file://{os.path.abspath(image_path)}"}}
            ]
        }
    ]

    print("Running GGUF VLM inference...")
    response = model.create_chat_completion(
        messages=messages,
        max_tokens=100,
        temperature=0.1,      # Slight temp helps small models
        top_p=0.9,
    )

    raw_content = response["choices"][0]["message"]["content"]
    answer = raw_content.strip() if raw_content else "No output."

    print("\n--- LOCAL VISION ANALYSIS ---")
    print(answer)
    
    try:
        model.close()
    except Exception:
        pass
        
    return answer




if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cross-Platform 3D Asset Validation Engine")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--model", type=str, help="Path to target 3D asset (.glb/.obj/.fbx/.stl)")
    group.add_argument("--image", type=str, help="Path to pre-existing verification canvas image")
    parser.add_argument("--output", type=str, default="model_preview.png", help="Output collage path location")
    parser.add_argument("--analyze", type=lambda x: (str(x).lower() == 'true'), default=False, help="Use vision LLM to describe model")

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

    if target_image and args.analyze:
        analyze_image_gguf(target_image)