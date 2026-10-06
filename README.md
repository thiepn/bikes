# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance, history, physics, compatibility, geometry and custom bicycle systems.

## Current phase

P24 — Full Build Geometry & Fit Consequence Solver + Dynamic Gearing Visualization

Bike Atlas now carries one custom bicycle state across Build Lab, the 3D scene, Geometry Lab, and Physics Lab.

## Geometry Lab

P24 adds four fictional Bike Atlas reference geometry profiles and a build-derived solver.

The frame reference remains fixed. Selected components can affect only the geometry they explicitly author:

- fork axle-to-crown and offset
- front and rear tire radius
- stem length and rise
- handlebar reach, drop, and width
- seatpost setback

The solver computes head angle, seat angle, effective reach and stack, wheelbase, BB height/drop, trail, fork geometry, grip coordinates, saddle coordinates, saddle-to-grip reach, and saddle-to-grip drop.

A live side-profile diagram overlays reference and custom geometry.

## Fit consequences

Bike Atlas reports contact-point changes, not rider-size prescriptions.

Examples include bar reach/stack changes, saddle-to-grip reach/drop, bar width, and seatpost setback change.

The UI explicitly states that this is not a rider-size recommendation.

## Dynamic gearing

P24 adds authored tooth arrays to the fictional reference component library.

Current architectures:

- Road: 2×12 external
- Gravel: 1×12 external
- MTB: 1×12 external
- Urban: 8-speed internal

The gearing view calculates every available combination and shows overall ratio, development, gear inches, speed at cadence, easiest gear, hardest gear, and total range.

Cadence is interactive from 40 to 130 rpm.

Road R1 exposes 24 combinations from 1.00× through approximately 4.545×.

Urban U1 exposes eight authored internal ratios with approximately 306% total range.

## Build-aware geometry and gearing

Component changes propagate automatically.

Examples:

- Gravel plus shorter Road fork: steeper front end, less stack, more reach, lower BB
- Road plus Gravel stem: shorter and higher grip position
- Gravel plus Road 2× crankset: gear map expands to 24 combinations

P23 still evaluates mechanical system conflicts, so a kinematically valid gear map does not imply a coherent finished bicycle.

## Geometry and Physics consistency

Reference wheel radii are tied to Physics Lab wheel circumference.

The gearing solver uses the active build-adjusted Physics profile, so tire changes can alter wheel circumference, development, gear inches, and speed at cadence.

Physics remains responsible for achievable steady-state speed.

## URL state

Geometry supports geometry=1, geometryTab=gearing, and gearCad=100 while the custom bicycle remains stored in buildParts.

## Validation

P24 adds scripts/validate-geometry.mjs to the existing npm run validate:domain suite.

It covers geometry references, component geometry metadata, gearing arrays, solver regressions, internal/external gear behavior, routing, model-boundary wording, build-state sharing, and URL defaults.

P24 also fixes absent-query numeric defaults in Physics Lab so missing URL parameters no longer collapse to minimum values through Number(null).

See docs/P1.md through docs/P24.md.
