import road from "../content/bikes/road-r1.json" with { type: "json" };
import mtb from "../content/bikes/mtb-m1.json" with { type: "json" };
import urban from "../content/bikes/urban-u1.json" with { type: "json" };
import questionsJson from "../content/finder/questions.json" with { type: "json" };
import profilesJson from "../content/finder/profiles.json" with { type: "json" };
import presetsJson from "../content/finder/presets.json" with { type: "json" };

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const traits = [
  "pavedEfficiency",
  "mixedSurface",
  "technicalTerrain",
  "distanceEfficiency",
  "climbingCapability",
  "comfortControl",
  "cargoUtility",
  "allWeather",
  "maintenanceSimplicity",
  "suspensionCapability",
];

const traitSet = new Set(traits);
const bikes = new Map([
  [road.id, road],
  [mtb.id, mtb],
  [urban.id, urban],
]);
const questions = questionsJson.questions;
const profiles = profilesJson.profiles;
const presets = presetsJson.presets;

assert(
  questions.length === 7,
  "P13 must currently expose seven finder questions.",
);
assert(
  new Set(questions.map((question) => question.id)).size ===
    questions.length,
  "Finder question IDs must be unique.",
);

const questionById = new Map(
  questions.map((question) => [question.id, question]),
);

for (const question of questions) {
  assert(
    question.title.trim().length > 0 &&
      question.prompt.trim().length > 0,
    `Finder question copy missing: ${question.id}`,
  );
  assert(
    question.options.length >= 3,
    `Finder question needs at least three options: ${question.id}`,
  );
  assert(
    new Set(question.options.map((option) => option.id)).size ===
      question.options.length,
    `Finder option IDs must be unique within ${question.id}`,
  );

  for (const option of question.options) {
    assert(
      option.label.trim().length > 0 &&
        option.description.trim().length > 0,
      `Finder option copy missing: ${question.id}/${option.id}`,
    );

    for (const [traitId, effect] of Object.entries(option.effects)) {
      assert(
        traitSet.has(traitId),
        `Unknown finder trait ${traitId} in ${question.id}/${option.id}`,
      );
      assert(
        Number.isFinite(effect.demand) &&
          effect.demand >= 0 &&
          effect.demand <= 1,
        `Finder demand must be 0..1: ${question.id}/${option.id}/${traitId}`,
      );
      assert(
        Number.isFinite(effect.weight) &&
          effect.weight > 0 &&
          effect.weight <= 10,
        `Finder weight must be >0 and <=10: ${question.id}/${option.id}/${traitId}`,
      );
    }
  }
}

assert(
  profiles.length === bikes.size,
  "Every current Bike Atlas archetype must have one finder profile.",
);
assert(
  new Set(profiles.map((profile) => profile.bikeId)).size ===
    profiles.length,
  "Finder bike profile IDs must be unique.",
);

for (const profile of profiles) {
  assert(
    bikes.has(profile.bikeId),
    `Finder profile targets unknown bike: ${profile.bikeId}`,
  );

  const profileTraits = Object.keys(profile.traits);
  assert(
    profileTraits.length === traits.length,
    `Finder profile must define all traits: ${profile.bikeId}`,
  );

  for (const traitId of traits) {
    assert(
      Number.isFinite(profile.traits[traitId]) &&
        profile.traits[traitId] >= 0 &&
        profile.traits[traitId] <= 1,
      `Finder capability must be 0..1: ${profile.bikeId}/${traitId}`,
    );
    assert(
      typeof profile.traitReasons[traitId] === "string" &&
        profile.traitReasons[traitId].trim().length > 0,
      `Finder trait reason missing: ${profile.bikeId}/${traitId}`,
    );
  }

  assert(
    profile.generalStrengths.length >= 3,
    `Finder strengths incomplete: ${profile.bikeId}`,
  );
  assert(
    profile.generalTradeoffs.length >= 2,
    `Finder tradeoffs incomplete: ${profile.bikeId}`,
  );
}

function sanitize(answers) {
  const clean = {};
  for (const question of questions) {
    const optionId = answers[question.id];
    if (
      optionId &&
      question.options.some((option) => option.id === optionId)
    ) {
      clean[question.id] = optionId;
    }
  }
  return clean;
}

