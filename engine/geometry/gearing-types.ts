export type GearingArchitecture =
  | "external-cassette"
  | "internal-gear";

export interface GearCombination {
  id: string;
  label: string;
  architecture: GearingArchitecture;
  chainringTeeth: number;
  rearTeeth: number;
  internalRatio: number;
  overallRatio: number;
  developmentM: number;
  gearInches: number;
  speedKph: number;
}

export interface GearingSolution {
  bikeId: string;
  architecture: GearingArchitecture;
  cadenceRpm: number;
  wheelCircumferenceM: number;
  wheelDiameterIn: number;
  chainrings: number[];
  rearSprockets: number[];
  internalRatios: number[];
  combinations: GearCombination[];
  easiest: GearCombination;
  hardest: GearCombination;
  rangePercent: number;
}
