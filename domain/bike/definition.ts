import type { BikeComponent, BikeSystemId } from "./types";

export interface BikeCapabilities {
  model: "production" | "prototype" | "foundation";
  encyclopedia: "full" | "foundation" | "none";
  lessons: boolean;
  workshop: boolean;
}

export type RawBikeComponent = Omit<
  BikeComponent,
  "interfaces" | "learningConceptIds" | "procedureIds" | "failureModeIds"
>;

export interface RawBikeDefinition {
  id: string;
  slug: string;
  name: string;
  archetype: string;
  status: string;
  description: string;
  systems: string[];
  components: RawBikeComponent[];
}

export interface BikeDefinition
  extends Omit<RawBikeDefinition, "systems" | "components"> {
  systems: BikeSystemId[];
  components: BikeComponent[];
  capabilities: BikeCapabilities;
}

export function normalizeBikeDefinition(
  raw: RawBikeDefinition,
  capabilities: BikeCapabilities,
): BikeDefinition {
  return {
    ...raw,
    systems: raw.systems as BikeSystemId[],
    components: raw.components.map((component) => ({
      ...component,
      interfaces: [],
      learningConceptIds: [],
      procedureIds: [],
      failureModeIds: [],
    })),
    capabilities,
  };
}
