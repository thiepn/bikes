"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { ROAD_R1 } from "@/domain/bike/road-r1";
import { isCalibrationComponent } from "@/engine/interaction/calibration-components";
import { BikeScene } from "./BikeScene";
import { ComponentPanel } from "./ComponentPanel";

export function BikeViewer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isolated, setIsolated] = useState(false);

  const selectedComponent = useMemo(
    () => ROAD_R1.components.find((component) => component.id === selectedId) ?? null,
    [selectedId],
  );

  const updateUrl = useCallback((componentId: string | null) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const component = ROAD_R1.components.find((item) => item.id === componentId);

    if (component) url.searchParams.set("part", component.slug);
    else url.searchParams.delete("part");

    window.history.replaceState({}, "", url);
  }, []);

  const select = useCallback(
    (componentId: string | null) => {
      setSelectedId(componentId);
      setHoveredId(null);
      setIsolated(false);
      updateUrl(componentId);
    },
    [updateUrl],
  );

  const isolate = useCallback(
    (componentId: string) => {
      setSelectedId(componentId);
      setHoveredId(null);
      setIsolated(true);
      updateUrl(componentId);
    },
    [updateUrl],
  );

  useEffect(() => {
    const slug = new URL(window.location.href).searchParams.get("part");
    if (!slug) return;

    const component = ROAD_R1.components.find(
      (item) => item.slug === slug && isCalibrationComponent(item.id),
    );

    if (component) setSelectedId(component.id);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        select(null);
        return;
      }

      if (event.key.toLowerCase() === "i" && selectedId) {
        setIsolated((value) => !value);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [select, selectedId]);

  return (
    <section className="viewer" aria-label="Interactive Bike Atlas 3D viewer">
      <div className="topbar">
        <div className="brand">
          <strong>BIKE ATLAS</strong>
          <span>Interactive bicycle laboratory</span>
        </div>
        <div className="phase-label">P3 semantic interaction</div>
      </div>

      <Canvas
        className="viewer-canvas"
        dpr={[1, 1.8]}
        shadows
        camera={{ position: [1.85, 1.15, 2.2], fov: 34, near: 0.05, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onPointerMissed={() => select(null)}
        onCreated={({ gl }) => {
          gl.outputColorSpace = SRGBColorSpace;
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <BikeScene
          selectedId={selectedId}
          hoveredId={hoveredId}
          isolated={isolated}
          onSelect={select}
          onHover={setHoveredId}
          onIsolate={isolate}
        />
      </Canvas>

      <ComponentPanel
        selectedId={selectedId}
        isolated={isolated}
        onSelect={select}
        onToggleIsolate={() => setIsolated((value) => !value)}
      />

      <div className={selectedComponent ? "selection-caption is-active" : "selection-caption"}>
        <span>{selectedComponent ? selectedComponent.systemId.replaceAll("-", " ") : "Road R1"}</span>
        <strong>{selectedComponent?.name ?? "Select a component"}</strong>
      </div>

      <div className="viewer-hint" aria-hidden="true">
        <span>Drag</span> rotate · <span>Scroll</span> zoom · <span>Esc</span> reset · <span>I</span> isolate
      </div>
    </section>
  );
}
