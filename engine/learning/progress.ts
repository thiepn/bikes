import type {
  LearningProgressStore,
  LessonChallengeResult,
} from "./types";

export const LEARNING_PROGRESS_KEY = "bike-atlas.learning.v1";

export const EMPTY_LEARNING_PROGRESS: LearningProgressStore = {
  version: 1,
  lessons: {},
};

export function readLearningProgress(): LearningProgressStore {
  if (typeof window === "undefined") return EMPTY_LEARNING_PROGRESS;

  try {
    const raw = window.localStorage.getItem(LEARNING_PROGRESS_KEY);
    if (!raw) return EMPTY_LEARNING_PROGRESS;

    const parsed = JSON.parse(raw) as LearningProgressStore;
    if (parsed.version !== 1 || !parsed.lessons) {
      return EMPTY_LEARNING_PROGRESS;
    }

    return parsed;
  } catch {
    return EMPTY_LEARNING_PROGRESS;
  }
}

export function writeLearningProgress(store: LearningProgressStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LEARNING_PROGRESS_KEY,
    JSON.stringify(store),
  );
}

export function calculateLessonScore(
  results: Record<string, LessonChallengeResult>,
  challengeStepIds: string[],
) {
  if (challengeStepIds.length === 0) return 100;

  const points = challengeStepIds.map((stepId) => {
    const result = results[stepId];
    if (!result?.correct) return 0;
    if (result.attempts <= 1) return 100;
    if (result.attempts === 2) return 75;
    return 50;
  });

  return Math.round(
    points.reduce((sum, value) => sum + value, 0) / points.length,
  );
}

export function isLessonCompleted(
  store: LearningProgressStore,
  lessonId: string,
) {
  return store.lessons[lessonId]?.status === "completed";
}
