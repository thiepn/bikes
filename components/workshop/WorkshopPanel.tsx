"use client";

import { ROAD_R1_COMPONENTS_BY_ID } from "@/domain/bike/road-r1";
import type { WorkshopProcedure } from "@/engine/workshop/types";

type WorkshopPanelProps = {
  procedure: WorkshopProcedure;
  stepIndex: number;
  completedStepIds: string[];
  canCompleteCurrent: boolean;
  blockedReason?: string;
  onStepChange: (index: number) => void;
  onCompleteCurrent: () => void;
  onExit: () => void;
};

export function WorkshopPanel({
  procedure,
  stepIndex,
  completedStepIds,
  canCompleteCurrent,
  blockedReason,
  onStepChange,
  onCompleteCurrent,
  onExit,
}: WorkshopPanelProps) {
  const step = procedure.steps[stepIndex];
  const completed = new Set(completedStepIds);
  const isCurrentComplete = completed.has(step.id);
  const requiredTools = procedure.tools.filter((tool) =>
    step.tools.includes(tool.id),
  );

  return (
    <aside className="workshop-panel" aria-label={procedure.title}>
      <div className="workshop-panel__top">
        <div>
          <span className="workshop-kicker">
            Guided procedure · {procedure.durationMinutes} min
          </span>
          <strong>{procedure.title}</strong>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onExit}
          aria-label="Exit procedure"
        >
          ×
        </button>
      </div>

      <div
        className="workshop-progress"
        style={{
          gridTemplateColumns: `repeat(${procedure.steps.length}, 1fr)`,
        }}
        aria-label={`Step ${stepIndex + 1} of ${procedure.steps.length}`}
      >
        {procedure.steps.map((item, index) => {
          const available =
            index === 0 ||
            procedure.steps
              .slice(0, index)
              .every((previous) => completed.has(previous.id));

          return (
            <button
              type="button"
              key={item.id}
              disabled={!available}
              className={
                index === stepIndex
                  ? "workshop-progress__step is-active"
                  : completed.has(item.id)
                    ? "workshop-progress__step is-complete"
                    : "workshop-progress__step"
              }
              onClick={() => onStepChange(index)}
              aria-label={`Go to step ${index + 1}: ${item.title}`}
            />
          );
        })}
      </div>

      <div className="workshop-content" aria-live="polite">
        <div className="workshop-step-meta">
          <span>
            Step {stepIndex + 1} / {procedure.steps.length}
          </span>
          <span>
            {ROAD_R1_COMPONENTS_BY_ID.get(step.focusComponentId)?.name ??
              step.focusComponentId}
          </span>
        </div>

        <h2>{step.title}</h2>
        <p>{step.instruction}</p>

        <div className="workshop-why">
          <span>Why this matters</span>
          <p>{step.why}</p>
        </div>

        {requiredTools.length > 0 && (
          <div className="workshop-tools">
            <span>Tools for this step</span>
            <div>
              {requiredTools.map((tool) => (
                <article key={tool.id}>
                  <strong>{tool.name}</strong>
                  {tool.note && <small>{tool.note}</small>}
                </article>
              ))}
            </div>
          </div>
        )}

        {step.warning && (
          <div className="workshop-warning">
            <strong>Warning</strong>
            <p>{step.warning}</p>
          </div>
        )}

        {step.check && (
          <div className="workshop-check">
            <span>Before continuing</span>
            <p>{step.check}</p>
          </div>
        )}

        {blockedReason && !isCurrentComplete && (
          <div className="workshop-blocked">
            <strong>Dependency not satisfied</strong>
            <p>{blockedReason}</p>
          </div>
        )}

        {step.operationId && (
          <div className="workshop-operation">
            <span>Mechanical operation</span>
            <code>{step.operationId}</code>
          </div>
        )}
      </div>

      <div className="workshop-footer">
        <button
          type="button"
          className="lesson-nav lesson-nav--secondary"
          disabled={stepIndex === 0}
          onClick={() => onStepChange(stepIndex - 1)}
        >
          ← Previous
        </button>

        {isCurrentComplete ? (
          <button
            type="button"
            className="lesson-nav lesson-nav--primary"
            onClick={() =>
              stepIndex === procedure.steps.length - 1
                ? onExit()
                : onStepChange(stepIndex + 1)
            }
          >
            {stepIndex === procedure.steps.length - 1
              ? "Back to workshop"
              : "Next →"}
          </button>
        ) : (
          <button
            type="button"
            className="lesson-nav lesson-nav--primary"
            disabled={!canCompleteCurrent}
            onClick={onCompleteCurrent}
          >
            {stepIndex === procedure.steps.length - 1
              ? "Complete procedure"
              : "Complete step"}
          </button>
        )}
      </div>
    </aside>
  );
}
