export type GlobalKnowledgeEntityType =
  | "concept"
  | "bike"
  | "component"
  | "lesson"
  | "workshop"
  | "history";

export interface ConceptComponentTarget {
  bikeId: string;
  componentId: string;
  note: string;
}

export interface EngineeringConcept {
  id: string;
  title: string;
  shortTitle: string;
  summary: string;
  principles: string[];
  aliases: string[];
  componentTargets: ConceptComponentTarget[];
  lessonIds: string[];
  procedureIds: string[];
  historyEventIds: string[];
}

export interface GlobalKnowledgeSearchResult {
  type: GlobalKnowledgeEntityType;
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  score: number;
  bikeId?: string;
  componentId?: string;
}
