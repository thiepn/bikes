# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance and use-case fit.

## Current phase

**P16 — Gravel G1: All-Road Archetype & Mixed-Surface Expansion**

Bike Atlas now contains four distinct bicycle families:

### Road R1

Performance-road reference focused on paved speed and distance efficiency.

### MTB M1

Full-suspension trail reference focused on technical terrain and rough-surface control.

### Urban U1

Dutch-style utility reference focused on everyday comfort, cargo, all-weather use and low-maintenance practicality.

### Gravel G1

All-road reference focused on the space between road and trail:

- efficient paved riding;
- gravel and rough-road control;
- long-distance mixed-surface use;
- wide-range 1× gearing;
- light bikepacking / utility mounting flexibility.

Gravel G1 introduces:

```text
flared drop handlebar
45 mm mixed-surface tires
1× crankset
wide-range cassette
rear derailleur
frame utility mounts
fork utility mounts
downtube protector
```

Current Gravel foundation:

```text
34 semantic components
34 interactive 3D parts
20 assembly connections
reference geometry
searchable encyclopedia foundation
Finder profile
Compare integration
```

### Finder impact

The previous Mixed exploration ambiguity:

```text
MTB M1    97
Urban U1  97
```

now resolves to:

```text
Gravel G1 100
```

Current deterministic presets:

```text
Fast road          → Road R1    100
Mixed exploration  → Gravel G1  100
Trail riding       → MTB M1      99
Technical trail    → MTB M1      99
Daily utility      → Urban U1    98
```

Gravel G1 participates immediately in the shared 3D scene, Systems/X-Ray/Exploded modes, P12 comparison and P13 Finder.

It currently has an encyclopedia **foundation**. Dedicated Gravel lessons and Workshop procedures are intentionally deferred to P17.

Example links:

```text
/?bike=gravel-g1
/?bike=gravel-g1&part=front-tire
/?bike=gravel-g1&part=frame-mounts
/?bike=gravel-g1&view=systems
/?bike=gravel-g1&compare=road-r1&overlay=1
/?bike=gravel-g1&compare=mtb-m1&overlay=1
```

Run all domain checks with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P16.md`.
