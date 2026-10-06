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
import { analyzeBuild } from "@/domain/compatibility/analyze-build";
import {
  encodeBuildSelections,
  sanitizeBuildSelections,
} from "@/domain/compatibility/build-state";
import {
  loadSavedBuilds,
  MAX_PORTFOLIO_BUILDS_PER_BIKE,
  persistSavedBuilds,
} from "@/domain/optimizer/portfolio-storage";
import { ParetoFrontierPanel } from "@/components/optimizer/ParetoFrontierPanel";
import { BuildPortfolioPanel } from "@/components/optimizer/BuildPortfolioPanel";
import type {
  GeometryGuard,
  OptimizationConstraints,
  OptimizationGoalId,
  OptimizedBuild,
} from "@/engine/optimizer/types";
import type {
  PortfolioSource,
  SavedBuild,
} from "@/engine/optimizer/portfolio-types";

type Props = {
  bikeId: string;
  buildSelections: Readonly<Record<string, string>>;
  onApplySelections: (next: Record<string, string>) => void;
  onOpenBuild: (next: Record<string, string>) => void;
  onClose: () => void;
};

type OptimizerView = "ranked" | "frontier" | "portfolio";

function initialView(): OptimizerView {
  if (typeof window === "undefined") return "ranked";
  const value =
    new URL(window.location.href).searchParams.get("optView");
  return value === "frontier" || value === "portfolio"
    ? value
    : "ranked";
}

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
  if (raw === null) {
    return getOptimizationGoal(initialGoal()).defaultMaxChanges;
  }
  const value = Number(raw);
  return Number.isFinite(value)
    ? Math.min(5, Math.max(1, Math.round(value)))
    : 4;
}

