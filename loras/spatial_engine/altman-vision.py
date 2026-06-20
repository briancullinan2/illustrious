#!/usr/bin/env python3

import argparse
from pathlib import Path

import numpy as np
import trimesh
import pyrender
from PIL import Image


def rotation_matrix_x(angle_rad):
    c = np.cos(angle_rad)
    s = np.sin(angle_rad)

    return np.array([
        [1, 0, 0, 0],
        [0, c, -s, 0],
        [0, s, c, 0],
        [0, 0, 0, 1]
    ])


def look_at(camera_position, target, up=np.array([0.0, 0.0, 1.0])):
    forward = target - camera_position
    f_norm = np.linalg.norm(forward)
    
    # Avoid zero-length forward vectors
    if f_norm < 1e-6:
        forward = np.array([0.0, -1.0, 0.0])
    else:
        forward = forward / f_norm

    right = np.cross(forward, up)
    r_norm = np.linalg.norm(right)
    
    # Handle the case where forward points straight up/down
    if r_norm < 1e-6:
        alternative_up = np.array([1.0, 0.0, 0.0])
        right = np.cross(forward, alternative_up)
        right = right / max(np.linalg.norm(right), 1e-6)
    else:
        right = right / r_norm

    true_up = np.cross(right, forward)
    true_up = true_up / max(np.linalg.norm(true_up), 1e-6)

    pose = np.eye(4)
    pose[:3, 0] = right
    pose[:3, 1] = true_up
    pose[:3, 2] = -forward
    pose[:3, 3] = camera_position

    return pose


def load_glb_scene(glb_path):
    loaded = trimesh.load(
        glb_path,
        force="scene",
        process=True,       # Force decoding and face reconstruction pipelines
        validate=True       # Validate consistency of topology index arrays
    )

    if isinstance(loaded, trimesh.Scene):
        scene = loaded
    else:
        scene = trimesh.Scene([loaded])

    return scene


def compute_bounds(scene):
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

    # Fallback if no valid geometry was found
    if np.any(np.isinf(mins)) or np.any(np.isinf(maxs)):
        return np.zeros(3), np.ones(3), 1.0

    center = (mins + maxs) * 0.5
    extents = maxs - mins
    
    # Enforce a non-zero norm baseline
    extents_norm = np.linalg.norm(extents)
    radius = max(extents_norm * 0.5, 0.001)

    return center, extents, radius


def trimesh_to_pyrender(scene):
    render_scene = pyrender.Scene(
        bg_color=[255, 255, 255, 255],
        ambient_light=[0.25, 0.25, 0.25]
    )

    for name, geom in scene.geometry.items():
        if len(geom.vertices) == 0:
            print(f"Skipping empty mesh: {name}")
            continue

        verts = np.asarray(geom.vertices)
        if not np.isfinite(verts).all():
            print(f"Skipping invalid mesh: {name}")
            continue

        try:
            # Explicitly force trimesh to generate flat normals ahead of time
            # This ensures pyrender never triggers its stateful eigenvalue calculation
            geom.fix_normals()
            
            # Construct manual pyrender material mapping to bypass trimesh parsing
            material = pyrender.MetallicRoughnessMaterial(
                doubleSided=True,
                baseColorFactor=[0.7, 0.7, 0.7, 1.0],
                metallicFactor=0.2,
                roughnessFactor=0.8
            )

            # Build primitive tracking geometry manually
            primitive = pyrender.Primitive(
                positions=verts,
                indices=np.asarray(geom.faces, dtype=np.uint32),
                normals=np.asarray(geom.vertex_normals),
                material=material,
                mode=pyrender.GLTF.TRIANGLES
            )

            mesh = pyrender.Mesh(primitives=[primitive], name=name)
            render_scene.add(mesh)

        except Exception as e:
            # Fallback to direct raw primitives if the normal engine still complains
            try:
                primitive = pyrender.Primitive(
                    positions=verts,
                    indices=np.asarray(geom.faces, dtype=np.uint32),
                    material=material,
                    mode=pyrender.GLTF.TRIANGLES
                )
                mesh = pyrender.Mesh(primitives=[primitive], name=name)
                render_scene.add(mesh)
            except Exception as inner_e:
                print(f"❌ Failed to render mesh {name}: {inner_e}")

    return render_scene


def add_raymond_lights(scene):
    light_positions = [
        [5, 5, 10],
        [-5, 5, 10],
        [0, -5, 10]
    ]

    for pos in light_positions:
        light = pyrender.DirectionalLight(
            color=np.ones(3),
            intensity=3.0
        )

        pose = np.eye(4)
        pose[:3, 3] = pos

        scene.add(light, pose=pose)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--output", default="render.png")
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=1024)

    args = parser.parse_args()

    model_path = Path(args.model)

    if not model_path.exists():
        raise FileNotFoundError(model_path)

    trimesh_scene = load_glb_scene(model_path)

    center, extents, radius = compute_bounds(trimesh_scene)

    scene = trimesh_to_pyrender(trimesh_scene)

    add_raymond_lights(scene)

    fov_y = np.radians(45.0)

    desired_fill = 0.75

    distance = radius / np.tan((fov_y * desired_fill) / 2.0)

    angle_deg = 30.0
    angle_rad = np.radians(angle_deg)

    horizontal_distance = distance * np.cos(angle_rad)
    vertical_offset = distance * np.sin(angle_rad)

    camera_position = center + np.array([
        horizontal_distance,
        -horizontal_distance,
        vertical_offset
    ])

    camera_pose = look_at(camera_position, center)

    camera = pyrender.PerspectiveCamera(
        yfov=fov_y
    )

    scene.add(camera, pose=camera_pose)

    renderer = pyrender.OffscreenRenderer(
        viewport_width=args.width,
        viewport_height=args.height
    )

    color, depth = renderer.render(scene)

    Image.fromarray(color).save(args.output)

    renderer.delete()

    print(f"Saved: {args.output}")


if __name__ == "__main__":
    main()