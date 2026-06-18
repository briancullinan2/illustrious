import os
import sys
import argparse
import platform
import torch
import trimesh
import pyrender
import numpy as np
from PIL import Image
from transformers import AutoProcessor, AutoModel
from pathlib import Path

# ==================== PLATFORM-SPECIFIC RENDERING SETUP ====================
current_os = platform.system()

if current_os == "Linux":
    os.environ["PYOPENGL_PLATFORM"] = "egl"
elif current_os == "Windows":
    # Force Pyglet context fallback to leverage native WGL GPU hardware drivers
    os.environ["PYRENDER_BACKEND"] = "pyglet"
    os.environ["PYOPENGL_PLATFORM"] = "pyglet"
    os.environ["PYOPENGL_FORCE_NO_EGL"] = "1"
else:
    os.environ["PYRENDER_BACKEND"] = "osmesa"

model_id = "HuggingFaceTB/SmolVLM-Instruct"
HF_CACHE_DIR = "hf_cache"


CREDENTIALS_FILE = Path("~/.credentials/huggingface-provider.json").expanduser()

def get_token():
    if CREDENTIALS_FILE.exists():
        with open(CREDENTIALS_FILE, 'r', encoding='utf-8') as f:
            import json
            return json.load(f).get("ACCESS_TOKEN", "").strip()
    return None

HF_TOKEN = get_token()
if HF_TOKEN:
    print(f"Found {HF_TOKEN}, using authenticated HF token...")
    os.environ["HF_TOKEN"] = HF_TOKEN


import subprocess
import tempfile
import shutil
from pathlib import Path

def find_blender_executable() -> str:
    """Find Blender on Windows (common locations)."""
    possible_paths = [
        r"C:\Program Files\Blender Foundation\Blender\blender.exe",
        r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",  # adjust version
        shutil.which("blender"),
        "blender",  # if in PATH
    ]
    for p in possible_paths:
        if p and os.path.exists(p if isinstance(p, str) else p):
            return str(p)
    raise FileNotFoundError("Blender not found. Please install Blender and ensure it's in PATH or update find_blender_executable().")


