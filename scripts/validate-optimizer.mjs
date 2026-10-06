import reference from "../content/compatibility/reference.json" with { type: "json" };
import goals from "../content/optimizer/goals.json" with { type: "json" };
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

const expectedGoals = [
  "speed",
  "climbing",
  "mixed-surface",
  "comfort",
  "utility",
];

const allowedFeatures = new Set([
  "flatSpeed",
  "climbSpeed",
  "hardpackSpeed",
  "mass",
  "aero",
  "lowGear",
  "highGear",
  "range",
  "upright",
  "barWidthComfort",
  "tireWidth",
  "stability",
  "braking",
  "internalGear",
]);

const allowedGuards = new Set([
  "strict",
  "balanced",
  "open",
]);

assert(
  goals.version === 1,
  "P25 goal schema version must remain 1.",
);
assert(
  goals.goals.length === expectedGoals.length,
  "P25 must retain five explicit optimization goals.",
);
assert(
  JSON.stringify(goals.goals.map((goal) => goal.id)) ===
    JSON.stringify(expectedGoals),
  "P25 goal IDs/order drifted.",
);
assert(
  new Set(goals.goals.map((goal) => goal.id)).size ===
    goals.goals.length,
  "P25 goal IDs must be unique.",
);

for (const goal of goals.goals) {
  assert(
    Number.isInteger(goal.defaultMaxChanges) &&
      goal.defaultMaxChanges >= 1 &&
      goal.defaultMaxChanges <= 5,
    `Invalid P25 change budget: ${goal.id}`,
  );
  assert(
    allowedGuards.has(goal.defaultGeometryGuard),
    `Invalid P25 geometry guard: ${goal.id}`,
  );

  const entries = Object.entries(goal.weights);
  assert(
    entries.length >= 5,
    `P25 goal needs a multi-factor score: ${goal.id}`,
  );
  assert(
    entries.every(([featureId, weight]) =>
      allowedFeatures.has(featureId) &&
      typeof weight === "number" &&
      Number.isFinite(weight) &&
      weight !== 0
    ),
    `P25 goal has invalid feature/weight: ${goal.id}`,
  );

  const absoluteWeight = entries.reduce(
    (sum, [, weight]) => sum + Math.abs(weight),
    0,
  );
  approx(
    absoluteWeight,
    1,
    0.001,
    `P25 goal weights should normalize to 1: ${goal.id}`,
  );
}

const speed = goals.goals.find((goal) => goal.id === "speed");
const comfort = goals.goals.find((goal) => goal.id === "comfort");

assert(
  speed?.weights.upright < 0,
  "P25 Speed must prefer less-upright reference contact points.",
);
assert(
  comfort?.weights.upright >= 0.35 &&
    !("mass" in comfort.weights),
  "P25 Comfort must prioritize posture rather than incidental mass savings.",
);

function evaluateRequirement(requirement, part) {
  const actual = part.interfaces[requirement.key];
  if (actual === undefined) return false;
  if (requirement.kind === "exact") {
    return actual === requirement.expected;
  }
  return (
    typeof actual === "number" &&
    actual >= requirement.min &&
    actual <= requirement.max
  );
}

function compatible(slot, part) {
  return (
    slot.id === part.slotId &&
    slot.requirements.every((requirement) =>
      evaluateRequirement(requirement, part),
    )
  );
}

const searchSlots = new Set([
  "front-wheel",
  "rear-wheel",
  "front-tire",
  "rear-tire",
  "handlebar",
  "stem",
  "front-rotor",
  "rear-rotor",
  "seatpost",
  "fork",
  "front-caliper",
  "rear-caliper",
  "crankset",
  "rear-transmission",
  "rear-derailleur",
]);

for (const profile of reference.profiles) {
  const alternativeSlots = profile.slots.filter((slot) => {
    if (!searchSlots.has(slot.id)) return false;
    return (
      reference.parts.filter(
        (part) =>
          part.slotId === slot.id &&
          compatible(slot, part),
      ).length > 1
    );
  });

  assert(
    alternativeSlots.length >= 2,
    `P25 needs a meaningful compatible search space on ${profile.bikeId}`,
  );
}

const road = reference.profiles.find(
  (profile) => profile.bikeId === "bike.road.r1",
);
const roadCrank = reference.parts.find(
  (part) => part.id === "part.road.crankset",
);
const roadTransmission = reference.parts.find(
  (part) => part.id === "part.road.rear-transmission",
);
const roadDerailleur = reference.parts.find(
  (part) => part.id === "part.road.rear-derailleur",
);
const gravelTransmission = reference.parts.find(
  (part) => part.id === "part.gravel.rear-transmission",
);
const gravelDerailleur = reference.parts.find(
  (part) => part.id === "part.gravel.rear-derailleur",
);

const roadTransmissionSlot = road?.slots.find(
  (slot) => slot.id === "rear-transmission",
);
const roadDerailleurSlot = road?.slots.find(
  (slot) => slot.id === "rear-derailleur",
);

