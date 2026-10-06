"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCompatibilityPart,
  getCompatibilityProfile,
  getInstalledReferencePart,
} from "@/domain/compatibility/catalog";
import {
  OPTIMIZATION_GOALS,
  getOptimizationGoal,
} from "@/domain/optimizer/catalog";
import { optimizeBuild } from "@/domain/optimizer/optimize";
import type {
  GeometryGuard,
  OptimizationConstraints,
  OptimizationGoalId,
  OptimizedBuild,
} from "@/engine/optimizer/types";

type Props = {
  bikeId: string;
  buildSelections: Readonly<Record<string, string>>;
  onApplySelections: (next: Record<string, string>) => void;
  onOpenBuild: (next: Record<string, string>) => void;
  onClose: () => void;
};

function initialGoal(): OptimizationGoalId {
  if (typeof window === "undefined") return "speed";
  const raw = new URL(window.location.href).searchParams.get("optGoal");
  return OPTIMIZATION_GOALS.some((goal) => goal.id === raw)
    ? (raw as OptimizationGoalId)
    : "speed";
}

function initialMaxChanges() {
  if (typeof window === "undefined") return 4;
  const raw = new URL(window.location.href).searchParams.get("optChanges");
  if (raw === null) return 4;
  const value = Number(raw);
  return Number.isFinite(value)
    ? Math.min(5, Math.max(1, Math.round(value)))
    : 4;
}

function initialGuard(): GeometryGuard {
  if (typeof window === "undefined") return "balanced";
  const raw = new URL(window.location.href).searchParams.get("optGuard");
  return raw === "strict" || raw === "open" ? raw : "balanced";
}

function initialPreserve() {
  if (typeof window === "undefined") return false;
  return (
    new URL(window.location.href).searchParams.get("optPreserve") === "1"
  );
}

function signed(value: number, digits: number, unit: string) {
  const rounded = Number(value.toFixed(digits));
  return `${rounded > 0 ? "+" : ""}${rounded}${unit}`;
}

function metricDelta(
  result: OptimizedBuild,
  baseline: OptimizedBuild["metrics"],
) {
  return [
    {
      label: "Mass",
      value: `${result.metrics.bikeMassKg.toFixed(2)} kg`,
      delta: signed(
        result.metrics.bikeMassKg - baseline.bikeMassKg,
        2,
        " kg",
      ),
    },
    {
      label: "Flat @ 250 W",
      value: `${result.metrics.flatSpeedKph.toFixed(1)} km/h`,
      delta: signed(
        result.metrics.flatSpeedKph - baseline.flatSpeedKph,
        1,
        " km/h",
      ),
    },
    {
      label: "8% @ 250 W",
      value: `${result.metrics.climbSpeedKph.toFixed(1)} km/h`,
      delta: signed(
        result.metrics.climbSpeedKph - baseline.climbSpeedKph,
        1,
        " km/h",
      ),
    },
    {
      label: "Hardpack @ 220 W",
      value: `${result.metrics.hardpackSpeedKph.toFixed(1)} km/h`,
      delta: signed(
        result.metrics.hardpackSpeedKph - baseline.hardpackSpeedKph,
        1,
        " km/h",
      ),
    },
    {
      label: "Lowest gear",
      value: `${result.metrics.lowGearRatio.toFixed(2)}×`,
      delta: signed(
        result.metrics.lowGearRatio - baseline.lowGearRatio,
        2,
        "×",
      ),
    },
    {
      label: "Tire width",
      value: `${Math.round(result.metrics.averageTireWidthMm)} mm`,
      delta: signed(
        result.metrics.averageTireWidthMm -
          baseline.averageTireWidthMm,
        0,
        " mm",
      ),
    },
  ];
}

function changeLabel(
  bikeId: string,
  result: OptimizedBuild,
) {
  const profile = getCompatibilityProfile(bikeId);
  if (!profile) return [];

  return result.changedSlots.flatMap((slotId) => {
    const slot = profile.slots.find((item) => item.id === slotId);
    if (!slot) return [];

    const selectedId = result.selections[slotId];
    const part = selectedId
      ? getCompatibilityPart(selectedId)
      : getInstalledReferencePart(bikeId, slotId);
    if (!part) return [];

    return [
      {
        slotId,
        slotLabel: slot.label,
        partLabel: part.label,
        sourceBikeId: part.sourceBikeId,
      },
    ];
  });
}

