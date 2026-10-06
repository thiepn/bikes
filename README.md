# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring multiple bicycle archetypes, their components, systems, lessons, maintenance workflows and technical relationships.

## Current phase

**P10 — Multi-Bike Architecture & Second Archetype Foundation**

Bike Atlas is no longer architecturally Road-R1-only.

Current bike registry:

- **Road R1** — performance road reference bike; interactive prototype, full encyclopedia, Learn and Workshop.
- **MTB M1** — generic full-suspension trail MTB; interactive prototype and semantic/assembly foundation.

MTB M1 introduces rear suspension, linkage, flat cockpit, dropper post and a 1× wide-range drivetrain so the shared architecture is tested against genuinely different bicycle systems.

Bike-aware links:

```text
/?bike=mtb-m1
/?bike=mtb-m1&part=rear-shock
/?bike=mtb-m1&part=dropper-post
/?bike=mtb-m1&view=systems
```

Road-specific Learn and Workshop features are capability-gated and do not appear on MTB M1 until MTB-specific content exists.

Shared camera, inspection, selection and component lookup now resolve through the bike registry rather than hardcoded Road R1 IDs.

See `docs/P1.md` through `docs/P10.md`.
