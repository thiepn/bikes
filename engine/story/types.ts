export type ExperienceMode =
  | "story"
  | "explore"
  | "lesson"
  | "workshop";

export interface StoryVisualState {
  inspectionMode: "normal" | "systems" | "xray" | "exploded";
  explosionAmount: number;
}
