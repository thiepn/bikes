import roadR1 from "@/content/bikes/road-r1.json";
import type { BikeComponent, BikeSystemId } from "./types";

type RawRoadR1Component = Omit<
  BikeComponent,
  "interfaces" | "learningConceptIds" | "procedureIds" | "failureModeIds"
>;

type RawRoadR1Definition = {
  id: string;
  slug: string;
  name: string;
  archetype: string;
  status: string;
  description: string;
  systems: string[];
  components: RawRoadR1Component[];
};

export type RoadR1Definition = Omit<RawRoadR1Definition, "systems" | "components"> & {
  systems: BikeSystemId[];
  components: BikeComponent[];
};

const raw = roadR1 as RawRoadR1Definition;

export const ROAD_R1: RoadR1Definition = {
  ...raw,
  systems: raw.systems as BikeSystemId[],
  components: raw.components.map((component) => ({
    ...component,
    interfaces: [],
    learningConceptIds: [],
    procedureIds: [],
    failureModeIds: [],
  })),
};

export const ROAD_R1_COMPONENTS_BY_ID = new Map(
  ROAD_R1.components.map((component) => [component.id, component]),
);

export const ROAD_R1_COMPONENTS_BY_NODE = new Map(
  ROAD_R1.components.map((component) => [component.modelNode, component]),
);
