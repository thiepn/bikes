import reference from "../content/compatibility/reference.json" with { type: "json" };
import consequences from "../content/compatibility/consequences.json" with { type: "json" };
import visual from "../content/compatibility/visual-attachments.json" with { type: "json" };
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
const bikeById = new Map(bikes.map((bike) => [bike.id, bike]));
const profileByBike = new Map(
  reference.profiles.map((profile) => [profile.bikeId, profile]),
);
const partById = new Map(
  reference.parts.map((part) => [part.id, part]),
);
const consequenceByPart = new Map(
  consequences.parts.map((profile) => [profile.partId, profile]),
);

function installedPart(bikeId, slotId) {
  return (
    reference.parts.find(
      (part) =>
        part.sourceBikeId === bikeId &&
        part.slotId === slotId,
    ) ?? null
  );
}

function effectivePart(bikeId, slotId, selections) {
  const selected = selections[slotId];
  if (selected && partById.has(selected)) {
    return partById.get(selected);
  }
  return installedPart(bikeId, slotId);
}

function numberValue(part, key) {
  const value = part?.interfaces?.[key];
  return typeof value === "number" ? value : null;
}

function stringValue(part, key) {
  const value = part?.interfaces?.[key];
  return typeof value === "string" ? value : null;
}

function systemIssueIds(bikeId, selections) {
  const bike = bikeById.get(bikeId);
  const ids = [];

  const frontRotor = effectivePart(bikeId, "front-rotor", selections);
  const frontCaliper = effectivePart(bikeId, "front-caliper", selections);
  const rearTransmission = effectivePart(
    bikeId,
    "rear-transmission",
    selections,
  );
  const rearDerailleur = effectivePart(
    bikeId,
    "rear-derailleur",
    selections,
  );
  const crankset = effectivePart(bikeId, "crankset", selections);

  const frontDiameter = numberValue(frontRotor, "rotorDiameter");
  const caliperMin = numberValue(frontCaliper, "rotorMinDiameter");
  const caliperMax = numberValue(frontCaliper, "rotorMaxDiameter");
  if (
    frontDiameter !== null &&
    caliperMin !== null &&
    caliperMax !== null &&
    (frontDiameter < caliperMin || frontDiameter > caliperMax)
  ) {
    ids.push("front-caliper-rotor-range");
  }

  const architecture = stringValue(
    rearTransmission,
    "transmissionArchitecture",
  );
  const rearLarge = numberValue(
    rearTransmission,
    "rearLargeTeeth",
  );
  const rearSmall = numberValue(
    rearTransmission,
    "rearSmallTeeth",
  );
  const frontLarge = numberValue(crankset, "frontLargeTeeth");
  const frontSmall = numberValue(crankset, "frontSmallTeeth");

  if (architecture === "external-cassette" && rearDerailleur) {
    const maxSprocket = numberValue(
      rearDerailleur,
      "maxSprocketTeeth",
    );
    if (
      rearLarge !== null &&
      maxSprocket !== null &&
      rearLarge > maxSprocket
    ) {
      ids.push("rear-derailleur-largest-sprocket");
    }

    const capacity = numberValue(
      rearDerailleur,
      "totalCapacityTeeth",
    );
    if (
      capacity !== null &&
      rearLarge !== null &&
      rearSmall !== null &&
      frontLarge !== null &&
      frontSmall !== null
    ) {
      const required =
        frontLarge - frontSmall + (rearLarge - rearSmall);
      if (required > capacity) {
        ids.push("rear-derailleur-capacity");
      }
    }
  }

  const ringCount = numberValue(crankset, "ringCount");
  const hasFrontDerailleur = bike?.components.some(
    (component) => component.slug === "front-derailleur",
  );
  if (
    ringCount !== null &&
    ringCount > 1 &&
    !hasFrontDerailleur
  ) {
    ids.push("multi-ring-no-front-derailleur");
  }

  return ids;
}

assert(
  consequences.version === 1,
  "P23 consequence schema version must remain 1.",
);
assert(
  consequences.parts.length === reference.parts.length,
  "Every P23 reference part must have a consequence profile.",
);
assert(
  new Set(consequences.parts.map((part) => part.partId)).size ===
    consequences.parts.length,
  "P23 consequence part IDs must be unique.",
);

for (const part of reference.parts) {
  const consequence = consequenceByPart.get(part.id);
  assert(
    Boolean(consequence),
    `Missing P23 consequence profile: ${part.id}`,
  );
  if (!consequence) continue;

  assert(
    Number.isFinite(consequence.massKg) &&
      consequence.massKg > 0 &&
      consequence.massKg < 5,
    `Invalid reference mass for ${part.id}`,
  );
}

const handlebarConsequences = consequences.parts.filter(
  (profile) =>
    partById.get(profile.partId)?.slotId === "handlebar",
);
assert(
  handlebarConsequences.length === 4 &&
    handlebarConsequences.every((profile) =>
      Number.isFinite(profile.aeroCdAContributionM2),
    ),
  "All four reference handlebars must carry P23 aero contribution data.",
);

