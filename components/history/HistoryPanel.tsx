"use client";

import { useMemo, useState } from "react";
import {
  HISTORY_CATEGORY_LABELS,
  HISTORY_ERAS,
  HISTORY_EVENTS,
  getHistoryEventsForCategory,
} from "@/domain/history/catalog";
import { getBikeById } from "@/domain/bike/catalog";
import type {
  HistoryCategory,
  HistoryEvent,
} from "@/engine/history/types";

type Props = {
  eventId: string;
  onEventChange: (eventId: string) => void;
  onOpenComponent: (bikeId: string, componentId: string) => void;
  onClose: () => void;
};

const CATEGORY_ORDER: Array<HistoryCategory | "all"> = [
  "all",
  "architecture",
  "steering",
  "propulsion",
  "wheels-tires",
  "drivetrain",
  "utility",
  "off-road",
  "sport",
];

function eventEra(event: HistoryEvent) {
  return (
    HISTORY_ERAS.find(
      (era) =>
        event.startYear >= era.startYear &&
        (era.endYear === undefined || event.startYear <= era.endYear),
    ) ?? HISTORY_ERAS[HISTORY_ERAS.length - 1]
  );
}

export function HistoryPanel({
  eventId,
  onEventChange,
  onOpenComponent,
  onClose,
}: Props) {
  const [category, setCategory] =
    useState<HistoryCategory | "all">("all");

  const filtered = useMemo(
    () => getHistoryEventsForCategory(category),
    [category],
  );

  const active =
    HISTORY_EVENTS.find((event) => event.id === eventId) ??
    HISTORY_EVENTS[0];

  const visibleActive = filtered.some(
    (event) => event.id === active.id,
  )
    ? active
    : filtered[0] ?? HISTORY_EVENTS[0];

  const index = filtered.findIndex(
    (event) => event.id === visibleActive.id,
  );

  const move = (direction: -1 | 1) => {
    if (filtered.length === 0) return;
    const nextIndex = Math.max(
      0,
      Math.min(filtered.length - 1, index + direction),
    );
    onEventChange(filtered[nextIndex].id);
  };

  return (
    <aside className="history-panel" aria-label="Bicycle history">
      <header className="history-header">
        <div>
          <span className="history-kicker">
            History · engineering lineage
          </span>
          <h2>How the bicycle became this machine.</h2>
          <p>
            Follow engineering changes from the 1817 draisine to
            modern road, mountain, utility and gravel bicycles.
          </p>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onClose}
          aria-label="Close bicycle history"
        >
          ×
        </button>
      </header>

      <div className="history-filters" aria-label="History categories">
        {CATEGORY_ORDER.map((item) => (
          <button
            type="button"
            key={item}
            className={category === item ? "is-active" : ""}
            onClick={() => {
              setCategory(item);
              const next = getHistoryEventsForCategory(item)[0];
              if (
                next &&
                !getHistoryEventsForCategory(item).some(
                  (event) => event.id === active.id,
                )
              ) {
                onEventChange(next.id);
              }
            }}
          >
            {item === "all"
              ? "All"
              : HISTORY_CATEGORY_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="history-body">
        <nav className="history-timeline" aria-label="Historical milestones">
          {filtered.map((event) => {
            const era = eventEra(event);
            const isActive = event.id === visibleActive.id;

            return (
              <button
                type="button"
                key={event.id}
                className={
                  isActive
                    ? "history-event is-active"
                    : "history-event"
                }
                onClick={() => onEventChange(event.id)}
              >
                <span className="history-event__rail" aria-hidden="true">
                  <i />
                </span>
                <span className="history-event__copy">
                  <small>{era.label}</small>
                  <strong>{event.yearLabel}</strong>
                  <b>{event.title}</b>
                </span>
              </button>
            );
          })}
        </nav>

        <article className="history-detail">
          <div className="history-detail__date">
            <span>{eventEra(visibleActive).label}</span>
            <strong>{visibleActive.yearLabel}</strong>
          </div>

          <h3>{visibleActive.title}</h3>
          <p className="history-detail__subtitle">
            {visibleActive.subtitle}
          </p>
          <p className="history-detail__summary">
            {visibleActive.summary}
          </p>

          <section className="history-shift">
            <h4>Engineering shift</h4>
            <div>
              {visibleActive.engineeringShift.map((item, itemIndex) => (
                <p key={item}>
                  <span>{String(itemIndex + 1).padStart(2, "0")}</span>
                  {item}
                </p>
              ))}
            </div>
          </section>

          {visibleActive.caveat && (
            <div className="history-caveat">
              <strong>Historical note</strong>
              <p>{visibleActive.caveat}</p>
            </div>
          )}

          <section className="history-lineage">
            <h4>Trace it into Bike Atlas</h4>
            <p>
              Open a modern component that carries this engineering
              lineage forward.
            </p>
            <div>
              {visibleActive.lineageTargets.map((target) => {
                const bike = getBikeById(target.bikeId);
                return (
                  <button
                    type="button"
                    key={`${target.bikeId}:${target.componentId}`}
                    onClick={() =>
                      onOpenComponent(
                        target.bikeId,
                        target.componentId,
                      )
                    }
                  >
                    <span>{bike?.name ?? "Bike Atlas"}</span>
                    <strong>{target.label}</strong>
                    <i aria-hidden="true">→</i>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="history-sources">
            <h4>Sources</h4>
            <div>
              {visibleActive.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{source.organization}</span>
                  <strong>{source.title}</strong>
                  <i aria-hidden="true">↗</i>
                </a>
              ))}
            </div>
          </section>

          <footer className="history-nav">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => move(-1)}
            >
              ← Previous
            </button>
            <span>
              {Math.max(0, index) + 1} / {filtered.length}
            </span>
            <button
              type="button"
              disabled={index >= filtered.length - 1}
              onClick={() => move(1)}
            >
              Next →
            </button>
          </footer>
        </article>
      </div>
    </aside>
  );
}
