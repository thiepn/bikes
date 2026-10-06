# Road R1 source asset

The binary source model is intentionally **not committed** to this application repository.

Fetch the exact pinned source:

```bash
npm run asset:road-r1:fetch
```

The fetcher downloads:

- Repository: `MirageYM/3DModels`
- Branch: `master`
- File: `RoadBike/RoadBike_SubDiv.fbx`
- Pinned Git blob SHA-1: `02d1ba11fbbd1c4034f147a65a58ee621e134d51`

It verifies the Git blob SHA before writing the file here.

The source repository describes the RoadBike model as modeled but without UVs, so Bike Atlas treats it as geometry source material. It is **not** suitable to ship directly as the website's production model.

See `ATTRIBUTION.md`.
