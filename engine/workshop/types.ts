import type { BikeSystemId } from "@/domain/bike/types";
import type { InspectionMode } from "@/engine/inspection/types";

export interface WorkshopTool {
  id: string;
  name: string;
  required: boolean;
  note?: string;
}

export interface WorkshopStep {
  id: string;
  title: string;
  instruction: string;
  why: string;
  focusComponentId: string;
  highlightComponentIds: string[];
  inspectionMode: InspectionMode;
  explosionAmount: number;
  operationId?: string;
  tools: string[];
  warning?: string;
  check?: string;
  removedComponentIds: string[];
}

export interface WorkshopProcedure {
  id: string;
  title: string;
  summary: string;
  systemId: BikeSystemId;
  difficulty: "beginner" | "intermediate";
  durationMinutes: number;
  prerequisiteProcedureIds: string[];
  assumedOperationIds: string[];
  tools: WorkshopTool[];
  steps: WorkshopStep[];
}

export interface WorkshopProgressRecord {
  procedureId: string;
  status: "in-progress" | "completed";
  lastStepIndex: number;
  completedStepIds: string[];
  completedAt?: string;
}

export interface WorkshopProgressStore {
  version: 1;
  procedures: Record<string, WorkshopProgressRecord>;
}
