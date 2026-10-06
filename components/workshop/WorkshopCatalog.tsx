"use client";

import {
  getProcedurePrerequisites,
  getWorkshopProceduresForBike,
} from "@/domain/workshop/catalog";
import { getBikeById } from "@/domain/bike/catalog";
import { isProcedureCompleted } from "@/engine/workshop/progress";
import type { WorkshopProgressStore } from "@/engine/workshop/types";

type WorkshopCatalogProps = {
  bikeId: string;
  progress: WorkshopProgressStore;
  hydrated: boolean;
  onStartProcedure: (procedureId: string, stepIndex: number) => void;
  onClose: () => void;
};

export function WorkshopCatalog({
  bikeId,
  progress,
  hydrated,
  onStartProcedure,
  onClose,
}: WorkshopCatalogProps) {
  const bike = getBikeById(bikeId);
  const procedures = getWorkshopProceduresForBike(bikeId);
  const completed = procedures.filter((procedure) =>
    isProcedureCompleted(progress, procedure.id),
  ).length;

  return (
    <aside className="workshop-catalog" aria-label="Bike Atlas workshop">
      <div className="workshop-catalog__header">
        <div>
          <span className="workshop-kicker">Workshop · {bike?.name ?? "Bike Atlas"}</span>
          <h2>Work on the machine.</h2>
          <p>
            Guided procedures combine tools, warnings, checks and the same
            interactive 3D bicycle. Component-specific limits remain tied to
            manufacturer guidance.
          </p>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onClose}
          aria-label="Close workshop"
        >
          ×
        </button>
      </div>

      <div className="workshop-overview">
        <span>
          <strong>{completed}</strong> / {procedures.length} completed
        </span>
        <span>{bike?.name ?? bikeId}</span>
      </div>

      <div className="workshop-list">
        {procedures.map((procedure, index) => {
          const record = progress.procedures[procedure.id];
          const prerequisites = getProcedurePrerequisites(procedure);
          const locked =
            hydrated &&
            prerequisites.some(
              (item) => !isProcedureCompleted(progress, item.id),
            );
          const completedProcedure = record?.status === "completed";
          const inProgress = record?.status === "in-progress";
          const resumeStep = Math.min(
            procedure.steps.length - 1,
            Math.max(0, record?.lastStepIndex ?? 0),
          );

          return (
            <article
              key={procedure.id}
              className={
                locked
                  ? "workshop-card is-locked"
                  : completedProcedure
                    ? "workshop-card is-complete"
                    : "workshop-card"
              }
            >
              <div className="workshop-card__index">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="workshop-card__body">
                <div className="workshop-card__meta">
                  <span>{procedure.systemId.replaceAll("-", " ")}</span>
                  <span>{procedure.durationMinutes} min</span>
                  <span>{procedure.difficulty}</span>
                </div>
                <h3>{procedure.title}</h3>
                <p>{procedure.summary}</p>

                <div className="workshop-card__tools">
                  {procedure.tools
                    .filter((tool) => tool.required)
                    .map((tool) => (
                      <span key={tool.id}>{tool.name}</span>
                    ))}
                </div>

                {locked && (
                  <small className="workshop-card__lock">
                    Complete{" "}
                    {prerequisites.map((item) => item.title).join(", ")} first.
                  </small>
                )}

                {completedProcedure && (
                  <small className="workshop-card__complete">
                    Procedure completed
                  </small>
                )}
              </div>

              <button
                type="button"
                className="workshop-card__action"
                disabled={locked}
                onClick={() =>
                  onStartProcedure(
                    procedure.id,
                    inProgress ? resumeStep : 0,
                  )
                }
              >
                {locked
                  ? "Locked"
                  : completedProcedure
                    ? "Review"
                    : inProgress
                      ? "Resume"
                      : "Start"}
                {!locked && <span aria-hidden="true">→</span>}
              </button>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
