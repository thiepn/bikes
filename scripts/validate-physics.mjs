import physicsJson from "../content/physics/profiles.json" with { type: "json" };
import road from "../content/bikes/road-r1.json" with { type: "json" };
import mtb from "../content/bikes/mtb-m1.json" with { type: "json" };
import urban from "../content/bikes/urban-u1.json" with { type: "json" };
import gravel from "../content/bikes/gravel-g1.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}

const bikes = [road, mtb, urban, gravel];
const bikeIds = new Set(bikes.map((bike) => bike.id));
const profiles = physicsJson.profiles;
const surfaces = physicsJson.surfaces;
const profileByBike = new Map(
  profiles.map((profile) => [profile.bikeId, profile]),
);

assert(
  physicsJson.version === 1,
  "P20 physics schema version must remain 1.",
);
assert(
  profiles.length === bikes.length,
  "P20 must provide one reference physics profile per current bike.",
);
assert(
  new Set(profiles.map((profile) => profile.bikeId)).size ===
    profiles.length,
  "P20 physics profile bike IDs must be unique.",
);
assert(
  surfaces.length >= 5,
  "P20 should retain multiple pavement/off-road surface presets.",
);

const surfaceIds = new Set(surfaces.map((surface) => surface.id));
for (const required of [
  "smooth-asphalt",
  "rough-asphalt",
  "hardpack-gravel",
  "loose-gravel",
  "trail",
]) {
  assert(
    surfaceIds.has(required),
    `Required P20 surface missing: ${required}`,
  );
}

for (const bike of bikes) {
  assert(
    profileByBike.has(bike.id),
    `Missing P20 profile: ${bike.id}`,
  );
}

for (const profile of profiles) {
  assert(
    bikeIds.has(profile.bikeId),
    `Physics profile targets unknown bike: ${profile.bikeId}`,
  );
  assert(
    profile.source === "bike-atlas-reference",
    `Physics profile must remain clearly reference data: ${profile.bikeId}`,
  );
  assert(
    profile.bikeMassKg > 3 && profile.bikeMassKg < 40,
    `Implausible reference bike mass: ${profile.bikeId}`,
  );
  assert(
    profile.cdaM2 > 0.15 && profile.cdaM2 < 1.2,
    `Implausible reference CdA: ${profile.bikeId}`,
  );
  assert(
    profile.drivetrainEfficiency > 0.75 &&
      profile.drivetrainEfficiency <= 1,
    `Invalid drivetrain efficiency: ${profile.bikeId}`,
  );
  assert(
    profile.wheelCircumferenceM > 1.5 &&
      profile.wheelCircumferenceM < 3,
    `Invalid wheel circumference: ${profile.bikeId}`,
  );
  assert(
    profile.defaultDriveRatio > 0.4 &&
      profile.defaultDriveRatio < 6,
    `Invalid default drive ratio: ${profile.bikeId}`,
  );

  for (const surfaceId of surfaceIds) {
    const crr = profile.rollingResistance[surfaceId];
    assert(
      Number.isFinite(crr) && crr > 0 && crr < 0.1,
      `Invalid Crr for ${profile.bikeId}/${surfaceId}`,
    );
  }

  assert(
    profile.notes.some((note) =>
      note.toLowerCase().includes("reference"),
    ),
    `Physics profile must disclose reference assumptions: ${profile.bikeId}`,
  );
}

const g = 9.80665;
function requiredWheelPower(speedMps, profile, scenario) {
  const totalMass =
    profile.bikeMassKg +
    scenario.riderMassKg +
    scenario.cargoMassKg;
  const angle = Math.atan(scenario.gradePercent / 100);
  const crr = profile.rollingResistance[scenario.surfaceId];
  const rolling =
    crr * totalMass * g * Math.cos(angle);
  const gravity =
    totalMass * g * Math.sin(angle);
  const relativeAir =
    speedMps + scenario.windSpeedKph / 3.6;
  const aero =
    0.5 *
    scenario.airDensityKgM3 *
    profile.cdaM2 *
    relativeAir *
    Math.abs(relativeAir);
  return (rolling + gravity + aero) * speedMps;
}