def render_blender_to_2d(file_path: str, output_image_path: str = "model_preview.png"):
    """Reliable headless 4-view render using external Blender script."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Asset not found: {file_path}")

    print(f"🎬 Processing with Blender: {os.path.basename(file_path)}")

    blender_exe = find_blender_executable()
    print(f"🔧 Using Blender: {blender_exe}")

    # Path to the external script
    script_template_path = os.path.join(os.path.dirname(__file__), "blender_render_script.py")
    
    if not os.path.exists(script_template_path):
        raise FileNotFoundError(f"Blender script template not found: {script_template_path}")

    # Read and fill template
    with open(script_template_path, "r", encoding="utf-8") as f:
        script_content = f.read()

    script_content = script_content.replace("{{MODEL_PATH}}", file_path)
    script_content = script_content.replace("{{OUTPUT_GRID_PATH}}", output_image_path)

    # Write filled script to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding="utf-8") as tmp:
        tmp.write(script_content)
        script_path = tmp.name

    try:
        result = subprocess.run([
            blender_exe,
            "--background",
            "--python", script_path,
        ], capture_output=True, text=True, timeout=180)  # increased timeout

        if result.returncode != 0:
            print("Blender stdout:", result.stdout)
            print("Blender stderr:", result.stderr)
            raise RuntimeError(f"Blender failed with code {result.returncode}")

        print(result.stdout.strip())

    finally:
        try:
            os.unlink(script_path)
        except:
            pass

    if os.path.exists(output_image_path):
        print(f"✅ Render completed → {output_image_path}")
        return output_image_path
    else:
        raise RuntimeError("Blender did not produce the output image.")


def render_model_to_2d(file_path: str, output_image_path: str = "model_preview.png"):
    """Robust headless 3D → 2D renderer with Windows Mesa fallback."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Asset not found: {file_path}")

    print(f"🎬 Processing: {os.path.basename(file_path)}")

    # Load and normalize scene
    trimesh_scene = trimesh.load(file_path, force="scene")
    print(f"📦 Found scene with {len(trimesh_scene.geometry)} geometries.")

    # Robust bounds calculation
    try:
        flat = trimesh_scene.to_geometry() if hasattr(trimesh_scene, 'to_geometry') else trimesh_scene.dump(concatenate=True)
        if isinstance(flat, list):
            flat_mesh = trimesh.util.concatenate(flat)
        else:
            flat_mesh = flat
        bounds = flat_mesh.bounds
    except Exception:
        bounds = trimesh_scene.bounds

    min_pt, max_pt = bounds[0], bounds[1]
    center = (min_pt + max_pt) / 2.0
    extents = max_pt - min_pt
    max_dim = float(np.max(extents)) if extents.max() > 0 else 1.0

    # Vertex fallback for broken scenes
    if max_dim < 1e-5:
        print("⚠️ Zero extents → collecting raw vertices...")
        verts = [g.vertices for g in trimesh_scene.geometry.values() if hasattr(g, 'vertices') and len(g.vertices) > 0]
        if verts:
            v = np.vstack(verts)
            min_pt = v.min(axis=0)
            max_pt = v.max(axis=0)
            center = (min_pt + max_pt) / 2.0
            extents = max_pt - min_pt
            max_dim = float(np.max(extents))

    max_dim = max(max_dim, 1.0)
    print(f"📐 Extents: {np.round(extents, 3)} | Center: {np.round(center, 3)} | Max Dim: {round(max_dim, 3)}")

    # Build pyrender scene
    try:
        scene = pyrender.Scene.from_trimesh_scene(trimesh_scene)
    except Exception as e:
        print(f"⚠️ Scene creation fallback: {e}")
        scene = pyrender.Scene()
        for mesh in trimesh_scene.geometry.values():
            scene.add(pyrender.Mesh.from_trimesh(mesh, smooth=True))

    scene.ambient_light = np.array([0.4, 0.4, 0.4], dtype=np.float32)

    # Camera & views
    yfov = np.pi / 3.0
    camera = pyrender.PerspectiveCamera(yfov=yfov, aspectRatio=1.0)

    distance = max(max_dim * 2.2, (max_dim / 0.65) / np.tan(yfov / 2.0))

    view_angles = [
        {"name": "Front", "pitch": 8,  "yaw": 0},
        {"name": "Side",  "pitch": 5,  "yaw": 90},
        {"name": "Top",   "pitch": 75, "yaw": 45},
        {"name": "Angle", "pitch": -12,"yaw": 35},
    ]

    captured_images = []

    # === Renderer with better Windows compatibility ===
    renderer = None
    try:
        # Force OSMesa if available
        if platform.system() == "Windows":
            os.environ.setdefault("PYOPENGL_PLATFORM", "osmesa")
        
        renderer = pyrender.OffscreenRenderer(viewport_width=512, viewport_height=512)
        print("✅ OffscreenRenderer initialized (Mesa recommended)")
    except Exception as e:
        print(f"⚠️ OffscreenRenderer failed: {e}")
        print("🔄 Falling back to basic Renderer...")
        use_fallback_renderer = True
        try:
            renderer = pyrender.Renderer(viewport_width=512, viewport_height=512)
        except Exception as e2:
            raise RuntimeError(f"Both renderers failed. Install Mesa DLLs (see instructions above). Error: {e2}") from e2

    for view in view_angles:
        pitch = np.radians(view["pitch"])
        yaw = np.radians(view["yaw"])

        dx = distance * np.cos(pitch) * np.sin(yaw)
        dy = -distance * np.cos(pitch) * np.cos(yaw)
        dz = distance * np.sin(pitch)

        cam_pos = center + np.array([dx, dy, dz])

        # Look-at matrix
        z = cam_pos - center
        z /= np.linalg.norm(z)
        up = np.array([0., 0., 1.])
        if abs(np.dot(z, up)) > 0.98:
            up = np.array([0., 1., 0.])
        x = np.cross(up, z)
        x /= np.linalg.norm(x)
        y = np.cross(z, x)

        pose = np.eye(4)
        pose[:3, 0] = x
        pose[:3, 1] = y
        pose[:3, 2] = z
        pose[:3, 3] = cam_pos

        cam_node = scene.add(camera, pose=pose)
        light = pyrender.DirectionalLight(color=[1.0, 1.0, 1.0], intensity=4.5)
        light_node = scene.add(light, pose=pose)

        succeeded = False
        try:
            if use_fallback_renderer:
                color, _ = renderer.render(scene, flags=0) # Must pass explicit flags to low-level Renderer
            else:
                color, _ = renderer.render(scene)
            captured_images.append(Image.fromarray(color.astype(np.uint8)))
            succeeded = True
        except Exception as e:
            print(f"⚠️ View '{view['name']}' render failed: {e}")
            captured_images.append(Image.new('RGB', (512, 512), (50, 50, 60)))
        finally:
            scene.remove_node(cam_node)
            scene.remove_node(light_node)

    if renderer:
        renderer.delete()

    if succeeded:
        # Create 2x2 grid
        grid = Image.new('RGB', (1024, 1024), (30, 30, 35))
        grid.paste(captured_images[0], (0, 0))
        grid.paste(captured_images[1], (512, 0))
        grid.paste(captured_images[2], (0, 512))
        grid.paste(captured_images[3], (512, 512))

        grid.save(output_image_path)
        print(f"✅ Successfully rendered 4-view grid → {output_image_path}")
        return output_image_path
    else:
        return None


# ==================== VISION ANALYSIS PIPELINE ====================
def analyze_image_locally(image_path: str):
    if not os.path.exists(image_path):
        print(f"Error: Image not found: {image_path}", file=sys.stderr)
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
        print("⚠️ Running on CPU (slow execution layer)")

    print(f"📦 Loading {model_id} on {device}...")

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

    print("👁️ Running vision model inference checks...")
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
        print(f"🎬 Rendering model: {args.model}")
        try:
            target_image = render_model_to_2d(args.model, args.output)
        except Exception as e:
            print(f"❌ Structural script runtime failure: {e}", file=sys.stderr)
            sys.exit(1)

    if target_image:
        analyze_image_locally(target_image)