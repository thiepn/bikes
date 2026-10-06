export type FinderTraitId =
  | "pavedEfficiency"
  | "mixedSurface"
  | "technicalTerrain"
  | "distanceEfficiency"
  | "climbingCapability"
  | "comfortControl"
  | "cargoUtility"
  | "allWeather"
  | "maintenanceSimplicity"
  | "suspensionCapability";

export interface FinderTraitEffect {
  demand: number;
  weight: number;
}

export interface FinderQuestionOption {
  id: string;
  label: string;
  description: string;
  effects: Partial<Record<FinderTraitId, FinderTraitEffect>>;
}

export interface FinderQuestion {
  id: string;
  title: string;
  prompt: string;
  options: FinderQuestionOption[];
}

export interface BikeFinderProfile {
  bikeId: string;
  traits: Record<FinderTraitId, number>;
  traitReasons: Record<FinderTraitId, string>;
  generalStrengths: string[];
  generalTradeoffs: string[];
}

export interface FinderPreset {
  id: string;
  name: string;
  description: string;
  answers: Record<string, string>;
}

export type FinderAnswers = Record<string, string>;

export interface FinderTraitNeed {
  traitId: FinderTraitId;
  demand: number;
  weight: number;
}

export interface FinderFactor {
  traitId: FinderTraitId;
  score: number;
  demand: number;
  capability: number;
  reason: string;
}

export interface BikeFinderResult {
  bikeId: string;
  score: number;
  fitBand: "strong" | "good" | "partial";
  matchedFactors: FinderFactor[];
  unmetFactors: FinderFactor[];
  generalStrengths: string[];
  generalTradeoffs: string[];
}

export interface FinderRecommendation {
  complete: boolean;
  answered: number;
  total: number;
  needs: FinderTraitNeed[];
  results: BikeFinderResult[];
  top: BikeFinderResult | null;
  alternative: BikeFinderResult | null;
  catalogGap: boolean;
}
