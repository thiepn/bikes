"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { ROAD_R1 } from "@/domain/bike/road-r1";
import {
  LESSON_CATALOG,
  getLessonById,
} from "@/domain/learning/catalog";
import { isCalibrationComponent } from "@/engine/interaction/calibration-components";
import type { InspectionMode } from "@/engine/inspection/types";
import {
  calculateLessonScore,
  isLessonCompleted,
} from "@/engine/learning/progress";
import type {
  LessonChallengeResult,
} from "@/engine/learning/types";
import { getStoryVisualState } from "@/engine/story/config";
import type { ExperienceMode } from "@/engine/story/types";
import { CinematicStory } from "@/components/story/CinematicStory";
import { LearningCatalog } from "@/components/learning/LearningCatalog";
import { LessonPanel } from "@/components/learning/LessonPanel";
import { useLearningProgress } from "@/components/learning/useLearningProgress";
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
  const [learningOpen, setLearningOpen] = useState(false);

  const [activeLessonId, setActiveLessonId] = useState(
    LESSON_CATALOG[0].id,
  );
  const [lessonStepIndex, setLessonStepIndex] = useState(0);
  const [lessonRunning, setLessonRunning] = useState(false);
  const [lessonGearIndex, setLessonGearIndex] = useState(2);
  const [challengeResults, setChallengeResults] = useState<
    Record<string, LessonChallengeResult>
  >({});

  const {
    store: learningProgress,
    hydrated: progressHydrated,
    markStarted,
    savePosition,
    completeLesson,
  } = useLearningProgress();

  const lesson =
    getLessonById(activeLessonId) ?? LESSON_CATALOG[0];
  const safeLessonStepIndex = Math.min(
    lesson.steps.length - 1,
    Math.max(0, lessonStepIndex),
  );
  const lessonStep = lesson.steps[safeLessonStepIndex];
  const challengeResult = challengeResults[lessonStep.id];
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
      ? [
          ...lessonStep.highlightComponentIds,
          ...(challengeResult?.correct
            ? [challengeResult.answerId]
            : []),
        ]
      : [];
  const drivetrainDemo =
    experienceMode === "lesson" && lessonStep.demo
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

  const configureLessonStep = useCallback(
    (nextLessonId: string, nextIndex: number) => {
      const nextLesson = getLessonById(nextLessonId);
      if (!nextLesson) return;

      const index = Math.min(
        nextLesson.steps.length - 1,
        Math.max(0, nextIndex),
      );
      const step = nextLesson.steps[index];

      setActiveLessonId(nextLesson.id);
      setLessonStepIndex(index);
      setLessonRunning(step.demo?.running ?? false);
      setLessonGearIndex(step.demo?.gearIndex ?? 2);
    },
    [],
  );

  const changeLessonStep = useCallback(
    (nextIndex: number) => {
      configureLessonStep(lesson.id, nextIndex);
      savePosition(lesson.id, nextIndex);
    },
    [configureLessonStep, lesson.id, savePosition],
  );

  const startLesson = useCallback(
    (lessonId: string, requestedStep = 0) => {
      const nextLesson = getLessonById(lessonId);
      if (!nextLesson) return;

      const locked = nextLesson.prerequisiteLessonIds.some(
        (prerequisiteId) =>
          !isLessonCompleted(learningProgress, prerequisiteId),
      );
      if (locked) return;

      setSelectedId(null);
      setHoveredId(null);
      setIsolated(false);
      setChallengeResults({});
      configureLessonStep(nextLesson.id, requestedStep);
      markStarted(nextLesson.id, requestedStep);
      setLearningOpen(false);
      setExperienceMode("lesson");
    },
    [
      configureLessonStep,
      learningProgress,
      markStarted,
    ],
  );

  const answerLessonChallenge = useCallback(
    (answerId: string) => {
      const challenge = lessonStep.challenge;
      if (!challenge) return;

      const correct =
        challenge.type === "multiple-choice"
          ? answerId === challenge.correctOptionId
          : challenge.correctComponentIds.includes(answerId);

      setChallengeResults((current) => {
        const existing = current[lessonStep.id];
        if (existing?.correct) return current;

        return {
          ...current,
          [lessonStep.id]: {
            answerId,
            correct,
            attempts: (existing?.attempts ?? 0) + 1,
          },
        };
      });
    },
    [lessonStep],
  );

  const finishLesson = useCallback(() => {
    const challengeStepIds = lesson.steps
      .filter((step) => Boolean(step.challenge))
      .map((step) => step.id);
    const score = calculateLessonScore(
      challengeResults,
      challengeStepIds,
    );

    completeLesson(
      lesson.id,
      lesson.steps.length - 1,
      score,
    );
    setExperienceMode("explore");
    setLearningOpen(true);
    setSelectedId(null);
    setHoveredId(null);
    setIsolated(false);
  }, [
    challengeResults,
    completeLesson,
    lesson.id,
    lesson.steps,
  ]);

  const exitLesson = useCallback(() => {
    savePosition(lesson.id, safeLessonStepIndex);
    setExperienceMode("explore");
    setLearningOpen(true);
    setSelectedId(null);
    setHoveredId(null);
    setIsolated(false);
  }, [lesson.id, safeLessonStepIndex, savePosition]);

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
    setLearningOpen(false);
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
    const requestedLessonId = url.searchParams.get("lesson");
    const requestedStep = Number(url.searchParams.get("step"));
    const requestedLesson = getLessonById(requestedLessonId);
    const lessonDeepLink = Boolean(requestedLesson);
    const hasDeepLink = Boolean(slug || view || lessonDeepLink);

    if (hasDeepLink) {
      setExperienceMode(lessonDeepLink ? "lesson" : "explore");
    }

    if (requestedLesson) {
      const index =
        Number.isFinite(requestedStep) && requestedStep >= 1
          ? Math.min(
              requestedLesson.steps.length - 1,
              requestedStep - 1,
            )
          : 0;
      const step = requestedLesson.steps[index];

      setActiveLessonId(requestedLesson.id);
      setLessonStepIndex(index);
      setLessonRunning(step.demo?.running ?? false);
      setLessonGearIndex(step.demo?.gearIndex ?? 2);
      setChallengeResults({});
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
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (experienceMode === "lesson") {
      url.searchParams.delete("part");
      url.searchParams.delete("view");
      url.searchParams.delete("explode");
      url.searchParams.set("lesson", lesson.id);
      url.searchParams.set(
        "step",
        String(safeLessonStepIndex + 1),
      );
    } else {
      url.searchParams.delete("lesson");
      url.searchParams.delete("step");
    }

    window.history.replaceState({}, "", url);
  }, [
    experienceMode,
    lesson.id,
    safeLessonStepIndex,
  ]);

  useEffect(() => {
    if (
      experienceMode !== "lesson" ||
      !progressHydrated
    ) {
      return;
    }

    markStarted(lesson.id, safeLessonStepIndex);
  }, [
    experienceMode,
    lesson.id,
    markStarted,
    progressHydrated,
    safeLessonStepIndex,
  ]);

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
        if (learningOpen) {
          setLearningOpen(false);
        } else {
          select(null);
        }
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
  }, [
    changeMode,
    experienceMode,
    learningOpen,
    select,
    selectedId,
  ]);

  const lessonSelectHandler =
    lessonStep.challenge?.type === "select-component"
      ? (componentId: string | null) => {
          if (componentId) answerLessonChallenge(componentId);
        }
      : () => {};

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
              className={
                learningOpen
                  ? "learn-launch is-active"
                  : "learn-launch"
              }
              onClick={() =>
                setLearningOpen((value) => !value)
              }
            >
              Learn
              <span aria-hidden="true">→</span>
            </button>
          )}
          <div className="phase-label">
            {experienceMode === "story"
              ? "Cinematic introduction"
              : experienceMode === "lesson"
                ? `Lesson · ${safeLessonStepIndex + 1}/${lesson.steps.length}`
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
            experienceMode === "explore"
              ? select
              : experienceMode === "lesson"
                ? lessonSelectHandler
                : () => {}
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
          lesson={lesson}
          stepIndex={safeLessonStepIndex}
          running={lessonRunning}
          cadenceRpm={lessonStep.demo?.cadenceRpm ?? 0}
          gearIndex={lessonGearIndex}
          challengeResult={challengeResult}
          onStepChange={changeLessonStep}
          onRunningChange={setLessonRunning}
          onGearChange={setLessonGearIndex}
          onChallengeAnswer={answerLessonChallenge}
          onFinish={finishLesson}
          onExit={exitLesson}
        />
      ) : learningOpen ? (
        <LearningCatalog
          progress={learningProgress}
          hydrated={progressHydrated}
          onStartLesson={startLesson}
          onClose={() => setLearningOpen(false)}
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
