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
  hiddenIds = [],
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
  const hiddenByBuild = hiddenIds.includes(componentId);

  return (
    <group
      position={position}
      visible={!hiddenByBuild}
      userData={{
        componentId,
        selected: selectedId === componentId,
        isolated: hiddenByIsolation,
        removed: removedIds.includes(componentId),
        buildHidden: hiddenByBuild,
        comparisonGhost: Boolean(ghost),
        inspectionMode: mode,
        explosionAmount,
      }}
      onClick={ghost || hiddenByBuild ? undefined : select}
      onDoubleClick={ghost || hiddenByBuild ? undefined : isolatePart}
      onPointerOver={ghost || hiddenByBuild ? undefined : enter}
      onPointerOut={ghost || hiddenByBuild ? undefined : leave}
    >
      {children}
    </group>
  );
}
