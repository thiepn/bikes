import { BIKE_CATALOG, getBikeById } from "@/domain/bike/catalog";
import { getBikeKnowledgeNode } from "@/domain/knowledge/catalog";
import {
  ENGINEERING_CONCEPTS,
  getEngineeringConcept,
} from "@/domain/knowledge/concepts";
import { LESSON_CATALOG, getLessonById } from "@/domain/learning/catalog";
import {
  WORKSHOP_CATALOG,
  getWorkshopProcedure,
} from "@/domain/workshop/catalog";
import { HISTORY_EVENTS, getHistoryEvent } from "@/domain/history/catalog";
import type {
  EngineeringConcept,
  GlobalKnowledgeEntityType,
  GlobalKnowledgeSearchResult,
} from "@/engine/global-knowledge/types";

function tokens(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function scoreText(
  rawQuery: string,
  title: string,
  aliases: string[],
  searchable: string[],
) {
  const query = rawQuery.trim().toLowerCase();
  const queryTokens = tokens(rawQuery);
  if (queryTokens.length === 0) return 0;

  const normalizedTitle = title.toLowerCase();
  const normalizedAliases = aliases.map((alias) => alias.toLowerCase());
  const haystack = [title, ...aliases, ...searchable]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (!haystack.includes(token)) return null;
    score += 1;
    if (normalizedTitle.includes(token)) score += 7;
    if (normalizedAliases.some((alias) => alias.includes(token))) {
      score += 4;
    }
  }

  if (normalizedTitle === query) score += 30;
  if (normalizedAliases.includes(query)) score += 20;
  return score;
}

function result(
  type: GlobalKnowledgeEntityType,
  id: string,
  title: string,
  subtitle: string,
  summary: string,
  score: number,
  extra: Partial<GlobalKnowledgeSearchResult> = {},
): GlobalKnowledgeSearchResult {
  return {
    type,
    id,
    title,
    subtitle,
    summary,
    score,
    ...extra,
  };
}

export function searchGlobalKnowledge(
  rawQuery: string,
): GlobalKnowledgeSearchResult[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const results: GlobalKnowledgeSearchResult[] = [];

  for (const concept of ENGINEERING_CONCEPTS) {
    const score = scoreText(
      query,
      concept.title,
      [concept.shortTitle, ...concept.aliases],
      [concept.summary, ...concept.principles],
    );
    if (score === null) continue;

    results.push(
      result(
        "concept",
        concept.id,
        concept.title,
        "Engineering concept",
        concept.summary,
        score + 10,
      ),
    );
  }

  for (const bike of BIKE_CATALOG) {
    const score = scoreText(
      query,
      bike.name,
      [bike.slug, bike.archetype],
      [bike.description, ...bike.systems],
    );
    if (score === null) continue;

    results.push(
      result(
        "bike",
        bike.id,
        bike.name,
        bike.archetype.replaceAll("-", " "),
        bike.description,
        score + 5,
        { bikeId: bike.id },
      ),
    );

    for (const component of bike.components) {
      const node = getBikeKnowledgeNode(bike.id, component.id);
      if (!node) continue;

      const componentScore = scoreText(
        query,
        node.name,
        [node.slug, ...node.aliases],
        [
          bike.name,
          node.systemId,
          ...node.tags,
          node.summary,
          node.function,
          ...node.materials,
          ...node.standards,
          ...node.commonSymptoms,
        ],
      );
      if (componentScore === null) continue;

      results.push(
        result(
          "component",
          component.id,
          node.name,
          `${bike.name} · ${node.systemId.replaceAll("-", " ")}`,
          node.summary,
          componentScore + (node.availableIn3d ? 3 : 0),
          {
            bikeId: bike.id,
            componentId: component.id,
          },
        ),
      );
    }
  }

  for (const lesson of LESSON_CATALOG) {
    const bike = getBikeById(lesson.bikeId);
    const score = scoreText(
      query,
      lesson.title,
      [lesson.id],
      [
        lesson.summary,
        lesson.systemId,
        bike?.name ?? "",
        ...lesson.steps.flatMap((step) => [
          step.title,
          step.body,
          step.keyFact,
          step.challenge?.prompt ?? "",
        ]),
      ],
    );
    if (score === null) continue;

    results.push(
      result(
        "lesson",
        lesson.id,
        lesson.title,
        `${bike?.name ?? "Bike Atlas"} · Learn`,
        lesson.summary,
        score + 4,
        { bikeId: lesson.bikeId },
      ),
    );
  }

  for (const procedure of WORKSHOP_CATALOG) {
    const bike = getBikeById(procedure.bikeId);
    const score = scoreText(
      query,
      procedure.title,
      [procedure.id],
      [
        procedure.summary,
        procedure.systemId,
        bike?.name ?? "",
        ...procedure.tools.flatMap((tool) => [
          tool.name,
          tool.note ?? "",
        ]),
        ...procedure.steps.flatMap((step) => [
          step.title,
          step.instruction,
          step.why,
          step.warning ?? "",
          step.check ?? "",
        ]),
      ],
    );
    if (score === null) continue;

    results.push(
      result(
        "workshop",
        procedure.id,
        procedure.title,
        `${bike?.name ?? "Bike Atlas"} · Workshop`,
        procedure.summary,
        score + 3,
        { bikeId: procedure.bikeId },
      ),
    );
  }

  for (const event of HISTORY_EVENTS) {
    const score = scoreText(
      query,
      event.title,
      [event.id, event.yearLabel],
      [
        event.subtitle,
        event.summary,
        ...event.engineeringShift,
        ...event.categoryIds,
        event.caveat ?? "",
      ],
    );
    if (score === null) continue;

    results.push(
      result(
        "history",
        event.id,
        event.title,
        `${event.yearLabel} · History`,
        event.summary,
        score + 2,
      ),
    );
  }

  return results.sort(
    (a, b) =>
      b.score - a.score ||
      a.type.localeCompare(b.type) ||
      a.title.localeCompare(b.title),
  );
}

export function getGlobalResultEntity(result: GlobalKnowledgeSearchResult) {
  if (result.type === "concept") {
    return getEngineeringConcept(result.id);
  }
  if (result.type === "bike") {
    return getBikeById(result.bikeId ?? result.id);
  }
  if (result.type === "component") {
    const bike = getBikeById(result.bikeId ?? null);
    return bike?.components.find(
      (component) => component.id === result.componentId,
    ) ?? null;
  }
  if (result.type === "lesson") {
    return getLessonById(result.id);
  }
  if (result.type === "workshop") {
    return getWorkshopProcedure(result.id);
  }
  if (result.type === "history") {
    return getHistoryEvent(result.id);
  }
  return null;
}

export function conceptsForComponent(componentId: string) {
  return ENGINEERING_CONCEPTS.filter((concept) =>
    concept.componentTargets.some(
      (target) => target.componentId === componentId,
    ),
  );
}

export function conceptsForBike(bikeId: string) {
  return ENGINEERING_CONCEPTS.filter((concept) =>
    concept.componentTargets.some(
      (target) => target.bikeId === bikeId,
    ),
  );
}

export function conceptTargetsForBike(
  concept: EngineeringConcept,
  bikeId: string,
) {
  return concept.componentTargets.filter(
    (target) => target.bikeId === bikeId,
  );
}
