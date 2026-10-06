# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance, history, physics, compatibility, geometry, gearing and custom bicycle systems.

## Current phase

**P25 — Build Optimization, Goal-Based Configuration & Constraint Solver**

Bike Atlas can now search its compatibility, system-health, geometry, gearing and Physics models for coherent custom builds.

## Goals

P25 includes five transparent goal profiles:

- Speed
- Climbing
- Mixed Surface
- Comfort
- Utility

Each goal uses inspectable normalized feature weights rather than an opaque recommendation model.

## Hard constraints

Goal score cannot override:

- slot compatibility
- P23 blocking system dependencies
- maximum component-change budget
- the selected P24 geometry guard
- locked current Build Lab changes

Only non-blocked final builds can be recommended.

## Companion-aware search

P25 uses a bounded beam search over the curated donor graph.

Temporarily blocked partial builds can remain in a small search lane when a companion change may resolve them.

For example, Road R1 plus the Gravel rear transmission is temporarily blocked by the stock Road derailleur. Adding the compatible Gravel derailleur resolves the modeled largest-sprocket and total-capacity constraints, allowing the complete configuration to rank.

## Geometry guards

Users can choose Strict, Balanced or Open geometry constraints.

The guard limits candidate changes in head angle, trail, grip position and wheelbase relative to the current starting build.

## Preserve current changes

The optimizer can lock existing Build Lab modifications and search around them.

## Goal metrics

Candidates are scored using reference values including:

- mass
- CdA
- flat speed
- 8% climbing speed
- hardpack speed
- lowest and highest gearing
- total gear range
- tire width
- brake leverage
- bar width
- contact-point posture
- trail
- wheelbase
- internal-gear architecture

## Improvement-only recommendations

P25 does not recommend a worse bicycle merely to populate a list.

A final candidate must improve the current goal score after change and warning penalties.

If nothing improves the active bicycle under the selected constraints, the optimizer reports that directly.

## Explainability

Each result exposes:

- goal score
- score improvement vs current
- changed components
- top scoring contributions
- metric deltas
- gains and costs
- P23 health state

## Apply flow

Apply optimized build writes directly into the shared custom bicycle.

Apply + inspect in Build Lab applies the same configuration and opens Build Lab for mechanical inspection.

The resulting build continues into the 3D scene, Geometry Lab, Physics Lab and buildParts URL state.

## URL state

P25 adds optimizer UI state through:

- optimize=1
- optGoal
- optChanges
- optGuard
- optPreserve=1

The actual bicycle remains encoded separately in buildParts.

## Validation

P25 adds scripts/validate-optimizer.mjs to npm run validate:domain.

It protects goal normalization, search-space assumptions, companion-change behavior, bounded blocked-state search, hard constraints, improvement-only ranking, URL routing and canonical build-state application.

See docs/P1.md through docs/P25.md.
