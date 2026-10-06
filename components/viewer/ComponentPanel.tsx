"use client";

import { ROAD_R1 } from "@/domain/bike/road-r1";
import { CALIBRATION_COMPONENT_IDS } from "@/engine/interaction/calibration-components";

type ComponentPanelProps = {
  selectedId: string | null;
  isolated: boolean;
  onSelect: (componentId: string | null) => void;
  onToggleIsolate: () => void;
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

export function ComponentPanel({
  selectedId,
  isolated,
  onSelect,
  onToggleIsolate,
}: ComponentPanelProps) {
  const selected = ROAD_R1.components.find((component) => component.id === selectedId) ?? null;
  const available = ROAD_R1.components.filter((component) =>
    CALIBRATION_COMPONENT_IDS.has(component.id),
  );

  const grouped = available.reduce<Record<string, typeof available>>((groups, component) => {
    (groups[component.systemId] ??= []).push(component);
    return groups;
  }, {});

  return (
    <aside className="component-panel" aria-label="Road R1 component navigator">
      <div className="component-panel__header">
        <div>
          <span className="component-panel__kicker">Road R1</span>
          <strong>{selected?.name ?? "Explore components"}</strong>
        </div>
        {selected && (
          <button className="icon-button" type="button" onClick={() => onSelect(null)} aria-label="Reset selection">
            ×
          </button>
        )}
      </div>

      {selected ? (
        <div className="selected-card" aria-live="polite">
          <div className="selected-card__meta">
            <span>{SYSTEM_LABELS[selected.systemId] ?? selected.systemId}</span>
            <span>{selected.modelNode}</span>
          </div>
          <p>
            Semantic component <code>{selected.id}</code>. P3 binds interaction
            to this stable ID rather than to source-mesh naming.
          </p>
          <div className="selected-card__actions">
            <button type="button" className={isolated ? "control-button is-active" : "control-button"} onClick={onToggleIsolate}>
              {isolated ? "Show bike" : "Isolate part"}
            </button>
            <button type="button" className="control-button" onClick={() => onSelect(null)}>
              Full bike
            </button>
          </div>
        </div>
      ) : (
        <p className="component-panel__intro">
          Select directly on the bike or use the semantic navigator. Double-click
          a visible component to isolate it.
        </p>
      )}

      <div className="component-list">
        {Object.entries(grouped).map(([systemId, components]) => (
          <section className="component-group" key={systemId}>
            <h2>{SYSTEM_LABELS[systemId] ?? systemId}</h2>
            <div className="component-group__items">
              {components.map((component) => (
                <button
                  type="button"
                  key={component.id}
                  className={selectedId === component.id ? "component-item is-selected" : "component-item"}
                  onClick={() => onSelect(component.id)}
                >
                  <span>{component.name}</span>
                  <small>›</small>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
