# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform: explore bicycles, inspect components, understand systems, and eventually disassemble, repair, compare, configure, and simulate them.

## Current phase

**P4 — Exploded View, X-Ray, Systems & Inspection Modes**

P1 established the 3D engine. P2 locked the Road R1 asset source and semantic model. P3 made semantic components selectable and focusable. P4 adds viewer-level inspection modes over that same semantic state.

## Inspection modes

- **Normal** — product/material view
- **Systems** — color-coded mechanical systems
- **X-Ray** — exterior structure fades to expose mechanisms
- **Exploded** — authored component separation with continuous 0–100% scrubber

Keyboard:

```text
N Normal
S Systems
X X-Ray
E Exploded
I Isolate selected component
Esc Reset selection
```

Shareable state examples:

```text
/?part=rear-derailleur
/?view=systems
/?view=xray&part=cassette
/?view=exploded&explode=70
```

The temporary calibration bike remains in place until the production Road R1 GLB completes the Blender asset-authoring pipeline.

See `docs/P1.md`, `docs/P2.md`, `docs/P3.md`, `docs/P4.md`, and `docs/ASSET_PIPELINE.md`.
