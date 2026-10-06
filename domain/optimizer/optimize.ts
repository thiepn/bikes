import {
  getCompatibilityPartsForSlot,
  getCompatibilityProfile,
  getInstalledReferencePart,
} from "@/domain/compatibility/catalog";
import { evaluateCompatibility } from "@/domain/compatibility/evaluate";
import {
  analyzeBuild,
  getEffectiveBuildPart,
} from "@/domain/compatibility/analyze-build";
import { applyBuildToPhysicsProfile } from "@/domain/compatibility/physics-effects";
import {
  encodeBuildSelections,
  sanitizeBuildSelections,
} from "@/domain/compatibility/build-state";
import { solveBuildGeometry } from "@/domain/geometry/solve";
import { solveBuildGearing } from "@/domain/geometry/gearing";
import { simulateProfile } from "@/engine/physics/model";
import type {
  PhysicsScenario,
  PhysicsSurfaceId,
} from "@/engine/physics/types";
import type {
  CompatibilityPart,
  CompatibilitySlotId,
} from "@/engine/compatibility/types";
import type {
  GeometryGuard,
  OptimizationConstraints,
  OptimizationExplanation,
  OptimizationFeatureId,
  OptimizationGoalProfile,
  OptimizationMetrics,
  OptimizationResult,
  OptimizationTradeoff,
  OptimizedBuild,
} from "@/engine/optimizer/types";