function initialGuard(): GeometryGuard {
  if (typeof window === "undefined") return "balanced";
  const raw = new URL(window.location.href).searchParams.get("optGuard");
  if (raw === "strict" || raw === "balanced" || raw === "open") {
    return raw;
  }
  return getOptimizationGoal(initialGoal()).defaultGeometryGuard;
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
  const [view, setView] = useState<OptimizerView>(initialView);
  const [goalId, setGoalId] =
    useState<OptimizationGoalId>(initialGoal);
  const [maxChanges, setMaxChanges] = useState(initialMaxChanges);
  const [geometryGuard, setGeometryGuard] =
    useState<GeometryGuard>(initialGuard);
  const [preserveCurrentChanges, setPreserveCurrentChanges] =
    useState(initialPreserve);
  const [selectedResultId, setSelectedResultId] = useState("");
  const [portfolioEntries, setPortfolioEntries] = useState<SavedBuild[]>([]);
  const [portfolioLoaded, setPortfolioLoaded] = useState(false);
  const [portfolioNotice, setPortfolioNotice] = useState("");

  useEffect(() => {
    setPortfolioEntries(loadSavedBuilds());
    setPortfolioLoaded(true);
  }, []);

  useEffect(() => {
    if (!portfolioLoaded) return;
    persistSavedBuilds(portfolioEntries);
  }, [portfolioEntries, portfolioLoaded]);

  function savePortfolioBuild(
    selections: Readonly<Record<string, string>>,
    source: PortfolioSource,
    suggestedName: string,
  ) {
    const safe = sanitizeBuildSelections(bikeId, selections);
    const analysis = analyzeBuild(bikeId, safe);

    if (analysis.health === "blocked") {
      setPortfolioNotice(
        "Blocked builds cannot be newly saved to the decision portfolio.",
      );
      return;
    }

    const key = encodeBuildSelections(safe);
    const sameBike = portfolioEntries.filter(
      (entry) => entry.bikeId === bikeId,
    );
    const duplicate = sameBike.find(
      (entry) =>
        encodeBuildSelections(entry.selections) === key,
    );

    if (duplicate) {
      setPortfolioNotice(
        `Already saved as “${duplicate.name}”.`,
      );
      setView("portfolio");
      return;
    }

    if (
      sameBike.length >= MAX_PORTFOLIO_BUILDS_PER_BIKE
    ) {
      setPortfolioNotice(
        `Portfolio limit reached: ${MAX_PORTFOLIO_BUILDS_PER_BIKE} saved builds for this bike.`,
      );
      setView("portfolio");
      return;
    }

    const entry: SavedBuild = {
      id:
        bikeId +
        ":" +
        Date.now().toString(36) +
        ":" +
        Math.random().toString(36).slice(2, 7),
      bikeId,
      name: suggestedName.slice(0, 48),
      selections: safe,
      source,
      savedAt: Date.now(),
    };

    setPortfolioEntries((current) => [...current, entry]);
    setPortfolioNotice(`Saved “${entry.name}”.`);
  }

  function renamePortfolioBuild(id: string, name: string) {
    const safeName = name.trim().slice(0, 48);
    if (!safeName) return;
    setPortfolioEntries((current) =>
      current.map((entry) =>
        entry.id === id
          ? { ...entry, name: safeName }
          : entry,
      ),
    );
  }

  function deletePortfolioBuild(id: string) {
    setPortfolioEntries((current) =>
      current.filter((entry) => entry.id !== id),
    );
    setPortfolioNotice("Saved build removed.");
  }

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
      view === "ranked"
        ? optimizeBuild(
            bikeId,
            goal,
            buildSelections,
            constraints,
          )
        : null,
    [bikeId, buildSelections, constraints, goal, view],
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
    if (view === "frontier") {
      url.searchParams.set("optView", "frontier");
    } else if (view === "portfolio") {
      url.searchParams.set("optView", "portfolio");
    } else {
      url.searchParams.delete("optView");
    }

    if (view !== "frontier") {
      url.searchParams.delete("optX");
      url.searchParams.delete("optY");
      url.searchParams.delete("optPoint");
    }

    if (view !== "portfolio") {
      url.searchParams.delete("portSc");
    }

    if (view === "ranked") {
      if (goalId === "speed") url.searchParams.delete("optGoal");
      else url.searchParams.set("optGoal", goalId);
    } else {
      url.searchParams.delete("optGoal");
    }

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
    view,
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
            blocked builds, enforce geometry limits, rank single-goal
            configurations, explore non-dominated trade-offs, or keep a
            saved decision portfolio across riding scenarios.
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
        <div className="optimizer-view-tabs" role="tablist" aria-label="Optimizer view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "ranked"}
            className={view === "ranked" ? "is-active" : ""}
            onClick={() => setView("ranked")}
          >
            Ranked
            <span>single goal</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "frontier"}
            className={view === "frontier" ? "is-active" : ""}
            onClick={() => setView("frontier")}
          >
            Frontier
            <span>Pareto trade-offs</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "portfolio"}
            className={view === "portfolio" ? "is-active" : ""}
            onClick={() => setView("portfolio")}
          >
            Portfolio
            <span>saved decisions</span>
          </button>
        </div>

        {portfolioNotice && (
          <div className="portfolio-notice" role="status">
            {portfolioNotice}
            <button
              type="button"
              onClick={() => setPortfolioNotice("")}
              aria-label="Dismiss portfolio message"
            >
              ×
            </button>
          </div>
        )}

        {view === "ranked" && (
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

        )}

        {view !== "portfolio" && (
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
        )}

        {view === "portfolio" ? (
          <BuildPortfolioPanel
            bikeId={bikeId}
            entries={portfolioEntries}
            buildSelections={buildSelections}
            onSaveCurrent={() =>
              savePortfolioBuild(
                buildSelections,
                "current",
                "Current build " +
                  (portfolioEntries.filter(
                    (entry) => entry.bikeId === bikeId,
                  ).length +
                    1),
              )
            }
            onRename={renamePortfolioBuild}
            onDelete={deletePortfolioBuild}
            onApplySelections={onApplySelections}
            onOpenBuild={onOpenBuild}
          />
        ) : view === "frontier" ? (
          <ParetoFrontierPanel
            bikeId={bikeId}
            buildSelections={buildSelections}
            constraints={constraints}
            onApplySelections={onApplySelections}
            onOpenBuild={onOpenBuild}
            onSaveSelection={(next) =>
              savePortfolioBuild(
                next,
                "frontier",
                "Frontier candidate " +
                  (portfolioEntries.filter(
                    (entry) => entry.bikeId === bikeId,
                  ).length +
                    1),
              )
            }
          />
        ) : (
          <>
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
              <span>Current score</span>
              <strong>{optimization.baselineScore.toFixed(1)}</strong>
              <small>{goal.name.toLowerCase()} baseline</small>
            </article>
          </section>
        )}

        {!optimization || optimization.results.length === 0 ? (
          <section className="optimizer-empty">
            <strong>No improved coherent result under these constraints.</strong>
            <p>
              The current bicycle already scores as well or better than the
              searched alternatives, or the hard constraints exclude the
              necessary changes. Increase the change budget, relax the
              geometry guard, or unlock current changes. P25 will not
              recommend a worse or mechanically blocked build just to fill
              the list.
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
                      +{(result.score - optimization.baselineScore).toFixed(1)}
                      {" "}vs current · {result.changedSlots.length} change
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
                  <div className="optimizer-score">
                    <b>{selected.score.toFixed(1)}</b>
                    <small>
                      +{(
                        selected.score - optimization.baselineScore
                      ).toFixed(1)}{" "}
                      vs current
                    </small>
                  </div>
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
                  <button
                    type="button"
                    onClick={() =>
                      savePortfolioBuild(
                        selected.selections,
                        "ranked",
                        goal.name +
                          " candidate " +
                          (portfolioEntries.filter(
                            (entry) => entry.bikeId === bikeId,
                          ).length +
                            1),
                      )
                    }
                  >
                    Save to portfolio
                  </button>
                </div>
              </main>
            )}
          </section>
        )}

          </>
        )}

        <section className="optimizer-boundary">
          <strong>P25–P27 model boundary</strong>
          <p>
            Optimization searches only the fictional Bike Atlas donor
            library. Goal weights, Pareto axes and P27 scenario scores are
            transparent educational references over the existing
            compatibility, geometry, gearing and Physics models. Saved
            portfolio entries are browser-local in P27. This is not
            purchasing advice, manufacturer certification, structural
            engineering or personal fitting.
          </p>
        </section>
      </div>
    </aside>
  );
}
