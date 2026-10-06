"""Audit the pinned Road R1 FBX inside Blender.

Usage:
blender --background --python scripts/blender/audit-road-r1.py -- \
  assets/source/road-r1/RoadBike_SubDiv.fbx \
  assets/work/road-r1/source-audit.json
"""

import bpy
import json
import os
import sys


def script_args():
    argv = sys.argv
    if "--" not in argv:
        raise SystemExit("Expected source FBX and audit JSON after --")
    args = argv[argv.index("--") + 1 :]
    if len(args) != 2:
        raise SystemExit("Usage: <source.fbx> <audit.json>")
    return args


def bbox_world(obj):
    corners = [obj.matrix_world @ __import__("mathutils").Vector(corner) for corner in obj.bound_box]
    return {
        "min": [min(point[i] for point in corners) for i in range(3)],
        "max": [max(point[i] for point in corners) for i in range(3)],
    }


source_path, output_path = script_args()
source_path = os.path.abspath(source_path)
output_path = os.path.abspath(output_path)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=source_path)

objects = []
for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
        continue
    mesh = obj.data
    objects.append(
        {
            "name": obj.name,
            "vertices": len(mesh.vertices),
            "polygons": len(mesh.polygons),
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "dimensions": list(obj.dimensions),
            "location": list(obj.location),
            "rotationEuler": list(obj.rotation_euler),
            "scale": list(obj.scale),
            "boundingBoxWorld": bbox_world(obj),
        }
    )

report = {
    "source": source_path,
    "meshObjectCount": len(objects),
    "totalVertices": sum(item["vertices"] for item in objects),
    "totalPolygons": sum(item["polygons"] for item in objects),
    "objects": sorted(objects, key=lambda item: item["name"].lower()),
}

os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w", encoding="utf-8") as handle:
    json.dump(report, handle, indent=2)

print(json.dumps({
    "meshObjectCount": report["meshObjectCount"],
    "totalVertices": report["totalVertices"],
    "totalPolygons": report["totalPolygons"],
    "audit": output_path,
}, indent=2))
