# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance, history, physics, compatibility, geometry, gearing and custom bicycle systems.

## Current phase

**P29 — Account-Synced Portfolios, Cross-Device Recovery & THIEPN Ecosystem Integration**

Optimize now has three connected workflows:

- Ranked — P25 single-goal search
- Frontier — P26 Pareto trade-offs
- Portfolio — P27 saved multi-scenario decisions

## P29 account-synced Portfolio

Bike Atlas remains guest-first and local-first, but signed-in users can now carry the explicit saved Build Portfolio across devices through THIEPN Account + Core.

P29 adds:

- Authorization Code + PKCE Account integration;
- app-local access/refresh tokens;
- a revisioned whole-Portfolio Core document;
- compare-and-swap cloud writes;
- automatic P27 local migration with per-entry updatedAt metadata;
- bounded local recovery copies when another device advances the cloud revision;
- explicit recovery restore instead of silent last-write-wins;
- THIEPN Account/Core/Product Registry registration;
- GitHub Pages production export at https://thiepn.dev/bikes/.

Only saved Portfolio candidates sync. The active bike, Build Lab draft and temporary learning state stay local.

The OAuth client ID is intentionally deployment-configured. Until the Bike Atlas public OAuth client is registered, the production UI stays local-only rather than exposing a nonfunctional sign-in control.

## P28 portable decision reports

P28 turns the P27 decision workspace into a portable evidence layer.

For any selected saved build, Bike Atlas now provides:

- explicit rank and decision rationale;
- strongest and weakest selected scenarios;
- scenario-by-scenario comparison against the current portfolio leader;
- mass and low-gear trade-off notes where meaningful;
- native share with clipboard fallback;
- copyable Markdown reports;
- downloadable Markdown reports;
- full evaluated portfolio JSON export;
- a reproducible Build Lab URL containing the selected canonical build.

Reports are generated from the current sanitized P27 evaluation state. They do not create a second scoring engine or expose the user's browser-local portfolio unless the user explicitly exports it.

## Saved build portfolio

P27 lets users keep candidate builds without repeatedly replacing the active custom bicycle.

Candidates can be saved from:

- the current build
- Ranked recommendations
- Frontier points

Saved configurations are de-duplicated by canonical build selections.

Blocked builds cannot be newly saved.

If an older saved snapshot becomes blocked after Bike Atlas rules change, it remains visible for historical comparison but cannot be restored as a coherent build.

## Persistence

P29 keeps portfolio data in browser localStorage as the immediate local-first source and optionally synchronizes the same saved Portfolio as one revisioned THIEPN Core document when signed in.

Existing P27 data migrates in place; no manual import is required.

Current limit:

- 8 saved builds per host bicycle

The limit is enforced during save, load and persist.

Signed-out use stays browser-local. Signed-in P29 sync uses revision CAS and preserves a local recovery copy on conflict; it never silently applies last-write-wins.

## Five scenario presets

Portfolio comparison can use any combination of:

- Fast Flat — 250 W, smooth asphalt, 0%
- Long Climb — 250 W, smooth asphalt, 8%
- Rough Mixed — 220 W, hardpack gravel
- Headwind — 220 W into 20 km/h headwind
- Loaded Utility — 180 W, 15 kg cargo, 2%, light headwind

The default comparison uses Fast Flat, Long Climb and Rough Mixed.

## Scenario scoring

Every saved build is re-evaluated through the current:

- compatibility sanitizer
- P23 system analysis
- build-aware Physics profile
- steady-state Physics model
- P24 gearing solver
- P24 geometry solver

Each scenario score is:

- 80% normalized steady-state performance
- 20% cadence/gearing feasibility

Attention builds receive a small health penalty.

Blocked historical builds score zero and cannot be restored.

The multi-scenario score is the mean across the selected presets.

## Decision workspace

The Portfolio table shows:

- aggregate score
- per-scenario score
- raw per-scenario speed
- bike mass
- lowest gear

The selected candidate inspector adds:

- editable name
- source
- modified-slot count
- system health
- closest gear at scenario cadence
- CdA
- gear span
- saddle-to-grip drop

## Restore flow

Restore as active build writes directly into the same canonical build state used by:

- 3D assembly
- Build Lab
- Geometry Lab
- Physics Lab
- buildParts

Restore + inspect in Build Lab restores the same configuration and immediately opens mechanical inspection.

No duplicate Portfolio-owned active-bike state exists.

## URL state

P27 adds:

- optView=portfolio
- portSc=...

The portfolio itself is intentionally not encoded into the URL because persistence is browser-local.

## Validation

P27 adds:

- scripts/validate-portfolio.mjs

to:

- npm run validate:domain

The validator protects scenario definitions, scenario-score semantics, capped local persistence, re-sanitization, Ranked/Frontier capture, blocked-snapshot behavior, Portfolio routing and canonical build restore.

P25/P26 regression suites remain active and were updated only for the legitimate third-view UI extension.

## Validation environment

The current execution container could not resolve github.com, so a local clone and Next.js production build could not be run here.

Committed source/data state and validator registration were audited directly through the GitHub repository.

See docs/P1.md through docs/P29.md.
