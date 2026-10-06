# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance, history, physics, compatibility, geometry, gearing and custom bicycle systems.

## Current phase

**P26 — Interactive Optimization Frontier, Pareto Trade-Offs & Build Comparison**

Optimize now supports two connected workflows:

- Ranked — P25 single-goal configuration search
- Frontier — P26 two-objective Pareto exploration

## Explored Pareto frontier

P26 lets users choose any two distinct goals from:

- Speed
- Climbing
- Mixed Surface
- Comfort
- Utility

Bike Atlas performs five bounded weighted searches between the two objectives, unions the coherent candidates, rescoring every build independently on both axes and removes dominated configurations.

The result is explicitly an **explored frontier**, not a claim of exhaustive global optimality.

## Current build as reference

The active custom bicycle is plotted as a reference diamond.

If it is coherent, any candidate worse on both objective scores is removed.

This prevents the frontier from presenting a trade that is inferior to simply keeping the current bicycle.

## Frontier interaction

The P26 workspace includes:

- X/Y objective selectors
- axis swap
- 0–100 SVG score chart
- Pareto curve
- current-build reference
- clickable and keyboard-accessible frontier points
- previous/next navigation
- frontier slider
- comparison pin
- selected-vs-pinned metric deltas

## Build comparison

Frontier points can be compared using:

- X objective score
- Y objective score
- flat speed
- 8% climbing speed
- hardpack speed
- bike mass
- lowest gear
- tire width

The exact changed components are also shown.

## Shared hard constraints

Ranked and Frontier share:

- maximum component-change budget
- Strict / Balanced / Open geometry guard
- preserve-current-modified-slots

P26 does not bypass P23 mechanical system constraints.

Blocked final builds cannot enter the frontier.

## Companion-aware search

P26 reuses P25's bounded companion-aware optimizer.

Temporary blocked states can survive long enough for a second compatible component change to resolve them, such as the Road R1 wide-range Gravel cassette + derailleur pair.

## Pareto tie-break

Scores use a 0.05 epsilon.

When two builds are effectively equal on both axes, the configuration with fewer changed component slots dominates the heavier edit.

## Apply flow

Apply frontier build writes directly into the canonical custom bicycle state.

Apply + inspect in Build Lab applies the same build and opens Build Lab.

The selected configuration then continues into:

- 3D scene
- Geometry Lab
- Physics Lab
- buildParts URL state

## URL state

P26 adds:

- optView=frontier
- optX
- optY
- optPoint

P25 hard-constraint URL state remains shared.

Malformed same-axis frontier deep links are repaired automatically.

## Validation

P26 adds scripts/validate-pareto.mjs to npm run validate:domain.

It protects Pareto dominance semantics, current-build filtering, fewer-change tie-breaks, five-sweep exploration, Ranked/Frontier compute separation, accessible SVG interaction, comparison behavior, routing and shared build application.

See docs/P1.md through docs/P26.md.
