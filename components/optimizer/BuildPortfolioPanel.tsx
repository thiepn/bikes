"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PORTFOLIO_SCENARIOS,
} from "@/domain/optimizer/scenario-catalog";
import { evaluatePortfolio } from "@/domain/optimizer/evaluate-portfolio";
import {
  MAX_PORTFOLIO_BUILDS_PER_BIKE,
} from "@/domain/optimizer/portfolio-storage";
import type {
  PortfolioScenarioId,
  SavedBuild,
} from "@/engine/optimizer/portfolio-types";

type Props = {
  bikeId: string;
  entries: readonly SavedBuild[];
  buildSelections: Readonly<Record<string, string>>;
  onSaveCurrent: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onApplySelections: (next: Record<string, string>) => void;
  onOpenBuild: (next: Record<string, string>) => void;
};

const DEFAULT_SCENARIOS: PortfolioScenarioId[] = [
  "fast-flat",
  "long-climb",
  "rough-mixed",
];

function initialScenarios(): PortfolioScenarioId[] {
  if (typeof window === "undefined") return DEFAULT_SCENARIOS;

  const raw = new URL(window.location.href).searchParams.get(
    "portSc",
  );
  if (!raw) return DEFAULT_SCENARIOS;

  const allowed = new Set(
    PORTFOLIO_SCENARIOS.map((scenario) => scenario.id),
  );
  const parsed = raw
    .split(",")
    .filter(
      (id): id is PortfolioScenarioId =>
        allowed.has(id as PortfolioScenarioId),
    );

  return parsed.length ? [...new Set(parsed)] : DEFAULT_SCENARIOS;
}

function scenarioResult(
  results: ReturnType<typeof evaluatePortfolio>[number]["scenarioResults"],
  scenarioId: PortfolioScenarioId,
) {
  return results.find(
    (result) => result.scenarioId === scenarioId,
  );
}

