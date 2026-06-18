# blender_render_script.py
import bpy
import os
import math
from mathutils import Vector
from PIL import Image

# These will be replaced by the main script before running
MODEL_PATH = r"{{MODEL_PATH}}"
OUTPUT_GRID_PATH = r"{{OUTPUT_GRID_PATH}}"

# ====================== BLENDER RENDER LOGIC ======================
bpy.ops.wm.open_mainfile(filepath="")

# Import GLB
bpy.ops.import_scene.gltf(filepath=MODEL_PATH)

# Select meshes and compute bounds
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj

bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

# Calculate scene bounds
min_pt = Vector((float('inf'),) * 3)
max_pt = Vector((-float('inf'),) * 3)

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        for vert in obj.data.vertices:
            world_coord = obj.matrix_world @ vert.co
            min_pt = Vector(min(min_pt.x, world_coord.x), min(min_pt.y, world_coord.y), min(min_pt.z, world_coord.z))
            max_pt = Vector(max(max_pt.x, world_coord.x), max(max_pt.y, world_coord.y), max(max_pt.z, world_coord.z))

center = (min_pt + max_pt) / 2
extents = max_pt - min_pt
max_dim = max(extents.x, extents.y, extents.z) or 1.0

print(f"Blender bounds → Center: {center} | Max Dim: {max_dim:.3f}")

# Scene settings
scene = bpy.context.scene
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.image_settings.file_format = 'PNG'
scene.render.engine = 'BLENDER_EEVEE'      # Faster than Cycles for previews
scene.eevee.taa_render_samples = 64
scene.render.film_transparent = True

# Add sunlight
light = bpy.data.lights.new(name="Sun", type='SUN')
light.energy = 5.0
light_node = bpy.data.objects.new("Sun", light)
bpy.context.collection.objects.link(light_node)
light_node.rotation_euler = (math.radians(45), 0, math.radians(30))

# Camera
cam_data = bpy.data.cameras.new(name='Camera')
cam = bpy.data.objects.new('Camera', cam_data)
bpy.context.collection.objects.link(cam)
scene.camera = cam

distance = max_dim * 2.5

views = [
    ("front",  8,   0),
    ("side",   5,  90),
    ("top",   75,  45),
    ("angle", -12, 35),
]

temp_dir = os.path.dirname(OUTPUT_GRID_PATH)
image_paths = []

for i, (name, pitch, yaw) in enumerate(views):
    pitch_rad = math.radians(pitch)
    yaw_rad = math.radians(yaw)
    
    dx = distance * math.cos(pitch_rad) * math.sin(yaw_rad)
    dy = -distance * math.cos(pitch_rad) * math.cos(yaw_rad)
    dz = distance * math.sin(pitch_rad)
    
    cam.location = center + Vector((dx, dy, dz))
    direction = center - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    
    output = os.path.join(temp_dir, f"view_{i}.png")
    scene.render.filepath = output
    bpy.ops.render.render(write_still=True)
    image_paths.append(output)
    print(f"Rendered view: {name}")

# Create 2x2 grid
grid = Image.new('RGB', (1024, 1024), (30, 30, 35))
imgs = [Image.open(p) for p in image_paths]

grid.paste(imgs[0], (0, 0))
grid.paste(imgs[1], (512, 0))
grid.paste(imgs[2], (0, 512))
grid.paste(imgs[3], (512, 512))

grid.save(OUTPUT_GRID_PATH)
print(f"✅ Blender 4-view grid saved → {OUTPUT_GRID_PATH}")

# Cleanup temp view files
for p in image_paths:
    try:
        os.remove(p)
    except:
        pass