assert(
  roadTransmissionSlot &&
    gravelTransmission &&
    compatible(roadTransmissionSlot, gravelTransmission),
  "P25 Road companion-search regression needs the Gravel transmission to pass slot compatibility.",
);
assert(
  roadDerailleurSlot &&
    gravelDerailleur &&
    compatible(roadDerailleurSlot, gravelDerailleur),
  "P25 Road companion-search regression needs the Gravel derailleur to pass slot compatibility.",
);

assert(
  gravelTransmission.interfaces.rearLargeTeeth >
    roadDerailleur.interfaces.maxSprocketTeeth,
  "P25 blocked-intermediate regression requires the Gravel cassette to exceed the Road derailleur limit.",
);

const requiredCapacity =
  roadCrank.interfaces.frontLargeTeeth -
  roadCrank.interfaces.frontSmallTeeth +
  (gravelTransmission.interfaces.rearLargeTeeth -
    gravelTransmission.interfaces.rearSmallTeeth);

assert(
  requiredCapacity >
    roadDerailleur.interfaces.totalCapacityTeeth,
  "P25 blocked-intermediate regression requires Road derailleur capacity to fail.",
);
assert(
  gravelTransmission.interfaces.rearLargeTeeth <=
    gravelDerailleur.interfaces.maxSprocketTeeth &&
    requiredCapacity <=
      gravelDerailleur.interfaces.totalCapacityTeeth,
  "P25 companion regression requires the Gravel derailleur to resolve the modeled Road wide-range drivetrain.",
);

const optimizerText = await readFile(
  "domain/optimizer/optimize.ts",
  "utf8",
);

for (const token of [
  "evaluateCompatibility",
  "analyzeBuild",
  "applyBuildToPhysicsProfile",
  "solveBuildGeometry",
  "solveBuildGearing",
  "simulateProfile",
  "preserveCurrentChanges",
  "GEOMETRY_GUARDS",
  "blockedBeam",
  "beamWidth = 36",
  "state.score > base.score + 0.05",
  "baselineScore: base.score",
]) {
  assert(
    optimizerText.includes(token),
    `P25 optimizer missing required architecture token: ${token}`,
  );
}

assert(
  optimizerText.includes(".slice(0, 8)") &&
    optimizerText.includes('analysis.health === "blocked" ? 12 : 0'),
  "P25 search must retain a bounded blocked-state lane so companion changes can resolve temporary conflicts.",
);
assert(
  optimizerText.includes(
    'const SEARCH_SLOTS = new Set<CompatibilitySlotId>([',
  ) &&
    !optimizerText
      .slice(
        optimizerText.indexOf(
          "const SEARCH_SLOTS = new Set<CompatibilitySlotId>([",
        ),
        optimizerText.indexOf("]);", optimizerText.indexOf("const SEARCH_SLOTS")),
      )
      .includes('"saddle"'),
  "P25 search should focus on consequential build slots rather than cosmetic/minor mass-only swaps.",
);

const panelText = await readFile(
  "components/optimizer/BuildOptimizerPanel.tsx",
  "utf8",
);

for (const token of [
  "Build Optimizer · constraint solver",
  "Hard constraints",
  "Preserve my current modified slots",
  "No improved coherent result under these constraints.",
  "Why it ranked here",
  "Trade-offs",
  "Apply optimized build",
  "Apply + inspect in Build Lab",
  "optimization.baselineScore",
  'url.searchParams.set("optimize", "1")',
  "getOptimizationGoal(initialGoal()).defaultMaxChanges",
  "getOptimizationGoal(initialGoal()).defaultGeometryGuard",
  "P25 model boundary",
]) {
  assert(
    panelText.includes(token),
    `P25 optimizer UI missing required behavior/copy: ${token}`,
  );
}

const viewerText = await readFile(
  "components/viewer/BikeViewer.tsx",
  "utf8",
);

assert(
  viewerText.includes("BuildOptimizerPanel") &&
    viewerText.includes("OPTIMIZER_QUERY_KEYS") &&
    viewerText.includes('searchParams.get("optimize")') &&
    viewerText.includes('searchParams.set("optimize", "1")') &&
    viewerText.includes("optimizer-launch") &&
    viewerText.includes(
      "else if (optimizerOpen) setOptimizerOpen(false);",
    ),
  "BikeViewer must retain P25 optimizer routing and Escape behavior.",
);

assert(
  viewerText.includes(
    "buildSelections={effectiveBuildSelections}",
  ) &&
    viewerText.includes(
      "sanitizeBuildSelections(activeBike.id, next)",
    ) &&
    viewerText.includes("setBuildOpen(true);"),
  "P25 optimizer must apply into the canonical Build Lab / buildParts state.",
);

assert(
  viewerText.includes(
    "setGeometryOpen(true);\n      setOptimizerOpen(false);",
  ),
  "Geometry must explicitly close the P25 optimizer.",
);

if (errors.length) {
  console.error("\nP25 optimizer validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  "✓ P25 optimizer valid: five normalized goals, bounded companion-aware search, hard geometry constraints, improvement-only ranking and shared-build routing checks pass.",
);
