# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance, history, physics, compatibility and custom builds.

## Current phase

**P22 — Build Lab 3D Assembly, Component Transforms & Expanded System Compatibility**

Bike Atlas now turns compatibility-checked Build Lab selections into visible assembled 3D drafts.

## 3D Build Lab

P22 adds a normalized assembly layer:

```text
compatible component
      ↓
host attachment transform
      ↓
hide host-owned semantic geometry
      ↓
render donor proxy
      ↓
assembled custom draft
```

Current visual assembly foundation:

```text
4 host bikes
12 attachment slots per bike
48 attachment records
4 donor visual profiles
0 broken visual references
```

Donor proxies currently support:

```text
wheels
tires
handlebars
stems
seatposts
saddles
pedals
rotors
```

Donor source traits such as tire thickness, bar shape, wheel construction, saddle dimensions and rotor size remain visible while the host attachment point remains authoritative.

## Expanded compatibility

The Build Lab now has 12 slots per bike:

```text
Front wheel
Rear wheel
Front tire
Rear tire
Handlebar
Stem
Front rotor
Rear rotor
Seatpost
Saddle
Left pedal
Right pedal
```

Compatibility matrix:

```text
4 host bikes
48 reference donor parts
192 evaluated combinations

123 compatible
69 incompatible
0 unknown
```

The engine still supports `unknown` for future incomplete/imported component data.

## New rotor rules

P22 checks:

```text
disc interface
rotor diameter envelope
```

so a mount-type match alone is no longer enough.

Examples:

```text
Road host + Gravel 160 mm center-lock rotor
→ compatible

Road host + Urban 180 mm center-lock rotor
→ incompatible by modeled diameter envelope

MTB host + Road center-lock rotor
→ incompatible by modeled disc interface
```

## One authoritative build state

The build draft now lives in the main viewer and is shared by:

```text
URL
Build Lab
compatibility engine
3D scene
```

URL-loaded drafts are revalidated against the active host before anything is rendered.

Selecting the already-installed reference part canonicalizes to no change.

## Model boundary

P22's donor geometry is normalized procedural proxy geometry.

It proves the component-transform and assembly architecture but is not yet manufacturer CAD/GLB interchange.

Likewise, a compatible result means all **currently modeled Bike Atlas interfaces** match; it is not installation certification.

Run all domain checks with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P22.md`.
