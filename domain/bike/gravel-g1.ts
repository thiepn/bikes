import gravelG1 from "@/content/bikes/gravel-g1.json";
import {
  normalizeBikeDefinition,
  type RawBikeDefinition,
} from "./definition";

export const GRAVEL_G1 = normalizeBikeDefinition(
  gravelG1 as RawBikeDefinition,
  {
    model: "prototype",
    encyclopedia: "foundation",
    lessons: false,
    workshop: false,
  },
);

export const GRAVEL_G1_COMPONENTS_BY_ID = new Map(
  GRAVEL_G1.components.map((component) => [component.id, component]),
);

export const GRAVEL_G1_COMPONENTS_BY_NODE = new Map(
  GRAVEL_G1.components.map((component) => [component.modelNode, component]),
);
