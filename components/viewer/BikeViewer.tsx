"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { ROAD_R1 } from "@/domain/bike/road-r1";
import {
  getBikeById,
  getBikeBySlug,
} from "@/domain/bike/catalog";
import {
  canPerformOperation,
  getAssemblyOperation,
} from "@/domain/assembly/road-r1";
import {
  LESSON_CATALOG,
  getLessonById,
} from "@/domain/learning/catalog";
import {
  WORKSHOP_CATALOG,
  getWorkshopProcedure,
} from "@/domain/workshop/catalog";
import { KnowledgeSearch } from "@/components/knowledge/KnowledgeSearch";
import type { InspectionMode } from "@/engine/inspection/types";
import {
  calculateLessonScore,
  isLessonCompleted,
} from "@/engine/learning/progress";
import type { LessonChallengeResult } from "@/engine/learning/types";
import {
  isProcedureCompleted,
} from "@/engine/workshop/progress";
import { getStoryVisualState } from "@/engine/story/config";
import type { ExperienceMode } from "@/engine/story/types";
import { CinematicStory } from "@/components/story/CinematicStory";
import { LearningCatalog } from "@/components/learning/LearningCatalog";
import { LessonPanel } from "@/components/learning/LessonPanel";
import { useLearningProgress } from "@/components/learning/useLearningProgress";
import { WorkshopCatalog } from "@/components/workshop/WorkshopCatalog";
import { WorkshopPanel } from "@/components/workshop/WorkshopPanel";
import { useWorkshopProgress } from "@/components/workshop/useWorkshopProgress";
import { BikeScene } from "./BikeScene";
import { ComponentPanel } from "./ComponentPanel";
import { InspectionToolbar } from "./InspectionToolbar";
import { SystemsLegend } from "./SystemsLegend";
import { BikeSwitcher } from "./BikeSwitcher";

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
  const [activeBikeId, setActiveBikeId] = useState(ROAD_R1.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isolated, setIsolated] = useState(false);
  const [mode, setMode] = useState<InspectionMode>("normal");
  const [explosionAmount, setExplosionAmount] = useState(0);
  const [learningOpen, setLearningOpen] = useState(false);
  const [workshopOpen, setWorkshopOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);

  const [activeLessonId, setActiveLessonId] = useState(
    LESSON_CATALOG[0].id,
  );
  const [lessonStepIndex, setLessonStepIndex] = useState(0);
  const [lessonRunning, setLessonRunning] = useState(false);
  const [lessonGearIndex, setLessonGearIndex] = useState(2);
  const [challengeResults, setChallengeResults] = useState<
    Record<string, LessonChallengeResult>
  >({});

  const [activeProcedureId, setActiveProcedureId] = useState(
    WORKSHOP_CATALOG[0].id,
  );
  const [workshopStepIndex, setWorkshopStepIndex] = useState(0);
  const [workshopCompletedStepIds, setWorkshopCompletedStepIds] =
    useState<string[]>([]);

  const {
    store: learningProgress,
    hydrated: progressHydrated,
    markStarted,
    savePosition,
    completeLesson,
  } = useLearningProgress();

  const {
    store: workshopProgress,
    hydrated: workshopHydrated,
    startProcedure: persistProcedureStart,
    saveStep: persistWorkshopStep,
    completeProcedure,
  } = useWorkshopProgress();

  const activeBike = getBikeById(activeBikeId) ?? ROAD_R1;

  const lesson =
    getLessonById(activeLessonId) ?? LESSON_CATALOG[0];
  const safeLessonStepIndex = Math.min(
    lesson.steps.length - 1,
    Math.max(0, lessonStepIndex),
  );
  const lessonStep = lesson.steps[safeLessonStepIndex];
  const challengeResult = challengeResults[lessonStep.id];

  const procedure =
    getWorkshopProcedure(activeProcedureId) ?? WORKSHOP_CATALOG[0];
  const safeWorkshopStepIndex = Math.min(
    procedure.steps.length - 1,
    Math.max(0, workshopStepIndex),
  );
  const workshopStep = procedure.steps[safeWorkshopStepIndex];
  const workshopCompletedOperations = new Set([
    ...procedure.assumedOperationIds,
    ...procedure.steps
      .filter(
        (step) =>
          step.operationId &&
          workshopCompletedStepIds.includes(step.id),
      )
      .map((step) => step.operationId as string),
  ]);
  const currentWorkshopOperation = workshopStep.operationId
    ? getAssemblyOperation(workshopStep.operationId)
    : null;
  const canCompleteWorkshopStep =
    !currentWorkshopOperation ||
    canPerformOperation(
      currentWorkshopOperation,
      workshopCompletedOperations,
    );
  const missingWorkshopPrerequisites =
    currentWorkshopOperation?.prerequisites.filter(
      (operationId) => !workshopCompletedOperations.has(operationId),
    ) ?? [];
  const workshopBlockedReason =
    missingWorkshopPrerequisites.length > 0
      ? `Complete mechanical prerequisite${missingWorkshopPrerequisites.length > 1 ? "s" : ""}: ${missingWorkshopPrerequisites.join(", ")}.`
      : undefined;

  const storyVisual = getStoryVisualState(storyProgress);

  const sceneMode =
    experienceMode === "story"
      ? storyVisual.inspectionMode
      : experienceMode === "lesson"
        ? lessonStep.inspectionMode
        : experienceMode === "workshop"
          ? workshopStep.inspectionMode
          : mode;

  const sceneExplosion =
    experienceMode === "story"
      ? storyVisual.explosionAmount
      : experienceMode === "lesson"
        ? 0
        : experienceMode === "workshop"
          ? workshopStep.explosionAmount
          : explosionAmount;

  const sceneSelectedId =
    experienceMode === "story"
      ? null
      : experienceMode === "lesson"
        ? lessonStep.focusComponentId
        : experienceMode === "workshop"
          ? workshopStep.focusComponentId
          : selectedId;

  const sceneHighlightedIds =
    experienceMode === "lesson"
      ? [
          ...lessonStep.highlightComponentIds,
          ...(challengeResult?.correct
            ? [challengeResult.answerId]
            : []),
        ]
      : experienceMode === "workshop"
        ? workshopStep.highlightComponentIds
        : [];

  const sceneRemovedIds =
    experienceMode === "workshop"
      ? workshopStep.removedComponentIds
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
      activeBike.components.find(
        (component) => component.id === selectedId,
      ) ?? null,
    [activeBike, selectedId],
  );

  const updatePartUrl = useCallback(
    (componentId: string | null) => {
      if (typeof window === "undefined") return;

      const url = new URL(window.location.href);
      const component = activeBike.components.find(
        (item) => item.id === componentId,
      );

      if (activeBike.id === ROAD_R1.id) {
        url.searchParams.delete("bike");
      } else {
        url.searchParams.set("bike", activeBike.slug);
      }

      if (component) url.searchParams.set("part", component.slug);
      else url.searchParams.delete("part");

      window.history.replaceState({}, "", url);
    },
    [activeBike],
  );

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

  const changeBike = useCallback((bikeId: string) => {
    const nextBike = getBikeById(bikeId);
    if (!nextBike) return;

    setActiveBikeId(nextBike.id);
    setSelectedId(null);
    setHoveredId(null);
    setIsolated(false);
    setMode("normal");
    setExplosionAmount(0);
    setLearningOpen(false);
    setWorkshopOpen(false);
    setKnowledgeOpen(false);
    setExperienceMode("explore");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);

      if (nextBike.id === ROAD_R1.id) {
        url.searchParams.delete("bike");
      } else {
        url.searchParams.set("bike", nextBike.slug);
      }

      for (const key of [
        "bike",
        "part",
        "view",
        "explode",
        "lesson",
        "workshop",
        "step",
      ]) {
        url.searchParams.delete(key);
      }

      window.history.replaceState({}, "", url);
    }
  }, []);

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
      const index = Math.min(
        lesson.steps.length - 1,
        Math.max(0, nextIndex),
      );
      configureLessonStep(lesson.id, index);
      savePosition(lesson.id, index);
    },
    [configureLessonStep, lesson.id, lesson.steps.length, savePosition],
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

      setActiveBikeId(ROAD_R1.id);
      setSelectedId(null);
      setHoveredId(null);
      setIsolated(false);
      setChallengeResults({});
      configureLessonStep(nextLesson.id, requestedStep);
      markStarted(nextLesson.id, requestedStep);
      setLearningOpen(false);
      setWorkshopOpen(false);
      setKnowledgeOpen(false);
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

  const configureWorkshopStep = useCallback(
    (procedureId: string, nextIndex: number) => {
      const nextProcedure = getWorkshopProcedure(procedureId);
      if (!nextProcedure) return;

      const index = Math.min(
        nextProcedure.steps.length - 1,
        Math.max(0, nextIndex),
      );

      setActiveProcedureId(nextProcedure.id);
      setWorkshopStepIndex(index);
    },
    [],
  );

  const startWorkshopProcedure = useCallback(
    (procedureId: string, requestedStep = 0) => {
      const nextProcedure = getWorkshopProcedure(procedureId);
      if (!nextProcedure) return;

      const locked = nextProcedure.prerequisiteProcedureIds.some(
        (prerequisiteId) =>
          !isProcedureCompleted(workshopProgress, prerequisiteId),
      );
      if (locked) return;

      const existing = workshopProgress.procedures[nextProcedure.id];
      const completedIds = existing?.completedStepIds ?? [];

      setActiveBikeId(ROAD_R1.id);
      setSelectedId(null);
      setHoveredId(null);
      setIsolated(false);
      setWorkshopCompletedStepIds(completedIds);
      configureWorkshopStep(nextProcedure.id, requestedStep);
      persistProcedureStart(nextProcedure.id, requestedStep);
      setLearningOpen(false);
      setWorkshopOpen(false);
      setKnowledgeOpen(false);
      setExperienceMode("workshop");
    },
    [
      configureWorkshopStep,
      persistProcedureStart,
      workshopProgress,
    ],
  );

  const changeWorkshopStep = useCallback(
    (nextIndex: number) => {
      const index = Math.min(
        procedure.steps.length - 1,
        Math.max(0, nextIndex),
      );

      configureWorkshopStep(procedure.id, index);
      persistWorkshopStep(
        procedure.id,
        index,
        workshopCompletedStepIds,
      );
    },
    [
      configureWorkshopStep,
      persistWorkshopStep,
      procedure.id,
      procedure.steps.length,
      workshopCompletedStepIds,
    ],
  );

  const completeCurrentWorkshopStep = useCallback(() => {
    if (!canCompleteWorkshopStep) return;

    const completedIds = Array.from(
      new Set([
        ...workshopCompletedStepIds,
        workshopStep.id,
      ]),
    );

    setWorkshopCompletedStepIds(completedIds);

    const last =
      safeWorkshopStepIndex === procedure.steps.length - 1;

    if (last) {
      completeProcedure(
        procedure.id,
        safeWorkshopStepIndex,
        completedIds,
      );
      setExperienceMode("explore");
      setWorkshopOpen(true);
      return;
    }

    const nextIndex = safeWorkshopStepIndex + 1;
    persistWorkshopStep(
      procedure.id,
      nextIndex,
      completedIds,
    );
    configureWorkshopStep(procedure.id, nextIndex);
  }, [
    canCompleteWorkshopStep,
    completeProcedure,
    configureWorkshopStep,
    persistWorkshopStep,
    procedure.id,
    procedure.steps.length,
    safeWorkshopStepIndex,
    workshopCompletedStepIds,
    workshopStep.id,
  ]);

  const exitWorkshop = useCallback(() => {
    persistWorkshopStep(
      procedure.id,
      safeWorkshopStepIndex,
      workshopCompletedStepIds,
    );
    setExperienceMode("explore");
    setWorkshopOpen(true);
    setSelectedId(null);
    setHoveredId(null);
    setIsolated(false);
  }, [
    persistWorkshopStep,
    procedure.id,
    safeWorkshopStepIndex,
    workshopCompletedStepIds,
  ]);

  const enterExplore = useCallback(() => {
    setMode(storyVisual.inspectionMode);
    setExplosionAmount(storyVisual.explosionAmount);
    setSelectedId(null);
    setHoveredId(null);
    setIsolated(false);
    setExperienceMode("explore");
  }, [storyVisual.explosionAmount, storyVisual.inspectionMode]);

  const returnToStory = useCallback(() => {
    setActiveBikeId(ROAD_R1.id);
    setSelectedId(null);
    setHoveredId(null);
    setIsolated(false);
    setLearningOpen(false);
    setWorkshopOpen(false);
    setKnowledgeOpen(false);
    setMode("normal");
    setExplosionAmount(0);
    setStoryProgress(0);
    setExperienceMode("story");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      for (const key of [
        "part",
        "view",
        "explode",
        "lesson",
        "workshop",
        "step",
      ]) {
        url.searchParams.delete(key);
      }
      window.history.replaceState({}, "", url);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const requestedBike =
      getBikeBySlug(url.searchParams.get("bike")) ?? ROAD_R1;
    const slug = url.searchParams.get("part");
    const view = url.searchParams.get("view") as InspectionMode | null;
    const explode = Number(url.searchParams.get("explode"));
    const requestedLesson = getLessonById(
      url.searchParams.get("lesson"),
    );
    const requestedProcedure = getWorkshopProcedure(
      url.searchParams.get("workshop"),
    );
    const requestedStep = Number(url.searchParams.get("step"));

    if (requestedProcedure) {
      setActiveBikeId(ROAD_R1.id);
      const index =
        Number.isFinite(requestedStep) && requestedStep >= 1
          ? Math.min(
              requestedProcedure.steps.length - 1,
              requestedStep - 1,
            )
          : 0;
      setActiveProcedureId(requestedProcedure.id);
      setWorkshopStepIndex(index);
      setWorkshopCompletedStepIds([]);
      setExperienceMode("workshop");
      return;
    }

    if (requestedLesson) {
      setActiveBikeId(ROAD_R1.id);
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
      setExperienceMode("lesson");
      return;
    }

    setActiveBikeId(requestedBike.id);

    if (slug || view || requestedBike.id !== ROAD_R1.id) {
      setExperienceMode("explore");
    }

    if (slug) {
      const component = requestedBike.components.find(
        (item) => item.slug === slug,
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
    if (
      experienceMode !== "workshop" ||
      !workshopHydrated
    ) {
      return;
    }

    const record = workshopProgress.procedures[procedure.id];
    if (record && workshopCompletedStepIds.length === 0) {
      setWorkshopCompletedStepIds(record.completedStepIds);
    }
    persistProcedureStart(procedure.id, safeWorkshopStepIndex);
  }, [
    experienceMode,
    persistProcedureStart,
    procedure.id,
    safeWorkshopStepIndex,
    workshopCompletedStepIds.length,
    workshopHydrated,
    workshopProgress.procedures,
  ]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (experienceMode === "lesson") {
      url.searchParams.delete("part");
      url.searchParams.delete("view");
      url.searchParams.delete("explode");
      url.searchParams.delete("workshop");
      url.searchParams.set("lesson", lesson.id);
      url.searchParams.set(
        "step",
        String(safeLessonStepIndex + 1),
      );
    } else if (experienceMode === "workshop") {
      url.searchParams.delete("part");
      url.searchParams.delete("view");
      url.searchParams.delete("explode");
      url.searchParams.delete("lesson");
      url.searchParams.set("workshop", procedure.id);
      url.searchParams.set(
        "step",
        String(safeWorkshopStepIndex + 1),
      );
    } else {
      url.searchParams.delete("lesson");
      url.searchParams.delete("workshop");
      url.searchParams.delete("step");
    }

    window.history.replaceState({}, "", url);
  }, [
    experienceMode,
    lesson.id,
    procedure.id,
    safeLessonStepIndex,
    safeWorkshopStepIndex,
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

    if (activeBike.id === ROAD_R1.id) {
      url.searchParams.delete("bike");
    } else {
      url.searchParams.set("bike", activeBike.slug);
    }

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
  }, [
    activeBike.id,
    activeBike.slug,
    experienceMode,
    mode,
    explosionAmount,
  ]);

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
        if (learningOpen) setLearningOpen(false);
        else if (workshopOpen) setWorkshopOpen(false);
        else if (knowledgeOpen) setKnowledgeOpen(false);
        else select(null);
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
    knowledgeOpen,
    learningOpen,
    select,
    selectedId,
    workshopOpen,
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
            : experienceMode === "workshop"
              ? "viewer viewer--workshop"
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
            <>
              <BikeSwitcher
                bikeId={activeBike.id}
                onChange={changeBike}
              />
              {activeBike.capabilities.lessons && (
                <button
                  type="button"
                  className={
                    learningOpen
                      ? "learn-launch is-active"
                      : "learn-launch"
                  }
                  onClick={() => {
                    setLearningOpen((value) => !value);
                    setWorkshopOpen(false);
                    setKnowledgeOpen(false);
                  }}
                >
                  Learn
                  <span aria-hidden="true">→</span>
                </button>
              )}
              {activeBike.capabilities.workshop && (
                <button
                  type="button"
                  className={
                    workshopOpen
                      ? "workshop-launch is-active"
                      : "workshop-launch"
                  }
                  onClick={() => {
                    setWorkshopOpen((value) => !value);
                    setLearningOpen(false);
                    setKnowledgeOpen(false);
                  }}
                >
                  Workshop
                  <span aria-hidden="true">→</span>
                </button>
              )}
              {activeBike.capabilities.encyclopedia !== "none" && (
                <button
                  type="button"
                  className={
                    knowledgeOpen
                      ? "knowledge-launch is-active"
                      : "knowledge-launch"
                  }
                  onClick={() => {
                    setKnowledgeOpen((value) => !value);
                    setLearningOpen(false);
                    setWorkshopOpen(false);
                  }}
                >
                  Encyclopedia
                  <span aria-hidden="true">⌕</span>
                </button>
              )}
            </>
          )}
          <div className="phase-label">
            {experienceMode === "story"
              ? "Cinematic introduction"
              : experienceMode === "lesson"
                ? `Lesson · ${safeLessonStepIndex + 1}/${lesson.steps.length}`
                : experienceMode === "workshop"
                  ? `Workshop · ${safeWorkshopStepIndex + 1}/${procedure.steps.length}`
                  : activeBike.name}
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
          bikeId={activeBike.id}
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
          removedIds={sceneRemovedIds}
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
      ) : experienceMode === "workshop" ? (
        <WorkshopPanel
          procedure={procedure}
          stepIndex={safeWorkshopStepIndex}
          completedStepIds={workshopCompletedStepIds}
          canCompleteCurrent={canCompleteWorkshopStep}
          blockedReason={workshopBlockedReason}
          onStepChange={changeWorkshopStep}
          onCompleteCurrent={completeCurrentWorkshopStep}
          onExit={exitWorkshop}
        />
      ) : learningOpen ? (
        <LearningCatalog
          progress={learningProgress}
          hydrated={progressHydrated}
          onStartLesson={startLesson}
          onClose={() => setLearningOpen(false)}
        />
      ) : workshopOpen ? (
        <WorkshopCatalog
          progress={workshopProgress}
          hydrated={workshopHydrated}
          onStartProcedure={startWorkshopProcedure}
          onClose={() => setWorkshopOpen(false)}
        />
      ) : knowledgeOpen ? (
        <KnowledgeSearch
          bikeId={activeBike.id}
          selectedId={selectedId}
          onSelect={(componentId) => {
            select(componentId);
            setKnowledgeOpen(false);
          }}
          onClose={() => setKnowledgeOpen(false)}
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
            bikeId={activeBike.id}
            selectedId={selectedId}
            isolated={isolated}
            onSelect={select}
            onHover={setHoveredId}
            onToggleIsolate={() =>
              setIsolated((value) => !value)
            }
            onOpenLesson={startLesson}
            onOpenWorkshop={startWorkshopProcedure}
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
                  ? activeBike.name
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
