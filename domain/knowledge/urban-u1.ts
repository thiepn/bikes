import { URBAN_U1, URBAN_U1_COMPONENTS_BY_ID } from "@/domain/bike/urban-u1";
import { getAssemblyNeighborsForComponent } from "@/domain/assembly/catalog";
import { isInteractiveComponent } from "@/engine/interaction/component-availability";
import type {
  ComponentKnowledgeNode,
  KnowledgeSearchResult,
} from "@/engine/knowledge/types";

const SPECIAL: Record<
  string,
  {
    summary: string;
    function: string;
    materials: string[];
    standards: string[];
    commonSymptoms: string[];
    aliases: string[];
  }
> = {
  "chain-guard": {
    summary: "A full enclosure around the exposed chain and front drive area.",
    function:
      "Reduces clothing contact with the chain and helps shield the drivetrain from splash and everyday contamination.",
    materials: ["polymer", "aluminium"],
    standards: [
      "Guard shape must clear the crank, chainring, chain path and frame.",
    ],
    commonSymptoms: ["rubbing", "cracks", "loose mounts", "chain contact"],
    aliases: ["chainguard", "chain case"],
  },
  "rear-rack": {
    summary: "Integrated rear carrier for everyday luggage.",
    function:
      "Supports panniers or compatible cargo while transferring load into the bicycle frame through dedicated mounts.",
    materials: ["aluminium"],
    standards: [
      "Rack load rating and mounting hardware are rack/frame specific.",
    ],
    commonSymptoms: ["loose hardware", "rattle", "bent stays", "cracks"],
    aliases: ["carrier", "luggage rack", "pannier rack"],
  },
  "front-fender": {
    summary: "Full-coverage front mudguard for wet-weather riding.",
    function:
      "Intercepts water and road spray thrown from the front tire toward the rider and bicycle.",
    materials: ["aluminium", "polymer"],
    standards: ["Tire clearance and mounting points must suit the wheel and fork."],
    commonSymptoms: ["rubbing", "rattle", "bent stay", "cracked guard"],
    aliases: ["mudguard", "front mudguard"],
  },
  "rear-fender": {
    summary: "Full-coverage rear mudguard for wet-weather utility use.",
    function:
      "Reduces water and debris spray from the rear tire toward the rider, rack and drivetrain area.",
    materials: ["aluminium", "polymer"],
    standards: ["Tire clearance and mounting points must suit the frame and wheel."],
    commonSymptoms: ["rubbing", "rattle", "bent stay", "cracked guard"],
    aliases: ["mudguard", "rear mudguard"],
  },
  "front-light": {
    summary: "Integrated forward bicycle light.",
    function:
      "Provides forward illumination and conspicuity as part of the utility-bike lighting system.",
    materials: ["aluminium", "polymer", "lens material"],
    standards: [
      "Lighting output, mounting and legal requirements depend on jurisdiction and component system.",
    ],
    commonSymptoms: ["intermittent output", "misalignment", "damaged lens", "wiring fault"],
    aliases: ["headlight", "front lamp"],
  },
  "rear-light": {
    summary: "Integrated rear visibility light.",
    function:
      "Makes the bicycle visible from behind and completes the everyday lighting system.",
    materials: ["aluminium", "polymer", "lens material"],
    standards: [
      "Lighting output, mounting and legal requirements depend on jurisdiction and component system.",
    ],
    commonSymptoms: ["intermittent output", "damaged lens", "loose mount", "wiring fault"],
    aliases: ["tail light", "rear lamp"],
  },
  "kickstand": {
    summary: "Deployable support for parking the bicycle without leaning it on another object.",
    function:
      "Supports the stationary bicycle during normal loading, unloading and short stops.",
    materials: ["aluminium", "steel"],
    standards: ["Mounting interface and load suitability are frame/stand specific."],
    commonSymptoms: ["loose pivot", "poor return", "bending", "unstable parking"],
    aliases: ["stand", "side stand"],
  },
  "frame-lock": {
    summary: "Frame-mounted wheel immobilizer used for quick everyday security.",
    function:
      "Blocks wheel rotation when locked and is intended as one layer of bicycle security rather than a universal theft-proof solution.",
    materials: ["steel", "polymer"],
    standards: ["Mounting and security rating are lock/model specific."],
    commonSymptoms: ["sticky mechanism", "misalignment", "damaged keyway", "loose mount"],
    aliases: ["ring lock", "cafe lock", "wheel lock"],
  },
  "rear-hub": {
    summary: "Rear hub containing the internal gear mechanism.",
    function:
      "Supports rear-wheel rotation while providing multiple gear ratios inside the hub shell rather than through an exposed cassette and derailleur.",
    materials: ["aluminium shell", "steel gears", "bearings"],
    standards: [
      "Axle, sprocket, shifter and cable/electronic actuation must match the hub system.",
    ],
    commonSymptoms: ["poor shifting", "hub play", "rough bearings", "abnormal noise"],
    aliases: ["internal gear hub", "IGH", "gear hub"],
  },
  "rear-sprocket": {
    summary: "Single external sprocket driving the internal-gear rear hub.",
    function:
      "Receives chain force while gear-ratio changes happen inside the hub.",
    materials: ["steel"],
    standards: ["Sprocket interface, chain width and chainline must match the hub/drivetrain."],
    commonSymptoms: ["tooth wear", "chain noise", "poor retention", "loose interface"],
    aliases: ["hub sprocket", "rear cog"],
  },
  "handlebar": {
    summary: "Swept handlebar supporting an upright city-riding posture.",
    function:
      "Provides steering leverage and positions hands closer to the rider for visibility, comfort and low-speed control.",
    materials: ["aluminium"],
    standards: ["Clamp diameter and control mounting areas must match stem and controls."],
    commonSymptoms: ["crash damage", "slipping", "loose controls"],
    aliases: ["swept bar", "city handlebar"],
  },
  "bell": {
    summary: "Mechanical audible warning device mounted near the rider's hand.",
    function:
      "Provides a simple way to signal presence to other road or path users.",
    materials: ["aluminium", "steel"],
    standards: ["Mount diameter and local equipment rules vary."],
    commonSymptoms: ["weak ring", "sticky striker", "loose clamp"],
    aliases: ["bicycle bell"],
  },
};

