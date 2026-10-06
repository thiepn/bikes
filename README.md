# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance, history, physics, compatibility and use-case fit.

## Current phase

**P21 — Compatibility Engine & Build Lab Foundation**

Bike Atlas now has an explicit compatibility engine and the first Build Lab.

## Compatibility engine

Compatibility is evaluated from authored interface requirements rather than visual similarity.

Results use three states:

```text
compatible
incompatible
unknown
```

A missing specification therefore never becomes an assumed fit.

Current requirement types:

```text
exact interface match
numeric range
```

## Build scope

P21 exposes nine safe foundation slots per current bike:

```text
Front wheel
Rear wheel
Front tire
Rear tire
Handlebar
Seatpost
Saddle
Left pedal
Right pedal
```

More complex drivetrain, suspension, brake and headset compatibility remains intentionally deferred until the required interface data is explicit.

## Current reference library

```text
4 host bikes
9 slots per bike
36 donor/reference parts
144 evaluated host/candidate combinations

90 compatible
54 incompatible
0 unknown
```

All donor and host references resolve to existing semantic Bike Atlas components.

## Explainable decisions

The Build Lab shows every requirement behind a result.

Example:

```text
Road R1 host
Gravel G1 front wheel

622 wheel format      match
12x100 thru axle      match
center-lock disc      match

→ compatible
```

while:

```text
Road R1 host
MTB M1 front wheel

622 wheel format      match
12x100 vs 15x110      mismatch
center-lock vs 6-bolt mismatch

→ incompatible
```

## Logical build drafts

Only fully compatible candidates can be added to a draft.

Users can:

- change a slot;
- inspect why a part fits/fails;
- restore a slot;
- reset the whole build;
- jump between modified slots.

Selecting a slot highlights its host component on the existing 3D bike.

P21 intentionally does **not** transplant donor meshes yet.

## Shareable builds

```text
build=1
buildParts=...
```

store Build Lab state in the URL.

Loaded selections are always re-evaluated; hand-editing the URL cannot force an incompatible candidate into the logical draft.

## Compatibility boundary

A P21 compatible result means only:

> all currently modeled Bike Atlas interfaces match.

It is not an installation certification and does not imply that unmodeled clearance, fastener, structural, routing, adapter, manufacturer, warranty or legal constraints are satisfied.

Run all domain checks with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P21.md`.
