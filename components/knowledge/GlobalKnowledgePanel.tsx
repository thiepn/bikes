"use client";

import { useMemo, useState } from "react";
import {
  BIKE_CATALOG,
  getBikeById,
  getBikeComponentById,
} from "@/domain/bike/catalog";
import {
  ENGINEERING_CONCEPTS,
  getEngineeringConcept,
} from "@/domain/knowledge/concepts";
import { searchGlobalKnowledge } from "@/domain/knowledge/global";
import { getLessonById } from "@/domain/learning/catalog";
import { getWorkshopProcedure } from "@/domain/workshop/catalog";
import { getHistoryEvent } from "@/domain/history/catalog";
import type {
  EngineeringConcept,
  GlobalKnowledgeEntityType,
  GlobalKnowledgeSearchResult,
} from "@/engine/global-knowledge/types";

type Props = {
  conceptId: string | null;
  onConceptChange: (conceptId: string | null) => void;
  onOpenBike: (bikeId: string) => void;
  onOpenComponent: (bikeId: string, componentId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenWorkshop: (procedureId: string) => void;
  onOpenHistory: (eventId: string) => void;
  onClose: () => void;
};

const TYPE_LABELS: Record<GlobalKnowledgeEntityType, string> = {
  concept: "Concept",
  bike: "Bike",
  component: "Component",
  lesson: "Learn",
  workshop: "Workshop",
  history: "History",
};

const FILTERS: Array<GlobalKnowledgeEntityType | "all"> = [
  "all",
  "concept",
  "component",
  "bike",
  "lesson",
  "workshop",
  "history",
];

function ConceptDetail({
  concept,
  onBack,
  onOpenComponent,
  onOpenLesson,
  onOpenWorkshop,
  onOpenHistory,
}: {
  concept: EngineeringConcept;
  onBack: () => void;
  onOpenComponent: (bikeId: string, componentId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenWorkshop: (procedureId: string) => void;
  onOpenHistory: (eventId: string) => void;
}) {
  return (
    <div className="global-knowledge__detail">
      <button
        type="button"
        className="global-knowledge__back"
        onClick={onBack}
      >
        ← All concepts
      </button>

      <span className="global-knowledge__eyebrow">
        Engineering concept
      </span>
      <h3>{concept.title}</h3>
      <p className="global-knowledge__summary">{concept.summary}</p>

      <section className="global-concept__principles">
        <h4>Core principles</h4>
        <div>
          {concept.principles.map((principle, index) => (
            <p key={principle}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {principle}
            </p>
          ))}
        </div>
      </section>

      <section className="global-concept__bikes">
        <h4>Across Bike Atlas</h4>
        <div>
          {concept.componentTargets.map((target) => {
            const bike = getBikeById(target.bikeId);
            const component = getBikeComponentById(target.componentId);
            if (!bike || !component) return null;

            return (
              <button
                type="button"
                key={`${target.bikeId}:${target.componentId}`}
                onClick={() =>
                  onOpenComponent(target.bikeId, target.componentId)
                }
              >
                <span>{bike.name}</span>
                <strong>{component.name}</strong>
                <p>{target.note}</p>
                <i aria-hidden="true">→</i>
              </button>
            );
          })}
        </div>
      </section>

      {concept.lessonIds.length > 0 && (
        <section className="global-concept__resources">
          <h4>Learn</h4>
          <div>
            {concept.lessonIds.map((lessonId) => {
              const lesson = getLessonById(lessonId);
              const bike = lesson ? getBikeById(lesson.bikeId) : null;
              if (!lesson) return null;

              return (
                <button
                  type="button"
                  key={lesson.id}
                  onClick={() => onOpenLesson(lesson.id)}
                >
                  <span>{bike?.name ?? "Bike Atlas"}</span>
                  <strong>{lesson.title}</strong>
                  <p>{lesson.summary}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {concept.procedureIds.length > 0 && (
        <section className="global-concept__resources">
          <h4>Workshop</h4>
          <div>
            {concept.procedureIds.map((procedureId) => {
              const procedure = getWorkshopProcedure(procedureId);
              const bike = procedure
                ? getBikeById(procedure.bikeId)
                : null;
              if (!procedure) return null;

              return (
                <button
                  type="button"
                  key={procedure.id}
                  onClick={() => onOpenWorkshop(procedure.id)}
                >
                  <span>{bike?.name ?? "Bike Atlas"}</span>
                  <strong>{procedure.title}</strong>
                  <p>{procedure.summary}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {concept.historyEventIds.length > 0 && (
        <section className="global-concept__resources">
          <h4>History lineage</h4>
          <div>
            {concept.historyEventIds.map((eventId) => {
              const event = getHistoryEvent(eventId);
              if (!event) return null;

              return (
                <button
                  type="button"
                  key={event.id}
                  onClick={() => onOpenHistory(event.id)}
                >
                  <span>{event.yearLabel}</span>
                  <strong>{event.title}</strong>
                  <p>{event.subtitle}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function SearchResult({
  result,
  onOpen,
}: {
  result: GlobalKnowledgeSearchResult;
  onOpen: (result: GlobalKnowledgeSearchResult) => void;
}) {
  return (
    <button
      type="button"
      className="global-search-result"
      onClick={() => onOpen(result)}
    >
      <div className="global-search-result__meta">
        <span>{TYPE_LABELS[result.type]}</span>
        <span>{result.subtitle}</span>
      </div>
      <strong>{result.title}</strong>
      <p>{result.summary}</p>
      <i aria-hidden="true">→</i>
    </button>
  );
}

export function GlobalKnowledgePanel({
  conceptId,
  onConceptChange,
  onOpenBike,
  onOpenComponent,
  onOpenLesson,
  onOpenWorkshop,
  onOpenHistory,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<GlobalKnowledgeEntityType | "all">("all");

  const concept = getEngineeringConcept(conceptId);

  const results = useMemo(() => {
    const all = searchGlobalKnowledge(query);
    if (filter === "all") return all;
    return all.filter((result) => result.type === filter);
  }, [filter, query]);

  const openResult = (result: GlobalKnowledgeSearchResult) => {
    if (result.type === "concept") {
      onConceptChange(result.id);
      return;
    }
    if (result.type === "bike" && result.bikeId) {
      onOpenBike(result.bikeId);
      return;
    }
    if (
      result.type === "component" &&
      result.bikeId &&
      result.componentId
    ) {
      onOpenComponent(result.bikeId, result.componentId);
      return;
    }
    if (result.type === "lesson") {
      onOpenLesson(result.id);
      return;
    }
    if (result.type === "workshop") {
      onOpenWorkshop(result.id);
      return;
    }
    if (result.type === "history") {
      onOpenHistory(result.id);
    }
  };

  return (
    <aside
      className="global-knowledge"
      aria-label="Bike Atlas global knowledge search"
    >
      <header className="global-knowledge__header">
        <div>
          <span className="global-knowledge__kicker">
            Knowledge graph · global search
          </span>
          <h2>Search the whole machine.</h2>
          <p>
            Components, bikes, engineering concepts, lessons, Workshop
            procedures and history now share one searchable graph.
          </p>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onClose}
          aria-label="Close global search"
        >
          ×
        </button>
      </header>

      {concept ? (
        <ConceptDetail
          concept={concept}
          onBack={() => onConceptChange(null)}
          onOpenComponent={onOpenComponent}
          onOpenLesson={onOpenLesson}
          onOpenWorkshop={onOpenWorkshop}
          onOpenHistory={onOpenHistory}
        />
      ) : (
        <>
          <div className="global-knowledge__controls">
            <label className="global-knowledge__input">
              <span className="sr-only">
                Search all Bike Atlas knowledge
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search brakes, pressure, chain, Repack, cargo…"
                autoFocus
              />
              <span>{query ? results.length : ENGINEERING_CONCEPTS.length}</span>
            </label>

            {query && (
              <div
                className="global-knowledge__filters"
                aria-label="Filter search results"
              >
                {FILTERS.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={filter === item ? "is-active" : ""}
                    onClick={() => setFilter(item)}
                  >
                    {item === "all"
                      ? "All"
                      : TYPE_LABELS[item]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="global-knowledge__body">
            {!query ? (
              <>
                <section className="global-concepts">
                  <div className="global-section-heading">
                    <span>Concept map</span>
                    <strong>{ENGINEERING_CONCEPTS.length} concepts</strong>
                  </div>
                  <div className="global-concepts__grid">
                    {ENGINEERING_CONCEPTS.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => onConceptChange(item.id)}
                      >
                        <span>{item.shortTitle}</span>
                        <strong>{item.title}</strong>
                        <p>{item.summary}</p>
                        <small>
                          {item.componentTargets.length} component links ·{" "}
                          {item.lessonIds.length} lessons ·{" "}
                          {item.historyEventIds.length} history links
                        </small>
                        <i aria-hidden="true">→</i>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="global-bike-map">
                  <div className="global-section-heading">
                    <span>Current library</span>
                    <strong>{BIKE_CATALOG.length} bike families</strong>
                  </div>
                  <div>
                    {BIKE_CATALOG.map((bike) => (
                      <button
                        type="button"
                        key={bike.id}
                        onClick={() => onOpenBike(bike.id)}
                      >
                        <span>{bike.archetype.replaceAll("-", " ")}</span>
                        <strong>{bike.name}</strong>
                        <small>{bike.components.length} semantic parts</small>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : results.length === 0 ? (
              <div className="global-knowledge__empty">
                <strong>No cross-Bike Atlas match.</strong>
                <p>
                  Try a component, symptom, concept, lesson, procedure,
                  bike family or historical term.
                </p>
              </div>
            ) : (
              <div className="global-search-results">
                {results.slice(0, 80).map((result) => (
                  <SearchResult
                    key={`${result.type}:${result.id}`}
                    result={result}
                    onOpen={openResult}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
