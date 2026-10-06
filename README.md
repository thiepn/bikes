# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance and use-case fit.

## Current phase

**P14 — Urban U1: Dutch-Style Utility Bike**

Bike Atlas now contains three distinct bicycle families:

### Road R1

Performance-road reference archetype focused on:

- paved speed;
- distance efficiency;
- direct handling.

### MTB M1

Full-suspension trail reference archetype focused on:

- technical terrain;
- suspension;
- rough-surface control.

### Urban U1

Dutch-style utility reference archetype focused on:

- upright everyday riding;
- all-weather practicality;
- cargo;
- protected low-maintenance drivetrain;
- city accessories.

Urban U1 introduces:

```text
step-through frame
swept upright cockpit
internal-gear rear hub
full chain guard
front + rear fenders
rear cargo rack
integrated lights
kickstand
frame lock
bell
```

Current Urban foundation:

```text
42 semantic components
38 interactive 3D parts
21 assembly connections
15 systems
reference geometry
searchable encyclopedia foundation
Finder profile
Compare integration
```

Urban U1 is immediately available in the shared 3D scene, Systems/X-Ray/Exploded modes, P12 comparison and P13 Finder.

### Finder impact

The P13 **Daily utility** use case now changes from a catalog gap to:

```text
Urban U1 — 98/100 strong current match
```

Current deterministic presets:

```text
Fast road          → Road R1 100
Mixed exploration  → MTB M1 97 / Urban U1 97
Trail riding       → MTB M1 99
Technical trail    → MTB M1 99
Daily utility      → Urban U1 98
```

Urban U1 currently has an encyclopedia **foundation**. Dedicated Urban lessons and Workshop procedures are intentionally deferred to P15 rather than reusing Road/MTB content.

Example links:

```text
/?bike=urban-u1
/?bike=urban-u1&part=rear-rack
/?bike=urban-u1&part=chain-guard
/?bike=urban-u1&view=systems
/?bike=urban-u1&compare=road-r1&overlay=1
```

Run all domain checks with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P14.md`.
