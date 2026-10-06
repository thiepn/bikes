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

  if (state.ghost) {
    return {
      color: "#65e3ff",
      emissive: "#0b2630",
      emissiveIntensity: 0.42,
      opacity: 0.12,
      transparent: true,
      depthWrite: false,
    };
  }
  const selected = state.selectedId
    ? semanticIds.includes(state.selectedId)
    : false;
  const hovered = state.hoveredId
    ? semanticIds.includes(state.hoveredId)
    : false;
  const contextualHighlight = semanticIds.some((id) =>
    state.highlightedIds.includes(id),
  );
  const highlighted = selected || hovered || contextualHighlight;
  const removed = semanticIds.some((id) =>
    state.removedIds.includes(id),
  );
  const survivesIsolation =
    !state.selectedId || semanticIds.includes(state.selectedId);
  const dimmed = Boolean(state.isolated && !survivesIsolation);
  const systemColor =
    state.mode === "systems" ? getSystemColor(componentId) : baseColor;
  const xrayShell =
    state.mode === "xray" &&
    semanticIds.some((id) => isXrayShell(id)) &&
    !highlighted;

  const opacity = removed
    ? highlighted
      ? 0.24
      : 0.035
    : dimmed
      ? 0.045
      : xrayShell
        ? 0.14
        : 1;

  return {
    color: highlighted ? "#d9ff67" : systemColor,
    emissive: highlighted ? "#26370b" : "#000000",
    emissiveIntensity: highlighted ? 1.3 : 0,
    opacity,
    transparent: opacity < 1,
    depthWrite: opacity >= 0.95,
  };
}
