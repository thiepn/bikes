import {
  getKnowledgeNode as getRoadKnowledgeNode,
  getKnowledgeRelatedComponentIds as getRoadRelatedIds,
  searchRoadR1Knowledge,
} from "@/domain/knowledge/road-r1";
import {
  getMtbKnowledgeNode,
  getMtbRelatedComponentIds,
  searchMtbKnowledge,
} from "@/domain/knowledge/mtb-m1";
import {
  getUrbanKnowledgeNode,
  getUrbanRelatedComponentIds,
  searchUrbanKnowledge,
} from "@/domain/knowledge/urban-u1";
import type {
  ComponentKnowledgeNode,
  KnowledgeSearchResult,
} from "@/engine/knowledge/types";

export function getBikeKnowledgeNode(
  bikeId: string,
  componentId: string | null,
): ComponentKnowledgeNode | null {
  if (bikeId === "bike.road.r1") {
    return getRoadKnowledgeNode(componentId);
  }

  if (bikeId === "bike.mtb.m1") {
    return getMtbKnowledgeNode(componentId);
  }

  if (bikeId === "bike.urban.u1") {
    return getUrbanKnowledgeNode(componentId);
  }

  return null;
}

export function getBikeKnowledgeRelatedComponentIds(
  bikeId: string,
  componentId: string,
) {
  if (bikeId === "bike.road.r1") {
    return getRoadRelatedIds(componentId);
  }

  if (bikeId === "bike.mtb.m1") {
    return getMtbRelatedComponentIds(componentId);
  }

  if (bikeId === "bike.urban.u1") {
    return getUrbanRelatedComponentIds(componentId);
  }

  return [];
}

export function searchBikeKnowledge(
  bikeId: string,
  query: string,
): KnowledgeSearchResult[] {
  if (bikeId === "bike.road.r1") {
    return searchRoadR1Knowledge(query);
  }

  if (bikeId === "bike.mtb.m1") {
    return searchMtbKnowledge(query);
  }

  if (bikeId === "bike.urban.u1") {
    return searchUrbanKnowledge(query);
  }

  return [];
}