export function BuildPortfolioPanel({
  bikeId,
  entries,
  buildSelections,
  onSaveCurrent,
  onRename,
  onDelete,
  onApplySelections,
  onOpenBuild,
}: Props) {
  const [scenarioIds, setScenarioIds] =
    useState<PortfolioScenarioId[]>(initialScenarios);
  const [selectedId, setSelectedId] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const hostEntries = useMemo(
    () => entries.filter((entry) => entry.bikeId === bikeId),
    [bikeId, entries],
  );

  const evaluations = useMemo(
    () => evaluatePortfolio(hostEntries, scenarioIds),
    [hostEntries, scenarioIds],
  );

  const selected =
    evaluations.find(
      (evaluation) => evaluation.entry.id === selectedId,
    ) ??
    evaluations[0] ??
    null;

  useEffect(() => {
    if (!selected) {
      if (selectedId) setSelectedId("");
      return;
    }
    if (selected.entry.id !== selectedId) {
      setSelectedId(selected.entry.id);
    }
  }, [selected, selectedId]);

  useEffect(() => {
    setRenameValue(selected?.entry.name ?? "");
  }, [selected?.entry.id, selected?.entry.name]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);

    url.searchParams.set("optView", "portfolio");
    const sameAsDefault =
      scenarioIds.length === DEFAULT_SCENARIOS.length &&
      DEFAULT_SCENARIOS.every((id) => scenarioIds.includes(id));

    if (sameAsDefault) {
      url.searchParams.delete("portSc");
    } else {
      url.searchParams.set("portSc", scenarioIds.join(","));
    }

    window.history.replaceState({}, "", url);
  }, [scenarioIds]);

  function toggleScenario(id: PortfolioScenarioId) {
    setScenarioIds((current) => {
      if (current.includes(id)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  return (
    <section className="portfolio-panel">
      <div className="portfolio-head">
        <div>
          <span>Saved build portfolio</span>
          <strong>
            Compare several candidates before replacing the active bike.
          </strong>
        </div>
        <button
          type="button"
          onClick={onSaveCurrent}
          disabled={
            hostEntries.length >= MAX_PORTFOLIO_BUILDS_PER_BIKE
          }
        >
          Save current build
        </button>
      </div>

      <p className="portfolio-storage-note">
        Saved locally in this browser · {hostEntries.length}/
        {MAX_PORTFOLIO_BUILDS_PER_BIKE} slots for this bike.
        Every saved build is re-sanitized and re-evaluated against
        the current Bike Atlas models.
      </p>

      <section className="portfolio-scenarios">
        <div className="optimizer-section-title">
          <span>Decision scenarios</span>
          <strong>{scenarioIds.length} active</strong>
        </div>
        <div className="portfolio-scenario-grid">
          {PORTFOLIO_SCENARIOS.map((scenario) => (
            <button
              type="button"
              key={scenario.id}
              className={
                scenarioIds.includes(scenario.id)
                  ? "is-active"
                  : ""
              }
              aria-pressed={scenarioIds.includes(scenario.id)}
              onClick={() => toggleScenario(scenario.id)}
            >
              <strong>{scenario.name}</strong>
              <span>{scenario.description}</span>
              <small>
                {scenario.scenario.riderPowerW} W ·{" "}
                {scenario.scenario.gradePercent}% ·{" "}
                {scenario.scenario.surfaceId.replaceAll("-", " ")}
              </small>
            </button>
          ))}
        </div>
      </section>

      {evaluations.length === 0 ? (
        <section className="portfolio-empty">
          <strong>No saved builds for this bicycle yet.</strong>
          <p>
            Save the current custom bike, or save a Ranked/Frontier
            recommendation. P27 keeps candidates separate until you
            explicitly restore one.
          </p>
          {Object.keys(buildSelections).length === 0 && (
            <small>
              The stock/reference bike can also be saved as a decision
              baseline.
            </small>
          )}
        </section>
      ) : (
        <>
          <section className="portfolio-ranking">
            <div className="optimizer-section-title">
              <span>Scenario ranking</span>
              <strong>
                80% steady-state performance · 20% cadence fit
              </strong>
            </div>

            <div className="portfolio-table-wrap">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>Build</th>
                    <th>Overall</th>
                    {scenarioIds.map((scenarioId) => {
                      const scenario = PORTFOLIO_SCENARIOS.find(
                        (item) => item.id === scenarioId,
                      );
                      return (
                        <th key={scenarioId}>
                          {scenario?.shortName ?? scenarioId}
                        </th>
                      );
                    })}
                    <th>Mass</th>
                    <th>Low gear</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((evaluation, index) => (
                    <tr
                      key={evaluation.entry.id}
                      className={[
                        evaluation.entry.id === selected?.entry.id
                          ? "is-selected"
                          : "",
                        evaluation.health === "blocked"
                          ? "is-blocked"
                          : evaluation.health === "attention"
                            ? "has-warning"
                            : "",
                      ].join(" ")}
                      onClick={() =>
                        setSelectedId(evaluation.entry.id)
                      }
                    >
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedId(evaluation.entry.id)
                          }
                        >
                          <b>#{index + 1}</b>
                          <span>{evaluation.entry.name}</span>
                        </button>
                      </td>
                      <td>
                        <strong>
                          {evaluation.aggregateScore.toFixed(1)}
                        </strong>
                      </td>
                      {scenarioIds.map((scenarioId) => {
                        const result = scenarioResult(
                          evaluation.scenarioResults,
                          scenarioId,
                        );
                        return (
                          <td key={scenarioId}>
                            <strong>
                              {result
                                ? result.score.toFixed(0)
                                : "—"}
                            </strong>
                            <small>
                              {result
                                ? result.speedKph.toFixed(1) +
                                  " km/h"
                                : ""}
                            </small>
                          </td>
                        );
                      })}
                      <td>
                        {evaluation.bikeMassKg.toFixed(2)} kg
                      </td>
                      <td>
                        {evaluation.lowGearRatio.toFixed(2)}×
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {selected && (
            <section className="portfolio-inspector">
              <div className="portfolio-inspector__head">
                <div>
                  <span>Selected candidate</span>
                  <div className="portfolio-rename">
                    <input
                      value={renameValue}
                      maxLength={48}
                      aria-label="Saved build name"
                      onChange={(event) =>
                        setRenameValue(event.target.value)
                      }
                      onBlur={() => {
                        const next = renameValue.trim();
                        if (
                          next &&
                          next !== selected.entry.name
                        ) {
                          onRename(selected.entry.id, next);
                        }
                      }}
                    />
                    <small>
                      {selected.entry.source} ·{" "}
                      {selected.changedSlots} modified slot
                      {selected.changedSlots === 1 ? "" : "s"} ·{" "}
                      {selected.health}
                    </small>
                  </div>
                </div>
                <strong>
                  {selected.aggregateScore.toFixed(1)}
                  <small>multi-scenario</small>
                </strong>
              </div>

              <div className="portfolio-scenario-detail">
                {selected.scenarioResults.map((result) => {
                  const scenario = PORTFOLIO_SCENARIOS.find(
                    (item) => item.id === result.scenarioId,
                  );
                  return (
                    <article key={result.scenarioId}>
                      <span>{scenario?.name}</span>
                      <strong>
                        {result.speedKph.toFixed(1)} km/h
                      </strong>
                      <p>
                        Score {result.score.toFixed(0)} · closest{" "}
                        {scenario?.scenario.cadenceRpm} rpm gear:{" "}
                        {result.closestGearLabel} (
                        {result.closestGearSpeedKph.toFixed(1)} km/h)
                      </p>
                      <i
                        aria-hidden="true"
                        style={{
                          width:
                            Math.min(100, result.score) + "%",
                        }}
                      />
                    </article>
                  );
                })}
              </div>

              <div className="portfolio-core-metrics">
                <article>
                  <span>Mass</span>
                  <strong>
                    {selected.bikeMassKg.toFixed(2)} kg
                  </strong>
                </article>
                <article>
                  <span>CdA</span>
                  <strong>{selected.cdaM2.toFixed(3)} m²</strong>
                </article>
                <article>
                  <span>Gear span</span>
                  <strong>
                    {selected.lowGearRatio.toFixed(2)}× →{" "}
                    {selected.highGearRatio.toFixed(2)}×
                  </strong>
                </article>
                <article>
                  <span>Saddle → grip drop</span>
                  <strong>
                    {Math.round(
                      selected.saddleToGripDropMm,
                    )}{" "}
                    mm
                  </strong>
                </article>
              </div>

              {selected.health === "blocked" && (
                <p className="portfolio-blocked-note">
                  This saved snapshot is blocked under the current
                  system rules. It remains visible for historical
                  comparison but cannot be treated as a coherent
                  recommendation.
                </p>
              )}

              <div className="optimizer-actions">
                <button
                  type="button"
                  className="optimizer-apply"
                  disabled={selected.health === "blocked"}
                  onClick={() =>
                    onApplySelections(
                      selected.entry.selections,
                    )
                  }
                >
                  Restore as active build
                </button>
                <button
                  type="button"
                  disabled={selected.health === "blocked"}
                  onClick={() =>
                    onOpenBuild(selected.entry.selections)
                  }
                >
                  Restore + inspect in Build Lab
                </button>
                <button
                  type="button"
                  className="portfolio-delete"
                  onClick={() => onDelete(selected.entry.id)}
                >
                  Remove
                </button>
              </div>
            </section>
          )}
        </>
      )}

      <section className="portfolio-boundary">
        <strong>P27 decision boundary</strong>
        <p>
          Scenario scores are educational comparison indexes over the
          current Bike Atlas Physics and gearing models. They do not
          predict a particular rider, trip time, race result, purchase
          value or real component reliability. Portfolio persistence is
          browser-local in P27, not account sync.
        </p>
      </section>
    </section>
  );
}