function steadySpeed(profile, scenario) {
  const available =
    scenario.riderPowerW * profile.drivetrainEfficiency;
  let lo = 0;
  let hi = 60;

  for (let index = 0; index < 90; index += 1) {
    const mid = (lo + hi) / 2;
    const residual =
      available - requiredWheelPower(mid, profile, scenario);
    if (residual >= 0) lo = mid;
    else hi = mid;
  }

  return ((lo + hi) / 2) * 3.6;
}

const flat = {
  riderPowerW: 250,
  riderMassKg: 75,
  cargoMassKg: 0,
  gradePercent: 0,
  windSpeedKph: 0,
  airDensityKgM3: 1.225,
  surfaceId: "smooth-asphalt",
};

const roadFlat = steadySpeed(profileByBike.get(road.id), flat);
const gravelFlat = steadySpeed(profileByBike.get(gravel.id), flat);
const mtbFlat = steadySpeed(profileByBike.get(mtb.id), flat);
const urbanFlat = steadySpeed(profileByBike.get(urban.id), flat);

assert(
  roadFlat > gravelFlat &&
    gravelFlat > mtbFlat &&
    mtbFlat > urbanFlat,
  "P20 flat 250 W reference ordering should remain Road > Gravel > MTB > Urban.",
);
assert(
  roadFlat > 30 && roadFlat < 45,
  "Road R1 flat 250 W sanity result left expected educational range.",
);

const climb = { ...flat, gradePercent: 7 };
const roadClimb = steadySpeed(profileByBike.get(road.id), climb);
const gravelClimb = steadySpeed(profileByBike.get(gravel.id), climb);
assert(
  roadClimb < roadFlat && gravelClimb < gravelFlat,
  "A 7% climb must reduce steady speed at equal rider power.",
);

const headwind = { ...flat, windSpeedKph: 20 };
assert(
  steadySpeed(profileByBike.get(road.id), headwind) < roadFlat,
  "A 20 km/h headwind must reduce Road R1 steady speed.",
);

const cargoClimb = {
  ...climb,
  cargoMassKg: 10,
};
assert(
  steadySpeed(profileByBike.get(gravel.id), cargoClimb) <
    gravelClimb,
  "Added cargo must reduce uphill steady speed.",
);

const modelText = await readFile(
  "engine/physics/model.ts",
  "utf8",
);
assert(
  modelText.includes("relativeAirSpeedMps") &&
    modelText.includes("rollingForceN") &&
    modelText.includes("gravityForceN") &&
    modelText.includes("aeroForceN") &&
    modelText.includes("drivetrainEfficiency"),
  "P20 solver must retain aero, gravity, rolling and drivetrain terms.",
);
assert(
  modelText.includes("cadenceSpeed") &&
    modelText.includes("cadenceForSpeed"),
  "P20 must keep gearing/cadence separate from the steady-state speed solver.",
);

const panelText = await readFile(
  "components/physics/PhysicsLabPanel.tsx",
  "utf8",
);
assert(
  panelText.includes("Power becomes speed.") &&
    panelText.includes("Same rider & environment") &&
    panelText.includes("Reference assumptions") &&
    panelText.includes("Model boundary"),
  "P20 PhysicsLabPanel must retain explanation, comparison, editable assumptions and model boundary.",
);
assert(
  panelText.includes('url.searchParams.set("physics", "1")') &&
    panelText.includes('"pwr"') &&
    panelText.includes('"grade"') &&
    panelText.includes('"wind"') &&
    panelText.includes('"surface"'),
  "P20 PhysicsLabPanel must retain shareable scenario URL state.",
);

const viewerText = await readFile(
  "components/viewer/BikeViewer.tsx",
  "utf8",
);
assert(
  viewerText.includes("PhysicsLabPanel") &&
    viewerText.includes("physicsOpen") &&
    viewerText.includes('searchParams.get("physics")') &&
    viewerText.includes("PHYSICS_QUERY_KEYS"),
  "BikeViewer must retain P20 lab routing and URL lifecycle.",
);
assert(
  viewerText.includes("else if (physicsOpen) setPhysicsOpen(false);"),
  "Escape must close the P20 Physics Lab.",
);

if (errors.length) {
  console.error("\nP20 physics validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ P20 physics valid: ${profiles.length} bike profiles, ${surfaces.length} surfaces, Road 250 W flat ${roadFlat.toFixed(1)} km/h, Gravel ${gravelFlat.toFixed(1)}, MTB ${mtbFlat.toFixed(1)}, Urban ${urbanFlat.toFixed(1)}.`,
);
