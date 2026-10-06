export interface ComponentKnowledgeProfile {
  componentId: string;
  summary: string;
  function: string;
  materials: string[];
  standards: string[];
  commonSymptoms: string[];
  relatedComponentIds: string[];
  aliases: string[];
}

export interface BikeKnowledgeBase {
  bikeId: string;
  profiles: ComponentKnowledgeProfile[];
}

export interface ComponentKnowledgeNode extends ComponentKnowledgeProfile {
  name: string;
  slug: string;
  systemId: string;
  tags: string[];
  materialIds: string[];
  assemblyNeighborIds: string[];
  lessonIds: string[];
  procedureIds: string[];
  availableIn3d: boolean;
}

export interface KnowledgeSearchResult {
  componentId: string;
  name: string;
  systemId: string;
  summary: string;
  score: number;
  availableIn3d: boolean;
}
