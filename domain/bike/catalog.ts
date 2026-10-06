import { ROAD_R1 } from "./road-r1";
import { MTB_M1 } from "./mtb-m1";
import { URBAN_U1 } from "./urban-u1";
import { GRAVEL_G1 } from "./gravel-g1";
import type { BikeComponent } from "./types";

export const BIKE_CATALOG = [ROAD_R1, MTB_M1, URBAN_U1, GRAVEL_G1] as const;

const BIKES_BY_ID = new Map(
  BIKE_CATALOG.map((bike) => [bike.id, bike]),
);
const BIKES_BY_SLUG = new Map(
  BIKE_CATALOG.map((bike) => [bike.slug, bike]),
);
const COMPONENTS_BY_ID = new Map<string, BikeComponent>();

for (const bike of BIKE_CATALOG) {
  for (const component of bike.components) {
    COMPONENTS_BY_ID.set(component.id, component);
  }
}

export function getBikeById(id: string | null) {
  if (!id) return null;
  return BIKES_BY_ID.get(id) ?? null;
}

export function getBikeBySlug(slug: string | null) {
  if (!slug) return null;
  return BIKES_BY_SLUG.get(slug) ?? null;
}

export function getBikeComponentById(componentId: string | null) {
  if (!componentId) return null;
  return COMPONENTS_BY_ID.get(componentId) ?? null;
}

export function getBikeForComponent(componentId: string | null) {
  if (!componentId) return null;
  return (
    BIKE_CATALOG.find((bike) =>
      bike.components.some((component) => component.id === componentId),
    ) ?? null
  );
}
