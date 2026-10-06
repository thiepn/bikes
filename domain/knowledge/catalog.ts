import type { BikeDefinition } from "@/domain/bike/definition";
import {
  getBikeById,
  getBikeComponentById,
} from "@/domain/bike/catalog";
import {
  getAssemblyNeighborsForComponent,
} from "@/domain/assembly/catalog";
import {
  getKnowledgeNode as getRoadKnowledgeNode,
  getKnowledgeRelatedComponentIds as getRoadRelatedIds,
  searchRoadR1Knowledge,
} from "@/domain/knowledge/road-r1";
import {
  isInteractiveComponent,
} from "@/engine/interaction/component-availability";
import type {
  ComponentKnowledgeNode,
  KnowledgeSearchResult,
} from "@/engine/knowledge/types";

function foundationSummary(
  bike: BikeDefinition,
  componentId: string,
) {
  const component = getBikeComponentById(componentId);
  if (!component) return "";

  return `${component.name} in the ${bike.name} ${component.systemId.replaceAll("-", " ")} system. Detailed encyclopedia content is pending for this archetype.`;
}

export function getBikeKnowledgeNode(
  bikeId: string,
  componentId: string | null,
): ComponentKnowledgeNode | null {
  if (!componentId) return null;

  if (bikeId === "bike.road.r1") {
    return getRoadKnowledgeNode(componentId);
  }

  const bike = getBikeById(bikeId);
  const component = getBikeComponentById(componentId);
  if (!bike || !component || !component.id.startsWith(`${bike.id}.`)) {
    return null;
  }

  return {
    componentId: component.id,
    name: component.name,
    slug: component.slug,
    systemId: component.systemId,
    tags: component.tags,
    materialIds: component.materialIds,
    summary: foundationSummary(bike, component.id),
    function:
      "This semantic component is part of the MTB M1 architecture. Its full technical explanation will be added with the MTB encyclopedia content pass.",
    materials: component.materialIds.map((id) =>
      id.replace(/^mat\./, "").replaceAll(".", " "),
    ),
    standards: [
      "Component-specific standards and dimensions are intentionally not asserted until the MTB M1 component specification is authored.",
    ],
    commonSymptoms: [
      "Detailed inspection and failure-symptom content pending for MTB M1.",
    ],
    aliases: component.tags,
    relatedComponentIds: getAssemblyNeighborsForComponent(
      bikeId,
      component.id,
    ),
    assemblyNeighborIds: getAssemblyNeighborsForComponent(
      bikeId,
      component.id,
    ),
    lessonIds: [],
    procedureIds: [],
    availableIn3d: isInteractiveComponent(bikeId, component.id),
  };
}

export function getBikeKnowledgeRelatedComponentIds(
  bikeId: string,
  componentId: string,
) {
  if (bikeId === "bike.road.r1") {
    return getRoadRelatedIds(componentId);
  }

  return Array.from(
    new Set(
      getAssemblyNeighborsForComponent(bikeId, componentId),
    ),
  );
}

export function searchBikeKnowledge(
  bikeId: string,
  query: string,
): KnowledgeSearchResult[] {
  if (bikeId === "bike.road.r1") {
    return searchRoadR1Knowledge(query);
  }

  const bike = getBikeById(bikeId);
  if (!bike) return [];

  const normalized = query.trim().toLowerCase();
  const tokens = normalized.split(/\s+/).filter(Boolean);

  return bike.components
    .map((component) => {
      const text = [
        component.name,
        component.slug,
        component.systemId,
        ...component.tags,
        ...component.materialIds,
      ]
        .join(" ")
        .toLowerCase();

      if (tokens.some((token) => !text.includes(token))) {
        return null;
      }

      let score = 0;
      for (const token of tokens) {
        if (component.name.toLowerCase().includes(token)) score += 5;
        if (component.slug.includes(token)) score += 3;
        if (component.tags.some((tag) => tag.includes(token))) score += 2;
        score += 1;
      }

      return {
        componentId: component.id,
        name: component.name,
        systemId: component.systemId,
        summary: foundationSummary(bike, component.id),
        score,
        availableIn3d: isInteractiveComponent(
          bike.id,
          component.id,
        ),
      };
    })
    .filter((result): result is KnowledgeSearchResult => Boolean(result))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.name.localeCompare(b.name),
    );
}
