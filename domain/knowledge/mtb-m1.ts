import knowledgeJson from "@/content/knowledge/mtb-m1.json";
import { MTB_M1, MTB_M1_COMPONENTS_BY_ID } from "@/domain/bike/mtb-m1";
import {
  getAssemblyNeighborsForComponent,
} from "@/domain/assembly/catalog";
import {
  getLessonsForBike,
} from "@/domain/learning/catalog";
import {
  getWorkshopProceduresForBike,
} from "@/domain/workshop/catalog";
import {
  isInteractiveComponent,
} from "@/engine/interaction/component-availability";
import type {
  BikeKnowledgeBase,
  ComponentKnowledgeNode,
  ComponentKnowledgeProfile,
  KnowledgeSearchResult,
} from "@/engine/knowledge/types";

export const MTB_M1_KNOWLEDGE =
  knowledgeJson as BikeKnowledgeBase;

const PROFILE_BY_ID = new Map(
  MTB_M1_KNOWLEDGE.profiles.map((profile) => [
    profile.componentId,
    profile,
  ]),
);

function lessonsForComponent(componentId: string) {
  return getLessonsForBike(MTB_M1.id)
    .filter((lesson) =>
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
    )
    .map((lesson) => lesson.id);
}

function proceduresForComponent(componentId: string) {
  return getWorkshopProceduresForBike(MTB_M1.id)
    .filter((procedure) =>
      procedure.steps.some(
        (step) =>
          step.focusComponentId === componentId ||
          step.highlightComponentIds.includes(componentId) ||
          step.removedComponentIds.includes(componentId),
      ),
    )
    .map((procedure) => procedure.id);
}

export function getMtbKnowledgeProfile(
  componentId: string | null,
): ComponentKnowledgeProfile | null {
  if (!componentId) return null;
  return PROFILE_BY_ID.get(componentId) ?? null;
}

export function getMtbKnowledgeNode(
  componentId: string | null,
): ComponentKnowledgeNode | null {
  if (!componentId) return null;

  const component = MTB_M1_COMPONENTS_BY_ID.get(componentId);
  const profile = PROFILE_BY_ID.get(componentId);
  if (!component || !profile) return null;

  const assemblyNeighborIds =
    getAssemblyNeighborsForComponent(MTB_M1.id, componentId);

  return {
    ...profile,
    name: component.name,
    slug: component.slug,
    systemId: component.systemId,
    tags: component.tags,
    materialIds: component.materialIds,
    assemblyNeighborIds,
    lessonIds: lessonsForComponent(componentId),
    procedureIds: proceduresForComponent(componentId),
    availableIn3d: isInteractiveComponent(
      MTB_M1.id,
      componentId,
    ),
  };
}

export function getMtbRelatedComponentIds(componentId: string) {
  const node = getMtbKnowledgeNode(componentId);
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
  const component = MTB_M1_COMPONENTS_BY_ID.get(componentId);

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

export function searchMtbKnowledge(
  rawQuery: string,
): KnowledgeSearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return MTB_M1.components.map((component) => {
      const profile = PROFILE_BY_ID.get(component.id)!;

      return {
        componentId: component.id,
        name: component.name,
        systemId: component.systemId,
        summary: profile.summary,
        score: 0,
        availableIn3d: isInteractiveComponent(
          MTB_M1.id,
          component.id,
        ),
      };
    });
  }

  return MTB_M1.components
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
        if (
          profile.aliases.some((alias) =>
            alias.toLowerCase().includes(token),
          )
        ) {
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
        availableIn3d: isInteractiveComponent(
          MTB_M1.id,
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
