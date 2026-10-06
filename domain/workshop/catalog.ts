import rearWheel from "@/content/workshop/rear-wheel-removal.json";
import cassette from "@/content/workshop/cassette-removal.json";
import chain from "@/content/workshop/chain-replacement.json";
import brakes from "@/content/workshop/disc-brake-inspection.json";
import mtbSuspensionCheck from "@/content/workshop/mtb-suspension-pre-ride.json";
import mtbSag from "@/content/workshop/mtb-sag-baseline.json";
import mtbDropper from "@/content/workshop/mtb-dropper-function-check.json";
import mtbTires from "@/content/workshop/mtb-trail-tire-check.json";
import urbanPreRide from "@/content/workshop/urban-pre-ride-check.json";
import urbanRack from "@/content/workshop/urban-rack-cargo-check.json";
import urbanDrivetrain from "@/content/workshop/urban-drivetrain-check.json";
import urbanWeather from "@/content/workshop/urban-weather-lighting-check.json";
import gravelPreRide from "@/content/workshop/gravel-pre-ride-check.json";
import gravelTires from "@/content/workshop/gravel-tire-rim-check.json";
import gravelDrivetrain from "@/content/workshop/gravel-drivetrain-check.json";
import gravelMounts from "@/content/workshop/gravel-mount-cargo-check.json";
import type { WorkshopProcedure } from "@/engine/workshop/types";

export const WORKSHOP_CATALOG = [
  rearWheel,
  cassette,
  chain,
  brakes,
  mtbSuspensionCheck,
  mtbSag,
  mtbDropper,
  mtbTires,
  urbanPreRide,
  urbanRack,
  urbanDrivetrain,
  urbanWeather,
  gravelPreRide,
  gravelTires,
  gravelDrivetrain,
  gravelMounts,
] as unknown as WorkshopProcedure[];

const BY_ID = new Map(
  WORKSHOP_CATALOG.map((procedure) => [procedure.id, procedure]),
);

export function getWorkshopProcedure(id: string | null) {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

export function getWorkshopProceduresForBike(bikeId: string) {
  return WORKSHOP_CATALOG.filter(
    (procedure) => procedure.bikeId === bikeId,
  );
}

export function getProcedurePrerequisites(
  procedure: WorkshopProcedure,
) {
  return procedure.prerequisiteProcedureIds
    .map((id) => BY_ID.get(id))
    .filter((item): item is WorkshopProcedure => Boolean(item));
}
