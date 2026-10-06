import geometry from "../content/geometry/profiles.json" with { type: "json" };
import reference from "../content/compatibility/reference.json" with { type: "json" };
import physics from "../content/physics/profiles.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}
function approx(actual, expected, tolerance, message) {
  assert(
    Number.isFinite(actual) &&
      Math.abs(actual - expected) <= tolerance,
    message + ` (actual ${actual}, expected ${expected} ± ${tolerance})`,
  );
}

const geometryByBike = new Map(
  geometry.profiles.map((profile) => [profile.bikeId, profile]),
);
const physicsByBike = new Map(
  physics.profiles.map((profile) => [profile.bikeId, profile]),
);
const partById = new Map(
  reference.parts.map((part) => [part.id, part]),
);

function installed(bikeId, slotId) {
  return (
    reference.parts.find(
      (part) =>
        part.sourceBikeId === bikeId &&
        part.slotId === slotId,
    ) ?? null
  );
}

function effective(bikeId, slotId, selections) {
  const selectedId = selections[slotId];
  return selectedId
    ? partById.get(selectedId) ?? null
    : installed(bikeId, slotId);
}

function numberValue(part, key) {
  const value = part?.interfaces?.[key];
  return typeof value === "number" ? value : null;
}

function numberArray(part, key) {
  const value = part?.interfaces?.[key];
  return Array.isArray(value) &&
    value.every((item) => typeof item === "number")
    ? value
    : [];
}

function rotate(x, y, angleRad) {
  return {
    x: x * Math.cos(angleRad) - y * Math.sin(angleRad),
    y: x * Math.sin(angleRad) + y * Math.cos(angleRad),
  };
}

function wheelDeltaMm(hostBikeId, part) {
  if (!part || part.sourceBikeId === hostBikeId) return 0;
  const host = physicsByBike.get(hostBikeId);
  const donor = physicsByBike.get(part.sourceBikeId);
  if (!host || !donor) return 0;

  return (
    ((donor.wheelCircumferenceM - host.wheelCircumferenceM) /
      (2 * Math.PI)) *
    1000
  );
}

function solve(bikeId, selections) {
  const base = geometryByBike.get(bikeId);
  assert(Boolean(base), `Missing geometry profile: ${bikeId}`);
  if (!base) return null;

  const fork = effective(bikeId, "fork", selections);
  const frontTire = effective(bikeId, "front-tire", selections);
  const rearTire = effective(bikeId, "rear-tire", selections);
  const stem = effective(bikeId, "stem", selections);
  const handlebar = effective(bikeId, "handlebar", selections);
  const seatpost = effective(bikeId, "seatpost", selections);

  const a2c =
    numberValue(fork, "axleToCrown") ??
    base.forkAxleToCrownMm;
  const offset =
    numberValue(fork, "forkOffsetMm") ??
    base.forkOffsetMm;

  const frontRadius =
    base.frontWheelRadiusMm +
    wheelDeltaMm(bikeId, frontTire);
  const rearRadius =
    base.rearWheelRadiusMm +
    wheelDeltaMm(bikeId, rearTire);

  const headRad = (base.headAngleDeg * Math.PI) / 180;
  const forkDelta = a2c - base.forkAxleToCrownMm;
  const frontHeightDelta =
    forkDelta * Math.sin(headRad) +
    (frontRadius - base.frontWheelRadiusMm) -
    (rearRadius - base.rearWheelRadiusMm);
  const pitchRad = Math.atan2(
    frontHeightDelta,
    base.wheelbaseMm,
  );
  const pitchDeg = (pitchRad * 180) / Math.PI;

  const frameHead = rotate(
    base.reachMm,
    base.stackMm,
    pitchRad,
  );
  const solvedHead = base.headAngleDeg - pitchDeg;
  const solvedHeadRad = (solvedHead * Math.PI) / 180;
  const wheelbase =
    base.wheelbaseMm +
    forkDelta * Math.cos(headRad);

  const rearAxleToBbHorizontal = Math.sqrt(
    Math.max(
      0,
      base.chainstayMm ** 2 - base.bbDropMm ** 2,
    ),
  );
  const bb = rotate(
    rearAxleToBbHorizontal,
    -base.bbDropMm,
    pitchRad,
  );
  const bbHeight = rearRadius + bb.y;
  const trail =
    (frontRadius * Math.cos(solvedHeadRad) - offset) /
    Math.sin(solvedHeadRad);

  const stemLength = numberValue(stem, "stemLengthMm") ?? 80;
  const stemRise = numberValue(stem, "stemRiseDeg") ?? 0;
  const barReach = numberValue(handlebar, "barReachMm") ?? 0;
  const barWidth = numberValue(handlebar, "barWidthMm") ?? 600;
  const stemAngle =
    ((stemRise + pitchDeg) * Math.PI) / 180;

  const barX =
    frameHead.x +
    stemLength * Math.cos(stemAngle) +
    barReach;
  const barY =
    frameHead.y +
    stemLength * Math.sin(stemAngle);

  const installedSeatpost = installed(bikeId, "seatpost");
  const installedSetback =
    numberValue(installedSeatpost, "setbackMm") ?? 0;
  const selectedSetback =
    numberValue(seatpost, "setbackMm") ?? 0;
  const saddle = rotate(
    base.saddleXFromBbMm,
    base.saddleYFromBbMm,
    pitchRad,
  );

  return {
    head: solvedHead,
    reach: frameHead.x,
    stack: frameHead.y,
    wheelbase,
    bbHeight,
    trail,
    barX,
    barY,
    barWidth,
    saddleX:
      saddle.x - (selectedSetback - installedSetback),
  };
}

