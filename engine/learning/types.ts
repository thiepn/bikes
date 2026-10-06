import type { InspectionMode } from "@/engine/inspection/types";
import type { BikeSystemId } from "@/domain/bike/types";

export interface DrivetrainDemoState {
  running: boolean;
  cadenceRpm: number;
  gearIndex: number;
}

export interface LessonChoiceOption {
  id: string;
  label: string;
}

export interface MultipleChoiceChallenge {
  type: "multiple-choice";
  prompt: string;
  options: LessonChoiceOption[];
  correctOptionId: string;
  explanation: string;
}

export interface SelectComponentChallenge {
  type: "select-component";
  prompt: string;
  candidateComponentIds: string[];
  correctComponentIds: string[];
  successText: string;
  retryText: string;
}

export type LessonChallenge =
  | MultipleChoiceChallenge
  | SelectComponentChallenge;

export interface LessonStep {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  keyFact: string;
  focusComponentId: string;
  highlightComponentIds: string[];
  inspectionMode: InspectionMode;
  demo?: DrivetrainDemoState;
  showRatio?: boolean;
  allowGearControl?: boolean;
  challenge?: LessonChallenge;
}

export interface InteractiveLesson {
  id: string;
  title: string;
  summary: string;
  systemId: BikeSystemId;
  difficulty: "beginner" | "intermediate";
  durationMinutes: number;
  prerequisiteLessonIds: string[];
  steps: LessonStep[];
}

export interface LessonChallengeResult {
  correct: boolean;
  attempts: number;
  answerId: string;
}

export interface LessonProgressRecord {
  lessonId: string;
  status: "in-progress" | "completed";
  lastStepIndex: number;
  bestScore: number;
  attempts: number;
  completedAt?: string;
}

export interface LearningProgressStore {
  version: 1;
  lessons: Record<string, LessonProgressRecord>;
}
