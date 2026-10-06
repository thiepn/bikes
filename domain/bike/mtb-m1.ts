import mtbM1 from "@/content/bikes/mtb-m1.json";
import {
  normalizeBikeDefinition,
  type RawBikeDefinition,
} from "./definition";

export const MTB_M1 = normalizeBikeDefinition(
  mtbM1 as RawBikeDefinition,
  {
    model: "prototype",
    encyclopedia: "foundation",
    lessons: false,
    workshop: false,
  },
);

export const MTB_M1_COMPONENTS_BY_ID = new Map(
  MTB_M1.components.map((component) => [component.id, component]),
);

export const MTB_M1_COMPONENTS_BY_NODE = new Map(
  MTB_M1.components.map((component) => [component.modelNode, component]),
);
