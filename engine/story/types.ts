export type ExperienceMode = "story" | "explore";

export interface StoryVisualState {
  inspectionMode: "normal" | "systems" | "xray" | "exploded";
  explosionAmount: number;
}
