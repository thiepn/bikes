import type { CompatibilitySlotId } from "@/engine/compatibility/types";

export type BuildIssueSeverity = "info" | "warning" | "blocking";
export type BuildHealth = "ready" | "attention" | "blocked";

export interface PartConsequenceProfile {
  partId: string;
  massKg: number;
  aeroCdAContributionM2?: number;
}

export interface BuildIssue {
  id: string;
  severity: BuildIssueSeverity;
  system: "braking" | "drivetrain" | "wheels" | "suspension" | "cockpit";
  title: string;
  detail: string;
  relatedSlots: CompatibilitySlotId[];
}

export interface BuildMetrics {
  massDeltaKg: number;
  cdaDeltaM2: number;
  frontBrakeTorqueRatio: number;
  rearBrakeTorqueRatio: number;
  lowGearRatio: number | null;
  highGearRatio: number | null;
  gearRangePercent: number | null;
  forkTravelDeltaMm: number;
  axleToCrownDeltaMm: number;
}

export interface BuildAnalysis {
  health: BuildHealth;
  issues: BuildIssue[];
  metrics: BuildMetrics;
  modifiedSlotCount: number;
}
