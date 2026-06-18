import os
import math
import bpy

def render_model_to_grid(model_path, output_path):
    # Clear default scene items
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Import the asset
    ext = os.path.splitext(model_path)[1].lower()
    if ext in ['.glb', '.gltf']:
        bpy.ops.import_scene.gltf(filepath=model_path)
    elif ext == '.obj':
        bpy.ops.wm.obj_import(filepath=model_path)
    elif ext == '.fbx':
        bpy.ops.import_scene.fbx(filepath=model_path)
    elif ext == '.stl':
        bpy.ops.wm.stl_import(filepath=model_path)
    else:
        raise ValueError(f"Unsupported asset format extension: {ext}")

    # Compute bounding metrics across all imported objects
    obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    if not obs:
        raise ValueError("No valid mesh geometry loaded into the layout tree.")

    # Frame geometry bounds
    for obj in obs:
        obj.select_set(True)
    bpy.ops.view3d.camera_to_view_selected()

    # Add a clean camera and tracking point
    cam_data = bpy.data.cameras.new(name="ValidationCam")
    cam_obj = bpy.data.objects.new("ValidationCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Create an anchor target at the origin
    target = bpy.data.objects.new("Anchor", None)
    bpy.context.scene.collection.objects.link(target)
    
    # Add constraint to camera to always track the target origin
    track = cam_obj.constraints.new(type='TRACK_TO')
    track.target = target
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'

    # Light setup
    light_data = bpy.data.lights.new(name="Sun", type='SUN')
    light_obj = bpy.data.objects.new("Sun", light_data)
    bpy.context.scene.collection.objects.link(light_obj)
    light_data.energy = 3.0

    # Shading options: render flat colors with basic ambient pass
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.data, "version") and bpy.data.version >= (4, 2) else 'BLENDER_EEVEE'
    bpy.context.scene.render.resolution_x = 512
    bpy.context.scene.render.resolution_y = 512

    # View configurations matrix [Pitch, Yaw]
    views = [
        {"name": "Front", "p": 5,   "y": 0},
        {"name": "Side",  "p": 5,   "y": 90},
        {"name": "Top",   "p": 80,  "y": 45},
        {"name": "Angle", "p": -15, "y": 30}
    ]

    from PIL import Image
    captured_frames = []

    for idx, v in enumerate(views):
        pitch = math.radians(v["p"])
        yaw = math.radians(v["y"])
        dist = 3.5  # Set normalized tracking distance offset

        # Spherical coordinate conversion mechanics
        cam_obj.location.x = dist * math.cos(pitch) * math.sin(yaw)
        cam_obj.location.y = -dist * math.cos(pitch) * math.cos(yaw)
        cam_obj.location.z = dist * math.sin(pitch)

        # Execute render frame save pass
        tmp_img_path = f"tmp_frame_{idx}.png"
        bpy.context.scene.render.filepath = os.path.abspath(tmp_img_path)
        bpy.ops.render.render(write_still=True)
        captured_frames.append(Image.open(tmp_img_path))
        os.remove(tmp_img_path)

    # Compile the 2x2 grid collage
    grid = Image.new('RGB', (1024, 1024), (30, 30, 35))
    grid.paste(captured_frames[0], (0, 0))
    grid.paste(captured_frames[1], (512, 0))
    grid.paste(captured_frames[2], (0, 512))
    grid.paste(captured_frames[3], (512, 512))
    grid.save(output_path)
    print(f"✅ Grid successfully compiled via Blender context -> {output_path}")

if __name__ == "__main__":
    import sys
    argv = sys.argv
    try:
        idx = argv.index("--")
        m_path = argv[idx + 1]
        out_path = argv[idx + 2]
        render_model_to_grid(m_path, out_path)
    except (ValueError, IndexError):
        print("Missing argument bindings passed to background wrapper script.")