function buildNeeds(answers) {
  const clean = sanitize(answers);
  const accumulator = new Map();

  for (const question of questions) {
    const option = question.options.find(
      (item) => item.id === clean[question.id],
    );
    if (!option) continue;

    for (const [traitId, effect] of Object.entries(option.effects)) {
      const current = accumulator.get(traitId) ?? {
        weightedDemand: 0,
        weight: 0,
      };
      current.weightedDemand += effect.demand * effect.weight;
      current.weight += effect.weight;
      accumulator.set(traitId, current);
    }
  }

  return [...accumulator.entries()].map(([traitId, value]) => ({
    traitId,
    demand: value.weightedDemand / value.weight,
    weight: value.weight,
  }));
}

function score(profile, needs) {
  const totalWeight = needs.reduce((sum, need) => sum + need.weight, 0);
  let weightedLoss = 0;
  const unmet = [];

  for (const need of needs) {
    const capability = profile.traits[need.traitId];
    const shortfall = Math.max(0, need.demand - capability);
    weightedLoss += Math.pow(shortfall, 1.35) * need.weight;

    if (shortfall >= 0.18 && need.demand >= 0.45) {
      unmet.push({
        traitId: need.traitId,
        demand: need.demand,
        capability,
        severity: shortfall * need.weight,
      });
    }
  }

  const value =
    totalWeight === 0
      ? 0
      : 100 * (1 - weightedLoss / totalWeight);

  return {
    bikeId: profile.bikeId,
    score: Math.max(0, Math.min(100, Math.round(value))),
    unmet: unmet.sort((a, b) => b.severity - a.severity),
  };
}

function recommend(answers) {
  const needs = buildNeeds(answers);
  const results = profiles
    .map((profile) => score(profile, needs))
    .sort((a, b) => b.score - a.score);
  const top = results[0];

  return {
    results,
    top,
    catalogGap:
      top.score < 72 ||
      top.unmet.some(
        (factor) =>
          factor.demand >= 0.78 &&
          factor.capability < 0.5,
      ),
  };
}

assert(
  presets.length >= 5,
  "P13 should expose at least five use-case presets.",
);
assert(
  new Set(presets.map((preset) => preset.id)).size === presets.length,
  "Finder preset IDs must be unique.",
);

for (const preset of presets) {
  const clean = sanitize(preset.answers);
  assert(
    Object.keys(clean).length === questions.length,
    `Finder preset must answer every question: ${preset.id}`,
  );

  const encoded = [
    "v1",
    ...questions.map((question) => clean[question.id]),
  ].join(":");
  const parts = encoded.split(":");

  assert(
    parts.length === questions.length + 1 &&
      parts[0] === "v1",
    `Finder preset failed URL encoding shape: ${preset.id}`,
  );
}

const presetById = new Map(
  presets.map((preset) => [preset.id, preset]),
);

const fastRoad = recommend(presetById.get("fast-road").answers);
const mixed = recommend(presetById.get("mixed-explore").answers);
const trail = recommend(presetById.get("trail").answers);
const technical = recommend(presetById.get("technical-trail").answers);
const utility = recommend(presetById.get("daily-utility").answers);

assert(
  fastRoad.top.bikeId === road.id,
  "Fast-road preset must prefer Road R1.",
);
assert(
  mixed.top.bikeId === mtb.id,
  "Mixed-exploration preset must currently prefer MTB M1.",
);
assert(
  trail.top.bikeId === mtb.id,
  "Trail preset must prefer MTB M1.",
);
assert(
  technical.top.bikeId === mtb.id,
  "Technical-trail preset must prefer MTB M1.",
);
assert(
  utility.top.bikeId === urban.id,
  "Daily-utility preset must prefer Urban U1 after P14.",
);
assert(
  !utility.catalogGap,
  "Daily-utility preset should no longer expose a catalog gap after P14.",
);

if (errors.length) {
  console.error("\nP13 finder validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ P13 finder valid: ${questions.length} questions, ${traits.length} traits, ${profiles.length} bike profiles, ${presets.length} presets. Fast road → ${fastRoad.top.bikeId} (${fastRoad.top.score}), trail → ${trail.top.bikeId} (${trail.top.score}), daily utility → ${utility.top.bikeId} (${utility.top.score}), gap=${utility.catalogGap}.`,
);
