import type { StoryVisualState } from "./types";

export type StoryCameraKeyframe = {
  at: number;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

export const STORY_CAMERA_KEYFRAMES: StoryCameraKeyframe[] = [
  {
    at: 0,
    position: [1.95, 1.18, 2.35],
    target: [0, 0.5, 0],
    fov: 34,
  },
  {
    at: 0.2,
    position: [1.55, 0.92, 1.62],
    target: [0, 0.58, 0.02],
    fov: 31,
  },
  {
    at: 0.4,
    position: [1.16, 0.67, 0.72],
    target: [0, 0.43, -0.08],
    fov: 27,
  },
  {
    at: 0.6,
    position: [0.88, 0.6, -0.88],
    target: [0.04, 0.35, -0.48],
    fov: 24,
  },
  {
    at: 0.8,
    position: [2.22, 1.18, 1.55],
    target: [0.04, 0.51, 0],
    fov: 39,
  },
  {
    at: 1,
    position: [2.55, 1.28, 1.82],
    target: [0, 0.49, 0],
    fov: 42,
  },
];

export function getStoryVisualState(progress: number): StoryVisualState {
  const value = Math.min(1, Math.max(0, progress));

  if (value < 0.36) {
    return { inspectionMode: "normal", explosionAmount: 0 };
  }

  if (value < 0.54) {
    return { inspectionMode: "systems", explosionAmount: 0 };
  }

  if (value < 0.72) {
    return { inspectionMode: "xray", explosionAmount: 0 };
  }

  const explosionProgress = Math.min(
    0.84,
    Math.max(0, (value - 0.72) / 0.28) * 0.84,
  );

  return {
    inspectionMode: "exploded",
    explosionAmount: explosionProgress,
  };
}
