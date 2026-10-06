import geometryJson from "@/content/geometry/profiles.json";
import type { BikeGeometryReference } from "@/engine/geometry/types";

export const GEOMETRY_PROFILES =
  geometryJson.profiles as BikeGeometryReference[];

const BY_BIKE = new Map(
  GEOMETRY_PROFILES.map((profile) => [profile.bikeId, profile]),
);

export function getBikeGeometryReference(bikeId: string) {
  return BY_BIKE.get(bikeId) ?? null;
}
