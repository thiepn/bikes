export type ComponentSelectionId = string | null;

export interface ViewerInteractionState {
  selectedId: ComponentSelectionId;
  hoveredId: ComponentSelectionId;
  isolated: boolean;
}

export interface ViewerInteractionHandlers {
  onSelect: (componentId: ComponentSelectionId) => void;
  onHover: (componentId: ComponentSelectionId) => void;
  onIsolate: (componentId: string) => void;
}