function gearing(bikeId, selections, cadenceRpm) {
  const crank = effective(bikeId, "crankset", selections);
  const rear = effective(
    bikeId,
    "rear-transmission",
    selections,
  );
  const profile = physicsByBike.get(bikeId);
  if (!crank || !rear || !profile) return [];

  const rings = numberArray(crank, "chainringTeeth");
  const sprockets = numberArray(rear, "sprocketTeeth");
  const internal = numberArray(rear, "internalGearRatios");
  const architecture = rear.interfaces.transmissionArchitecture;
  const out = [];

  if (architecture === "internal-gear") {
    const front = rings[0];
    const back = sprockets[0];
    for (const internalRatio of internal) {
      const ratio = (front / back) * internalRatio;
      out.push({
        ratio,
        speed:
          (profile.wheelCircumferenceM *
            ratio *
            cadenceRpm *
            60) /
          1000,
      });
    }
  } else {
    for (const ring of rings) {
      for (const sprocket of sprockets) {
        const ratio = ring / sprocket;
        out.push({
          ratio,
          speed:
            (profile.wheelCircumferenceM *
              ratio *
              cadenceRpm *
              60) /
            1000,
        });
      }
    }
  }

  return out.sort((a, b) => a.ratio - b.ratio);
}

assert(
  geometry.version === 1,
  "P24 geometry schema version must remain 1.",
);
assert(
  geometry.profiles.length === 4,
  "P24 needs four geometry reference profiles.",
);
assert(
  new Set(geometry.profiles.map((profile) => profile.bikeId))
    .size === geometry.profiles.length,
  "P24 geometry bike IDs must be unique.",
);

for (const profile of geometry.profiles) {
  const physicsProfile = physicsByBike.get(profile.bikeId);
  assert(
    Boolean(physicsProfile),
    `Missing Physics profile for geometry host: ${profile.bikeId}`,
  );
  if (!physicsProfile) continue;

  const radiusFromPhysics =
    (physicsProfile.wheelCircumferenceM /
      (2 * Math.PI)) *
    1000;

  approx(
    profile.frontWheelRadiusMm,
    radiusFromPhysics,
    0.2,
    `Front wheel radius must align with Physics circumference: ${profile.bikeId}`,
  );
  approx(
    profile.rearWheelRadiusMm,
    radiusFromPhysics,
    0.2,
    `Rear wheel radius must align with Physics circumference: ${profile.bikeId}`,
  );

  assert(
    profile.headAngleDeg > 60 &&
      profile.headAngleDeg < 80 &&
      profile.seatTubeAngleDeg > 65 &&
      profile.seatTubeAngleDeg < 82 &&
      profile.reachMm > 300 &&
      profile.reachMm < 550 &&
      profile.stackMm > 450 &&
      profile.stackMm < 750 &&
      profile.wheelbaseMm > 850 &&
      profile.wheelbaseMm < 1300,
    `Geometry reference bounds invalid: ${profile.bikeId}`,
  );
}

