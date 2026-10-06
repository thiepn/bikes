# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform: explore bicycles, inspect components, understand systems, and eventually disassemble, repair, compare, configure, and simulate them.

## Current phase

**P5 — Cinematic Homepage, Product Storytelling & Transition System**

The root experience now begins with a guided cinematic sequence using the same persistent 3D scene as the interactive explorer.

Story progression moves through:

```text
Hero bike
→ structural close-up
→ mechanical systems
→ X-Ray
→ exploded assembly
→ free Explore mode
```

There is no separate static marketing model or route reload. Entering Explore hands the same scene over to the P3/P4 interaction system.

Direct component/view deep links bypass the introduction.

## Explore controls

```text
N Normal
S Systems
X X-Ray
E Exploded
I Isolate selected component
Esc Reset selection
```

Examples:

```text
/?part=rear-derailleur
/?view=systems
/?view=xray&part=cassette
/?view=exploded&explode=70
```

The temporary calibration bike remains until the production Road R1 GLB completes the P2B Blender asset-authoring pipeline.

See `docs/P1.md` through `docs/P5.md` and `docs/ASSET_PIPELINE.md`.
