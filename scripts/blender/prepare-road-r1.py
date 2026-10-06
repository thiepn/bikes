"""Prepare Road R1 only after the source audit has been reviewed.

This script is intentionally conservative: it never guesses which source mesh is a
cassette, derailleur, frame, etc. Exact source object names must first be mapped in
content/assets/road-r1.source-map.json.

Usage:
blender --background --python scripts/blender/prepare-road-r1.py -- \
  assets/source/road-r1/RoadBike_SubDiv.fbx \
  content/assets/road-r1.source-map.json \
  assets/work/road-r1/road-r1.blend
"""

import bpy
import json
import os
import sys


def script_args():
    argv = sys.argv
    if "--" not in argv:
        raise SystemExit("Expected source FBX, source map, and output blend after --")
    args = argv[argv.index("--") + 1 :]
    if len(args) != 3:
        raise SystemExit("Usage: <source.fbx> <source-map.json> <output.blend>")
    return args


source_path, mapping_path, output_path = [os.path.abspath(value) for value in script_args()]

with open(mapping_path, "r", encoding="utf-8") as handle:
    mapping_doc = json.load(handle)

mapping = mapping_doc.get("objects", {})
if not mapping:
    raise SystemExit(
        "Source map is empty. Run audit-road-r1.py, inspect the source objects, "
        "then map exact source names before preparing the asset."
    )

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=source_path)

mesh_objects = {obj.name: obj for obj in bpy.context.scene.objects if obj.type == "MESH"}
missing = sorted(source_name for source_name in mapping if source_name not in mesh_objects)
if missing:
    raise SystemExit("Mapped source objects missing from FBX: " + ", ".join(missing))

for obj in list(bpy.context.scene.objects):
    if obj.type in {"CAMERA", "LIGHT"}:
        bpy.data.objects.remove(obj, do_unlink=True)

for source_name, target_name in mapping.items():
    mesh_objects[source_name].name = target_name

for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
        continue
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)

os.makedirs(os.path.dirname(output_path), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=output_path)
print(f"Prepared Road R1 working file: {output_path}")
