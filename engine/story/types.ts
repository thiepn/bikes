export type ExperienceMode = "story" | "explore" | "lesson";

export interface StoryVisualState {
  inspectionMode: "normal" | "systems" | "xray" | "exploded";
  explosionAmount: number;
}
