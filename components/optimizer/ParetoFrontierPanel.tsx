"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCompatibilityPart,
  getCompatibilityProfile,
  getInstalledReferencePart,
} from "@/domain/compatibility/catalog";
import {
  OPTIMIZATION_GOALS,
  getOptimizationGoal,
} from "@/domain/optimizer/catalog";
import { exploreParetoFrontier } from "@/domain/optimizer/pareto";
import type {
  OptimizationConstraints,
  OptimizationGoalId,
  ParetoPoint,
} from "@/engine/optimizer/types";

type Props = {
  bikeId: string;
  buildSelections: Readonly<Record<string, string>>;
  constraints: OptimizationConstraints;
  onApplySelections: (next: Record<string, string>) => void;
  onOpenBuild: (next: Record<string, string>) => void;
};

function initialAxis(
  key: "optX" | "optY",
  fallback: OptimizationGoalId,
) {
  if (typeof window === "undefined") return fallback;
  const raw = new URL(window.location.href).searchParams.get(key);
  return OPTIMIZATION_GOALS.some((goal) => goal.id === raw)
    ? (raw as OptimizationGoalId)
    : fallback;
}

function initialPointIndex() {
  if (typeof window === "undefined") return 0;
  const raw = new URL(window.location.href).searchParams.get("optPoint");
  if (raw === null) return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function formatMetric(
  key: string,
  point: ParetoPoint,
) {
  switch (key) {
    case "mass":
      return point.metrics.bikeMassKg.toFixed(2) + " kg";
    case "flat":
      return point.metrics.flatSpeedKph.toFixed(1) + " km/h";
    case "climb":
      return point.metrics.climbSpeedKph.toFixed(1) + " km/h";
    case "hardpack":
      return point.metrics.hardpackSpeedKph.toFixed(1) + " km/h";
    case "low":
      return point.metrics.lowGearRatio.toFixed(2) + "×";
    case "tire":
      return Math.round(point.metrics.averageTireWidthMm) + " mm";
    case "drop":
      return Math.round(point.metrics.saddleToGripDropMm) + " mm";
    default:
      return "—";
  }
}

function metricNumber(
  key: string,
  point: ParetoPoint,
) {
  switch (key) {
    case "mass":
      return point.metrics.bikeMassKg;
    case "flat":
      return point.metrics.flatSpeedKph;
    case "climb":
      return point.metrics.climbSpeedKph;
    case "hardpack":
      return point.metrics.hardpackSpeedKph;
    case "low":
      return point.metrics.lowGearRatio;
    case "tire":
      return point.metrics.averageTireWidthMm;
    case "drop":
      return point.metrics.saddleToGripDropMm;
    default:
      return 0;
  }
}

function deltaLabel(
  key: string,
  selected: ParetoPoint,
  pinned: ParetoPoint,
) {
  const delta =
    metricNumber(key, selected) -
    metricNumber(key, pinned);

  const digits =
    key === "mass" || key === "low"
      ? 2
      : key === "flat" ||
          key === "climb" ||
          key === "hardpack"
        ? 1
        : 0;

  const unit =
    key === "mass"
      ? " kg"
      : key === "low"
        ? "×"
        : key === "tire" || key === "drop"
          ? " mm"
          : " km/h";

  const rounded = Number(delta.toFixed(digits));
  return (rounded > 0 ? "+" : "") + rounded + unit;
}

function changedParts(
  bikeId: string,
  point: ParetoPoint,
) {
  const profile = getCompatibilityProfile(bikeId);
  if (!profile) return [];

  return point.changedSlots.flatMap((slotId) => {
    const slot = profile.slots.find((item) => item.id === slotId);
    if (!slot) return [];

    const selectedId = point.selections[slotId];
    const part = selectedId
      ? getCompatibilityPart(selectedId)
      : getInstalledReferencePart(bikeId, slotId);

    return part
      ? [
          {
            slotId,
            slotLabel: slot.label,
            partLabel: part.label,
          },
        ]
      : [];
  });
}

function pointCoordinates(point: ParetoPoint) {
  const left = 48;
  const top = 20;
  const width = 492;
  const height = 260;

  return {
    x: left + (point.xScore / 100) * width,
    y: top + (1 - point.yScore / 100) * height,
  };
}

export function ParetoFrontierPanel({
  bikeId,
  buildSelections,
  constraints,
  onApplySelections,
  onOpenBuild,
}: Props) {
  const [xGoalId, setXGoalId] = useState<OptimizationGoalId>(() =>
    initialAxis("optX", "speed"),
  );
  const [yGoalId, setYGoalId] = useState<OptimizationGoalId>(() =>
    initialAxis("optY", "comfort"),
  );
  const [selectedIndex, setSelectedIndex] = useState(initialPointIndex);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const hasMountedAxes = useRef(false);

  useEffect(() => {
    if (xGoalId !== yGoalId) return;
    setYGoalId(
      OPTIMIZATION_GOALS.find((goal) => goal.id !== xGoalId)?.id ??
        "comfort",
    );
  }, [xGoalId, yGoalId]);

  const xGoal = getOptimizationGoal(xGoalId);
  const yGoal = getOptimizationGoal(yGoalId);

  const frontier = useMemo(
    () =>
      exploreParetoFrontier(
        bikeId,
        xGoal,
        yGoal,
        buildSelections,
        constraints,
      ),
    [bikeId, buildSelections, constraints, xGoal, yGoal],
  );

  const points = frontier?.frontier ?? [];
  const safeIndex = Math.min(
    Math.max(0, selectedIndex),
    Math.max(0, points.length - 1),
  );
  const selected = points[safeIndex] ?? null;
  const pinned =
    points.find((point) => point.id === pinnedId) ?? null;

  useEffect(() => {
    if (selectedIndex !== safeIndex) setSelectedIndex(safeIndex);
  }, [safeIndex, selectedIndex]);

  useEffect(() => {
    if (!hasMountedAxes.current) {
      hasMountedAxes.current = true;
      return;
    }
    setSelectedIndex(0);
    setPinnedId(null);
  }, [bikeId, xGoalId, yGoalId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);

    url.searchParams.set("optView", "frontier");
    if (xGoalId === "speed") url.searchParams.delete("optX");
    else url.searchParams.set("optX", xGoalId);

    if (yGoalId === "comfort") url.searchParams.delete("optY");
    else url.searchParams.set("optY", yGoalId);

    if (safeIndex > 0) {
      url.searchParams.set("optPoint", String(safeIndex));
    } else {
      url.searchParams.delete("optPoint");
    }

    window.history.replaceState({}, "", url);
  }, [safeIndex, xGoalId, yGoalId]);

  function setAxis(
    axis: "x" | "y",
    next: OptimizationGoalId,
  ) {
    if (axis === "x") {
      setXGoalId(next);
      if (next === yGoalId) {
        setYGoalId(
          OPTIMIZATION_GOALS.find((goal) => goal.id !== next)?.id ??
            "comfort",
        );
      }
    } else {
      setYGoalId(next);
      if (next === xGoalId) {
        setXGoalId(
          OPTIMIZATION_GOALS.find((goal) => goal.id !== next)?.id ??
            "speed",
        );
      }
    }
  }

  const polyline = points
    .map((point) => {
      const position = pointCoordinates(point);
      return position.x + "," + position.y;
    })
    .join(" ");

  const metricKeys = [
    ["flat", "Flat @ 250 W"],
    ["climb", "8% @ 250 W"],
    ["hardpack", "Hardpack @ 220 W"],
    ["mass", "Mass"],
    ["low", "Lowest gear"],
    ["tire", "Tire width"],
  ] as const;

  return (
    <section className="frontier-panel">
      <div className="frontier-axis-controls">
        <label>
          <span>X objective</span>
          <select
            value={xGoalId}
            onChange={(event) =>
              setAxis(
                "x",
                event.target.value as OptimizationGoalId,
              )
            }
          >
            {OPTIMIZATION_GOALS.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="frontier-swap"
          onClick={() => {
            const previousX = xGoalId;
            setXGoalId(yGoalId);
            setYGoalId(previousX);
          }}
          aria-label="Swap frontier axes"
        >
          ⇄
        </button>

        <label>
          <span>Y objective</span>
          <select
            value={yGoalId}
            onChange={(event) =>
              setAxis(
                "y",
                event.target.value as OptimizationGoalId,
              )
            }
          >
            {OPTIMIZATION_GOALS.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!frontier || points.length === 0 ? (
        <div className="frontier-empty">
          <strong>No non-dominated alternative was found.</strong>
          <p>
            The current build dominates the sampled alternatives under
            these axes and hard constraints, or this host has too little
            compatible donor variation. Relax the geometry/change
            constraints or choose another objective pair.
          </p>
        </div>
      ) : (
        <>
          <div className="frontier-summary">
            <article>
              <span>Search sweeps</span>
              <strong>{frontier.sampledSearches}</strong>
            </article>
            <article>
              <span>Unique candidates</span>
              <strong>{frontier.sampledCandidates}</strong>
            </article>
            <article>
              <span>Pareto points</span>
              <strong>{points.length}</strong>
            </article>
            <article>
              <span>Selected</span>
              <strong>
                {safeIndex + 1}/{points.length}
              </strong>
            </article>
          </div>

          <div className="frontier-chart-wrap">
            <svg
              className="frontier-chart"
              viewBox="0 0 580 320"
              role="img"
              aria-label={
                xGoal.name +
                " versus " +
                yGoal.name +
                " explored Pareto frontier"
              }
            >
              {[0, 25, 50, 75, 100].map((tick) => {
                const x = 48 + (tick / 100) * 492;
                const y = 20 + (1 - tick / 100) * 260;
                return (
                  <g key={tick}>
                    <line
                      x1={x}
                      y1={20}
                      x2={x}
                      y2={280}
                      className="frontier-grid"
                    />
                    <line
                      x1={48}
                      y1={y}
                      x2={540}
                      y2={y}
                      className="frontier-grid"
                    />
                    <text x={x} y={298} textAnchor="middle">
                      {tick}
                    </text>
                    <text
                      x={38}
                      y={y + 3}
                      textAnchor="end"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              <text
                className="frontier-axis-label"
                x={294}
                y={316}
                textAnchor="middle"
              >
                {xGoal.name} score →
              </text>
              <text
                className="frontier-axis-label"
                x={10}
                y={150}
                textAnchor="middle"
                transform="rotate(-90 10 150)"
              >
                {yGoal.name} score →
              </text>

              {polyline && (
                <polyline
                  points={polyline}
                  className="frontier-line"
                />
              )}

              {frontier.current && (() => {
                const current = pointCoordinates(frontier.current);
                return (
                  <g className="frontier-current">
                    <rect
                      x={current.x - 5}
                      y={current.y - 5}
                      width={10}
                      height={10}
                      transform={
                        "rotate(45 " +
                        current.x +
                        " " +
                        current.y +
                        ")"
                      }
                    />
                    <text x={current.x + 9} y={current.y - 8}>
                      current
                    </text>
                  </g>
                );
              })()}

              {points.map((point, index) => {
                const position = pointCoordinates(point);
                const isSelected = index === safeIndex;
                const isPinned = point.id === pinnedId;

                return (
                  <circle
                    key={point.id}
                    cx={position.x}
                    cy={position.y}
                    r={isSelected ? 8 : isPinned ? 7 : 5}
                    className={[
                      "frontier-point",
                      isSelected ? "is-selected" : "",
                      isPinned ? "is-pinned" : "",
                    ].join(" ")}
                    role="button"
                    tabIndex={0}
                    aria-label={
                      "Select frontier point " + (index + 1)
                    }
                    onClick={() => setSelectedIndex(index)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        setSelectedIndex(index);
                      }
                    }}
                  />
                );
              })}
            </svg>

            <div className="frontier-legend">
              <span>
                <i className="frontier-legend-current" /> Current
              </span>
              <span>
                <i className="frontier-legend-point" /> Non-dominated
              </span>
              <span>
                <i className="frontier-legend-pin" /> Comparison pin
              </span>
            </div>
          </div>

          {selected && (
            <div className="frontier-selector">
              <button
                type="button"
                onClick={() =>
                  setSelectedIndex(Math.max(0, safeIndex - 1))
                }
                disabled={safeIndex === 0}
              >
                ←
              </button>
              <input
                type="range"
                min={0}
                max={Math.max(0, points.length - 1)}
                step={1}
                value={safeIndex}
                onChange={(event) =>
                  setSelectedIndex(Number(event.target.value))
                }
                aria-label="Move along Pareto frontier"
              />
              <button
                type="button"
                onClick={() =>
                  setSelectedIndex(
                    Math.min(points.length - 1, safeIndex + 1),
                  )
                }
                disabled={safeIndex === points.length - 1}
              >
                →
              </button>
            </div>
          )}

          {selected && (
            <div className="frontier-inspector">
              <header>
                <div>
                  <span>Frontier point {safeIndex + 1}</span>
                  <h3>
                    {xGoal.name} {selected.xScore.toFixed(1)}
                    <i> / </i>
                    {yGoal.name} {selected.yScore.toFixed(1)}
                  </h3>
                </div>
                <div className="frontier-point-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setPinnedId(
                        pinnedId === selected.id
                          ? null
                          : selected.id,
                      )
                    }
                  >
                    {pinnedId === selected.id
                      ? "Unpin comparison"
                      : "Pin for comparison"}
                  </button>
                </div>
              </header>

              <div className="frontier-objective-bars">
                <article>
                  <span>{xGoal.name}</span>
                  <strong>{selected.xScore.toFixed(1)}</strong>
                  <i
                    style={{ width: selected.xScore + "%" }}
                    aria-hidden="true"
                  />
                </article>
                <article>
                  <span>{yGoal.name}</span>
                  <strong>{selected.yScore.toFixed(1)}</strong>
                  <i
                    style={{ width: selected.yScore + "%" }}
                    aria-hidden="true"
                  />
                </article>
              </div>

              <section className="frontier-changes">
                <div className="optimizer-section-title">
                  <span>Configuration</span>
                  <strong>
                    {selected.changedSlots.length} changed slot
                    {selected.changedSlots.length === 1 ? "" : "s"}
                  </strong>
                </div>
                <div>
                  {changedParts(bikeId, selected).map((change) => (
                    <article key={change.slotId}>
                      <span>{change.slotLabel}</span>
                      <strong>{change.partLabel}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section className="frontier-metrics">
                <div className="optimizer-section-title">
                  <span>
                    {pinned
                      ? "Selected vs pinned"
                      : "Reference metrics"}
                  </span>
                  <strong>
                    {pinned
                      ? "positive delta = selected is numerically higher"
                      : "pin another frontier point to compare"}
                  </strong>
                </div>
                <div>
                  {metricKeys.map(([key, label]) => (
                    <article key={key}>
                      <span>{label}</span>
                      <strong>{formatMetric(key, selected)}</strong>
                      <small>
                        {pinned
                          ? deltaLabel(key, selected, pinned)
                          : "—"}
                      </small>
                    </article>
                  ))}
                </div>
              </section>

              {pinned && pinned.id !== selected.id && (
                <section className="frontier-compare">
                  <div>
                    <span>Pinned build</span>
                    <strong>
                      {xGoal.name} {pinned.xScore.toFixed(1)} ·{" "}
                      {yGoal.name} {pinned.yScore.toFixed(1)}
                    </strong>
                  </div>
                  <p>
                    Selected minus pinned:{" "}
                    {selected.xScore - pinned.xScore >= 0 ? "+" : ""}
                    {(selected.xScore - pinned.xScore).toFixed(1)}{" "}
                    {xGoal.name};{" "}
                    {selected.yScore - pinned.yScore >= 0 ? "+" : ""}
                    {(selected.yScore - pinned.yScore).toFixed(1)}{" "}
                    {yGoal.name}.
                  </p>
                </section>
              )}

              <div className="optimizer-actions">
                <button
                  type="button"
                  className="optimizer-apply"
                  onClick={() =>
                    onApplySelections(selected.selections)
                  }
                >
                  Apply frontier build
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
            </div>
          )}
        </>
      )}

      <div className="frontier-boundary">
        <strong>Explored frontier, not an exhaustive global optimum</strong>
        <p>
          P26 unions five weighted P25 searches, removes dominated
          configurations, and includes the current build as a reference.
          A point is Pareto-optimal only within this bounded fictional Bike
          Atlas search space and the active hard constraints.
        </p>
      </div>
    </section>
  );
}
