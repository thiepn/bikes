# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning and maintenance.

## Current phase

**P12 — Bike Comparison, Geometry & Cross-Archetype Engineering Views**

Bike Atlas currently contains two complete content families:

- **Road R1** — performance-road reference archetype.
- **MTB M1** — full-suspension trail reference archetype.

P12 adds a dedicated **Compare** workspace with:

- Bike Atlas reference geometry;
- Road ↔ MTB signed dimension deltas;
- component-architecture differences;
- bike swapping;
- comparison deep links;
- an optional synchronized translucent 3D ghost overlay.

Current reference differences from Road R1 to MTB M1 include:

```text
wheelbase       +243 mm
reach            +80 mm
stack            +70 mm
head angle        -8.7°
seat angle        +3.5°
chainstay         +30 mm
BB drop           -37 mm
tire width        +31 mm
handlebar        +360 mm
front travel     +150 mm
rear travel      +140 mm
```

These values describe Bike Atlas's generic fictional reference archetypes. They are not manufacturer sizing, fit advice or measurements from the temporary procedural meshes.

Example comparison links:

```text
/?compare=mtb-m1&overlay=1
/?bike=mtb-m1&compare=road-r1&overlay=1
/?compare=mtb-m1&overlay=0
```

The ghost model shares the same 3D camera but is translucent and non-interactive, so the primary bike retains normal semantic selection.

P12 also fixes the P10 bike-switch URL cleanup bug.

Run all domain checks with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P12.md`.
