# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform: explore bicycles, inspect components, understand systems, and eventually disassemble, repair, compare, configure, and simulate them.

## Current phase

**P6 — Assembly Graph & Interactive Drivetrain Lesson**

Bike Atlas now has its first actual learning workflow.

The Road R1 domain includes:

- semantic bicycle components;
- mechanical connections;
- prerequisite-aware assembly operations;
- a structured interactive lesson;
- live drivetrain visualization;
- gear-ratio calculations;
- a short assessment.

The first lesson is **How a derailleur drivetrain works**.

Direct lesson links:

```text
/?lesson=drivetrain-basics&step=1
/?lesson=drivetrain-basics&step=4
```

The lesson reuses the same persistent 3D scene, semantic IDs, camera focus, Systems mode, highlighting, and Road R1 model as Explore.

## Explore controls

```text
N Normal
S Systems
X X-Ray
E Exploded
I Isolate selected component
Esc Reset selection
```

The temporary calibration bike remains until the production Road R1 GLB completes the P2B Blender asset-authoring pipeline.

See `docs/P1.md` through `docs/P6.md` and `docs/ASSET_PIPELINE.md`.
