import roadR1 from "@/content/bikes/road-r1.json";
import {
  normalizeBikeDefinition,
  type RawBikeDefinition,
} from "./definition";

export const ROAD_R1 = normalizeBikeDefinition(
  roadR1 as RawBikeDefinition,
  {
    model: "prototype",
    encyclopedia: "full",
    lessons: true,
    workshop: true,
  },
);

export type RoadR1Definition = typeof ROAD_R1;

export const ROAD_R1_COMPONENTS_BY_ID = new Map(
  ROAD_R1.components.map((component) => [component.id, component]),
);

export const ROAD_R1_COMPONENTS_BY_NODE = new Map(
  ROAD_R1.components.map((component) => [component.modelNode, component]),
);
