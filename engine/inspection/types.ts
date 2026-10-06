export type InspectionMode =
  | "normal"
  | "systems"
  | "xray"
  | "exploded";

export interface InspectionState {
  mode: InspectionMode;
  explosionAmount: number;
}
