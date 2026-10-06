# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform: explore bicycles, inspect components, understand systems, and eventually disassemble, repair, compare, configure, and simulate them.

## Current phase

**P3 — Part Selection, Highlighting, Semantic Navigation & Camera Focus**

P1 established the 3D engine. P2 locked the Road R1 asset source and semantic component model. P3 makes that semantic model interactive: click/hover parts, focus them smoothly, isolate them, navigate through an accessible component list, and deep-link selection through `?part=<slug>`.

The temporary calibration bike remains in place until the production Road R1 GLB finishes the Blender asset-authoring pipeline.

## Development

```bash
npm install
npm run dev
```

## Interaction

- Drag: orbit
- Scroll/pinch: zoom
- Click part: select + focus
- Double-click part: isolate
- `Esc`: reset
- `I`: toggle isolation

Example deep links:

```text
/?part=frame
/?part=cassette
/?part=rear-derailleur
```

See `docs/P1.md`, `docs/P2.md`, `docs/P3.md`, and `docs/ASSET_PIPELINE.md`.
