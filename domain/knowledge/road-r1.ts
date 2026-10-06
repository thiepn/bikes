import knowledgeJson from "@/content/knowledge/road-r1.json";
import { ROAD_R1, ROAD_R1_COMPONENTS_BY_ID } from "@/domain/bike/road-r1";
import { ROAD_R1_ASSEMBLY_GRAPH } from "@/domain/assembly/road-r1";
import { LESSON_CATALOG } from "@/domain/learning/catalog";
import { WORKSHOP_CATALOG } from "@/domain/workshop/catalog";
import { CALIBRATION_COMPONENT_IDS } from "@/engine/interaction/calibration-components";
import type {
  BikeKnowledgeBase,
  ComponentKnowledgeNode,
  ComponentKnowledgeProfile,
  KnowledgeSearchResult,
} from "@/engine/knowledge/types";

export const ROAD_R1_KNOWLEDGE =
  knowledgeJson as BikeKnowledgeBase;

const PROFILE_BY_ID = new Map(
  ROAD_R1_KNOWLEDGE.profiles.map((profile) => [
    profile.componentId,
    profile,
  ]),
);

function lessonsForComponent(componentId: string) {
  return LESSON_CATALOG.filter((lesson) =>
    lesson.steps.some((step) => {
      if (step.focusComponentId === componentId) return true;
      if (step.highlightComponentIds.includes(componentId)) return true;
      if (
        step.challenge?.type === "select-component" &&
        step.challenge.candidateComponentIds.includes(componentId)
      ) {
        return true;
      }
      return false;
    }),
  ).map((lesson) => lesson.id);
}

function proceduresForComponent(componentId: string) {
  return WORKSHOP_CATALOG.filter((procedure) =>
    procedure.steps.some(
      (step) =>
        step.focusComponentId === componentId ||
        step.highlightComponentIds.includes(componentId) ||
        step.removedComponentIds.includes(componentId),
    ),
  ).map((procedure) => procedure.id);
}

function assemblyNeighbors(componentId: string) {
  const ids = new Set<string>();

  for (const connection of ROAD_R1_ASSEMBLY_GRAPH.connections) {
    if (connection.from === componentId) ids.add(connection.to);
    if (connection.to === componentId) ids.add(connection.from);
  }

  return [...ids];
}

export function getKnowledgeProfile(
  componentId: string | null,
): ComponentKnowledgeProfile | null {
  if (!componentId) return null;
  return PROFILE_BY_ID.get(componentId) ?? null;
}

export function getKnowledgeNode(
  componentId: string | null,
): ComponentKnowledgeNode | null {
  if (!componentId) return null;

  const component = ROAD_R1_COMPONENTS_BY_ID.get(componentId);
  const profile = PROFILE_BY_ID.get(componentId);
  if (!component || !profile) return null;

  return {
    ...profile,
    name: component.name,
    slug: component.slug,
    systemId: component.systemId,
    tags: component.tags,
    materialIds: component.materialIds,
    assemblyNeighborIds: assemblyNeighbors(componentId),
    lessonIds: lessonsForComponent(componentId),
    procedureIds: proceduresForComponent(componentId),
    availableIn3d: CALIBRATION_COMPONENT_IDS.has(componentId),
  };
}

export function getKnowledgeRelatedComponentIds(componentId: string) {
  const node = getKnowledgeNode(componentId);
  if (!node) return [];

  return Array.from(
    new Set([
      ...node.relatedComponentIds,
      ...node.assemblyNeighborIds,
    ]),
  ).filter((id) => id !== componentId);
}

function searchableText(
  componentId: string,
  profile: ComponentKnowledgeProfile,
) {
  const component = ROAD_R1_COMPONENTS_BY_ID.get(componentId);
  return [
    component?.name,
    component?.slug,
    component?.systemId,
    ...(component?.tags ?? []),
    profile.summary,
    profile.function,
    ...profile.materials,
    ...profile.standards,
    ...profile.commonSymptoms,
    ...profile.aliases,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function searchRoadR1Knowledge(
  rawQuery: string,
): KnowledgeSearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return ROAD_R1.components.map((component) => {
      const profile = PROFILE_BY_ID.get(component.id)!;
      return {
        componentId: component.id,
        name: component.name,
        systemId: component.systemId,
        summary: profile.summary,
        score: 0,
        availableIn3d: CALIBRATION_COMPONENT_IDS.has(component.id),
      };
    });
  }

  return ROAD_R1.components
    .map((component) => {
      const profile = PROFILE_BY_ID.get(component.id);
      if (!profile) return null;

      const haystack = searchableText(component.id, profile);
      let score = 0;
      const name = component.name.toLowerCase();
      const slug = component.slug.toLowerCase();

      for (const token of tokens) {
        if (!haystack.includes(token)) return null;
        score += 1;
        if (name.includes(token)) score += 5;
        if (slug.includes(token)) score += 3;
        if (profile.aliases.some((alias) => alias.toLowerCase().includes(token))) {
          score += 2;
        }
      }

      if (name === query || slug === query) score += 20;

      return {
        componentId: component.id,
        name: component.name,
        systemId: component.systemId,
        summary: profile.summary,
        score,
        availableIn3d: CALIBRATION_COMPONENT_IDS.has(component.id),
      };
    })
    .filter((result): result is KnowledgeSearchResult => Boolean(result))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.name.localeCompare(b.name),
    );
}
