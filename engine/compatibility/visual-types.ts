import type { CompatibilitySlotId } from "@/engine/compatibility/types";

export type BuildVisualKind =
  | "wheel"
  | "tire"
  | "handlebar"
  | "tube"
  | "saddle"
  | "pedal"
  | "rotor"
  | "fork"
  | "caliper"
  | "crankset"
  | "rear-transmission"
  | "rear-derailleur";

export interface BuildVisualAttachment {
  slotId: CompatibilitySlotId;
  kind: BuildVisualKind;
  hiddenComponentIds: string[];
  position?: [number, number, number];
  from?: [number, number, number];
  to?: [number, number, number];
  radius?: number;
  segments?: Array<{
    from: [number, number, number];
    to: [number, number, number];
  }>;
}

export interface BikeBuildVisualProfile {
  bikeId: string;
  yawRad: number;
  attachments: BuildVisualAttachment[];
}

export type DonorHandlebarStyle =
  | "road-drop"
  | "gravel-flare"
  | "flat"
  | "swept";

export interface DonorVisualProfile {
  bikeId: string;
  accent: string;
  wheelSpokes: number;
  rimThickness: number;
  hubRadius: number;
  hubWidth: number;
  tireThickness: number;
  handlebarStyle: DonorHandlebarStyle;
  handlebarWidth: number;
  seatpostRadius: number;
  saddleSize: [number, number, number];
  pedalSize: [number, number, number];
  stemRadius: number;
  forkRadius: number;
  caliperSize: [number, number, number];
  derailleurSize?: [number, number, number];
}
