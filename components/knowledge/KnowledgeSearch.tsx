"use client";

import { useMemo, useState } from "react";
import { ROAD_R1 } from "@/domain/bike/road-r1";
import { searchRoadR1Knowledge } from "@/domain/knowledge/road-r1";

type KnowledgeSearchProps = {
  selectedId: string | null;
  onSelect: (componentId: string) => void;
  onClose: () => void;
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

export function KnowledgeSearch({
  selectedId,
  onSelect,
  onClose,
}: KnowledgeSearchProps) {
  const [query, setQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState<string>("all");

  const results = useMemo(
    () =>
      searchRoadR1Knowledge(query).filter(
        (result) =>
          systemFilter === "all" ||
          result.systemId === systemFilter,
      ),
    [query, systemFilter],
  );

  return (
    <aside className="knowledge-search" aria-label="Bike component encyclopedia">
      <div className="knowledge-search__header">
        <div>
          <span className="knowledge-kicker">Encyclopedia</span>
          <h2>Know every part.</h2>
          <p>
            Search components, systems, materials, standards and common
            symptoms across the Road R1 knowledge graph.
          </p>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onClose}
          aria-label="Close encyclopedia"
        >
          ×
        </button>
      </div>

      <div className="knowledge-search__controls">
        <label className="knowledge-input">
          <span className="sr-only">Search bicycle components</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search hub, creaking, carbon, brake…"
            autoFocus
          />
          <span>{results.length}</span>
        </label>

        <div className="knowledge-filters" aria-label="Filter by system">
          <button
            type="button"
            className={systemFilter === "all" ? "is-active" : ""}
            onClick={() => setSystemFilter("all")}
          >
            All
          </button>
          {ROAD_R1.systems.map((systemId) => (
            <button
              type="button"
              key={systemId}
              className={systemFilter === systemId ? "is-active" : ""}
              onClick={() => setSystemFilter(systemId)}
            >
              {SYSTEM_LABELS[systemId] ?? systemId.replaceAll("-", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="knowledge-results">
        {results.length === 0 ? (
          <div className="knowledge-empty">
            <strong>No matching component.</strong>
            <p>
              Try a component name, system, material or symptom such as
              “bearing”, “brake”, “creaking” or “carbon”.
            </p>
          </div>
        ) : (
          results.map((result) => (
            <button
              type="button"
              key={result.componentId}
              className={
                selectedId === result.componentId
                  ? "knowledge-result is-selected"
                  : "knowledge-result"
              }
              onClick={() => onSelect(result.componentId)}
            >
              <div className="knowledge-result__meta">
                <span>
                  {SYSTEM_LABELS[result.systemId] ??
                    result.systemId.replaceAll("-", " ")}
                </span>
                <span>
                  {result.availableIn3d ? "3D ready" : "3D detail pending"}
                </span>
              </div>
              <strong>{result.name}</strong>
              <p>{result.summary}</p>
              <span className="knowledge-result__arrow" aria-hidden="true">
                →
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
