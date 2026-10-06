# Bike Atlas

Bike Atlas is an interactive 3D bicycle knowledge platform: explore bicycles, inspect components, understand systems, learn how they work, practice maintenance, and navigate a cross-linked bicycle encyclopedia.

## Current phase

**P9 — Component Encyclopedia, Search, Cross-Linking & Knowledge Graph**

Every one of the 35 Road R1 semantic components now has an encyclopedia profile.

Explore includes three knowledge modes:

- **Learn** — interactive lessons and assessment.
- **Workshop** — prerequisite-aware maintenance procedures.
- **Encyclopedia** — search and component knowledge graph.

Component profiles cover:

- function;
- materials;
- compatibility/standards;
- common symptoms;
- connected/related parts;
- related lessons;
- related Workshop procedures.

Search spans names, aliases, systems, tags, materials, standards and symptoms.

The knowledge graph derives mechanical links from the assembly graph and instructional links from Learn/Workshop data instead of duplicating those relationships.

Component deep links work for all Road R1 semantic components, including components whose detailed calibration mesh is still pending:

```text
/?part=cassette
/?part=headset
/?part=bottom-bracket
/?part=front-derailleur
```

The temporary calibration bike currently exposes 27 of the 35 components in 3D. The production Road R1 GLB remains the path to full-detail visual coverage.

See `docs/P1.md` through `docs/P9.md` and `docs/ASSET_PIPELINE.md`.
