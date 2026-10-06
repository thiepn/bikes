import { analyzeBuild } from "@/domain/compatibility/analyze-build";
import { applyBuildToPhysicsProfile } from "@/domain/compatibility/physics-effects";
import { sanitizeBuildSelections } from "@/domain/compatibility/build-state";
import { solveBuildGeometry } from "@/domain/geometry/solve";
import { solveBuildGearing } from "@/domain/geometry/gearing";
import { PORTFOLIO_SCENARIOS } from "@/domain/optimizer/scenario-catalog";
import { simulateProfile } from "@/engine/physics/model";
import type {
  PortfolioEvaluation,
  PortfolioScenario,
  PortfolioScenarioId,
  PortfolioScenarioResult,
  SavedBuild,
} from "@/engine/optimizer/portfolio-types";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp01((value - min) / (max - min));
}

function scenarioResult(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
  scenario: PortfolioScenario,
): PortfolioScenarioResult | null {
  const physics = applyBuildToPhysicsProfile(
    bikeId,
    selections,
  ).profile;
  const gearing = solveBuildGearing(
    bikeId,
    selections,
    scenario.scenario.cadenceRpm,
  );

  if (!physics || !gearing) return null;

  const result = simulateProfile(
    physics,
    scenario.scenario,
  );

  const firstGear = gearing.combinations[0];
  if (!firstGear) return null;

  const closest = gearing.combinations.reduce(
    (best, candidate) => {
      const bestError = Math.abs(
        best.speedKph - result.speedKph,
      );
      const nextError = Math.abs(
        candidate.speedKph - result.speedKph,
      );
      return nextError < bestError ? candidate : best;
    },
    firstGear,
  );

  const relativeGearError =
    Math.abs(closest.speedKph - result.speedKph) /
    Math.max(1, result.speedKph);

  const cadenceMatchScore = clamp01(
    1 - relativeGearError / 0.25,
  );
  const performanceScore = normalize(
    result.speedKph,
    scenario.speedRangeKph[0],
    scenario.speedRangeKph[1],
  );

  return {
    scenarioId: scenario.id,
    speedKph: result.speedKph,
    score:
      (performanceScore * 0.8 +
        cadenceMatchScore * 0.2) *
      100,
    performanceScore,
    cadenceMatchScore,
    closestGearLabel: closest.label,
    closestGearSpeedKph: closest.speedKph,
  };
}

export function evaluateSavedBuild(
  entry: SavedBuild,
  selectedScenarioIds: readonly PortfolioScenarioId[],
): PortfolioEvaluation | null {
  const selections = sanitizeBuildSelections(
    entry.bikeId,
    entry.selections,
  );
  const analysis = analyzeBuild(entry.bikeId, selections);
  const physics = applyBuildToPhysicsProfile(
    entry.bikeId,
    selections,
  ).profile;
  const geometry = solveBuildGeometry(
    entry.bikeId,
    selections,
  );
  const gearing = solveBuildGearing(
    entry.bikeId,
    selections,
    90,
  );

  if (!physics || !geometry || !gearing) return null;

  const scenarioSet = new Set(selectedScenarioIds);
  const selectedScenarios = PORTFOLIO_SCENARIOS.filter(
    (scenario) => scenarioSet.has(scenario.id),
  );

  const scenarioResults = selectedScenarios.flatMap(
    (scenario) => {
      const result = scenarioResult(
        entry.bikeId,
        selections,
        scenario,
      );
      return result ? [result] : [];
    },
  );

  const healthFactor =
    analysis.health === "blocked"
      ? 0
      : analysis.health === "attention"
        ? 0.97
        : 1;

  const aggregateScore =
    scenarioResults.length > 0
      ? (scenarioResults.reduce(
          (sum, result) => sum + result.score,
          0,
        ) /
          scenarioResults.length) *
        healthFactor
      : 0;

  return {
    entry: {
      ...entry,
      selections,
    },
    health: analysis.health,
    aggregateScore,
    scenarioResults,
    bikeMassKg: physics.bikeMassKg,
    cdaM2: physics.cdaM2,
    lowGearRatio: gearing.easiest.overallRatio,
    highGearRatio: gearing.hardest.overallRatio,
    saddleToGripDropMm:
      geometry.fit.saddleToGripDropMm,
    changedSlots: Object.keys(selections).length,
  };
}

export function evaluatePortfolio(
  entries: readonly SavedBuild[],
  selectedScenarioIds: readonly PortfolioScenarioId[],
) {
  return entries
    .flatMap((entry) => {
      const evaluation = evaluateSavedBuild(
        entry,
        selectedScenarioIds,
      );
      return evaluation ? [evaluation] : [];
    })
    .sort(
      (a, b) =>
        b.aggregateScore - a.aggregateScore ||
        a.changedSlots - b.changedSlots ||
        a.entry.name.localeCompare(b.entry.name),
    );
}
