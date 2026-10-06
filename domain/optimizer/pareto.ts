import { analyzeBuild } from "@/domain/compatibility/analyze-build";
import {
  encodeBuildSelections,
  sanitizeBuildSelections,
} from "@/domain/compatibility/build-state";
import {
  optimizeBuild,
  scoreOptimizationMetrics,
} from "@/domain/optimizer/optimize";
import type {
  OptimizationConstraints,
  OptimizationFeatureId,
  OptimizationGoalProfile,
  OptimizationMetrics,
  ParetoFrontierResult,
  ParetoPoint,
} from "@/engine/optimizer/types";

const SWEEP_WEIGHTS = [0, 0.25, 0.5, 0.75, 1] as const;
const SCORE_EPSILON = 0.05;

function blendGoals(
  xGoal: OptimizationGoalProfile,
  yGoal: OptimizationGoalProfile,
  yWeight: number,
): OptimizationGoalProfile {
  const xWeight = 1 - yWeight;
  const features = new Set<OptimizationFeatureId>([
    ...(Object.keys(xGoal.weights) as OptimizationFeatureId[]),
    ...(Object.keys(yGoal.weights) as OptimizationFeatureId[]),
  ]);

  const blended: Partial<Record<OptimizationFeatureId, number>> = {};

  for (const featureId of features) {
    const value =
      (xGoal.weights[featureId] ?? 0) * xWeight +
      (yGoal.weights[featureId] ?? 0) * yWeight;

    if (Math.abs(value) >= 0.0001) blended[featureId] = value;
  }

  const magnitude = Object.values(blended).reduce(
    (sum, value) => sum + Math.abs(value ?? 0),
    0,
  );

  if (magnitude > 0) {
    for (const featureId of Object.keys(blended) as OptimizationFeatureId[]) {
      blended[featureId] = (blended[featureId] ?? 0) / magnitude;
    }
  }

  return {
    id: xGoal.id,
    name: `${xGoal.name} ↔ ${yGoal.name}`,
    shortName: "Frontier",
    description:
      "P26 sampled multi-objective blend used only to explore the bounded build space.",
    emphasis: `${Math.round(xWeight * 100)}% ${xGoal.name} / ${Math.round(
      yWeight * 100,
    )}% ${yGoal.name}`,
    defaultMaxChanges: Math.max(
      xGoal.defaultMaxChanges,
      yGoal.defaultMaxChanges,
    ),
    defaultGeometryGuard: "balanced",
    weights: blended,
  };
}

function pointFromMetrics(
  id: string,
  selections: Record<string, string>,
  changedSlots: ParetoPoint["changedSlots"],
  metrics: OptimizationMetrics,
  health: ParetoPoint["health"],
  xGoal: OptimizationGoalProfile,
  yGoal: OptimizationGoalProfile,
  sourceWeights: number[],
  isCurrent: boolean,
): ParetoPoint {
  return {
    id,
    selections,
    changedSlots,
    metrics,
    xScore: scoreOptimizationMetrics(xGoal, metrics),
    yScore: scoreOptimizationMetrics(yGoal, metrics),
    health,
    sourceWeights,
    isCurrent,
  };
}

function closeScores(a: ParetoPoint, b: ParetoPoint) {
  return (
    Math.abs(a.xScore - b.xScore) <= SCORE_EPSILON &&
    Math.abs(a.yScore - b.yScore) <= SCORE_EPSILON
  );
}

function dominates(a: ParetoPoint, b: ParetoPoint) {
  const atLeastAsGood =
    a.xScore >= b.xScore - SCORE_EPSILON &&
    a.yScore >= b.yScore - SCORE_EPSILON;

  if (!atLeastAsGood) return false;

  const meaningfullyBetter =
    a.xScore > b.xScore + SCORE_EPSILON ||
    a.yScore > b.yScore + SCORE_EPSILON;

  if (meaningfullyBetter) return true;

  return (
    closeScores(a, b) &&
    a.changedSlots.length < b.changedSlots.length
  );
}

function paretoFilter(points: ParetoPoint[], current: ParetoPoint) {
  const coherent = points.filter((point) => point.health !== "blocked");

  return coherent.filter((candidate) => {
    if (current.health !== "blocked" && dominates(current, candidate)) {
      return false;
    }

    return !coherent.some(
      (other) =>
        other.id !== candidate.id &&
        dominates(other, candidate),
    );
  });
}

export function exploreParetoFrontier(
  bikeId: string,
  xGoal: OptimizationGoalProfile,
  yGoal: OptimizationGoalProfile,
  inputSelections: Readonly<Record<string, string>>,
  constraints: OptimizationConstraints,
): ParetoFrontierResult | null {
  if (xGoal.id === yGoal.id) return null;

  const baselineSelections = sanitizeBuildSelections(
    bikeId,
    inputSelections,
  );

  const first = optimizeBuild(
    bikeId,
    blendGoals(xGoal, yGoal, 0),
    baselineSelections,
    constraints,
  );
  if (!first) return null;

  const baselineHealth = analyzeBuild(
    bikeId,
    baselineSelections,
  ).health;

  const current = pointFromMetrics(
    "current",
    baselineSelections,
    [],
    first.baselineMetrics,
    baselineHealth,
    xGoal,
    yGoal,
    [0, 1],
    true,
  );

  const candidates = new Map<string, ParetoPoint>();

  for (const yWeight of SWEEP_WEIGHTS) {
    const blendedGoal = blendGoals(xGoal, yGoal, yWeight);
    const result =
      yWeight === 0
        ? first
        : optimizeBuild(
            bikeId,
            blendedGoal,
            baselineSelections,
            constraints,
          );

    if (!result) continue;

    for (const build of result.results) {
      const key = encodeBuildSelections(build.selections);
      const existing = candidates.get(key);

      if (existing) {
        if (!existing.sourceWeights.includes(yWeight)) {
          existing.sourceWeights.push(yWeight);
          existing.sourceWeights.sort((a, b) => a - b);
        }
        continue;
      }

      candidates.set(
        key,
        pointFromMetrics(
          key || "stock",
          build.selections,
          build.changedSlots,
          build.metrics,
          build.health,
          xGoal,
          yGoal,
          [yWeight],
          false,
        ),
      );
    }
  }

  const frontier = paretoFilter(
    [...candidates.values()],
    current,
  ).sort(
    (a, b) =>
      a.xScore - b.xScore ||
      b.yScore - a.yScore ||
      a.changedSlots.length - b.changedSlots.length,
  );

  return {
    bikeId,
    xGoal,
    yGoal,
    constraints,
    sampledSearches: SWEEP_WEIGHTS.length,
    sampledCandidates: candidates.size,
    frontier,
    current,
  };
}
