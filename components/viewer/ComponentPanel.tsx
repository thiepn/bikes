"use client";

import { ROAD_R1, ROAD_R1_COMPONENTS_BY_ID } from "@/domain/bike/road-r1";
import {
  getKnowledgeNode,
  getKnowledgeRelatedComponentIds,
} from "@/domain/knowledge/road-r1";
import { LESSON_CATALOG } from "@/domain/learning/catalog";
import { WORKSHOP_CATALOG } from "@/domain/workshop/catalog";
import { CALIBRATION_COMPONENT_IDS } from "@/engine/interaction/calibration-components";

type ComponentPanelProps = {
  selectedId: string | null;
  isolated: boolean;
  onSelect: (componentId: string | null) => void;
  onHover: (componentId: string | null) => void;
  onToggleIsolate: () => void;
  onOpenLesson: (lessonId: string, stepIndex: number) => void;
  onOpenWorkshop: (procedureId: string, stepIndex: number) => void;
};

const SYSTEM_LABELS: Record<string, string> = {
  frame: "Frame",
  "fork-suspension": "Fork",
  steering: "Steering",
  cockpit: "Cockpit",
  "front-wheel": "Front wheel",
  "rear-wheel": "Rear wheel",
  tires: "Tires",
  drivetrain: "Drivetrain",
  transmission: "Transmission",
  braking: "Braking",
  "saddle-seatpost": "Saddle",
  pedals: "Pedals",
};

function lessonStepForComponent(lessonId: string, componentId: string) {
  const lesson = LESSON_CATALOG.find((item) => item.id === lessonId);
  if (!lesson) return 0;

  const index = lesson.steps.findIndex(
    (step) =>
      step.focusComponentId === componentId ||
      step.highlightComponentIds.includes(componentId) ||
      (step.challenge?.type === "select-component" &&
        step.challenge.candidateComponentIds.includes(componentId)),
  );

  return Math.max(0, index);
}

function procedureStepForComponent(
  procedureId: string,
  componentId: string,
) {
  const procedure = WORKSHOP_CATALOG.find(
    (item) => item.id === procedureId,
  );
  if (!procedure) return 0;

  const index = procedure.steps.findIndex(
    (step) =>
      step.focusComponentId === componentId ||
      step.highlightComponentIds.includes(componentId) ||
      step.removedComponentIds.includes(componentId),
  );

  return Math.max(0, index);
}

