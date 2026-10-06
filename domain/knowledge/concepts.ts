import conceptsJson from "@/content/knowledge/concepts.json";
import type { EngineeringConcept } from "@/engine/global-knowledge/types";

export const ENGINEERING_CONCEPTS =
  conceptsJson.concepts as EngineeringConcept[];

const BY_ID = new Map(
  ENGINEERING_CONCEPTS.map((concept) => [concept.id, concept]),
);

export function getEngineeringConcept(conceptId: string | null) {
  if (!conceptId) return null;
  return BY_ID.get(conceptId) ?? null;
}
