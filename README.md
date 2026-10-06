# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance, history, physics and use-case fit.

## Current phase

**P20 — Bicycle Physics Lab & Performance Simulation**

Bike Atlas now includes an interactive steady-state Physics Lab.

The model uses explicit:

```text
rider power
rider + bike + cargo mass
grade
wind
air density
CdA
rolling resistance
drivetrain efficiency
surface
```

to estimate sustainable steady speed.

Gearing is modeled separately:

```text
cadence
× overall drive ratio
× wheel circumference
→ kinematic speed
```

This prevents Bike Atlas from treating gearing as if it creates speed independently of rider power and resistance.

## Four reference profiles

```text
Road R1
MTB M1
Urban U1
Gravel G1
```

each has editable Bike Atlas reference assumptions for:

- bicycle mass;
- CdA;
- drivetrain efficiency;
- surface-dependent Crr;
- wheel circumference;
- default drive ratio.

These are educational simulation inputs, **not manufacturer measurements**.

## Surfaces

```text
Smooth asphalt
Rough asphalt
Hardpack gravel
Loose gravel
Trail
```

## Physics Lab

The UI provides:

- rider/environment controls;
- quick Flat / Climb / Gravel / Headwind presets;
- editable model assumptions;
- steady-state speed;
- aero / gravity / rolling power breakdown;
- four-bike comparison under the same scenario;
- cadence-selected speed;
- power required at the cadence-selected speed;
- equilibrium cadence for the selected ratio;
- model-boundary disclosure.

## Reference sanity output

At:

```text
250 W
75 kg rider
0 kg cargo
0%
0 km/h wind
smooth asphalt
```

the current reference model gives approximately:

```text
Road R1    36.9 km/h
Gravel G1  34.4 km/h
MTB M1     29.5 km/h
Urban U1   28.2 km/h
```

These are model sanity values, not fixed bicycle performance claims.

## Shareable Physics scenarios

Physics deep links use:

```text
/?physics=1
```

with optional values such as:

```text
pwr
rider
cargo
grade
wind
rho
surface
cad
ratio
bm
cda
eta
crr
```

Example:

```text
/?bike=gravel-g1&physics=1&pwr=250&grade=7&wind=10&surface=hardpack-gravel&cargo=5
```

Closing Physics or entering another incompatible mode clears Physics URL state.

## Model boundary

P20 is a transparent educational steady-state model.

It does not claim to predict:

- acceleration;
- sprinting;
- cornering;
- braking;
- fatigue;
- changing posture;
- detailed suspension/terrain dynamics;
- exact real-world tire losses;
- manufacturer performance.

Run all domain checks with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P20.md`.
