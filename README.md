# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring multiple bicycle archetypes, their components, systems, lessons, maintenance workflows and technical relationships.

## Current phase

**P11 — MTB M1 Knowledge, Suspension Learning & MTB Workshop Expansion**

Bike Atlas now has two real content families.

### Road R1

- 35 semantic components
- full encyclopedia
- interactive Learn catalog
- guided Workshop procedures
- mechanical operation dependencies

### MTB M1

- 37 semantic components
- 30 interactive prototype parts
- full 37-component encyclopedia
- 4 MTB-specific interactive lessons
- 4 MTB-specific Workshop procedures
- full-suspension, dropper and 1× drivetrain concepts

MTB Learn currently covers:

- suspension fundamentals;
- dropper-post operation;
- 1× drivetrain architecture;
- trail tire grip/pressure concepts.

MTB Workshop currently covers:

- suspension pre-ride inspection;
- manufacturer-guided sag baseline measurement;
- dropper-post function checking;
- trail-tire pre-ride inspection.

Lessons and Workshop procedures are bike-owned. Switching or deep-linking into content restores the correct bike rather than reusing Road content on MTB M1.

Example links:

```text
/?bike=mtb-m1&part=rear-shock
/?bike=mtb-m1&lesson=mtb-suspension-basics
/?bike=mtb-m1&lesson=mtb-one-by-drivetrain
/?bike=mtb-m1&workshop=mtb-sag-baseline
/?bike=mtb-m1&workshop=mtb-trail-tire-check
```

Bike Atlas deliberately does not invent universal suspension pressure, sag, damping, tire-pressure or torque values. Component-specific setup remains tied to the real frame/component manufacturer guidance.

Run domain validation with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P11.md`.
