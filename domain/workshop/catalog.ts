import rearWheel from "@/content/workshop/rear-wheel-removal.json";
import cassette from "@/content/workshop/cassette-removal.json";
import chain from "@/content/workshop/chain-replacement.json";
import brakes from "@/content/workshop/disc-brake-inspection.json";
import type { WorkshopProcedure } from "@/engine/workshop/types";

export const WORKSHOP_CATALOG = [
  rearWheel,
  cassette,
  chain,
  brakes,
] as unknown as WorkshopProcedure[];

const BY_ID = new Map(
  WORKSHOP_CATALOG.map((procedure) => [procedure.id, procedure]),
);

export function getWorkshopProcedure(id: string | null) {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

export function getProcedurePrerequisites(
  procedure: WorkshopProcedure,
) {
  return procedure.prerequisiteProcedureIds
    .map((id) => BY_ID.get(id))
    .filter((item): item is WorkshopProcedure => Boolean(item));
}
