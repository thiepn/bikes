export type PhysicsSurfaceId =
  | "smooth-asphalt"
  | "rough-asphalt"
  | "hardpack-gravel"
  | "loose-gravel"
  | "trail";

export interface SurfaceDefinition {
  id: PhysicsSurfaceId;
  name: string;
  description: string;
}

export interface BikePhysicsProfile {
  bikeId: string;
  source: "bike-atlas-reference";
  bikeMassKg: number;
  cdaM2: number;
  drivetrainEfficiency: number;
  wheelCircumferenceM: number;
  defaultDriveRatio: number;
  rollingResistance: Record<PhysicsSurfaceId, number>;
  notes: string[];
}

export interface PhysicsScenario {
  riderPowerW: number;
  riderMassKg: number;
  cargoMassKg: number;
  gradePercent: number;
  windSpeedKph: number;
  airDensityKgM3: number;
  surfaceId: PhysicsSurfaceId;
  cadenceRpm: number;
  driveRatio: number;
}

export interface PhysicsBreakdown {
  speedMps: number;
  speedKph: number;
  totalMassKg: number;
  wheelPowerW: number;
  rollingForceN: number;
  gravityForceN: number;
  aeroForceN: number;
  rollingPowerW: number;
  gravityPowerW: number;
  aeroPowerW: number;
  requiredWheelPowerW: number;
  requiredRiderPowerW: number;
  relativeAirSpeedMps: number;
}

export interface PhysicsBikeResult extends PhysicsBreakdown {
  bikeId: string;
  crr: number;
  profile: BikePhysicsProfile;
}

export interface CadenceResult {
  speedKph: number;
  cadenceRpm: number;
  driveRatio: number;
  wheelCircumferenceM: number;
}
