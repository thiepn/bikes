import type { InspectionMode } from "@/engine/inspection/types";

export type ComponentSelectionId = string | null;

export interface ViewerInteractionState {
  selectedId: ComponentSelectionId;
  hoveredId: ComponentSelectionId;
  isolated: boolean;
  mode: InspectionMode;
  explosionAmount: number;
  highlightedIds: string[];
  removedIds: string[];
  hiddenIds?: string[];
  ghost?: boolean;
}

export interface ViewerInteractionHandlers {
  onSelect: (componentId: ComponentSelectionId) => void;
  onHover: (componentId: ComponentSelectionId) => void;
  onIsolate: (componentId: string) => void;
}