const SEARCH_SLOTS = new Set<CompatibilitySlotId>([
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

const GEOMETRY_GUARDS: Record<
  GeometryGuard,
  {
    headAngleDeg: number;
    trailMm: number;
    barReachMm: number;
    barStackMm: number;
    wheelbaseMm: number;
  }
> = {
  strict: {
    headAngleDeg: 0.6,
    trailMm: 8,
    barReachMm: 20,
    barStackMm: 20,
    wheelbaseMm: 15,
  },
  balanced: {
    headAngleDeg: 1.5,
    trailMm: 20,
    barReachMm: 45,
    barStackMm: 45,
    wheelbaseMm: 35,
  },
  open: {
    headAngleDeg: Infinity,
    trailMm: Infinity,
    barReachMm: Infinity,
    barStackMm: Infinity,
    wheelbaseMm: Infinity,
  },
};

const FEATURE_LABELS: Record<OptimizationFeatureId, string> = {
  flatSpeed: "Flat-road speed",
  climbSpeed: "Climbing speed",
  hardpackSpeed: "Hardpack speed",
  mass: "Low mass",
  aero: "Low drag",
  lowGear: "Low climbing gear",
  highGear: "Top-end gearing",
  range: "Gear range",
  upright: "Upright contact points",
  barWidthComfort: "Moderate bar width",
  tireWidth: "Tire volume",
  stability: "Stable geometry",
  braking: "Brake leverage",
  internalGear: "Internal-gear utility",
};

type CandidateState = {
  selections: Record<string, string>;
  metrics: OptimizationMetrics;
  score: number;
  searchScore: number;
  health: ReturnType<typeof analyzeBuild>["health"];
  changedSlots: CompatibilitySlotId[];
  key: string;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp01((value - min) / (max - min));
}

function inverseNormalize(value: number, min: number, max: number) {
  return 1 - normalize(value, min, max);
}

function numberInterface(
  part: CompatibilityPart | null,
  key: string,
) {
  const value = part?.interfaces[key];
  return typeof value === "number" ? value : null;
}

function buildScenario(
  surfaceId: PhysicsSurfaceId,
  riderPowerW: number,
  gradePercent: number,
): PhysicsScenario {
  return {
    riderPowerW,
    riderMassKg: 75,
    cargoMassKg: 0,
    gradePercent,
    windSpeedKph: 0,
    airDensityKgM3: 1.225,
    surfaceId,
    cadenceRpm: 90,
    driveRatio: 1,
  };
}

function getAverageTireWidth(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
) {
  const widths = (["front-tire", "rear-tire"] as const)
    .map((slotId) =>
      numberInterface(
        getEffectiveBuildPart(bikeId, slotId, selections),
        "tireWidth",
      ),
    )
    .filter((value): value is number => value !== null);

  if (!widths.length) return 0;
  return widths.reduce((sum, value) => sum + value, 0) / widths.length;
}

function measureBuild(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
): OptimizationMetrics | null {
  const physics = applyBuildToPhysicsProfile(bikeId, selections).profile;
  const geometry = solveBuildGeometry(bikeId, selections);
  const gearing = solveBuildGearing(bikeId, selections, 90);

  if (!physics || !geometry || !gearing) return null;

  const flat = simulateProfile(
    physics,
    buildScenario("smooth-asphalt", 250, 0),
  );
  const climb = simulateProfile(
    physics,
    buildScenario("smooth-asphalt", 250, 8),
  );
  const hardpack = simulateProfile(
    physics,
    buildScenario("hardpack-gravel", 220, 0),
  );

  return {
    bikeMassKg: physics.bikeMassKg,
    cdaM2: physics.cdaM2,
    flatSpeedKph: flat.speedKph,
    climbSpeedKph: climb.speedKph,
    hardpackSpeedKph: hardpack.speedKph,
    lowGearRatio: gearing.easiest.overallRatio,
    highGearRatio: gearing.hardest.overallRatio,
    gearRangePercent: gearing.rangePercent,
    averageTireWidthMm: getAverageTireWidth(bikeId, selections),
    averageBrakeLeverageRatio:
      (analyzeBuild(bikeId, selections).metrics.frontBrakeTorqueRatio +
        analyzeBuild(bikeId, selections).metrics.rearBrakeTorqueRatio) /
      2,
    barWidthMm: geometry.bar.widthMm,
    saddleToGripDropMm: geometry.fit.saddleToGripDropMm,
    trailMm: geometry.trailMm,
    wheelbaseMm: geometry.wheelbaseMm,
    internalGear: gearing.architecture === "internal-gear",
  };
}

function featureValues(metrics: OptimizationMetrics) {
  const stability =
    clamp01(
      1 - Math.abs(metrics.trailMm - 70) / 45,
    ) *
      0.7 +
    normalize(metrics.wheelbaseMm, 950, 1200) * 0.3;

  return {
    flatSpeed: normalize(metrics.flatSpeedKph, 18, 50),
    climbSpeed: normalize(metrics.climbSpeedKph, 5, 18),
    hardpackSpeed: normalize(metrics.hardpackSpeedKph, 12, 36),
    mass: inverseNormalize(metrics.bikeMassKg, 7, 20),
    aero: inverseNormalize(metrics.cdaM2, 0.28, 0.75),
    lowGear: inverseNormalize(metrics.lowGearRatio, 0.6, 1.8),
    highGear: normalize(metrics.highGearRatio, 2.5, 5),
    range: normalize(metrics.gearRangePercent, 250, 550),
    upright: inverseNormalize(
      metrics.saddleToGripDropMm,
      -60,
      180,
    ),
    barWidthComfort: clamp01(
      1 - Math.abs(metrics.barWidthMm - 600) / 250,
    ),
    tireWidth: normalize(metrics.averageTireWidthMm, 25, 60),
    stability,
    braking: normalize(
      metrics.averageBrakeLeverageRatio,
      0.85,
      1.2,
    ),
    internalGear: metrics.internalGear ? 1 : 0,
  } satisfies Record<OptimizationFeatureId, number>;
}

function rawGoalScore(
  goal: OptimizationGoalProfile,
  metrics: OptimizationMetrics,
) {
  const values = featureValues(metrics);
  let weighted = 0;
  let totalWeight = 0;

  for (const [featureId, rawWeight] of Object.entries(goal.weights)) {
    const weight = rawWeight ?? 0;
    if (!weight) continue;

    const value = values[featureId as OptimizationFeatureId];
    const magnitude = Math.abs(weight);
    weighted +=
      weight >= 0 ? value * magnitude : (1 - value) * magnitude;
    totalWeight += magnitude;
  }

  if (!totalWeight) return 0;
  return (weighted / totalWeight) * 100;
}

function geometryAllowed(
  guard: GeometryGuard,
  baseline: ReturnType<typeof solveBuildGeometry>,
  candidate: ReturnType<typeof solveBuildGeometry>,
) {
  if (!baseline || !candidate) return false;
  const limits = GEOMETRY_GUARDS[guard];

  return (
    Math.abs(candidate.headAngleDeg - baseline.headAngleDeg) <=
      limits.headAngleDeg &&
    Math.abs(candidate.trailMm - baseline.trailMm) <=
      limits.trailMm &&
    Math.abs(candidate.bar.xMm - baseline.bar.xMm) <=
      limits.barReachMm &&
    Math.abs(candidate.bar.yMm - baseline.bar.yMm) <=
      limits.barStackMm &&
    Math.abs(candidate.wheelbaseMm - baseline.wheelbaseMm) <=
      limits.wheelbaseMm
  );
}

function effectivePartId(
  bikeId: string,
  slotId: CompatibilitySlotId,
  selections: Readonly<Record<string, string>>,
) {
  return getEffectiveBuildPart(bikeId, slotId, selections)?.id ?? null;
}

function changedSlotsFromBaseline(
  bikeId: string,
  baseline: Readonly<Record<string, string>>,
  candidate: Readonly<Record<string, string>>,
  slots: CompatibilitySlotId[],
) {
  return slots.filter(
    (slotId) =>
      effectivePartId(bikeId, slotId, baseline) !==
      effectivePartId(bikeId, slotId, candidate),
  );
}

function mutateSelection(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
  slotId: CompatibilitySlotId,
  partId: string,
) {
  const next = { ...selections };
  const installed = getInstalledReferencePart(bikeId, slotId);

  if (installed?.id === partId) delete next[slotId];
  else next[slotId] = partId;

  return sanitizeBuildSelections(bikeId, next);
}

function metricValue(
  featureId: OptimizationFeatureId,
  metrics: OptimizationMetrics,
) {
  switch (featureId) {
    case "flatSpeed":
      return metrics.flatSpeedKph.toFixed(1) + " km/h";
    case "climbSpeed":
      return metrics.climbSpeedKph.toFixed(1) + " km/h";
    case "hardpackSpeed":
      return metrics.hardpackSpeedKph.toFixed(1) + " km/h";
    case "mass":
      return metrics.bikeMassKg.toFixed(2) + " kg";
    case "aero":
      return metrics.cdaM2.toFixed(3) + " m² CdA";
    case "lowGear":
      return metrics.lowGearRatio.toFixed(2) + "×";
    case "highGear":
      return metrics.highGearRatio.toFixed(2) + "×";
    case "range":
      return Math.round(metrics.gearRangePercent) + "%";
    case "upright":
      return Math.round(metrics.saddleToGripDropMm) + " mm drop";
    case "barWidthComfort":
      return Math.round(metrics.barWidthMm) + " mm";
    case "tireWidth":
      return Math.round(metrics.averageTireWidthMm) + " mm";
    case "stability":
      return Math.round(metrics.trailMm) + " mm trail";
    case "braking":
      return (
        Math.round(metrics.averageBrakeLeverageRatio * 100) + "% ref."
      );
    case "internalGear":
      return metrics.internalGear ? "internal gear" : "external";
  }
}

function explanationsFor(
  goal: OptimizationGoalProfile,
  metrics: OptimizationMetrics,
): OptimizationExplanation[] {
  const values = featureValues(metrics);

  return Object.entries(goal.weights)
    .map(([rawFeatureId, rawWeight]) => {
      const featureId = rawFeatureId as OptimizationFeatureId;
      const weight = rawWeight ?? 0;
      const magnitude = Math.abs(weight);
      const value = values[featureId];
      const contribution =
        (weight >= 0 ? value : 1 - value) * magnitude;

      return {
        featureId,
        label: FEATURE_LABELS[featureId],
        value: metricValue(featureId, metrics),
        contribution,
      };
    })
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 4);
}

function deltaText(value: number, digits: number, unit: string) {
  const rounded = Number(value.toFixed(digits));
  return (rounded > 0 ? "+" : "") + rounded + unit;
}

function tradeoffsFor(
  baseline: OptimizationMetrics,
  candidate: OptimizationMetrics,
): OptimizationTradeoff[] {
  const items: OptimizationTradeoff[] = [];

  const comparisons = [
    {
      delta: candidate.flatSpeedKph - baseline.flatSpeedKph,
      threshold: 0.15,
      label: "Flat speed",
      format: (delta: number) => deltaText(delta, 1, " km/h"),
      positive: true,
    },
    {
      delta: candidate.climbSpeedKph - baseline.climbSpeedKph,
      threshold: 0.1,
      label: "Climbing speed",
      format: (delta: number) => deltaText(delta, 1, " km/h"),
      positive: true,
    },
    {
      delta: candidate.bikeMassKg - baseline.bikeMassKg,
      threshold: 0.03,
      label: "Bike mass",
      format: (delta: number) => deltaText(delta, 2, " kg"),
      positive: false,
    },
    {
      delta: candidate.cdaM2 - baseline.cdaM2,
      threshold: 0.005,
      label: "Aerodynamic reference",
      format: (delta: number) => deltaText(delta, 3, " m²"),
      positive: false,
    },
    {
      delta: candidate.lowGearRatio - baseline.lowGearRatio,
      threshold: 0.03,
      label: "Lowest gear",
      format: (delta: number) => deltaText(delta, 2, "×"),
      positive: false,
    },
    {
      delta:
        candidate.averageTireWidthMm - baseline.averageTireWidthMm,
      threshold: 1,
      label: "Average tire width",
      format: (delta: number) => deltaText(delta, 0, " mm"),
      positive: true,
    },
  ];

  for (const comparison of comparisons) {
    if (Math.abs(comparison.delta) < comparison.threshold) continue;
    const isGain = comparison.positive
      ? comparison.delta > 0
      : comparison.delta < 0;
    items.push({
      kind: isGain ? "gain" : "cost",
      label: comparison.label,
      detail: comparison.format(comparison.delta),
    });
  }

  if (!items.length) {
    items.push({
      kind: "neutral",
      label: "Trade-off",
      detail: "Performance reference remains close to the starting build.",
    });
  }

  return items.slice(0, 5);
}

function candidateOptions(
  bikeId: string,
  slotId: CompatibilitySlotId,
) {
  const profile = getCompatibilityProfile(bikeId);
  const slot = profile?.slots.find((item) => item.id === slotId);
  if (!slot) return [];

  return getCompatibilityPartsForSlot(slotId)
    .filter(
      (part) =>
        evaluateCompatibility(slot, part).status === "compatible",
    )
    .map((part) => part.id);
}

export function optimizeBuild(
  bikeId: string,
  goal: OptimizationGoalProfile,
  inputSelections: Readonly<Record<string, string>>,
  constraints: OptimizationConstraints,
): OptimizationResult | null {
  const profile = getCompatibilityProfile(bikeId);
  if (!profile) return null;

  const baselineSelections = sanitizeBuildSelections(
    bikeId,
    inputSelections,
  );
  const baselineMetrics = measureBuild(bikeId, baselineSelections);
  const baselineGeometry = solveBuildGeometry(
    bikeId,
    baselineSelections,
  );
  if (!baselineMetrics || !baselineGeometry) return null;

  const slots = profile.slots
    .map((slot) => slot.id)
    .filter((slotId) => SEARCH_SLOTS.has(slotId));

  const options = new Map(
    slots.map((slotId) => [
      slotId,
      candidateOptions(bikeId, slotId),
    ]),
  );

  const cache = new Map<string, CandidateState | null>();
  let rejectedByGeometry = 0;

  function evaluateState(
    selections: Record<string, string>,
  ): CandidateState | null {
    const key = encodeBuildSelections(selections);
    if (cache.has(key)) return cache.get(key) ?? null;

    const changedSlots = changedSlotsFromBaseline(
      bikeId,
      baselineSelections,
      selections,
      slots,
    );

    if (changedSlots.length > constraints.maxChanges) {
      cache.set(key, null);
      return null;
    }

    const geometry = solveBuildGeometry(bikeId, selections);
    if (
      !geometryAllowed(
        constraints.geometryGuard,
        baselineGeometry,
        geometry,
      )
    ) {
      rejectedByGeometry += 1;
      cache.set(key, null);
      return null;
    }

    const metrics = measureBuild(bikeId, selections);
    if (!metrics) {
      cache.set(key, null);
      return null;
    }

    const analysis = analyzeBuild(bikeId, selections);
    const goalScore = rawGoalScore(goal, metrics);
    const warningPenalty =
      analysis.health === "attention" ? 1.5 : 0;
    const changePenalty = changedSlots.length * 1.25;
    const blockedPenalty =
      analysis.health === "blocked" ? 12 : 0;
    const score = Math.max(
      0,
      goalScore - warningPenalty - changePenalty,
    );

    const state: CandidateState = {
      selections,
      metrics,
      score,
      searchScore: score - blockedPenalty,
      health: analysis.health,
      changedSlots,
      key,
    };
    cache.set(key, state);
    return state;
  }

  const base = evaluateState(baselineSelections);
  if (!base) return null;

  let beam = [base];
  const seen = new Set([base.key]);
  const coherent = new Map<string, CandidateState>();

  const maxDepth = Math.max(
    1,
    Math.min(5, Math.round(constraints.maxChanges)),
  );
  const beamWidth = 36;

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const expanded: CandidateState[] = [];

    for (const state of beam) {
      for (const slotId of slots) {
        if (
          constraints.preserveCurrentChanges &&
          baselineSelections[slotId]
        ) {
          continue;
        }

        for (const partId of options.get(slotId) ?? []) {
          if (
            effectivePartId(
              bikeId,
              slotId,
              state.selections,
            ) === partId
          ) {
            continue;
          }

          const nextSelections = mutateSelection(
            bikeId,
            state.selections,
            slotId,
            partId,
          );
          const key = encodeBuildSelections(nextSelections);
          if (seen.has(key)) continue;
          seen.add(key);

          const next = evaluateState(nextSelections);
          if (!next || next.changedSlots.length === 0) continue;

          expanded.push(next);
          if (next.health !== "blocked") {
            coherent.set(next.key, next);
          }
        }
      }
    }

    if (!expanded.length) break;

    expanded.sort((a, b) => b.searchScore - a.searchScore);

    const coherentBeam = expanded
      .filter((state) => state.health !== "blocked")
      .slice(0, 28);
    const blockedBeam = expanded
      .filter((state) => state.health === "blocked")
      .slice(0, 8);

    beam = [...coherentBeam, ...blockedBeam].slice(0, beamWidth);
  }

  const results: OptimizedBuild[] = [...coherent.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((state, index) => ({
      id: goal.id + "-" + (index + 1) + "-" + state.key,
      score: state.score,
      selections: state.selections,
      changedSlots: state.changedSlots,
      metrics: state.metrics,
      explanations: explanationsFor(goal, state.metrics),
      tradeoffs: tradeoffsFor(baselineMetrics, state.metrics),
      health: state.health as "ready" | "attention",
    }));

  return {
    bikeId,
    goal,
    constraints: {
      ...constraints,
      maxChanges: maxDepth,
    },
    baselineMetrics,
    searchedStates: cache.size,
    coherentStates: coherent.size,
    rejectedByGeometry,
    results,
  };
}
