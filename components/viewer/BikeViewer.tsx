"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { ROAD_R1 } from "@/domain/bike/road-r1";
import { DRIVETRAIN_BASICS_LESSON } from "@/domain/learning/drivetrain-basics";
import { isCalibrationComponent } from "@/engine/interaction/calibration-components";
import type { InspectionMode } from "@/engine/inspection/types";
import { getStoryVisualState } from "@/engine/story/config";
import type { ExperienceMode } from "@/engine/story/types";
import { CinematicStory } from "@/components/story/CinematicStory";
import { LessonPanel } from "@/components/learning/LessonPanel";
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

const EMPTY_DEMO = {
  running: false,
  cadenceRpm: 0,
  gearIndex: 2,
};

export function BikeViewer() {
  const [experienceMode, setExperienceMode] =
    useState<ExperienceMode>("story");
  const [storyProgress, setStoryProgress] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isolated, setIsolated] = useState(false);
  const [mode, setMode] = useState<InspectionMode>("normal");
  const [explosionAmount, setExplosionAmount] = useState(0);

  const [lessonStepIndex, setLessonStepIndex] = useState(0);
  const [lessonRunning, setLessonRunning] = useState(true);
  const [lessonGearIndex, setLessonGearIndex] = useState(2);

  const lesson = DRIVETRAIN_BASICS_LESSON;
  const lessonStep = lesson.steps[lessonStepIndex];
  const storyVisual = getStoryVisualState(storyProgress);

  const sceneMode =
    experienceMode === "story"
      ? storyVisual.inspectionMode
      : experienceMode === "lesson"
        ? lessonStep.inspectionMode
        : mode;
  const sceneExplosion =
    experienceMode === "story"
      ? storyVisual.explosionAmount
      : experienceMode === "lesson"
        ? 0
        : explosionAmount;
  const sceneSelectedId =
    experienceMode === "story"
      ? null
      : experienceMode === "lesson"
        ? lessonStep.focusComponentId
        : selectedId;
  const sceneHighlightedIds =
    experienceMode === "lesson"
      ? lessonStep.highlightComponentIds
      : [];
  const drivetrainDemo =
    experienceMode === "lesson"
      ? {
          running: lessonRunning,
          cadenceRpm: lessonStep.demo.cadenceRpm,
          gearIndex: lessonGearIndex,
        }
      : EMPTY_DEMO;

  const selectedComponent = useMemo(
    () =>
      ROAD_R1.components.find((component) => component.id === selectedId) ??
      null,
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

  const changeLessonStep = useCallback((nextIndex: number) => {
    const index = Math.min(
      lesson.steps.length - 1,
      Math.max(0, nextIndex),
    );
    const step = lesson.steps[index];

    setLessonStepIndex(index);
    setLessonRunning(step.demo.running);
    setLessonGearIndex(step.demo.gearIndex);
  }, [lesson.steps]);

  const startLesson = useCallback(() => {
    setSelectedId(null);
    setHoveredId(null);
    setIsolated(false);
    changeLessonStep(0);
    setExperienceMode("lesson");
  }, [changeLessonStep]);

  const exitLesson = useCallback(() => {
    setExperienceMode("explore");
    setSelectedId(null);
    setHoveredId(null);
    setIsolated(false);
  }, []);

  const enterExplore = useCallback(() => {
    setMode(storyVisual.inspectionMode);
    setExplosionAmount(storyVisual.explosionAmount);
    setSelectedId(null);
    setHoveredId(null);
    setIsolated(false);
    setExperienceMode("explore");
  }, [storyVisual.explosionAmount, storyVisual.inspectionMode]);

  const returnToStory = useCallback(() => {
    setSelectedId(null);
    setHoveredId(null);
    setIsolated(false);
    setMode("normal");
    setExplosionAmount(0);
    setStoryProgress(0);
    setExperienceMode("story");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("part");
      url.searchParams.delete("view");
      url.searchParams.delete("explode");
      url.searchParams.delete("lesson");
      url.searchParams.delete("step");
      window.history.replaceState({}, "", url);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const slug = url.searchParams.get("part");
    const view = url.searchParams.get("view") as InspectionMode | null;
    const explode = Number(url.searchParams.get("explode"));
    const lessonId = url.searchParams.get("lesson");
    const requestedStep = Number(url.searchParams.get("step"));
    const lessonDeepLink = lessonId === lesson.id;
    const hasDeepLink = Boolean(slug || view || lessonDeepLink);

    if (hasDeepLink) {
      setExperienceMode(lessonDeepLink ? "lesson" : "explore");
    }

    if (lessonDeepLink) {
      const index =
        Number.isFinite(requestedStep) && requestedStep >= 1
          ? Math.min(lesson.steps.length - 1, requestedStep - 1)
          : 0;
      const step = lesson.steps[index];
      setLessonStepIndex(index);
      setLessonRunning(step.demo.running);
      setLessonGearIndex(step.demo.gearIndex);
      return;
    }

    if (slug) {
      const component = ROAD_R1.components.find(
        (item) =>
          item.slug === slug && isCalibrationComponent(item.id),
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
  }, [lesson.id, lesson.steps]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (experienceMode === "lesson") {
      url.searchParams.delete("part");
      url.searchParams.delete("view");
      url.searchParams.delete("explode");
      url.searchParams.set("lesson", lesson.id);
      url.searchParams.set("step", String(lessonStepIndex + 1));
    } else {
      url.searchParams.delete("lesson");
      url.searchParams.delete("step");
    }

    window.history.replaceState({}, "", url);
  }, [experienceMode, lesson.id, lessonStepIndex]);

  useEffect(() => {
    if (experienceMode !== "explore") return;

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
  }, [experienceMode, mode, explosionAmount]);

  useEffect(() => {
    if (experienceMode !== "explore") return;

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
  }, [changeMode, experienceMode, select, selectedId]);

  return (
    <section
      className={
        experienceMode === "story"
          ? "viewer viewer--story"
          : experienceMode === "lesson"
            ? "viewer viewer--lesson"
            : "viewer viewer--explore"
      }
      aria-label="Interactive Bike Atlas 3D viewer"
    >
      <div className="topbar">
        <button
          className="brand brand-button"
          type="button"
          onClick={experienceMode === "story" ? undefined : returnToStory}
          aria-label={
            experienceMode === "story"
              ? "Bike Atlas"
              : "Return to Bike Atlas introduction"
          }
        >
          <strong>BIKE ATLAS</strong>
          <span>Interactive bicycle laboratory</span>
        </button>

        <div className="topbar-actions">
          {experienceMode === "explore" && (
            <button
              type="button"
              className="learn-launch"
              onClick={startLesson}
            >
              Learn drivetrain
              <span aria-hidden="true">→</span>
            </button>
          )}
          <div className="phase-label">
            {experienceMode === "story"
              ? "Cinematic introduction"
              : experienceMode === "lesson"
                ? "Lesson · drivetrain"
                : "Explore"}
          </div>
        </div>
      </div>

      <Canvas
        className="viewer-canvas"
        dpr={[1, 1.8]}
        shadows
        camera={{
          position: [1.95, 1.18, 2.35],
          fov: 34,
          near: 0.05,
          far: 60,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onPointerMissed={() => {
          if (experienceMode === "explore") select(null);
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = SRGBColorSpace;
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <BikeScene
          experienceMode={experienceMode}
          storyProgress={storyProgress}
          selectedId={sceneSelectedId}
          hoveredId={
            experienceMode === "explore" ? hoveredId : null
          }
          isolated={
            experienceMode === "explore" ? isolated : false
          }
          mode={sceneMode}
          explosionAmount={sceneExplosion}
          highlightedIds={sceneHighlightedIds}
          drivetrainDemo={drivetrainDemo}
          onSelect={
            experienceMode === "explore" ? select : () => {}
          }
          onHover={
            experienceMode === "explore" ? setHoveredId : () => {}
          }
          onIsolate={
            experienceMode === "explore" ? isolate : () => {}
          }
        />
      </Canvas>

      {experienceMode === "story" ? (
        <CinematicStory
          progress={storyProgress}
          onProgress={setStoryProgress}
          onEnterExplore={enterExplore}
        />
      ) : experienceMode === "lesson" ? (
        <LessonPanel
          stepIndex={lessonStepIndex}
          running={lessonRunning}
          cadenceRpm={lessonStep.demo.cadenceRpm}
          gearIndex={lessonGearIndex}
          onStepChange={changeLessonStep}
          onRunningChange={setLessonRunning}
          onGearChange={setLessonGearIndex}
          onExit={exitLesson}
        />
      ) : (
        <>
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
            onToggleIsolate={() =>
              setIsolated((value) => !value)
            }
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
            <strong>
              {selectedComponent?.name ?? "Inspect the machine"}
            </strong>
          </div>

          <div className="viewer-hint" aria-hidden="true">
            <span>Drag</span> rotate · <span>Scroll</span> zoom ·{" "}
            <span>Esc</span> reset · <span>I</span> isolate
          </div>
        </>
      )}
    </section>
  );
}
