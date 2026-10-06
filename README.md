# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform: explore bicycles, inspect components, understand systems, and eventually disassemble, repair, compare, configure, and simulate them.

## Current phase

**P2 — Production Road R1 Asset & Semantic Component Preparation**

P1 established the web 3D engine. P2 now locks the first production road-bike source, provenance, semantic component registry, asset validation, and Blender preparation workflow.

The browser still displays the procedural calibration bike until a cleaned and optimized Road R1 GLB passes the production asset contract.

## Stack

- Next.js 16
- React 19
- TypeScript
- Three.js
- React Three Fiber
- Drei
- three-mesh-bvh

## Development

```bash
npm install
npm run dev
```

## Road R1 asset workflow

```bash
# Download the pinned CC BY source model and verify its Git blob SHA
npm run asset:road-r1:fetch

# Validate metadata / semantic registry
npm run validate:assets

# Audit the source in Blender
blender --background --python scripts/blender/audit-road-r1.py -- \
  assets/source/road-r1/RoadBike_SubDiv.fbx \
  assets/work/road-r1/source-audit.json
```

The source FBX itself is intentionally ignored by Git. Its exact upstream location, blob SHA, license, and attribution are committed so it can be reproduced without bloating the application repository.

See `docs/P1.md`, `docs/P2.md`, and `docs/ASSET_PIPELINE.md`.
