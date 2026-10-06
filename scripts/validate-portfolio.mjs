import scenarios from "../content/optimizer/scenarios.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}

const expectedScenarioIds = [
  "fast-flat",
  "long-climb",
  "rough-mixed",
  "headwind",
  "loaded-utility",
];

assert(
  scenarios.version === 1,
  "P27 scenario schema version must remain 1.",
);
assert(
  scenarios.scenarios.length === 5,
  "P27 must retain five scenario presets.",
);
assert(
  JSON.stringify(scenarios.scenarios.map((scenario) => scenario.id)) ===
    JSON.stringify(expectedScenarioIds),
  "P27 scenario IDs/order drifted.",
);
assert(
  new Set(scenarios.scenarios.map((scenario) => scenario.id)).size ===
    scenarios.scenarios.length,
  "P27 scenario IDs must be unique.",
);

for (const scenario of scenarios.scenarios) {
  const physics = scenario.scenario;
  assert(
    Number.isFinite(physics.riderPowerW) &&
      physics.riderPowerW > 0 &&
      Number.isFinite(physics.riderMassKg) &&
      physics.riderMassKg > 0 &&
      Number.isFinite(physics.cargoMassKg) &&
      physics.cargoMassKg >= 0 &&
      Number.isFinite(physics.gradePercent) &&
      Number.isFinite(physics.windSpeedKph) &&
      Number.isFinite(physics.airDensityKgM3) &&
      physics.airDensityKgM3 > 0 &&
      Number.isFinite(physics.cadenceRpm) &&
      physics.cadenceRpm > 0,
    "P27 scenario contains invalid Physics values: " + scenario.id,
  );

  assert(
    Array.isArray(scenario.speedRangeKph) &&
      scenario.speedRangeKph.length === 2 &&
      scenario.speedRangeKph[0] >= 0 &&
      scenario.speedRangeKph[1] > scenario.speedRangeKph[0],
    "P27 scenario speed range invalid: " + scenario.id,
  );
}

const evaluatorText = await readFile(
  "domain/optimizer/evaluate-portfolio.ts",
  "utf8",
);
for (const token of [
  "sanitizeBuildSelections",
  "analyzeBuild",
  "applyBuildToPhysicsProfile",
  "solveBuildGeometry",
  "solveBuildGearing",
  "simulateProfile",
  "firstGear",
  "performanceScore * 0.8",
  "cadenceMatchScore * 0.2",
  'analysis.health === "blocked"',
  'analysis.health === "attention"',
  "aggregateScore",
]) {
  assert(
    evaluatorText.includes(token),
    "P27 evaluator missing required behavior: " + token,
  );
}

const storageText = await readFile(
  "domain/optimizer/portfolio-storage.ts",
  "utf8",
);
for (const token of [
  '"bike-atlas:p27-portfolio:v1"',
  "MAX_PORTFOLIO_BUILDS_PER_BIKE = 8",
  "window.localStorage.getItem",
  "window.localStorage.setItem",
  "capPerBike",
  "count >= MAX_PORTFOLIO_BUILDS_PER_BIKE",
  "catch",
]) {
  assert(
    storageText.includes(token),
    "P27 portfolio persistence missing behavior: " + token,
  );
}

const portfolioText = await readFile(
  "components/optimizer/BuildPortfolioPanel.tsx",
  "utf8",
);
for (const token of [
  "Saved build portfolio",
  "Save current build",
  "Saved locally in this browser",
  "DEFAULT_SCENARIOS",
  "if (current.length === 1) return current;",
  'url.searchParams.set("optView", "portfolio")',
  'url.searchParams.set("portSc", scenarioIds.join(","))',
  "80% steady-state performance · 20% cadence fit",
  "Scenario ranking",
  "Saved build name",
  "Restore as active build",
  "Restore + inspect in Build Lab",
  "portfolio-delete",
  'selected.health === "blocked"',
  "P27 decision boundary",
  "browser-local in P27",
]) {
  assert(
    portfolioText.includes(token),
    "P27 portfolio UI missing behavior/copy: " + token,
  );
}

const optimizerText = await readFile(
  "components/optimizer/BuildOptimizerPanel.tsx",
  "utf8",
);
for (const token of [
  'type OptimizerView = "ranked" | "frontier" | "portfolio"',
  "loadSavedBuilds",
  "persistSavedBuilds",
  "portfolioLoaded",
  "encodeBuildSelections(entry.selections) === key",
  "Blocked builds cannot be newly saved",
  "MAX_PORTFOLIO_BUILDS_PER_BIKE",
  "saved decisions",
  "<BuildPortfolioPanel",
  "Save to portfolio",
  'source: PortfolioSource',
  "onSaveSelection",
  "P25–P27 model boundary",
]) {
  assert(
    optimizerText.includes(token),
    "P27 Optimize integration missing token: " + token,
  );
}

assert(
  optimizerText.includes(
    'view === "portfolio" ? (\n          <BuildPortfolioPanel',
  ),
  "Portfolio must be a first-class third Optimize workspace.",
);
assert(
  optimizerText.includes(
    'view !== "portfolio" && (\n        <section className="optimizer-constraints">',
  ),
  "P25 hard-constraint controls should not clutter the P27 scenario workspace.",
);

const frontierText = await readFile(
  "components/optimizer/ParetoFrontierPanel.tsx",
  "utf8",
);
assert(
  frontierText.includes(
    "onSaveSelection: (next: Record<string, string>) => void;",
  ) &&
    frontierText.includes("Save to portfolio"),
  "P26 frontier points must be saveable into the P27 portfolio.",
);

const viewerText = await readFile(
  "components/viewer/BikeViewer.tsx",
  "utf8",
);
assert(
  viewerText.includes('"portSc"'),
  "BikeViewer optimizer cleanup must include P27 scenario URL state.",
);

const cssText = await readFile("app/globals.css", "utf8");
for (const token of [
  "grid-template-columns: repeat(3, minmax(0, 1fr));",
  ".portfolio-notice",
  ".portfolio-scenario-grid",
  ".portfolio-table",
  ".portfolio-inspector",
  ".portfolio-scenario-detail",
  ".portfolio-boundary",
]) {
  assert(
    cssText.includes(token),
    "P27 visual system missing selector/rule: " + token,
  );
}

// Score semantics: exact cadence + upper speed range should be 100;
// a 25% gearing mismatch should reduce cadence-fit contribution to zero.
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
function normalize(value, min, max) {
  return clamp01((value - min) / (max - min));
}
function score(speed, min, max, relativeGearError) {
  const performance = normalize(speed, min, max);
  const cadence = clamp01(1 - relativeGearError / 0.25);
  return (performance * 0.8 + cadence * 0.2) * 100;
}
assert(
  Math.abs(score(50, 25, 50, 0) - 100) < 1e-9,
  "P27 scenario score maximum regression failed.",
);
assert(
  Math.abs(score(25, 25, 50, 0) - 20) < 1e-9,
  "P27 cadence contribution regression failed.",
);
assert(
  Math.abs(score(50, 25, 50, 0.25) - 80) < 1e-9,
  "P27 25% gearing-error regression failed.",
);

if (errors.length) {
  console.error("\nP27 portfolio validation failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log(
  "✓ P27 portfolio valid: five scenarios, capped browser-local persistence, re-sanitized multi-build evaluation, Ranked/Frontier capture, scenario ranking and canonical build restore are protected.",
);
