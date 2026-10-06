import roadR1 from "@/content/bikes/road-r1.json";
import type { BikeComponent, BikeSystemId } from "./types";

export type RoadR1Definition = {
  id: string;
  slug: string;
  name: string;
  archetype: string;
  status: string;
  description: string;
  systems: BikeSystemId[];
  components: BikeComponent[];
};

export const ROAD_R1 = roadR1 as RoadR1Definition;

export const ROAD_R1_COMPONENTS_BY_ID = new Map(
  ROAD_R1.components.map((component) => [component.id, component]),
);

export const ROAD_R1_COMPONENTS_BY_NODE = new Map(
  ROAD_R1.components.map((component) => [component.modelNode, component]),
);