for (const bikeKey of ["road", "gravel", "mtb", "urban"]) {
  const stem = partById.get(`part.${bikeKey}.stem`);
  const bar = partById.get(`part.${bikeKey}.handlebar`);
  const post = partById.get(`part.${bikeKey}.seatpost`);
  const fork = partById.get(`part.${bikeKey}.fork`);
  const crank = partById.get(`part.${bikeKey}.crankset`);
  const rear = partById.get(
    `part.${bikeKey}.rear-transmission`,
  );

  assert(
    Number.isFinite(stem?.interfaces.stemLengthMm) &&
      Number.isFinite(stem?.interfaces.stemRiseDeg),
    `Missing P24 stem geometry: ${bikeKey}`,
  );
  assert(
    Number.isFinite(bar?.interfaces.barReachMm) &&
      Number.isFinite(bar?.interfaces.barDropMm) &&
      Number.isFinite(bar?.interfaces.barWidthMm),
    `Missing P24 handlebar geometry: ${bikeKey}`,
  );
  assert(
    Number.isFinite(post?.interfaces.setbackMm),
    `Missing P24 seatpost setback: ${bikeKey}`,
  );
  assert(
    Number.isFinite(fork?.interfaces.forkOffsetMm),
    `Missing P24 fork offset: ${bikeKey}`,
  );

  const rings = numberArray(crank, "chainringTeeth");
  const sprockets = numberArray(rear, "sprocketTeeth");
  assert(
    rings.length >= 1 &&
      sprockets.length >= 1,
    `Missing P24 gearing arrays: ${bikeKey}`,
  );

  const gearCount = numberValue(rear, "gearCount");
  assert(
    sprockets.length ===
      (rear?.interfaces.transmissionArchitecture ===
      "internal-gear"
        ? 1
        : gearCount),
    `Rear sprocket array does not match architecture/gear count: ${bikeKey}`,
  );

  if (
    rear?.interfaces.transmissionArchitecture ===
    "internal-gear"
  ) {
    const internal = numberArray(rear, "internalGearRatios");
    assert(
      internal.length === gearCount,
      `Internal gear ratios must match gear count: ${bikeKey}`,
    );
    const authoredRange =
      numberValue(rear, "internalRangePercent") ?? 0;
    const derivedRange =
      (Math.max(...internal) / Math.min(...internal)) * 100;
    approx(
      derivedRange,
      authoredRange,
      1,
      `Internal range must match authored reference: ${bikeKey}`,
    );
  } else {
    assert(
      Math.min(...sprockets) ===
        numberValue(rear, "rearSmallTeeth") &&
        Math.max(...sprockets) ===
          numberValue(rear, "rearLargeTeeth"),
      `Cassette tooth array endpoints drifted: ${bikeKey}`,
    );
  }
}

const gravelBase = solve("bike.gravel.g1", {});
const gravelRoadFork = solve("bike.gravel.g1", {
  fork: "part.road.fork",
});
assert(
  gravelBase &&
    gravelRoadFork &&
    gravelRoadFork.head - gravelBase.head > 1 &&
    gravelRoadFork.stack < gravelBase.stack - 8 &&
    gravelRoadFork.reach > gravelBase.reach + 12 &&
    gravelRoadFork.bbHeight < gravelBase.bbHeight - 8,
  "Gravel + Road fork geometry regression failed.",
);

