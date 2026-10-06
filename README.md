# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform for exploring bicycle archetypes, components, engineering, learning, maintenance, history, physics, compatibility and custom bicycle systems.

## Current phase

**P23 — Advanced Drivetrain, Brake-System & Suspension Compatibility + Build Consequence Analysis**

Bike Atlas now distinguishes:

```text
slot compatibility
        ↓
system coherence
        ↓
build consequences
```

An individually compatible part can therefore enter a draft and still create a complete-bike dependency that must be resolved.

## Advanced Build Lab

P23 adds:

```text
Fork
Front caliper
Rear caliper
Crankset
Rear transmission
Rear derailleur
```

to the existing Build Lab.

Current host sizes:

```text
Road R1       18 slots
Gravel G1     18 slots
MTB M1        18 slots
Urban U1      17 slots
```

Urban intentionally has no derailleur slot because its reference transmission is internal-gear.

## System dependency engine

P23 evaluates relationships including:

```text
rotor ↔ caliper range
rotor ↔ fork limit
wheel ↔ rotor mount
fork ↔ front-wheel axle
rear wheel ↔ transmission carrier

crankset ↔ transmission chain family
transmission ↔ derailleur chain family
cassette largest sprocket ↔ derailleur maximum
drivetrain total capacity ↔ derailleur capacity
1× / 2× crankset ↔ front shifting system
fork geometry / travel changes
```

Build health is:

```text
ready
attention
blocked
```

Blocked parts remain in the draft so companion changes can be made explicitly.

## Example companion change

Road R1 accepts the modeled Gravel rear transmission at the slot level.

But the reference Gravel cassette reaches 44T while the Road derailleur is authored for 36T and lacks the required total capacity.

Result:

```text
slot compatible
system blocked
```

Adding the compatible Gravel rear derailleur resolves the current modeled clearance/capacity conflict.

## Build consequences

Build Lab now displays:

```text
mass delta
CdA delta
front brake leverage delta
rear brake leverage delta
gear range
fork axle-to-crown delta
```

Warnings and blocking issues link back to their relevant Build Lab slots.

## Build-aware Physics

The active custom bicycle now changes the Physics Lab baseline.

P23 propagates reference deltas for:

```text
bike mass
CdA
surface rolling resistance
wheel circumference
drivetrain efficiency
```

A blocked build can still be simulated experimentally, but Physics marks it:

```text
Simulation is provisional
```

rather than presenting it as a coherent finished bicycle.

## Persistent custom bicycle

```text
build=1
```

now means the Build panel is open.

```text
buildParts=...
```

represents the custom bicycle itself.

Closing Build no longer destroys the draft.

The same bicycle remains visible in 3D and can be carried directly into Physics.

## 3D advanced-system assembly

Normalized donor proxies now also support:

```text
fork
caliper
crankset
rear transmission
rear derailleur
```

Current P23 assembly graph:

```text
71 reference parts
71 consequence profiles
71 visual attachment records

281 static host/candidate evaluations
165 compatible
116 incompatible
0 unknown
```

These are Bike Atlas reference archetype values, not manufacturer specifications or installation certification.

Run all domain checks with:

```bash
npm run validate:domain
```

See `docs/P1.md` through `docs/P23.md`.
