# blender_render_script.py
import bpy
import os
import math
from array import array
from mathutils import Vector

# NOTE: this script runs inside Blender's bundled Python, which usually has
# neither PIL nor numpy, so the 2x2 grid is assembled with Blender's own image
# API instead.

# These will be replaced by the main script before running
MODEL_PATH = r"{{MODEL_PATH}}"
OUTPUT_GRID_PATH = r"{{OUTPUT_GRID_PATH}}"

# ====================== BLENDER RENDER LOGIC ======================
# Start from a clean scene. open_mainfile("") raises, so just delete the
# default cube/camera/light instead.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Import GLB (Blender's glTF importer handles KHR_draco_mesh_compression)
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
            min_pt = Vector((min(min_pt.x, world_coord.x), min(min_pt.y, world_coord.y), min(min_pt.z, world_coord.z)))
            max_pt = Vector((max(max_pt.x, world_coord.x), max(max_pt.y, world_coord.y), max(max_pt.z, world_coord.z)))

center = (min_pt + max_pt) / 2
extents = max_pt - min_pt
max_dim = max(extents.x, extents.y, extents.z) or 1.0

print(f"Blender bounds → Center: {center} | Max Dim: {max_dim:.3f}")

# Scene settings
scene = bpy.context.scene
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.image_settings.file_format = 'PNG'
# EEVEE was renamed BLENDER_EEVEE_NEXT in Blender 4.2+; pick whatever this build
# actually offers so the script works across versions.
engine_options = scene.render.bl_rna.properties['engine'].enum_items.keys()
if 'BLENDER_EEVEE_NEXT' in engine_options:
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
elif 'BLENDER_EEVEE' in engine_options:
    scene.render.engine = 'BLENDER_EEVEE'
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

# Create 2x2 grid using only Blender's image API (no PIL/numpy required).
GRID = 1024
bg = (30 / 255.0, 30 / 255.0, 35 / 255.0, 1.0)
dest = array('f', list(bg) * (GRID * GRID))

# (screen-space top-left x, top-left y) for each tile; Blender images are stored
# bottom-up, so convert the y origin accordingly.
placements = [(0, 0), (512, 0), (0, 512), (512, 512)]

for path, (px, py) in zip(image_paths, placements):
    img = bpy.data.images.load(path)
    sw, sh = img.size
    src = array('f', [0.0] * (sw * sh * 4))
    img.pixels.foreach_get(src)

    base_row = GRID - py - sh  # bottom-up row of the tile's bottom edge
    for sr in range(sh):
        grid_row = base_row + sr
        if grid_row < 0 or grid_row >= GRID:
            continue
        d0 = (grid_row * GRID + px) * 4
        s0 = sr * sw * 4
        dest[d0:d0 + sw * 4] = src[s0:s0 + sw * 4]
    bpy.data.images.remove(img)

grid_img = bpy.data.images.new("grid", width=GRID, height=GRID, alpha=True)
grid_img.pixels.foreach_set(dest)
grid_img.filepath_raw = OUTPUT_GRID_PATH
grid_img.file_format = 'PNG'
grid_img.save()
print(f"✅ Blender 4-view grid saved → {OUTPUT_GRID_PATH}")

# Cleanup temp view files
for p in image_paths:
    try:
        os.remove(p)
    except:
        pass