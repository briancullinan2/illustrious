import argparse
import os
import platform
import sys
from pathlib import Path

# pyrender needs an offscreen GL backend (EGL) on a headless Linux box. Must be
# set before pyrender is imported (it is imported lazily further down). A
# desktop session (DISPLAY set) is left untouched.
if platform.system() == "Linux" and not os.environ.get("DISPLAY"):
    os.environ.setdefault("PYOPENGL_PLATFORM", "egl")

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from draco_glb import load_glb_scene


def angled_camera_pose(center, radius):
    """A 3/4 view pose looking at ``center`` (Z is treated as the up axis).

    Looking straight down a model's main axis (the old behaviour) often shows
    only a featureless silhouette, so frame it from an elevated corner instead.
    """
    if radius < 1e-6:
        radius = 1.0

    distance = radius * 2.2
    azimuth = np.radians(35.0)
    elevation = np.radians(25.0)

    offset = np.array([
        distance * np.cos(elevation) * np.sin(azimuth),
        -distance * np.cos(elevation) * np.cos(azimuth),
        distance * np.sin(elevation),
    ])
    eye = center + offset

    forward = center - eye
    forward = forward / np.linalg.norm(forward)

    up = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(forward, up)) > 0.99:
        up = np.array([0.0, 1.0, 0.0])

    right = np.cross(forward, up)
    right = right / np.linalg.norm(right)
    true_up = np.cross(right, forward)

    pose = np.eye(4)
    pose[:3, 0] = right
    pose[:3, 1] = true_up
    pose[:3, 2] = -forward
    pose[:3, 3] = eye
    return pose


def load_flat_mesh(path):
    import trimesh

    print("Loading scene...")

    # load_glb_scene transparently decodes KHR_draco_mesh_compression, which a
    # plain trimesh.load cannot do (it would return all-zero vertices).
    loaded = load_glb_scene(path)

    print(f"Loaded object type: {type(loaded)}")

    if isinstance(loaded, trimesh.Trimesh):
        return loaded

    if not isinstance(loaded, trimesh.Scene):
        raise RuntimeError(
            f"Unsupported object type: {type(loaded)}"
        )

    print(f"Scene geometries: {len(loaded.geometry)}")

    if len(loaded.geometry) == 0:
        raise RuntimeError(
            "Scene contains no geometry"
        )

    # New trimesh versions
    if hasattr(loaded, "to_mesh"):
        try:
            print("Using Scene.to_mesh()")
            mesh = loaded.to_mesh()

            if mesh is not None and not mesh.is_empty:
                return mesh
        except Exception as e:
            print(f"Scene.to_mesh failed: {e}")

    # Fallback
    try:
        print("Using dump(concatenate=True)")
        mesh = loaded.dump(concatenate=True)

        if mesh is not None and not mesh.is_empty:
            return mesh
    except Exception as e:
        print(f"dump(concatenate=True) failed: {e}")

    # Nuclear option: manually bake transforms
    print("Manually baking scene graph...")

    meshes = []

    for node_name in loaded.graph.nodes_geometry:

        try:
            transform, geom_name = loaded.graph[node_name]

            geom = loaded.geometry[geom_name].copy()

            if transform is not None:
                geom.apply_transform(transform)

            meshes.append(geom)

        except Exception as e:
            print(f"Failed node {node_name}: {e}")

    if not meshes:
        raise RuntimeError(
            "No mesh data extracted from scene"
        )

    mesh = trimesh.util.concatenate(meshes)

    return mesh


def repair_mesh(mesh):
    print("\nRepairing mesh...")

    try:
        mesh.remove_unreferenced_vertices()
    except:
        pass

    try:
        mesh.merge_vertices()
    except:
        pass

    try:
        mesh.remove_duplicate_faces()
    except:
        pass

    try:
        mesh.remove_degenerate_faces()
    except:
        pass

    # Remove NaN/Inf vertices
    try:
        valid = np.isfinite(mesh.vertices).all(axis=1)

        if not valid.all():
            removed = (~valid).sum()
            print(
                f"Removed {removed} invalid vertices"
            )

            mesh.update_vertices(valid)

    except Exception as e:
        print(f"Vertex cleanup failed: {e}")

    try:
        mesh.fix_normals()
    except:
        pass

    return mesh


def center_and_scale(mesh, target_size=5.0):

    bounds = mesh.bounds

    vmin = bounds[0]
    vmax = bounds[1]

    extents = vmax - vmin

    center = (vmin + vmax) * 0.5

    mesh.apply_translation(-center)

    largest = float(np.max(extents))

    if largest > 1e-12:
        scale = target_size / largest

        mesh.apply_scale(scale)

        print(
            f"Scale factor: {scale:.6f}"
        )

    return mesh