assert(
  profileByBike.get("bike.road.r1")?.slots.length === 18 &&
    profileByBike.get("bike.gravel.g1")?.slots.length === 18 &&
    profileByBike.get("bike.mtb.m1")?.slots.length === 18 &&
    profileByBike.get("bike.urban.u1")?.slots.length === 17,
  "P23 host slot counts must remain 18/18/18/17.",
);
assert(
  reference.parts.length === 71,
  "P23 should retain 71 curated reference donor parts.",
);
assert(
  visual.hosts.reduce(
    (sum, host) => sum + host.attachments.length,
    0,
  ) === 71,
  "P23 must retain one authored 3D attachment per build slot.",
);

const roadWide = systemIssueIds("bike.road.r1", {
  "rear-transmission": "part.gravel.rear-transmission",
});
assert(
  roadWide.includes("rear-derailleur-largest-sprocket") &&
    roadWide.includes("rear-derailleur-capacity"),
  "Road + Gravel cassette must require a drivetrain companion change.",
);

const roadWideResolved = systemIssueIds("bike.road.r1", {
  "rear-transmission": "part.gravel.rear-transmission",
  "rear-derailleur": "part.gravel.rear-derailleur",
});
assert(
  !roadWideResolved.includes("rear-derailleur-largest-sprocket") &&
    !roadWideResolved.includes("rear-derailleur-capacity"),
  "Adding the Gravel derailleur must resolve the modeled Road wide-range cassette limits.",
);

const gravelDouble = systemIssueIds("bike.gravel.g1", {
  crankset: "part.road.crankset",
});
assert(
  gravelDouble.includes("multi-ring-no-front-derailleur"),
  "Gravel + Road 2× crankset must require a front shifting system.",
);

const gravelBrakeConflict = systemIssueIds("bike.gravel.g1", {
  "front-caliper": "part.road.front-caliper",
  "front-rotor": "part.urban.front-rotor",
});
assert(
  gravelBrakeConflict.includes("front-caliper-rotor-range"),
  "A 180 mm front rotor with the Road caliper must be blocked on the Gravel host.",
);

const roadFork = partById.get("part.road.fork");
const gravelFork = partById.get("part.gravel.fork");
assert(
  numberValue(roadFork, "axleToCrown") === 385 &&
    numberValue(gravelFork, "axleToCrown") === 410 &&
    numberValue(roadFork, "suspensionTravel") === 0,
  "P23 fork consequence reference values drifted.",
);

const analyzerText = await readFile(
  "domain/compatibility/analyze-build.ts",
  "utf8",
);
for (const token of [
  "rear-derailleur-largest-sprocket",
  "rear-derailleur-capacity",
  "front-caliper-rotor-range",
  "fork-front-rotor-limit",
  "fork-geometry-change",
  "multi-ring-no-front-derailleur",
  "massDeltaKg",
  "cdaDeltaM2",
  "frontBrakeTorqueRatio",
  "gearRangePercent",
]) {
  assert(
    analyzerText.includes(token),
    `P23 analyzer missing required consequence token: ${token}`,
  );
}

const physicsEffectsText = await readFile(
  "domain/compatibility/physics-effects.ts",
  "utf8",
);
assert(
  physicsEffectsText.includes("analysis.metrics.massDeltaKg") &&
    physicsEffectsText.includes("analysis.metrics.cdaDeltaM2") &&
    physicsEffectsText.includes('["front-tire", "rear-tire"]') &&
    physicsEffectsText.includes('selections["rear-transmission"]'),
  "P23 Physics propagation must retain mass, aero, tire and transmission effects.",
);

const physicsPanelText = await readFile(
  "components/physics/PhysicsLabPanel.tsx",
  "utf8",
);
assert(
  physicsPanelText.includes("Active Build Lab draft") &&
    physicsPanelText.includes("Simulation is provisional") &&
    physicsPanelText.includes("applyBuildToPhysicsProfile"),
  "Physics Lab must surface P23 active-build propagation and blocked-build warning.",
);

const buildPanelText = await readFile(
  "components/build/BuildLabPanel.tsx",
  "utf8",
);
assert(
  buildPanelText.includes("System analysis") &&
    buildPanelText.includes("Companion changes required") &&
    buildPanelText.includes("build-consequence-metrics") &&
    buildPanelText.includes("analyzeBuild"),
  "Build Lab must surface P23 cross-component analysis.",
);

const viewerText = await readFile(
  "components/viewer/BikeViewer.tsx",
  "utf8",
);
assert(
  viewerText.includes('url.searchParams.set("buildParts", encodedBuild)') &&
    viewerText.includes('url.searchParams.delete("build");') &&
    viewerText.includes("buildSelections={effectiveBuildSelections}"),
  "P23 custom builds must persist independently of whether the Build panel is open.",
);

if (errors.length) {
  console.error("\nP23 build consequence validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ P23 consequences valid: ${reference.parts.length} parts, 71 visual slots, drivetrain/brake/fork dependency regressions pass.`,
);
