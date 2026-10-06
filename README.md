# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance, history and use-case fit.

## Current phase

**P19 — Cross-Bike Knowledge Graph, Concept Pages & Global Search**

Bike Atlas now has one global knowledge surface spanning:

```text
Concepts
Bikes
Components
Learn
Workshop
History
```

The previous bike-local Encyclopedia search has been promoted into a global **Search** workspace.

## Engineering concept graph

P19 introduces nine cross-bike engineering concepts:

```text
Braking systems
Tire volume, pressure & contact
Chain drive & power transmission
Gearing, range & shifting
Steering, geometry & control
Suspension & compliance
Wheels, hubs & axles
Cargo, mounts & utility hardware
Frame architecture & rider position
```

Each concept can connect:

```text
concept
├─ modern 3D components
├─ multiple bike families
├─ Learn lessons
├─ Workshop procedures
└─ History milestones
```

Component encyclopedia pages also contain reverse links back into relevant concepts.

This creates navigable flows such as:

```text
Urban U1 internal-gear hub
        ↓
Gearing, range & shifting
        ↓
Road cassette
MTB cassette
Gravel cassette
        ↓
Learn / Workshop / History
```

## Global Search

Search now derives results from the canonical Bike Atlas catalogs instead of maintaining duplicate search content.

Indexed entity types:

```text
Concept
Bike
Component
Learn
Workshop
History
```

Example searches:

```text
brakes
pressure
creaking
cassette
internal gear
Repack
cargo
tubeless
suspension
head angle
```

Search is deterministic, local and does not require an AI API.

## Concept deep links

```text
/?concept=braking-systems
/?concept=tire-volume-pressure
/?concept=chain-drive-power
/?concept=gearing-range-shifting
/?concept=steering-geometry-control
/?concept=suspension-compliance
/?concept=wheels-hubs-axles
/?concept=cargo-mounting-utility
/?concept=frame-architecture-rider-position
```

## Current authored graph

```text
9 engineering concepts
36 component links
25 lesson links
22 Workshop links
19 History links
4 / 4 bike families covered
0 broken graph references
```

The global derived index additionally contains all current bikes, searchable encyclopedia components, lessons, Workshop procedures and History milestones.

Run all domain checks with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P19.md`.
