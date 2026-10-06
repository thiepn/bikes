"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  LearningProgressStore,
} from "@/engine/learning/types";
import {
  EMPTY_LEARNING_PROGRESS,
  readLearningProgress,
  writeLearningProgress,
} from "@/engine/learning/progress";

export function useLearningProgress() {
  const [store, setStore] = useState<LearningProgressStore>(
    EMPTY_LEARNING_PROGRESS,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(readLearningProgress());
    setHydrated(true);
  }, []);

  const update = useCallback(
    (
      updater: (current: LearningProgressStore) => LearningProgressStore,
    ) => {
      setStore((current) => {
        const next = updater(current);
        writeLearningProgress(next);
        return next;
      });
    },
    [],
  );

  const markStarted = useCallback(
    (lessonId: string, stepIndex: number) => {
      update((current) => {
        const existing = current.lessons[lessonId];

        return {
          ...current,
          lessons: {
            ...current.lessons,
            [lessonId]: {
              lessonId,
              status:
                existing?.status === "completed"
                  ? "completed"
                  : "in-progress",
              lastStepIndex: stepIndex,
              bestScore: existing?.bestScore ?? 0,
              attempts: existing?.attempts ?? 0,
              completedAt: existing?.completedAt,
            },
          },
        };
      });
    },
    [update],
  );

  const savePosition = useCallback(
    (lessonId: string, stepIndex: number) => {
      update((current) => {
        const existing = current.lessons[lessonId];

        return {
          ...current,
          lessons: {
            ...current.lessons,
            [lessonId]: {
              lessonId,
              status:
                existing?.status === "completed"
                  ? "completed"
                  : "in-progress",
              lastStepIndex: stepIndex,
              bestScore: existing?.bestScore ?? 0,
              attempts: existing?.attempts ?? 0,
              completedAt: existing?.completedAt,
            },
          },
        };
      });
    },
    [update],
  );

  const completeLesson = useCallback(
    (lessonId: string, stepIndex: number, score: number) => {
      update((current) => {
        const existing = current.lessons[lessonId];

        return {
          ...current,
          lessons: {
            ...current.lessons,
            [lessonId]: {
              lessonId,
              status: "completed",
              lastStepIndex: stepIndex,
              bestScore: Math.max(score, existing?.bestScore ?? 0),
              attempts: (existing?.attempts ?? 0) + 1,
              completedAt: new Date().toISOString(),
            },
          },
        };
      });
    },
    [update],
  );

  return {
    store,
    hydrated,
    markStarted,
    savePosition,
    completeLesson,
  };
}
