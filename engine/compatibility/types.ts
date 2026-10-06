export type CompatibilityStatus =
  | "compatible"
  | "incompatible"
  | "unknown";

export type CompatibilitySlotId =
  | "front-wheel"
  | "rear-wheel"
  | "front-tire"
  | "rear-tire"
  | "handlebar"
  | "stem"
  | "front-rotor"
  | "rear-rotor"
  | "seatpost"
  | "saddle"
  | "left-pedal"
  | "right-pedal";

export type InterfaceValue = string | number | boolean;

export interface ExactInterfaceRequirement {
  kind: "exact";
  key: string;
  label: string;
  expected: InterfaceValue;
  unit?: string;
}

export interface RangeInterfaceRequirement {
  kind: "range";
  key: string;
  label: string;
  min: number;
  max: number;
  unit?: string;
}

export type InterfaceRequirement =
  | ExactInterfaceRequirement
  | RangeInterfaceRequirement;

export interface CompatibilitySlot {
  id: CompatibilitySlotId;
  label: string;
  hostComponentId: string;
  description: string;
  requirements: InterfaceRequirement[];
}

export interface CompatibilityPart {
  id: string;
  label: string;
  slotId: CompatibilitySlotId;
  sourceBikeId: string;
  sourceComponentId: string;
  interfaces: Record<string, InterfaceValue>;
  notes: string[];
}

export interface BikeCompatibilityProfile {
  bikeId: string;
  source: "bike-atlas-reference";
  slots: CompatibilitySlot[];
}

export interface CompatibilityReason {
  key: string;
  label: string;
  status: "match" | "mismatch" | "unknown";
  expected: string;
  actual: string;
}

export interface CompatibilityResult {
  status: CompatibilityStatus;
  slotId: CompatibilitySlotId;
  partId: string;
  reasons: CompatibilityReason[];
}

export interface BuildSelection {
  slotId: CompatibilitySlotId;
  partId: string;
}
