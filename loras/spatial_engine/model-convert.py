import bpy
# from import_bsp import MD3
import sys
from pathlib import Path

# bpy.context.window.cursor_warp(10, 10)
# current_file_name = bpy.path.basename(file_path)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
# bpy.ops.render.view_show('INVOKE_DEFAULT')

# usage: 

print(f'Starting {sys.argv[4]}...')

extname = '.map'
if ".map" in sys.argv[4]:
  bpy.ops.import_scene.id_map(filepath=sys.argv[4])
elif ".bsp" in sys.argv[4]:
  extname = '.bsp'
  bpy.ops.import_scene.id3_bsp(
    filepath=sys.argv[4], 
    preset="BRUSHES", 
    vert_map_packing="Keep"
    )
elif ".obj" in sys.argv[4]:
  extname = '.obj'
  bpy.ops.wm.obj_import(filepath=sys.argv[4])


bpy.context.view_layer.update()

# https://github.com/SomaZ/Blender_BSP_Importer/blob/main/import_bsp/UI.py#L362
# bpy.ops.export_scene.id3_md3(
#     filepath = file,
#     preset = "MATERIALS",
#     only_selected = True,
#     limits = "LEGACY",
#     start_frame = 0,
#     end_frame = 0,
#     individual = False # use model space coordinates instead of world space
#     )

try:
  bpy.ops.export_scene.id3_md3(
    filepath = sys.argv[4].replace(extname, '.md3'),
    preset = "MATERIALS",
    only_selected = False,
    limits = "STUPID",
    start_frame = 0,
    end_frame = 0,
    individual = False # use model space coordinates instead of world space
  )
except RuntimeError as err:
  if not "Model exceeds MD3 bounds" in str(err):
    raise RuntimeError
except Exception as err:
  if not "BSP format not supported" in str(err):
    raise err

for ob in bpy.data.objects:
   ob.scale = (0.5,0.5,0.5)
   bpy.ops.object.transform_apply(scale=True)

bpy.context.view_layer.update()

try:
  bpy.ops.export_scene.id3_md3(
    filepath = sys.argv[4].replace(extname, '-half.md3'),
    preset = "MATERIALS",
    only_selected = False,
    limits = "STUPID",
    start_frame = 0,
    end_frame = 0,
    individual = False # use model space coordinates instead of world space
  )
except RuntimeError as err:
  if not "Model exceeds MD3 bounds" in str(err):
    raise err
except Exception as err:
  if not "BSP format not supported" in str(err):
    raise err

for ob in bpy.data.objects:
   ob.scale = (0.25,0.25,0.25)
   bpy.ops.object.transform_apply(scale=True)

bpy.context.view_layer.update()

# MD3.ExportMD3(
#   sys.argv[4].replace(extname, '-quarter.md3'),
#   bpy.data.objects,
#   range(0, 1),
#   False,
#   True,
#   100000,
#   1024)

try:
  bpy.ops.export_scene.id3_md3(
    filepath = sys.argv[4].replace(extname, '-quarter.md3'),
    preset = "MATERIALS",
    only_selected = False,
    limits = "STUPID",
    start_frame = 0,
    end_frame = 0,
    individual = False # use model space coordinates instead of world space
  )
except RuntimeError as err:
  if not "Model exceeds MD3 bounds" in str(err):
    raise err
except Exception as err:
  if not "BSP format not supported" in str(err):
    raise err


for ob in bpy.data.objects:
   ob.scale = (0.125,0.125,0.125)
   bpy.ops.object.transform_apply(scale=True)

bpy.context.view_layer.update()

try:
  bpy.ops.export_scene.id3_md3(
    filepath = sys.argv[4].replace(extname, '-eigth.md3'),
    preset = "MATERIALS",
    only_selected = False,
    limits = "STUPID",
    start_frame = 0,
    end_frame = 0,
    individual = False # use model space coordinates instead of world space
  )
except RuntimeError as err:
  if not "Model exceeds MD3 bounds" in str(err):
    raise err
except Exception as err:
  if not "BSP format not supported" in str(err):
    raise err


# bpy.ops.wm.revert_mainfile()

print(f'Done {sys.argv[4]}...')
# bpy.ops.wm.call_menu(name="FILE_quit")
# bpy.ops.file.reset_recent()
bpy.ops.wm.window_close()
bpy.ops.wm.quit_blender()
sys.exit()
