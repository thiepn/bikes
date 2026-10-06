import type {
  WorkshopProgressRecord,
  WorkshopProgressStore,
} from "./types";

export const WORKSHOP_PROGRESS_KEY = "bike-atlas.workshop.v1";

export const EMPTY_WORKSHOP_PROGRESS: WorkshopProgressStore = {
  version: 1,
  procedures: {},
};

export function readWorkshopProgress(): WorkshopProgressStore {
  if (typeof window === "undefined") return EMPTY_WORKSHOP_PROGRESS;

  try {
    const raw = window.localStorage.getItem(WORKSHOP_PROGRESS_KEY);
    if (!raw) return EMPTY_WORKSHOP_PROGRESS;

    const parsed = JSON.parse(raw) as WorkshopProgressStore;
    if (parsed.version !== 1 || !parsed.procedures) {
      return EMPTY_WORKSHOP_PROGRESS;
    }

    return parsed;
  } catch {
    return EMPTY_WORKSHOP_PROGRESS;
  }
}

export function writeWorkshopProgress(store: WorkshopProgressStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    WORKSHOP_PROGRESS_KEY,
    JSON.stringify(store),
  );
}

export function isProcedureCompleted(
  store: WorkshopProgressStore,
  procedureId: string,
) {
  return store.procedures[procedureId]?.status === "completed";
}

export function getCompletedWorkshopOperationIds(
  record: WorkshopProgressRecord | undefined,
  steps: Array<{ id: string; operationId?: string }>,
  assumedOperationIds: string[],
) {
  const completedSteps = new Set(record?.completedStepIds ?? []);
  return new Set([
    ...assumedOperationIds,
    ...steps
      .filter(
        (step) =>
          step.operationId && completedSteps.has(step.id),
      )
      .map((step) => step.operationId as string),
  ]);
}
