# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform: explore bicycles, inspect components, understand systems, learn how they work, and eventually disassemble, repair, compare, configure, and simulate them.

## Current phase

**P7 — Learning Engine Expansion, Guided Interactions & Assessment Framework**

Bike Atlas now has a reusable learning system rather than one hardcoded drivetrain lesson.

Current beginner lessons:

- How a derailleur drivetrain works
- Wheels, rims and hubs
- How disc brakes slow a bicycle
- Frame and steering fundamentals

The Learn catalog supports prerequisites, resume state, completion, best scores and device-local progress.

Challenge types currently include:

- multiple choice;
- identify a component directly on the 3D bicycle.

Direct lesson links:

```text
/?lesson=drivetrain-basics&step=3
/?lesson=wheels-hubs-basics&step=2
/?lesson=braking-basics&step=1
/?lesson=frame-steering-basics&step=3
```

Progress is local-only for now; no account/backend is required.

The temporary calibration bike remains until the production Road R1 GLB completes the P2B Blender asset-authoring pipeline.

See `docs/P1.md` through `docs/P7.md` and `docs/ASSET_PIPELINE.md`.
