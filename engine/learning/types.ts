import type { InspectionMode } from "@/engine/inspection/types";

export interface DrivetrainDemoState {
  running: boolean;
  cadenceRpm: number;
  gearIndex: number;
}

export interface LessonQuizOption {
  id: string;
  label: string;
}

export interface LessonQuiz {
  question: string;
  options: LessonQuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface LessonStep {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  keyFact: string;
  focusComponentId: string;
  highlightComponentIds: string[];
  inspectionMode: InspectionMode;
  demo: DrivetrainDemoState;
  showRatio?: boolean;
  allowGearControl?: boolean;
  quiz?: LessonQuiz;
}

export interface InteractiveLesson {
  id: string;
  title: string;
  summary: string;
  steps: LessonStep[];
}
