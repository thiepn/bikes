"use client";

import type { ReactNode } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type {
  ViewerInteractionHandlers,
  ViewerInteractionState,
} from "@/engine/interaction/types";

type SemanticPartProps = ViewerInteractionState &
  ViewerInteractionHandlers & {
    componentId: string;
    children: ReactNode;
    position?: [number, number, number];
  };

export function SemanticPart({
  componentId,
  children,
  position = [0, 0, 0],
  selectedId,
  hoveredId,
  isolated,
  mode,
  explosionAmount,
  removedIds,
  ghost,
  onSelect,
  onHover,
  onIsolate,
}: SemanticPartProps) {
  function select(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect(componentId);
  }

  function isolatePart(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onIsolate(componentId);
  }

  function enter(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onHover(componentId);
    document.body.style.cursor = "pointer";
  }

  function leave(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    if (hoveredId === componentId) onHover(null);
    document.body.style.cursor = "";
  }

  const hiddenByIsolation = Boolean(
    isolated && selectedId && selectedId !== componentId,
  );

  return (
    <group
      position={position}
      userData={{
        componentId,
        selected: selectedId === componentId,
        isolated: hiddenByIsolation,
        removed: removedIds.includes(componentId),
        comparisonGhost: Boolean(ghost),
        inspectionMode: mode,
        explosionAmount,
      }}
      onClick={ghost ? undefined : select}
      onDoubleClick={ghost ? undefined : isolatePart}
      onPointerOver={ghost ? undefined : enter}
      onPointerOut={ghost ? undefined : leave}
    >
      {children}
    </group>
  );
}
