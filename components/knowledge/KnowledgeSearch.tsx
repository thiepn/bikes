"use client";

import { useMemo, useState } from "react";
import { getBikeById } from "@/domain/bike/catalog";
import { searchBikeKnowledge } from "@/domain/knowledge/catalog";

type KnowledgeSearchProps = {
  bikeId: string;
  selectedId: string | null;
  onSelect: (componentId: string) => void;
  onClose: () => void;
};

const SYSTEM_LABELS: Record<string, string> = {
  frame: "Frame",
  "fork-suspension": "Fork",
  "rear-suspension": "Rear suspension",
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
  lighting: "Lighting",
  "cargo-utility": "Cargo & utility",
  accessories: "Accessories",
};

export function KnowledgeSearch({
  bikeId,
  selectedId,
  onSelect,
  onClose,
}: KnowledgeSearchProps) {
  const [query, setQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const bike = getBikeById(bikeId);

  const results = useMemo(
    () =>
      searchBikeKnowledge(bikeId, query).filter(
        (result) =>
          systemFilter === "all" ||
          result.systemId === systemFilter,
      ),
    [bikeId, query, systemFilter],
  );

  if (!bike) return null;

  return (
    <aside className="knowledge-search" aria-label="Bike component encyclopedia">
      <div className="knowledge-search__header">
        <div>
          <span className="knowledge-kicker">Encyclopedia</span>
          <h2>Know every part.</h2>
          <p>
            Search components and systems across {bike.name}.
            {bike.capabilities.encyclopedia === "foundation"
              ? " Detailed MTB encyclopedia content is still being authored."
              : " Materials, standards and symptoms are included where authored."}
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
            placeholder={
              bike.id === "bike.road.r1"
                ? "Search hub, creaking, carbon, brake…"
                : "Search shock, dropper, cassette, fork…"
            }
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
          {bike.systems.map((systemId) => (
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
            <p>Try a component name, system, material or tag.</p>
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