export function ComponentPanel({
  selectedId,
  isolated,
  onSelect,
  onHover,
  onToggleIsolate,
  onOpenLesson,
  onOpenWorkshop,
}: ComponentPanelProps) {
  const selected =
    ROAD_R1.components.find((component) => component.id === selectedId) ?? null;
  const knowledge = getKnowledgeNode(selectedId);
  const available = ROAD_R1.components.filter((component) =>
    CALIBRATION_COMPONENT_IDS.has(component.id),
  );

  const grouped = available.reduce<Record<string, typeof available>>(
    (groups, component) => {
      (groups[component.systemId] ??= []).push(component);
      return groups;
    },
    {},
  );

  const relatedIds = selected
    ? getKnowledgeRelatedComponentIds(selected.id)
    : [];

  return (
    <aside className="component-panel" aria-label="Road R1 component navigator">
      <div className="component-panel__header">
        <div>
          <span className="component-panel__kicker">
            {selected ? "Encyclopedia" : "Road R1"}
          </span>
          <strong>{selected?.name ?? "Explore components"}</strong>
        </div>
        {selected && (
          <button
            className="icon-button"
            type="button"
            onClick={() => onSelect(null)}
            aria-label="Reset selection"
          >
            ×
          </button>
        )}
      </div>

      {selected && knowledge ? (
        <div className="selected-card selected-card--knowledge" aria-live="polite">
          <div className="selected-card__meta">
            <span>{SYSTEM_LABELS[selected.systemId] ?? selected.systemId}</span>
            <span>
              {knowledge.availableIn3d ? "3D ready" : "3D detail pending"}
            </span>
          </div>

          <p className="knowledge-summary">{knowledge.summary}</p>

          <section className="knowledge-section">
            <h3>What it does</h3>
            <p>{knowledge.function}</p>
          </section>

          <section className="knowledge-section">
            <h3>Materials</h3>
            <div className="knowledge-chips">
              {knowledge.materials.map((material) => (
                <span key={material}>{material}</span>
              ))}
            </div>
          </section>

          <section className="knowledge-section">
            <h3>Compatibility & standards</h3>
            {knowledge.standards.map((standard) => (
              <p key={standard}>{standard}</p>
            ))}
          </section>

          <section className="knowledge-section">
            <h3>Common symptoms</h3>
            <div className="knowledge-chips knowledge-chips--symptoms">
              {knowledge.commonSymptoms.map((symptom) => (
                <span key={symptom}>{symptom}</span>
              ))}
            </div>
          </section>

          {relatedIds.length > 0 && (
            <section className="knowledge-section">
              <h3>Connected & related parts</h3>
              <div className="knowledge-links">
                {relatedIds.slice(0, 8).map((componentId) => {
                  const component = ROAD_R1_COMPONENTS_BY_ID.get(componentId);
                  if (!component) return null;

                  return (
                    <button
                      type="button"
                      key={componentId}
                      onClick={() => onSelect(componentId)}
                      onMouseEnter={() => onHover(componentId)}
                      onMouseLeave={() => onHover(null)}
                    >
                      {component.name}
                      <span aria-hidden="true">→</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {knowledge.lessonIds.length > 0 && (
            <section className="knowledge-section">
              <h3>Learn</h3>
              <div className="knowledge-links">
                {knowledge.lessonIds.map((lessonId) => {
                  const lesson = LESSON_CATALOG.find(
                    (item) => item.id === lessonId,
                  );
                  if (!lesson) return null;
                  const stepIndex = lessonStepForComponent(
                    lessonId,
                    selected.id,
                  );

                  return (
                    <button
                      type="button"
                      key={lessonId}
                      onClick={() => onOpenLesson(lessonId, stepIndex)}
                    >
                      {lesson.title}
                      <span aria-hidden="true">→</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {knowledge.procedureIds.length > 0 && (
            <section className="knowledge-section">
              <h3>Workshop</h3>
              <div className="knowledge-links">
                {knowledge.procedureIds.map((procedureId) => {
                  const procedure = WORKSHOP_CATALOG.find(
                    (item) => item.id === procedureId,
                  );
                  if (!procedure) return null;
                  const stepIndex = procedureStepForComponent(
                    procedureId,
                    selected.id,
                  );

                  return (
                    <button
                      type="button"
                      key={procedureId}
                      onClick={() =>
                        onOpenWorkshop(procedureId, stepIndex)
                      }
                    >
                      {procedure.title}
                      <span aria-hidden="true">→</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <div className="selected-card__actions">
            {knowledge.availableIn3d && (
              <button
                type="button"
                className={
                  isolated ? "control-button is-active" : "control-button"
                }
                onClick={onToggleIsolate}
              >
                {isolated ? "Show bike" : "Isolate part"}
              </button>
            )}
            <button
              type="button"
              className="control-button"
              onClick={() => onSelect(null)}
            >
              Full bike
            </button>
          </div>
        </div>
      ) : (
        <p className="component-panel__intro">
          Select directly on the bike or browse the encyclopedia. Every
          semantic component can link into lessons, Workshop procedures and
          mechanically related parts.
        </p>
      )}

      {!selected && (
        <div className="component-list">
          {Object.entries(grouped).map(([systemId, components]) => (
            <section className="component-group" key={systemId}>
              <h2>{SYSTEM_LABELS[systemId] ?? systemId}</h2>
              <div className="component-group__items">
                {components.map((component) => (
                  <button
                    type="button"
                    key={component.id}
                    className="component-item"
                    onClick={() => onSelect(component.id)}
                    onMouseEnter={() => onHover(component.id)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(component.id)}
                    onBlur={() => onHover(null)}
                  >
                    <span>{component.name}</span>
                    <small aria-hidden="true">›</small>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}
