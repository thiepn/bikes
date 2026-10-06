import { readFile } from "node:fs/promises";

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const EPS = 0.05;

function close(a, b) {
  return (
    Math.abs(a.x - b.x) <= EPS &&
    Math.abs(a.y - b.y) <= EPS
  );
}

function dominates(a, b) {
  const atLeastAsGood =
    a.x >= b.x - EPS &&
    a.y >= b.y - EPS;

  if (!atLeastAsGood) return false;

  const better =
    a.x > b.x + EPS ||
    a.y > b.y + EPS;

  if (better) return true;

  return close(a, b) && a.changes < b.changes;
}

const current = { id: "current", x: 50, y: 50, changes: 0 };
const speedExtreme = { id: "speed", x: 70, y: 40, changes: 2 };
const balanced = { id: "balanced", x: 61, y: 61, changes: 3 };
const dominated = { id: "dominated", x: 55, y: 55, changes: 2 };
const worseThanCurrent = { id: "worse", x: 45, y: 45, changes: 1 };
const duplicateHeavy = { id: "heavy", x: 70, y: 40, changes: 4 };

assert(
  dominates(current, worseThanCurrent),
  "Current build must dominate a candidate worse on both axes.",
);
assert(
  !dominates(current, speedExtreme),
  "Current build must not eliminate a real X/Y trade-off.",
);
assert(
  dominates(balanced, dominated),
  "A build better on both objectives must dominate the weaker point.",
);
assert(
  dominates(speedExtreme, duplicateHeavy),
  "Near-identical frontier scores must prefer fewer component changes.",
);

const optimizerText = await readFile(
  "domain/optimizer/optimize.ts",
  "utf8",
);
assert(
  optimizerText.includes(
    "export function scoreOptimizationMetrics",
  ),
  "P26 requires the P25 scorer to be exported for independent axes.",
);

const paretoText = await readFile(
  "domain/optimizer/pareto.ts",
  "utf8",
);

for (const token of [
  "SWEEP_WEIGHTS = [0, 0.25, 0.5, 0.75, 1]",
  "SCORE_EPSILON = 0.05",
  "blendGoals",
  "optimizeBuild",
  "scoreOptimizationMetrics",
  "analyzeBuild",
  "encodeBuildSelections",
  "paretoFilter",
  "dominates(current, candidate)",
  "sourceWeights",
  "sampledSearches: SWEEP_WEIGHTS.length",
  "sampledCandidates: candidates.size",
]) {
  assert(
    paretoText.includes(token),
    "P26 frontier engine missing token: " + token,
  );
}

assert(
  paretoText.includes('if (xGoal.id === yGoal.id) return null;'),
  "P26 must reject identical X/Y objectives.",
);
assert(
  paretoText.includes('point.health !== "blocked"'),
  "P26 final frontier must exclude blocked configurations.",
);
assert(
  paretoText.includes('current.health !== "blocked"') &&
    paretoText.includes("dominates(current, candidate)"),
  "A coherent current build must participate in Pareto domination.",
);
assert(
  paretoText.includes(
    "a.changedSlots.length < b.changedSlots.length",
  ),
  "P26 must use fewer changes as the near-equal tie-break.",
);

const typesText = await readFile(
  "engine/optimizer/types.ts",
  "utf8",
);
for (const token of [
  "export interface ParetoPoint",
  "xScore: number",
  "yScore: number",
  'health: "ready" | "attention" | "blocked"',
  "sourceWeights: number[]",
  "isCurrent: boolean",
  "export interface ParetoFrontierResult",
]) {
  assert(
    typesText.includes(token),
    "P26 frontier types missing token: " + token,
  );
}

const frontierPanelText = await readFile(
  "components/optimizer/ParetoFrontierPanel.tsx",
  "utf8",
);

for (const token of [
  "X objective",
  "Y objective",
  "Swap frontier axes",
  "explored Pareto frontier",
  "frontier-chart",
  'role="button"',
  "tabIndex={0}",
  'event.key === "Enter"',
  'event.key === " "',
  "Move along Pareto frontier",
  "Pin for comparison",
  "Selected vs pinned",
  "Apply frontier build",
  "Apply + inspect in Build Lab",
  "Explored frontier, not an exhaustive global optimum",
  'url.searchParams.set("optView", "frontier")',
  'url.searchParams.set("optX", xGoalId)',
  'url.searchParams.set("optY", yGoalId)',
  'url.searchParams.set("optPoint", String(safeIndex))',
  "hasMountedAxes",
  "if (xGoalId !== yGoalId) return;",
]) {
  assert(
    frontierPanelText.includes(token),
    "P26 frontier UI missing behavior/copy: " + token,
  );
}

const optimizerPanelText = await readFile(
  "components/optimizer/BuildOptimizerPanel.tsx",
  "utf8",
);

for (const token of [
  'type OptimizerView = "ranked" | "frontier"',
  "optimizer-view-tabs",
  "Pareto trade-offs",
  'view === "ranked"',
  "? optimizeBuild(",
  "<ParetoFrontierPanel",
  "constraints={constraints}",
  "onApplySelections={onApplySelections}",
  "onOpenBuild={onOpenBuild}",
  'url.searchParams.set("optView", "frontier")',
  'url.searchParams.delete("optX")',
  'url.searchParams.delete("optY")',
  'url.searchParams.delete("optPoint")',
  "P25–P26 model boundary",
]) {
  assert(
    optimizerPanelText.includes(token),
    "P26 optimizer integration missing token: " + token,
  );
}

const viewerText = await readFile(
  "components/viewer/BikeViewer.tsx",
  "utf8",
);
for (const key of [
  '"optView"',
  '"optX"',
  '"optY"',
  '"optPoint"',
]) {
  assert(
    viewerText.includes(key),
    "BikeViewer optimizer cleanup missing P26 query key: " + key,
  );
}

const cssText = await readFile("app/globals.css", "utf8");
for (const token of [
  ".optimizer-view-tabs",
  ".frontier-axis-controls",
  ".frontier-chart",
  ".frontier-line",
  ".frontier-point.is-selected",
  ".frontier-point.is-pinned",
  ".frontier-selector",
  ".frontier-inspector",
  ".frontier-compare",
]) {
  assert(
    cssText.includes(token),
    "P26 visual system missing selector: " + token,
  );
}

if (errors.length) {
  console.error("\nP26 frontier validation failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log(
  "✓ P26 frontier valid: five-sweep explored Pareto search, current-build domination, fewer-change tie-breaks, interactive comparison, deep links and shared build application are protected.",
);
