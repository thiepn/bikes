import urbanU1 from "@/content/bikes/urban-u1.json";
import {
  normalizeBikeDefinition,
  type RawBikeDefinition,
} from "./definition";

export const URBAN_U1 = normalizeBikeDefinition(
  urbanU1 as RawBikeDefinition,
  {
    model: "prototype",
    encyclopedia: "full",
    lessons: true,
    workshop: true,
  },
);

export const URBAN_U1_COMPONENTS_BY_ID = new Map(
  URBAN_U1.components.map((component) => [component.id, component]),
);

export const URBAN_U1_COMPONENTS_BY_NODE = new Map(
  URBAN_U1.components.map((component) => [component.modelNode, component]),
);
