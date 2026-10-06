export interface BikeGeometryReference {
  bikeId: string;
  source: "bike-atlas-reference";
  headAngleDeg: number;
  seatTubeAngleDeg: number;
  reachMm: number;
  stackMm: number;
  wheelbaseMm: number;
  chainstayMm: number;
  bbDropMm: number;
  forkAxleToCrownMm: number;
  forkOffsetMm: number;
  frontWheelRadiusMm: number;
  rearWheelRadiusMm: number;
  saddleXFromBbMm: number;
  saddleYFromBbMm: number;
  notes: string[];
}

export interface GeometryPoint {
  xMm: number;
  yMm: number;
}

export interface GeometrySolution {
  bikeId: string;
  reference: BikeGeometryReference;
  headAngleDeg: number;
  seatTubeAngleDeg: number;
  reachMm: number;
  stackMm: number;
  wheelbaseMm: number;
  bbHeightMm: number;
  bbDropMm: number;
  trailMm: number;
  frontWheelRadiusMm: number;
  rearWheelRadiusMm: number;
  forkAxleToCrownMm: number;
  forkOffsetMm: number;
  forkTravelMm: number;
  pitchDeltaDeg: number;
  bar: GeometryPoint & {
    widthMm: number;
    lowerGripYFromBbMm: number;
  };
  saddle: GeometryPoint;
  fit: {
    saddleToGripReachMm: number;
    saddleToGripDropMm: number;
    frameReachDeltaMm: number;
    frameStackDeltaMm: number;
    barReachDeltaMm: number;
    barStackDeltaMm: number;
    saddleSetbackDeltaMm: number;
  };
  deltas: {
    headAngleDeg: number;
    seatTubeAngleDeg: number;
    wheelbaseMm: number;
    bbHeightMm: number;
    trailMm: number;
  };
}
