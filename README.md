# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform: explore bicycles, inspect components, understand systems, learn how they work, and practice guided maintenance workflows.

## Current phase

**P8 — Workshop Procedures, Tool Guidance & Step-by-Step Repair Simulation**

Bike Atlas now has two structured knowledge modes on top of the same persistent Road R1 scene:

- **Learn** — interactive conceptual lessons and assessments.
- **Workshop** — prerequisite-aware maintenance procedures with tools, warnings and 3D-guided steps.

Current Workshop procedures:

- Remove and reinstall the rear wheel
- Remove a cassette
- Replace a derailleur chain
- Inspect a disc brake

Workshop uses the Road R1 assembly graph to enforce mechanical operation prerequisites.

Direct Workshop links:

```text
/?workshop=rear-wheel-removal&step=2
/?workshop=cassette-removal&step=3
/?workshop=chain-replacement&step=1
/?workshop=disc-brake-inspection&step=2
```

Learn and Workshop progress are local-only for now; no account/backend is required.

The temporary calibration bike remains until the production Road R1 GLB completes the P2B Blender asset-authoring pipeline.

See `docs/P1.md` through `docs/P8.md` and `docs/ASSET_PIPELINE.md`.