const roadBase = solve("bike.road.r1", {});
const roadGravelBar = solve("bike.road.r1", {
  handlebar: "part.gravel.handlebar",
});
assert(
  roadBase &&
    roadGravelBar &&
    Math.abs(
      roadGravelBar.barX - roadBase.barX - 5,
    ) < 0.01 &&
    roadGravelBar.barWidth === 640 &&
    Math.abs(roadGravelBar.reach - roadBase.reach) < 0.01,
  "Road + Gravel handlebar must alter contact point without altering frame reach.",
);

const roadGravelStem = solve("bike.road.r1", {
  stem: "part.gravel.stem",
});
assert(
  roadBase &&
    roadGravelStem &&
    roadGravelStem.barX < roadBase.barX - 15 &&
    roadGravelStem.barY > roadBase.barY + 15,
  "Road + Gravel stem fit consequence regression failed.",
);

const road90 = gearing("bike.road.r1", {}, 90);
const road100 = gearing("bike.road.r1", {}, 100);
assert(
  road90.length === 24 &&
    road90[0].ratio === 1 &&
    Math.abs(
      road90[road90.length - 1].ratio - 50 / 11,
    ) < 1e-9,
  "Road 2×12 gearing regression failed.",
);
assert(
  Math.abs(
    road100[5].speed / road90[5].speed - 100 / 90,
  ) < 1e-9,
  "Cadence must scale kinematic gear speed linearly.",
);

const gravelDouble = gearing(
  "bike.gravel.g1",
  { crankset: "part.road.crankset" },
  90,
);
assert(
  gravelDouble.length === 24,
  "Gravel + Road 2× crankset must expose 24 kinematic gear combinations.",
);

const urban = gearing("bike.urban.u1", {}, 90);
assert(
  urban.length === 8,
  "Urban internal transmission must expose eight authored gears.",
);
approx(
  (urban[urban.length - 1].ratio / urban[0].ratio) * 100,
  306.45,
  0.1,
  "Urban internal gearing range regression failed.",
);

const solverText = await readFile(
  "domain/geometry/solve.ts",
  "utf8",
);
for (const token of [
  "frontEndHeightDeltaMm",
  "pitchDeltaDeg",
  "trailMm",
  "saddleToGripReachMm",
  "barStackDeltaMm",
]) {
  assert(
    solverText.includes(token),
    `P24 geometry solver missing token: ${token}`,
  );
}

const gearingText = await readFile(
  "domain/geometry/gearing.ts",
  "utf8",
);
for (const token of [
  "internalGearRatios",
  "gearInches",
  "developmentM",
  "speedKph",
  "applyBuildToPhysicsProfile",
]) {
  assert(
    gearingText.includes(token),
    `P24 gearing solver missing token: ${token}`,
  );
}

const panelText = await readFile(
  "components/geometry/GeometryLabPanel.tsx",
  "utf8",
);
assert(
  panelText.includes("GeometryDiagram") &&
    panelText.includes("GearingMap") &&
    panelText.includes("Contact-point consequences") &&
    panelText.includes("not a rider-size recommendation") &&
    panelText.includes("Gear speeds are kinematic"),
  "P24 Geometry Lab must retain geometry, fit and gearing model boundaries.",
);

const viewerText = await readFile(
  "components/viewer/BikeViewer.tsx",
  "utf8",
);
assert(
  viewerText.includes("GeometryLabPanel") &&
    viewerText.includes('searchParams.get("geometry")') &&
    viewerText.includes("GEOMETRY_QUERY_KEYS") &&
    viewerText.includes("geometry-launch") &&
    viewerText.includes(
      "else if (geometryOpen) setGeometryOpen(false);",
    ),
  "BikeViewer must retain P24 Geometry routing and Escape behavior.",
);
assert(
  viewerText.includes(
    "buildSelections={effectiveBuildSelections}",
  ),
  "P24 Geometry and Physics must share the active custom build state.",
);

if (errors.length) {
  console.error("\nP24 geometry validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  "✓ P24 geometry valid: 4 reference profiles, build-derived contact geometry, external/internal gearing regressions and routing checks pass.",
);
