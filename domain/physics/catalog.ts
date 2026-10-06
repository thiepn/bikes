import physicsJson from "@/content/physics/profiles.json";
import type {
  BikePhysicsProfile,
  PhysicsSurfaceId,
  SurfaceDefinition,
} from "@/engine/physics/types";

export const PHYSICS_PROFILES =
  physicsJson.profiles as BikePhysicsProfile[];

export const PHYSICS_SURFACES =
  physicsJson.surfaces as SurfaceDefinition[];

const BY_BIKE = new Map(
  PHYSICS_PROFILES.map((profile) => [profile.bikeId, profile]),
);

const SURFACE_BY_ID = new Map(
  PHYSICS_SURFACES.map((surface) => [surface.id, surface]),
);

export function getBikePhysicsProfile(bikeId: string) {
  return BY_BIKE.get(bikeId) ?? null;
}

export function getPhysicsSurface(surfaceId: PhysicsSurfaceId) {
  return SURFACE_BY_ID.get(surfaceId) ?? null;
}
