import os
import sys
import argparse
import torch
import trimesh
import pyrender
import numpy as np
from PIL import Image
from transformers import AutoProcessor, AutoModelForVision2Seq

# Force headless rendering backends (so windows don't pop up)
os.environ["PYOPENGL_PLATFORM"] = "egl" 


def render_model_to_2d(file_path: str, output_image_path: str = "snapshot.png"):
    """
    Loads a 3D model, centers it, and captures 4 distinct customizable view angles,
    stitching them into a clean 2x2 image grid for vision validation.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Asset not found: {file_path}")
        
    # 1. Load the scene natively
    trimesh_scene = trimesh.load(file_path, force="scene")
    
    # 2. Extract bounding metrics to handle arbitrary origin offsets
    bounds = trimesh_scene.bounds
    min_pt, max_pt = bounds[0], bounds[1]
    center = (min_pt + max_pt) / 2.0
    extents = max_pt - min_pt
    max_dim = max(extents)
    
    print(f"📐 Extents (X,Y,Z): {np.round(extents, 3)} | Center: {np.round(center, 3)}")

    # 3. Convert to a pyrender scene
    scene = pyrender.Scene.from_trimesh_scene(trimesh_scene)
    scene.ambient_light = np.array([0.2, 0.2, 0.2])
    
    # 4. Setup Camera Optics
    yfov = np.pi / 3.0  # 60-degree field of view
    camera = pyrender.PerspectiveCamera(yfov=yfov, aspectRatio=1.0)
    
    # Calculate distance to safely fill 75% of the quadrant frame
    visible_height_required = max_dim / 0.75
    distance_from_center = (visible_height_required / 2.0) / np.tan(yfov / 2.0)
    distance_from_center = max(distance_from_center, max_dim * 1.2)

    # 5. Define Modifiable Angle List (Pitch and Yaw in degrees)
    # Pitch: 0 is horizon, 90 is top-down looking straight down, negative is looking up
    # Yaw: Rotation around the Z-axis
    view_angles = [
        {"name": "Front", "pitch": 5.0,   "yaw": 0.0},
        {"name": "Side",  "pitch": 5.0,   "yaw": 90.0},
        {"name": "Top",   "pitch": 85.0,  "yaw": 45.0},  # Slightly offset from 90 to preserve orientation
        {"name": "Ant",   "pitch": -15.0, "yaw": 30.0}   # Low angle looking up at the asset
    ]

    captured_images = []
    renderer = pyrender.OffscreenRenderer(viewport_width=512, viewport_height=512)

    # 6. Capture individual frames loop
    for view in view_angles:
        pitch = np.radians(view["pitch"])
        yaw = np.radians(view["yaw"])
        
        # Calculate spherical-to-cartesian camera position relative to the bounding center
        dx = distance_from_center * np.cos(pitch) * np.sin(yaw)
        dy = -distance_from_center * np.cos(pitch) * np.cos(yaw)
        dz = distance_from_center * np.sin(pitch)
        camera_pos = center + np.array([dx, dy, dz])
        
        # Compute look-at orientation vector matrices pointing at the center
        z_axis = camera_pos - center
        z_axis /= np.linalg.norm(z_axis)
        
        up_guess = np.array([0, 0, 1])
        # Safe cross product calculation for steep top-down views
        if np.abs(np.dot(z_axis, up_guess)) > 0.999:
            up_guess = np.array([0, 1, 0])
            
        x_axis = np.cross(up_guess, z_axis)
        x_axis /= np.linalg.norm(x_axis)
        y_axis = np.cross(z_axis, x_axis)
        
        camera_pose = np.eye(4)
        camera_pose[0:3, 0] = x_axis
        camera_pose[0:3, 1] = y_axis
        camera_pose[0:3, 2] = z_axis
        camera_pose[0:3, 3] = camera_pos

        # Add nodes to scene dynamically
        cam_node = scene.add(camera, pose=camera_pose)
        light = pyrender.DirectionalLight(color=[1.0, 1.0, 1.0], intensity=4.0)
        light_node = scene.add(light, pose=camera_pose)
        
        # Render the viewpoint frame pass
        color, _ = renderer.render(scene)
        captured_images.append(Image.fromarray(color))
        
        # Strip nodes out of the scene state tree before the next angle execution pass
        scene.remove_node(cam_node)
        scene.remove_node(light_node)

    renderer.delete()

    # 7. Stitch the 4 frames into a clean 2x2 grid image (1024x1024 total)
    grid_img = Image.new('RGB', (1024, 1024), color=(30, 30, 30)) # Charcoal backup canvas background
    
    grid_img.paste(captured_images[0], (0, 0))       # Top-Left: Front View
    grid_img.paste(captured_images[1], (512, 0))     # Top-Right: Side View
    grid_img.paste(captured_images[2], (0, 512))     # Bottom-Left: Top View
    grid_img.paste(captured_images[3], (512, 512))   # Bottom-Right: Ant Mode View

    grid_img.save(output_image_path)
    print(f"📸 Quad-angle vision grid canvas safely generated at: {output_image_path}")
    
    return output_image_path

def analyze_image_locally(image_path: str):
    if not os.path.exists(image_path):
        print(f"Error: Image path not found: {image_path}", file=sys.stderr)
        sys.exit(1)

    # 1. Select hardware target (cuda for NVIDIA GPU, mps for Apple Silicon, cpu fallback)
    if torch.cuda.is_available():
        device = "cuda"
        dtype = torch.float16  # Use half-precision to save VRAM and increase speed
    elif torch.backends.mps.is_available():
        device = "mps"
        dtype = torch.float16
    else:
        device = "cpu"
        dtype = torch.float32
        print("⚠️  CUDA/MPS not found. Running slowly on CPU...")

    # 2. Define a compact, fast open-weight Vision-Language model
    # SmolVLM is lightweight (~2B params) and excellent at local desktop visual checks
    model_id = "HuggingFaceTB/SmolVLM-Instruct"
    
    print(f"📦 Loading {model_id} onto {device}...")
    processor = AutoProcessor.from_pretrained(model_id)
    model = AutoModelForVision2Seq.from_pretrained(
        model_id, 
        torch_dtype=dtype, 
        _attn_implementation="flash_attention_2" if device == "cuda" else None
    ).to(device)

    # 3. Prep the image and prompt
    try:
        raw_image = Image.open(image_path).convert("RGB")
    except Exception as e:
        print(f"Error opening image: {e}", file=sys.stderr)
        sys.exit(1)

    # We format the prompt using standard Chat ML templates the model expects
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image"},
                {"type": "text", "text": "Is this a 3D model render of a castle, fortress, or medieval tower architecture? Answer with 'YES' or 'NO' followed by a one-sentence reason."}
            ]
        }
    ]
    
    prompt = processor.apply_chat_template(messages, add_generation_prompt=True)

    # 4. Run Inference completely offline
    print("👁️  Running local inference asset check...")
    inputs = processor(text=prompt, images=raw_image, return_tensors="pt").to(device, dtype)
    
    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=100)
    
    # 5. Output Result
    generated_texts = processor.batch_decode(generated_ids, skip_special_tokens=True)
    
    print("\n--- LOCAL VISION ANALYSIS ---")
    # Clean up the output to print just the model's fresh answer string
    print(generated_texts[0].split("assistant")[-1].strip())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Spatial Engine local pipeline: 3D Rendering & Hugging Face Vision Verification"
    )
    
    # Mutually exclusive group makes sure you provide either a 3D model OR a pre-baked image snapshot
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--model", 
        type=str, 
        help="Path to the 3D asset file (e.g., .fbx, .glb) to render and verify"
    )
    group.add_argument(
        "--image", 
        type=str, 
        help="Path to an existing 2D snapshot image to verify directly"
    )
    
    # Optional flags for customizing the asset workflow
    parser.add_argument(
        "--output", 
        type=str, 
        default="castle_preview.png", 
        help="Target destination file path for the generated 2D render snapshot"
    )

    args = parser.parse_args()

    # Determine our target image file path
    target_image_path = args.image

    # If a 3D model was provided, process the render phase first
    if args.model:
        print(f"🎬 Initializing headless render routine for target model: {args.model}")
        try:
            # Call your rendering function
            target_image_path = render_model_to_2d(
                file_path=args.model, 
                output_image_path=args.output
            )
        except Exception as e:
            print(f"❌ Rendering processing engine failed: {e}", file=sys.stderr)
            sys.exit(1)

    # Fire the local vision transformer layer on the image snapshot
    if target_image_path:
        analyze_image_locally(image_path=target_image_path)