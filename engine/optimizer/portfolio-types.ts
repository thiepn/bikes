import type { PhysicsScenario } from "@/engine/physics/types";

export type PortfolioSource =
  | "current"
  | "ranked"
  | "frontier";

export type PortfolioScenarioId =
  | "fast-flat"
  | "long-climb"
  | "rough-mixed"
  | "headwind"
  | "loaded-utility";

export interface PortfolioScenario {
  id: PortfolioScenarioId;
  name: string;
  shortName: string;
  description: string;
  scenario: PhysicsScenario;
  speedRangeKph: [number, number];
}

export interface SavedBuild {
  id: string;
  bikeId: string;
  name: string;
  selections: Record<string, string>;
  source: PortfolioSource;
  savedAt: number;
  updatedAt: number;
}

export interface PortfolioScenarioResult {
  scenarioId: PortfolioScenarioId;
  speedKph: number;
  score: number;
  performanceScore: number;
  cadenceMatchScore: number;
  closestGearLabel: string;
  closestGearSpeedKph: number;
}

export interface PortfolioEvaluation {
  entry: SavedBuild;
  health: "ready" | "attention" | "blocked";
  aggregateScore: number;
  scenarioResults: PortfolioScenarioResult[];
  bikeMassKg: number;
  cdaM2: number;
  lowGearRatio: number;
  highGearRatio: number;
  saddleToGripDropMm: number;
  changedSlots: number;
}
