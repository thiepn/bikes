# Bike Atlas 3D Asset Pipeline

## Canonical scene convention

- Runtime: GLB/glTF 2.0
- 1 Blender unit = 1 meter
- +Y up
- +Z forward
- +X bike right
- Origin: bottom bracket center
- Apply scale before export; no hidden runtime correction transforms.

## Required hierarchy

```text
ROOT_BIKE
├── SYS__frame
│   └── COMP__frame
├── SYS__drivetrain
│   ├── COMP__crankset
│   ├── COMP__chain
│   ├── COMP__cassette
│   └── COMP__rear_derailleur
├── SYS__front_wheel
└── SYS__rear_wheel
```

Prefixes: `SYS__`, `COMP__`, `SUB__`, `HELPER__`.

Never ship authoring leftovers such as `Cube.001`.

## Semantic identity

Model node names are not database identity. Stable application IDs such as
`bike.road.r1.drivetrain.rear_derailleur` map to one or more nodes so assets
can be re-exported without breaking learning or repair content.

## LOD policy

- LOD0: extreme component close-up
- LOD1: normal whole-bike exploration
- LOD2: mobile/distant bike
- LOD3: thumbnail/background

Deep internals should stream only when required.

## PBR material baseline

Base color, metallic, roughness, normal, AO, and physically appropriate emissive.
Advanced clearcoat/anisotropy/transmission are optional and performance-gated.

## Runtime texture plan

- KTX2/Basis compression
- 512–1K mobile/common
- 1K–2K normal desktop
- 2K–4K only for selected hero close-ups

Technical labels stay out of textures so UI remains responsive, localized, and accessible.

## Optimization

Before release: remove safe hidden geometry, preserve semantic component boundaries and pivots, generate intentional LODs, optimize with glTF Transform/Meshopt, verify normals/tangents, and profile a midrange phone.

## Assembly metadata

Keep application mechanics outside the GLB: pivot, explosion path, sequence, dependencies, connection points, fasteners and camera target.

## Licensing

Every third-party production asset requires a repository-side record containing source, creator, acquisition date, license, attribution, modification/commercial permission, and relevant trademark/design-right caveats.

## Rejection conditions

Reject a production model if its scale/orientation is wrong, semantic parts cannot be selected independently, authoring names remain uncontrolled, mobile LOD is missing, provenance is unknown, or mechanical geometry contains obvious generative errors.