function fallback(slug: string, name: string, systemId: string, materialIds: string[]) {
  return {
    summary: `${name} in the Urban U1 ${systemId.replaceAll("-", " ")} system.`,
    function:
      "This component performs its normal bicycle-system role within the Urban U1 utility architecture. Detailed service and standards content will be expanded in a later Urban knowledge pass.",
    materials: materialIds.map((id) => id.replace(/^mat\./, "").replaceAll(".", " ")),
    standards: [
      "Exact dimensions, interfaces and service limits are component-specific.",
    ],
    commonSymptoms: [
      "Inspect for looseness, wear, damage, interference or abnormal operation.",
    ],
    aliases: [slug.replaceAll("-", " ")],
  };
}

export function getUrbanKnowledgeNode(
  componentId: string | null,
): ComponentKnowledgeNode | null {
  if (!componentId) return null;
  const component = URBAN_U1_COMPONENTS_BY_ID.get(componentId);
  if (!component) return null;

  const profile =
    SPECIAL[component.slug] ??
    fallback(
      component.slug,
      component.name,
      component.systemId,
      component.materialIds,
    );

  return {
    componentId: component.id,
    name: component.name,
    slug: component.slug,
    systemId: component.systemId,
    tags: component.tags,
    materialIds: component.materialIds,
    ...profile,
    relatedComponentIds: getAssemblyNeighborsForComponent(
      URBAN_U1.id,
      component.id,
    ),
    assemblyNeighborIds: getAssemblyNeighborsForComponent(
      URBAN_U1.id,
      component.id,
    ),
    lessonIds: [],
    procedureIds: [],
    availableIn3d: isInteractiveComponent(
      URBAN_U1.id,
      component.id,
    ),
  };
}

export function getUrbanRelatedComponentIds(componentId: string) {
  return getAssemblyNeighborsForComponent(URBAN_U1.id, componentId);
}

export function searchUrbanKnowledge(
  rawQuery: string,
): KnowledgeSearchResult[] {
  const tokens = rawQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);

  return URBAN_U1.components
    .map((component) => {
      const node = getUrbanKnowledgeNode(component.id);
      if (!node) return null;

      const haystack = [
        node.name,
        node.slug,
        node.systemId,
        ...node.tags,
        node.summary,
        node.function,
        ...node.materials,
        ...node.aliases,
      ].join(" ").toLowerCase();

      if (tokens.some((token) => !haystack.includes(token))) {
        return null;
      }

      let score = 0;
      for (const token of tokens) {
        if (node.name.toLowerCase().includes(token)) score += 5;
        if (node.slug.includes(token)) score += 3;
        if (node.aliases.some((alias) => alias.toLowerCase().includes(token))) {
          score += 2;
        }
        score += 1;
      }

      return {
        componentId: node.componentId,
        name: node.name,
        systemId: node.systemId,
        summary: node.summary,
        score,
        availableIn3d: node.availableIn3d,
      };
    })
    .filter((result): result is KnowledgeSearchResult => Boolean(result))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