def print_diagnostics(mesh):

    print("\n===== MESH INFO =====")

    print(
        f"Vertices: {len(mesh.vertices):,}"
    )

    print(
        f"Faces: {len(mesh.faces):,}"
    )

    print(
        f"Empty: {mesh.is_empty}"
    )

    print(
        f"Watertight: {mesh.is_watertight}"
    )

    print(
        f"Bounds:\n{mesh.bounds}"
    )

    print(
        f"Extents: {mesh.extents}"
    )

    print(
        f"Centroid: {mesh.centroid}"
    )

    try:
        print(
            f"Volume: {mesh.volume}"
        )
    except:
        pass

    print("=====================\n")


def export_debug_render(mesh):
    try:
        import pyrender
        from PIL import Image

        scene = pyrender.Scene(
            bg_color=[30, 30, 30, 255],
            ambient_light=[0.5, 0.5, 0.5]
        )

        material = (
            pyrender.MetallicRoughnessMaterial(
                metallicFactor=0.0,
                roughnessFactor=0.8,
                baseColorFactor=[
                    0.85,
                    0.85,
                    0.85,
                    1.0
                ]
            )
        )

        render_mesh = (
            pyrender.Mesh.from_trimesh(
                mesh,
                material=material,
                smooth=False
            )
        )

        scene.add(render_mesh)

        bbox = mesh.bounds

        center = bbox.mean(axis=0)

        radius = np.linalg.norm(
            bbox[1] - bbox[0]
        )

        if radius < 0.001:
            radius = 1.0

        camera = pyrender.PerspectiveCamera(
            yfov=np.pi / 3.0
        )

        pose = angled_camera_pose(center, radius * 0.5)

        scene.add(camera, pose=pose)

        light = pyrender.DirectionalLight(
            color=np.ones(3),
            intensity=8.0
        )

        scene.add(light, pose=pose)

        renderer = (
            pyrender.OffscreenRenderer(
                1024,
                1024
            )
        )

        color, depth = renderer.render(scene)

        Image.fromarray(color).save(
            "debug_render.png"
        )

        print(
            "Saved debug_render.png"
        )

        renderer.delete()

    except Exception as e:
        print(
            f"Debug render failed: {e}"
        )


def launch_viewer(mesh):

    import pyrender

    scene = pyrender.Scene(
        bg_color=[20, 20, 25, 255],
        ambient_light=[0.5, 0.5, 0.5]
    )

    material = (
        pyrender.MetallicRoughnessMaterial(
            metallicFactor=0.0,
            roughnessFactor=0.9,
            baseColorFactor=[
                0.85,
                0.85,
                0.85,
                1.0
            ]
        )
    )

    render_mesh = (
        pyrender.Mesh.from_trimesh(
            mesh,
            material=material,
            smooth=False
        )
    )

    scene.add(render_mesh)

    bbox = mesh.bounds

    center = bbox.mean(axis=0)

    radius = np.linalg.norm(
        bbox[1] - bbox[0]
    )

    if radius < 0.001:
        radius = 1.0

    camera = pyrender.PerspectiveCamera(
        yfov=np.pi / 3.0
    )

    pose = angled_camera_pose(center, radius * 0.5)

    scene.add(camera, pose=pose)

    light = pyrender.DirectionalLight(
        color=np.ones(3),
        intensity=8.0
    )

    scene.add(light, pose=pose)

    print(
        f"Viewer center: {center}"
    )

    print(
        f"Viewer radius: {radius}"
    )

    pyrender.Viewer(
        scene,
        viewport_size=(1400, 900),
        use_raymond_lighting=True,
        point_size=2.0
    )


def main():

    parser = argparse.ArgumentParser(
        description="GLB Debug Viewer"
    )

    parser.add_argument(
        "--model",
        required=True
    )

    parser.add_argument(
        "--visualize",
        action="store_true"
    )

    parser.add_argument(
        "--export-obj"
    )

    args = parser.parse_args()

    model_path = Path(args.model)

    if not model_path.exists():
        print(
            f"File not found: {model_path}",
            file=sys.stderr
        )
        sys.exit(1)

    try:
        import trimesh

        mesh = load_flat_mesh(
            model_path
        )

        mesh = repair_mesh(
            mesh
        )

        print_diagnostics(
            mesh
        )

        mesh = center_and_scale(
            mesh,
            target_size=5.0
        )

        export_debug_render(
            mesh
        )

        if args.export_obj:

            export_path = Path(
                args.export_obj
            )

            export_path.parent.mkdir(
                parents=True,
                exist_ok=True
            )

            mesh.export(export_path)

            print(
                f"Exported OBJ: {export_path}"
            )

        if args.visualize:

            try:
                launch_viewer(mesh)

            except Exception as e:

                print(
                    f"Pyrender failed: {e}"
                )

                print(
                    "Trying trimesh viewer..."
                )

                mesh.show()

    except Exception as e:

        print(
            f"\nFATAL ERROR: {e}",
            file=sys.stderr
        )

        import traceback
        traceback.print_exc()

        sys.exit(1)


if __name__ == "__main__":
    main()