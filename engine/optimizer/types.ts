import type { CompatibilitySlotId } from "@/engine/compatibility/types";

export type OptimizationGoalId =
  | "speed"
  | "climbing"
  | "mixed-surface"
  | "comfort"
  | "utility";

export type GeometryGuard = "strict" | "balanced" | "open";

export type OptimizationFeatureId =
  | "flatSpeed"
  | "climbSpeed"
  | "hardpackSpeed"
  | "mass"
  | "aero"
  | "lowGear"
  | "highGear"
  | "range"
  | "upright"
  | "barWidthComfort"
  | "tireWidth"
  | "stability"
  | "braking"
  | "internalGear";

export interface OptimizationGoalProfile {
  id: OptimizationGoalId;
  name: string;
  shortName: string;
  description: string;
  emphasis: string;
  defaultMaxChanges: number;
  defaultGeometryGuard: GeometryGuard;
  weights: Partial<Record<OptimizationFeatureId, number>>;
}

export interface OptimizationConstraints {
  maxChanges: number;
  geometryGuard: GeometryGuard;
  preserveCurrentChanges: boolean;
}

export interface OptimizationMetrics {
  bikeMassKg: number;
  cdaM2: number;
  flatSpeedKph: number;
  climbSpeedKph: number;
  hardpackSpeedKph: number;
  lowGearRatio: number;
  highGearRatio: number;
  gearRangePercent: number;
  averageTireWidthMm: number;
  averageBrakeLeverageRatio: number;
  barWidthMm: number;
  saddleToGripDropMm: number;
  trailMm: number;
  wheelbaseMm: number;
  internalGear: boolean;
}

export interface OptimizationExplanation {
  featureId: OptimizationFeatureId;
  label: string;
  value: string;
  contribution: number;
}

export interface OptimizationTradeoff {
  kind: "gain" | "cost" | "neutral";
  label: string;
  detail: string;
}

export interface OptimizedBuild {
  id: string;
  score: number;
  selections: Record<string, string>;
  changedSlots: CompatibilitySlotId[];
  metrics: OptimizationMetrics;
  explanations: OptimizationExplanation[];
  tradeoffs: OptimizationTradeoff[];
  health: "ready" | "attention";
}

export interface OptimizationResult {
  bikeId: string;
  goal: OptimizationGoalProfile;
  constraints: OptimizationConstraints;
  baselineMetrics: OptimizationMetrics;
  searchedStates: number;
  coherentStates: number;
  rejectedByGeometry: number;
  results: OptimizedBuild[];
}
