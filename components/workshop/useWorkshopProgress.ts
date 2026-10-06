"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_WORKSHOP_PROGRESS,
  readWorkshopProgress,
  writeWorkshopProgress,
} from "@/engine/workshop/progress";
import type { WorkshopProgressStore } from "@/engine/workshop/types";

export function useWorkshopProgress() {
  const [store, setStore] = useState<WorkshopProgressStore>(
    EMPTY_WORKSHOP_PROGRESS,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(readWorkshopProgress());
    setHydrated(true);
  }, []);

  const update = useCallback(
    (
      updater: (current: WorkshopProgressStore) => WorkshopProgressStore,
    ) => {
      setStore((current) => {
        const next = updater(current);
        writeWorkshopProgress(next);
        return next;
      });
    },
    [],
  );

  const startProcedure = useCallback(
    (procedureId: string, stepIndex: number) => {
      update((current) => {
        const existing = current.procedures[procedureId];
        return {
          ...current,
          procedures: {
            ...current.procedures,
            [procedureId]: {
              procedureId,
              status:
                existing?.status === "completed"
                  ? "completed"
                  : "in-progress",
              lastStepIndex: stepIndex,
              completedStepIds: existing?.completedStepIds ?? [],
              completedAt: existing?.completedAt,
            },
          },
        };
      });
    },
    [update],
  );

  const saveStep = useCallback(
    (
      procedureId: string,
      stepIndex: number,
      completedStepIds: string[],
    ) => {
      update((current) => {
        const existing = current.procedures[procedureId];
        return {
          ...current,
          procedures: {
            ...current.procedures,
            [procedureId]: {
              procedureId,
              status:
                existing?.status === "completed"
                  ? "completed"
                  : "in-progress",
              lastStepIndex: stepIndex,
              completedStepIds,
              completedAt: existing?.completedAt,
            },
          },
        };
      });
    },
    [update],
  );

  const completeProcedure = useCallback(
    (
      procedureId: string,
      stepIndex: number,
      completedStepIds: string[],
    ) => {
      update((current) => ({
        ...current,
        procedures: {
          ...current.procedures,
          [procedureId]: {
            procedureId,
            status: "completed",
            lastStepIndex: stepIndex,
            completedStepIds,
            completedAt: new Date().toISOString(),
          },
        },
      }));
    },
    [update],
  );

  return {
    store,
    hydrated,
    startProcedure,
    saveStep,
    completeProcedure,
  };
}
