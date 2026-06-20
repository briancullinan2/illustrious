"""Draco-aware GLB/glTF loader.

trimesh (and therefore pyrender) cannot decode meshes compressed with the
``KHR_draco_mesh_compression`` extension on its own. When it encounters such a
file it silently returns geometry whose vertex positions are all zero, which
renders as a blank image. A large share of GLB files exported by modern tools
(Blender, gltfpack, RealityCapture, photogrammetry pipelines, etc.) are
Draco-compressed, so this is the most common reason a "simple" GLB shows up
empty.

This module decodes the Draco buffers with :mod:`DracoPy` and rebuilds a normal
:class:`trimesh.Scene` (vertices, faces, normals, UVs and the base-color
texture) so the rest of a rendering pipeline can stay unchanged. Files that are
not Draco-compressed fall back to a plain :func:`trimesh.load`.
"""

from __future__ import annotations

import io
import json
import struct
from pathlib import Path

import numpy as np
import trimesh


DRACO_EXT = "KHR_draco_mesh_compression"


def _parse_glb(path: Path):
    """Return ``(gltf_json, binary_chunk)`` for a .glb, or ``(None, None)``."""
    data = Path(path).read_bytes()
    if len(data) < 12 or data[:4] != b"glTF":
        return None, None

    total_len = struct.unpack("<I", data[8:12])[0]
    offset = 12
    gltf_json = None
    bin_chunk = b""

    while offset < total_len:
        chunk_len = struct.unpack("<I", data[offset:offset + 4])[0]
        chunk_tag = data[offset + 4:offset + 8]
        body = data[offset + 8:offset + 8 + chunk_len]
        if chunk_tag == b"JSON":
            gltf_json = json.loads(body)
        elif chunk_tag == b"BIN\x00":
            bin_chunk = body
        offset += 8 + chunk_len

    return gltf_json, bin_chunk


def _is_draco_glb(path: Path) -> bool:
    gltf, _ = _parse_glb(path)
    if gltf is None:
        return False
    return DRACO_EXT in (gltf.get("extensionsUsed") or [])


def _buffer_view_bytes(gltf, bin_chunk, view_index):
    view = gltf["bufferViews"][view_index]
    start = view.get("byteOffset", 0)
    return bin_chunk[start:start + view["byteLength"]]


def _node_matrix(node):
    """Resolve a glTF node's local transform (matrix or TRS) to a 4x4 matrix."""
    if "matrix" in node:
        # glTF stores matrices column-major.
        return np.array(node["matrix"], dtype=np.float64).reshape(4, 4).T

    matrix = np.eye(4)
    if "scale" in node:
        matrix[:3, :3] = matrix[:3, :3] @ np.diag(node["scale"])
    if "rotation" in node:
        x, y, z, w = node["rotation"]
        rot = np.array([
            [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
            [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
            [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
        ])
        matrix[:3, :3] = rot @ matrix[:3, :3]
    if "translation" in node:
        matrix[:3, 3] = node["translation"]
    return matrix


def _load_material_image(gltf, bin_chunk, material_index):
    """Return a PIL image for a material's base-color texture, or ``None``."""
    if material_index is None:
        return None
    try:
        from PIL import Image
    except Exception:
        return None

    try:
        material = gltf["materials"][material_index]
        pbr = material.get("pbrMetallicRoughness", {})
        tex_info = pbr.get("baseColorTexture")
        if tex_info is None:
            return None
        texture = gltf["textures"][tex_info["index"]]
        image = gltf["images"][texture["source"]]
        if "bufferView" not in image:
            return None
        raw = _buffer_view_bytes(gltf, bin_chunk, image["bufferView"])
        return Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        return None


def _decode_draco_primitive(gltf, bin_chunk, primitive):
    import DracoPy

    draco = primitive["extensions"][DRACO_EXT]
    comp = _buffer_view_bytes(gltf, bin_chunk, draco["bufferView"])
    mesh = DracoPy.decode(comp)

    vertices = np.asarray(mesh.points, dtype=np.float64).reshape(-1, 3)
    faces = np.asarray(mesh.faces, dtype=np.int64).reshape(-1, 3)

    normals = None
    raw_normals = getattr(mesh, "normals", None)
    if raw_normals is not None and len(raw_normals) == len(vertices):
        normals = np.asarray(raw_normals, dtype=np.float64).reshape(-1, 3)

    uv = None
    raw_uv = getattr(mesh, "tex_coord", None)
    if raw_uv is not None and len(raw_uv) == len(vertices):
        uv = np.asarray(raw_uv, dtype=np.float64).reshape(-1, 2)

    visual = None
    image = _load_material_image(gltf, bin_chunk, primitive.get("material"))
    if image is not None and uv is not None:
        material = trimesh.visual.material.PBRMaterial(baseColorTexture=image)
        visual = trimesh.visual.TextureVisuals(uv=uv, material=material)

    geom = trimesh.Trimesh(
        vertices=vertices,
        faces=faces,
        vertex_normals=normals,
        visual=visual,
        process=False,
    )
    return geom


def _load_draco_scene(path: Path) -> trimesh.Scene:
    gltf, bin_chunk = _parse_glb(path)
    scene = trimesh.Scene()

    # Pre-decode each mesh's primitives once.
    decoded_meshes = []
    for mesh in gltf.get("meshes", []):
        geoms = []
        for primitive in mesh["primitives"]:
            if DRACO_EXT in (primitive.get("extensions") or {}):
                geoms.append(_decode_draco_primitive(gltf, bin_chunk, primitive))
        decoded_meshes.append(geoms)

    nodes = gltf.get("nodes", [])
    scene_nodes = (gltf.get("scenes") or [{}])[gltf.get("scene", 0)].get(
        "nodes", list(range(len(nodes)))
    )

    counter = {"n": 0}

    def add_node(node_index, parent_matrix):
        node = nodes[node_index]
        matrix = parent_matrix @ _node_matrix(node)
        if "mesh" in node:
            for geom in decoded_meshes[node["mesh"]]:
                name = f"draco_{counter['n']}"
                counter["n"] += 1
                scene.add_geometry(geom, node_name=name, transform=matrix)
        for child in node.get("children", []):
            add_node(child, matrix)

    for node_index in scene_nodes:
        add_node(node_index, np.eye(4))

    if len(scene.geometry) == 0:
        raise RuntimeError("Draco GLB contained no decodable geometry")

    return scene


def load_glb_scene(path) -> trimesh.Scene:
    """Load ``path`` into a :class:`trimesh.Scene`, decoding Draco if needed.

    Always returns a Scene (a lone mesh is wrapped in one) so callers can treat
    the result uniformly.
    """
    path = Path(path)

    if path.suffix.lower() == ".glb" and _is_draco_glb(path):
        return _load_draco_scene(path)

    loaded = trimesh.load(path, force="scene", process=False, maintain_order=True)
    if isinstance(loaded, trimesh.Scene):
        return loaded
    return trimesh.Scene([loaded])
