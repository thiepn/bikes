import type { ColorRepresentation } from "three";
import type { ViewerInteractionState } from "./types";
import {
  getSystemColor,
  isXrayShell,
} from "@/engine/inspection/config";

export type PartAppearance = {
  color: ColorRepresentation;
  emissive: ColorRepresentation;
  emissiveIntensity: number;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
};

export function getPartAppearance(
  baseColor: ColorRepresentation,
  componentId: string,
  state: ViewerInteractionState,
  parentIds: string[] = [],
): PartAppearance {
  const semanticIds = [componentId, ...parentIds];
  const selected = state.selectedId
    ? semanticIds.includes(state.selectedId)
    : false;
  const hovered = state.hoveredId
    ? semanticIds.includes(state.hoveredId)
    : false;
  const lessonHighlighted = semanticIds.some((id) =>
    state.highlightedIds.includes(id),
  );
  const highlighted = selected || hovered || lessonHighlighted;
  const survivesIsolation =
    !state.selectedId || semanticIds.includes(state.selectedId);
  const dimmed = Boolean(state.isolated && !survivesIsolation);
  const systemColor =
    state.mode === "systems" ? getSystemColor(componentId) : baseColor;
  const xrayShell =
    state.mode === "xray" &&
    semanticIds.some((id) => isXrayShell(id)) &&
    !highlighted;

  const opacity = dimmed ? 0.045 : xrayShell ? 0.14 : 1;

  return {
    color: highlighted ? "#d9ff67" : systemColor,
    emissive: highlighted ? "#26370b" : "#000000",
    emissiveIntensity: highlighted ? 1.3 : 0,
    opacity,
    transparent: opacity < 1,
    depthWrite: opacity >= 0.95,
  };
}
