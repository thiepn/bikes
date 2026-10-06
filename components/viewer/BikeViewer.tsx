"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { ROAD_R1 } from "@/domain/bike/road-r1";
import { isCalibrationComponent } from "@/engine/interaction/calibration-components";
import type { InspectionMode } from "@/engine/inspection/types";
import { BikeScene } from "./BikeScene";
import { ComponentPanel } from "./ComponentPanel";
import { InspectionToolbar } from "./InspectionToolbar";
import { SystemsLegend } from "./SystemsLegend";

const VALID_MODES = new Set<InspectionMode>([
  "normal",
  "systems",
  "xray",
  "exploded",
]);

export function BikeViewer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isolated, setIsolated] = useState(false);
  const [mode, setMode] = useState<InspectionMode>("normal");
  const [explosionAmount, setExplosionAmount] = useState(0);

  const selectedComponent = useMemo(
    () =>
      ROAD_R1.components.find((component) => component.id === selectedId) ?? null,
    [selectedId],
  );

  const updatePartUrl = useCallback((componentId: string | null) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const component = ROAD_R1.components.find(
      (item) => item.id === componentId,
    );

    if (component) url.searchParams.set("part", component.slug);
    else url.searchParams.delete("part");

    window.history.replaceState({}, "", url);
  }, []);

  const select = useCallback(
    (componentId: string | null) => {
      setSelectedId(componentId);
      setHoveredId(null);
      setIsolated(false);
      updatePartUrl(componentId);
    },
    [updatePartUrl],
  );

  const isolate = useCallback(
    (componentId: string) => {
      setSelectedId(componentId);
      setHoveredId(null);
      setIsolated(true);
      updatePartUrl(componentId);
    },
    [updatePartUrl],
  );

  const changeMode = useCallback((nextMode: InspectionMode) => {
    setMode(nextMode);
    if (nextMode === "exploded") {
      setExplosionAmount((amount) => (amount > 0 ? amount : 0.58));
    } else {
      setExplosionAmount(0);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const slug = url.searchParams.get("part");
    const view = url.searchParams.get("view") as InspectionMode | null;
    const explode = Number(url.searchParams.get("explode"));

    if (slug) {
      const component = ROAD_R1.components.find(
        (item) => item.slug === slug && isCalibrationComponent(item.id),
      );
      if (component) setSelectedId(component.id);
    }

    if (view && VALID_MODES.has(view)) {
      setMode(view);
      if (view === "exploded") {
        setExplosionAmount(
          Number.isFinite(explode) && explode >= 0 && explode <= 100
            ? explode / 100
            : 0.58,
        );
      }
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (mode === "normal") url.searchParams.delete("view");
    else url.searchParams.set("view", mode);

    if (mode === "exploded") {
      url.searchParams.set(
        "explode",
        String(Math.round(explosionAmount * 100)),
      );
    } else {
      url.searchParams.delete("explode");
    }

    window.history.replaceState({}, "", url);
  }, [mode, explosionAmount]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.key === "Escape") {
        select(null);
        return;
      }

      if (key === "i" && selectedId) {
        setIsolated((value) => !value);
      } else if (key === "n") {
        changeMode("normal");
      } else if (key === "s") {
        changeMode("systems");
      } else if (key === "x") {
        changeMode("xray");
      } else if (key === "e") {
        changeMode("exploded");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeMode, select, selectedId]);

  return (
    <section className="viewer" aria-label="Interactive Bike Atlas 3D viewer">
      <div className="topbar">
        <div className="brand">
          <strong>BIKE ATLAS</strong>
          <span>Interactive bicycle laboratory</span>
        </div>
        <div className="phase-label">P4 inspection modes</div>
      </div>

      <Canvas
        className="viewer-canvas"
        dpr={[1, 1.8]}
        shadows
        camera={{
          position: [1.85, 1.15, 2.2],
          fov: 34,
          near: 0.05,
          far: 60,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
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
          mode={mode}
          explosionAmount={explosionAmount}
          onSelect={select}
          onHover={setHoveredId}
          onIsolate={isolate}
        />
      </Canvas>

      <InspectionToolbar
        mode={mode}
        explosionAmount={explosionAmount}
        onModeChange={changeMode}
        onExplosionChange={setExplosionAmount}
      />

      {mode === "systems" && <SystemsLegend />}

      <ComponentPanel
        selectedId={selectedId}
        isolated={isolated}
        onSelect={select}
        onHover={setHoveredId}
        onToggleIsolate={() => setIsolated((value) => !value)}
      />

      <div
        className={
          selectedComponent
            ? "selection-caption is-active"
            : "selection-caption"
        }
      >
        <span>
          {selectedComponent
            ? selectedComponent.systemId.replaceAll("-", " ")
            : mode === "normal"
              ? "Road R1"
              : mode.replaceAll("-", " ")}
        </span>
        <strong>{selectedComponent?.name ?? "Inspect the machine"}</strong>
      </div>

      <div className="viewer-hint" aria-hidden="true">
        <span>Drag</span> rotate · <span>Scroll</span> zoom ·{" "}
        <span>Esc</span> reset · <span>I</span> isolate
      </div>
    </section>
  );
}
