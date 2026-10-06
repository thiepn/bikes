import { GRAVEL_G1, GRAVEL_G1_COMPONENTS_BY_ID } from "@/domain/bike/gravel-g1";
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
  handlebar: {
    summary: "Flared drop handlebar for all-road control and multiple hand positions.",
    function:
      "Preserves efficient drop-bar hand positions while increasing lower-bar width and leverage for loose or rough surfaces.",
    materials: ["aluminium alloy", "bar tape"],
    standards: [
      "stem clamp diameter and control mounting areas must match",
      "flare, width and reach are rider/component specific",
    ],
    commonSymptoms: ["crash damage", "bar rotation", "damaged tape", "loose controls"],
    aliases: ["flared drops", "gravel bar", "drop bar"],
  },
  "front-tire": {
    summary: "High-volume front tire for pavement and unsealed surfaces.",
    function:
      "Balances rolling efficiency with additional volume, traction and impact compliance on gravel and broken roads.",
    materials: ["rubber compounds", "textile casing", "bead material"],
    standards: [
      "diameter and width must suit rim, fork and frame clearances",
      "pressure and tubeless compatibility are tire/rim specific",
    ],
    commonSymptoms: ["cuts", "pressure loss", "sidewall damage", "poor bead seating", "tread wear"],
    aliases: ["gravel tire", "front tyre", "all-road tire"],
  },
  "rear-tire": {
    summary: "High-volume driven tire for mixed-surface traction.",
    function:
      "Carries rear load and drive force while balancing efficient rolling with grip on loose or broken surfaces.",
    materials: ["rubber compounds", "textile casing", "bead material"],
    standards: [
      "diameter and width must suit rim and frame clearance",
      "pressure and tubeless compatibility are tire/rim specific",
    ],
    commonSymptoms: ["cuts", "pressure loss", "sidewall damage", "poor bead seating", "tread wear"],
    aliases: ["gravel tire", "rear tyre", "all-road tire"],
  },
  chainring: {
    summary: "Single front sprocket in the Gravel G1 1× drivetrain.",
    function:
      "Receives crank torque and drives the chain while all selectable ratios are provided at the rear cassette.",
    materials: ["aluminium alloy or steel"],
    standards: ["mount, chainline and chain compatibility must match the crank/drivetrain"],
    commonSymptoms: ["tooth wear", "bending", "chain noise", "poor retention"],
    aliases: ["1x chainring", "front sprocket"],
  },
  cassette: {
    summary: "Wide-range stack of rear sprockets.",
    function:
      "Provides the selectable gear ratios needed to combine fast all-road riding with lower climbing gears.",
    materials: ["steel sprockets", "aluminium carrier or selected sprockets"],
    standards: ["freehub, chain, sprocket count/range and derailleur must be compatible"],
    commonSymptoms: ["worn teeth", "skipping", "looseness", "damaged sprockets"],
    aliases: ["rear cogs", "wide-range cassette"],
  },
  "rear-derailleur": {
    summary: "Rear shifting and chain-management mechanism.",
    function:
      "Moves the chain across the cassette and manages chain length while providing the drivetrain's rear shifting function.",
    materials: ["aluminium body/cage", "steel springs and hardware"],
    standards: ["shifter actuation, cassette range, chain capacity and hanger interface must match"],
    commonSymptoms: ["poor indexing", "impact damage", "sluggish movement", "excess pulley play"],
    aliases: ["rear mech", "derailleur"],
  },
  "frame-mounts": {
    summary: "Dedicated attachment points built into the gravel frame.",
    function:
      "Allow compatible bottle cages, bags or accessories to attach without improvised clamps.",
    materials: ["threaded metal inserts", "frame structure"],
    standards: ["thread size, placement, fastener length and allowable load are frame/accessory specific"],
    commonSymptoms: ["damaged threads", "loose bolts", "corrosion", "spinning insert"],
    aliases: ["bottle mounts", "bosses", "frame bosses"],
  },
  "fork-mounts": {
    summary: "Utility attachment points on the rigid gravel fork.",
    function:
      "Provide mounting interfaces for compatible light cargo or accessories where the actual fork permits them.",
    materials: ["threaded metal inserts", "fork structure"],
    standards: ["load, bolt length and accessory compatibility are fork-specific"],
    commonSymptoms: ["damaged threads", "loose bolts", "corrosion", "mount damage"],
    aliases: ["fork bosses", "cargo mounts", "fork mounts"],
  },
  "downtube-protector": {
    summary: "Abrasion and impact-protection layer on the lower frame.",
    function:
      "Takes minor stone, debris and abrasion exposure that would otherwise strike the frame surface directly.",
    materials: ["polymer or elastomer protector"],
    standards: ["shape, adhesive and coverage are frame-specific"],
    commonSymptoms: ["peeling", "tears", "trapped debris", "impact marks"],
    aliases: ["frame protector", "downtube guard"],
  },
};

function fallback(
  slug: string,
  name: string,
  systemId: string,
  materialIds: string[],
) {
  return {
    summary: `${name} in the Gravel G1 ${systemId.replaceAll("-", " ")} system.`,
    function:
      "This component performs its normal bicycle-system role within the Gravel G1 all-road architecture. Detailed Gravel-specific standards, symptoms and teaching content will be expanded in a later content phase.",
    materials: materialIds.map((id) =>
      id.replace(/^mat\./, "").replaceAll(".", " "),
    ),
    standards: [
      "Exact dimensions, interfaces and service limits are component-specific.",
    ],
    commonSymptoms: [
      "Inspect for looseness, wear, damage, interference or abnormal operation.",
    ],
    aliases: [slug.replaceAll("-", " ")],
  };
}

export function getGravelKnowledgeNode(
  componentId: string | null,
): ComponentKnowledgeNode | null {
  if (!componentId) return null;
  const component = GRAVEL_G1_COMPONENTS_BY_ID.get(componentId);
  if (!component) return null;

  const profile =
    SPECIAL[component.slug] ??
    fallback(
      component.slug,
      component.name,
      component.systemId,
      component.materialIds,
    );

  const assemblyNeighborIds =
    getAssemblyNeighborsForComponent(GRAVEL_G1.id, component.id);

  return {
    componentId: component.id,
    name: component.name,
    slug: component.slug,
    systemId: component.systemId,
    tags: component.tags,
    materialIds: component.materialIds,
    ...profile,
    relatedComponentIds: assemblyNeighborIds,
    assemblyNeighborIds,
    lessonIds: [],
    procedureIds: [],
    availableIn3d: isInteractiveComponent(
      GRAVEL_G1.id,
      component.id,
    ),
  };
}

export function getGravelRelatedComponentIds(componentId: string) {
  return getAssemblyNeighborsForComponent(GRAVEL_G1.id, componentId);
}

export function searchGravelKnowledge(
  rawQuery: string,
): KnowledgeSearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);

  return GRAVEL_G1.components
    .map((component) => {
      const node = getGravelKnowledgeNode(component.id);
      if (!node) return null;

      const haystack = [
        node.name,
        node.slug,
        node.systemId,
        ...node.tags,
        node.summary,
        node.function,
        ...node.materials,
        ...node.standards,
        ...node.commonSymptoms,
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

      if (node.name.toLowerCase() === query || node.slug === query) {
        score += 20;
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