export function BuildOptimizerPanel({
  bikeId,
  buildSelections,
  onApplySelections,
  onOpenBuild,
  onClose,
}: Props) {
  const [goalId, setGoalId] =
    useState<OptimizationGoalId>(initialGoal);
  const [maxChanges, setMaxChanges] = useState(initialMaxChanges);
  const [geometryGuard, setGeometryGuard] =
    useState<GeometryGuard>(initialGuard);
  const [preserveCurrentChanges, setPreserveCurrentChanges] =
    useState(initialPreserve);
  const [selectedResultId, setSelectedResultId] = useState("");

  const goal = getOptimizationGoal(goalId);
  const constraints: OptimizationConstraints = useMemo(
    () => ({
      maxChanges,
      geometryGuard,
      preserveCurrentChanges,
    }),
    [geometryGuard, maxChanges, preserveCurrentChanges],
  );

  const optimization = useMemo(
    () =>
      optimizeBuild(
        bikeId,
        goal,
        buildSelections,
        constraints,
      ),
    [bikeId, buildSelections, constraints, goal],
  );

  const selected =
    optimization?.results.find(
      (result) => result.id === selectedResultId,
    ) ??
    optimization?.results[0] ??
    null;

  useEffect(() => {
    setSelectedResultId(optimization?.results[0]?.id ?? "");
  }, [optimization]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("optimize", "1");
    if (goalId === "speed") url.searchParams.delete("optGoal");
    else url.searchParams.set("optGoal", goalId);

    if (maxChanges === 4) url.searchParams.delete("optChanges");
    else url.searchParams.set("optChanges", String(maxChanges));

    if (geometryGuard === "balanced") {
      url.searchParams.delete("optGuard");
    } else {
      url.searchParams.set("optGuard", geometryGuard);
    }

    if (preserveCurrentChanges) {
      url.searchParams.set("optPreserve", "1");
    } else {
      url.searchParams.delete("optPreserve");
    }

    window.history.replaceState({}, "", url);
  }, [
    geometryGuard,
    goalId,
    maxChanges,
    preserveCurrentChanges,
  ]);

  return (
    <aside
      className="optimizer-panel"
      aria-label="Bike Atlas build optimizer"
    >
      <header className="optimizer-header">
        <div>
          <span>Build Optimizer · constraint solver</span>
          <h2>Optimize the whole bicycle.</h2>
          <p>
            Search compatible component combinations, reject mechanically
            blocked builds, enforce geometry limits and rank the remaining
            bicycles by an explicit goal model.
          </p>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onClose}
          aria-label="Close Build Optimizer"
        >
          ×
        </button>
      </header>

      <div className="optimizer-body">
        <section className="optimizer-goals">
          <div className="optimizer-section-title">
            <span>Goal</span>
            <strong>{goal.emphasis}</strong>
          </div>
          <div className="optimizer-goal-grid">
            {OPTIMIZATION_GOALS.map((candidate) => (
              <button
                type="button"
                key={candidate.id}
                className={
                  candidate.id === goalId ? "is-active" : ""
                }
                onClick={() => {
                  setGoalId(candidate.id);
                  setMaxChanges(candidate.defaultMaxChanges);
                  setGeometryGuard(
                    candidate.defaultGeometryGuard,
                  );
                }}
              >
                <strong>{candidate.name}</strong>
                <span>{candidate.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="optimizer-constraints">
          <div className="optimizer-section-title">
            <span>Hard constraints</span>
            <strong>preferences cannot override these</strong>
          </div>

          <div className="optimizer-control-grid">
            <label>
              <span>Maximum component changes</span>
              <strong>{maxChanges}</strong>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={maxChanges}
                onChange={(event) =>
                  setMaxChanges(Number(event.target.value))
                }
              />
            </label>

            <div className="optimizer-guard">
              <span>Geometry guard</span>
              <div>
                {(["strict", "balanced", "open"] as const).map(
                  (guard) => (
                    <button
                      type="button"
                      key={guard}
                      className={
                        geometryGuard === guard ? "is-active" : ""
                      }
                      onClick={() => setGeometryGuard(guard)}
                    >
                      {guard}
                    </button>
                  ),
                )}
              </div>
            </div>

            <label className="optimizer-preserve">
              <input
                type="checkbox"
                checked={preserveCurrentChanges}
                onChange={(event) =>
                  setPreserveCurrentChanges(event.target.checked)
                }
              />
              <span>
                Preserve my current modified slots
                <small>
                  Existing Build Lab changes become locked.
                </small>
              </span>
            </label>
          </div>
        </section>

        {optimization && (
          <section className="optimizer-search-status">
            <article>
              <span>Searched</span>
              <strong>{optimization.searchedStates}</strong>
              <small>unique states</small>
            </article>
            <article>
              <span>Coherent</span>
              <strong>{optimization.coherentStates}</strong>
              <small>non-blocked states</small>
            </article>
            <article>
              <span>Geometry rejected</span>
              <strong>{optimization.rejectedByGeometry}</strong>
              <small>hard-constraint rejects</small>
            </article>
            <article>
              <span>Returned</span>
              <strong>{optimization.results.length}</strong>
              <small>ranked builds</small>
            </article>
          </section>
        )}

        {!optimization || optimization.results.length === 0 ? (
          <section className="optimizer-empty">
            <strong>No coherent result under these constraints.</strong>
            <p>
              Increase the change budget, relax the geometry guard, or
              unlock current changes. The optimizer will not return a
              mechanically blocked build just to fill the list.
            </p>
          </section>
        ) : (
          <section className="optimizer-workspace">
            <div className="optimizer-results">
              <div className="optimizer-section-title">
                <span>Ranked builds</span>
                <strong>score is goal-specific</strong>
              </div>

              <div className="optimizer-result-list">
                {optimization.results.map((result, index) => (
                  <button
                    type="button"
                    key={result.id}
                    className={[
                      result.id === selected?.id
                        ? "is-selected"
                        : "",
                      result.health === "attention"
                        ? "has-warning"
                        : "",
                    ].join(" ")}
                    onClick={() => setSelectedResultId(result.id)}
                  >
                    <b>#{index + 1}</b>
                    <div>
                      <strong>{result.score.toFixed(1)}</strong>
                      <span>goal score</span>
                    </div>
                    <p>
                      {result.changedSlots.length} change
                      {result.changedSlots.length === 1 ? "" : "s"} ·{" "}
                      {result.health === "ready"
                        ? "coherent"
                        : "warning"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {selected && (
              <main className="optimizer-inspector">
                <div className="optimizer-inspector__head">
                  <div>
                    <span>Recommended configuration</span>
                    <h3>{goal.name} build</h3>
                  </div>
                  <b>{selected.score.toFixed(1)}</b>
                </div>

                <section className="optimizer-explanations">
                  <div className="optimizer-section-title">
                    <span>Why it ranked here</span>
                    <strong>top score contributions</strong>
                  </div>
                  <div>
                    {selected.explanations.map((item) => (
                      <article key={item.featureId}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <i
                          aria-hidden="true"
                          style={{
                            width: `${Math.min(
                              100,
                              item.contribution * 420,
                            )}%`,
                          }}
                        />
                      </article>
                    ))}
                  </div>
                </section>

                <section className="optimizer-changes">
                  <div className="optimizer-section-title">
                    <span>Component changes</span>
                    <strong>
                      {selected.changedSlots.length}/
                      {constraints.maxChanges} budget
                    </strong>
                  </div>
                  <div>
                    {changeLabel(bikeId, selected).map((change) => (
                      <article key={change.slotId}>
                        <span>{change.slotLabel}</span>
                        <strong>{change.partLabel}</strong>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="optimizer-metrics">
                  <div className="optimizer-section-title">
                    <span>Against current build</span>
                    <strong>reference-model deltas</strong>
                  </div>
                  <div>
                    {metricDelta(
                      selected,
                      optimization.baselineMetrics,
                    ).map((metric) => (
                      <article key={metric.label}>
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                        <small>{metric.delta}</small>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="optimizer-tradeoffs">
                  <div className="optimizer-section-title">
                    <span>Trade-offs</span>
                    <strong>nothing is hidden</strong>
                  </div>
                  <div>
                    {selected.tradeoffs.map((tradeoff) => (
                      <article
                        key={tradeoff.label}
                        className={"is-" + tradeoff.kind}
                      >
                        <span>{tradeoff.label}</span>
                        <strong>{tradeoff.detail}</strong>
                      </article>
                    ))}
                  </div>
                </section>

                <div className="optimizer-actions">
                  <button
                    type="button"
                    className="optimizer-apply"
                    onClick={() =>
                      onApplySelections(selected.selections)
                    }
                  >
                    Apply optimized build
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenBuild(selected.selections)
                    }
                  >
                    Apply + inspect in Build Lab
                  </button>
                </div>
              </main>
            )}
          </section>
        )}

        <section className="optimizer-boundary">
          <strong>P25 model boundary</strong>
          <p>
            Optimization searches only the fictional Bike Atlas donor
            library. Goal weights are transparent heuristics over the
            existing compatibility, geometry, gearing and Physics reference
            models. This is not purchasing advice, manufacturer
            certification, structural engineering or personal fitting.
          </p>
        </section>
      </div>
    </aside>
  );
}
