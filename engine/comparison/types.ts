export interface BikeGeometryReference {
  bikeId: string;
  source: "bike-atlas-reference";
  sizeLabel: string;
  wheelFormat: string;
  wheelbaseMm: number;
  reachMm: number;
  stackMm: number;
  headAngleDeg: number;
  seatAngleDeg: number;
  chainstayMm: number;
  bottomBracketDropMm: number;
  tireWidthMm: number;
  handlebarWidthMm: number;
  frontTravelMm: number;
  rearTravelMm: number;
  notes: string[];
}

export interface GeometryComparisonRow {
  key: keyof BikeGeometryReference;
  label: string;
  unit: string;
  a: number;
  b: number;
  delta: number;
}
