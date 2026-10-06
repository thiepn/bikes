# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform: explore bicycles, inspect components, understand systems, and eventually disassemble, repair, compare, configure, and simulate them.

## Current phase

**P1 — 3D Engine, Camera, Lighting, Rendering & Asset Pipeline**

The repository currently contains the production rendering foundation plus a procedural calibration bike. The calibration model is deliberately temporary; P2 replaces it with the first production-quality Road R1 asset.

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

Then open `http://localhost:3000`.

See `docs/P1.md` and `docs/ASSET_PIPELINE.md`.
