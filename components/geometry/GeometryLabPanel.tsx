"use client";

import { useEffect, useMemo, useState } from "react";
import { getBikeById } from "@/domain/bike/catalog";
import { analyzeBuild } from "@/domain/compatibility/analyze-build";
import { solveBuildGeometry } from "@/domain/geometry/solve";
import { solveBuildGearing } from "@/domain/geometry/gearing";
import type { GeometrySolution } from "@/engine/geometry/types";
import type { GearCombination } from "@/engine/geometry/gearing-types";

type Props = {
  bikeId: string;
  buildSelections: Readonly<Record<string, string>>;
  onClose: () => void;
};

type Tab = "geometry" | "gearing";

function readInitialTab(): Tab {
  if (typeof window === "undefined") return "geometry";
  return new URL(window.location.href).searchParams.get("geometryTab") ===
    "gearing"
    ? "gearing"
    : "geometry";
}

function readInitialCadence() {
  if (typeof window === "undefined") return 90;
  const value = Number(
    new URL(window.location.href).searchParams.get("gearCad"),
  );
  return Number.isFinite(value)
    ? Math.min(130, Math.max(40, value))
    : 90;
}

function fixed(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function signed(value: number, digits = 1, unit = "") {
  const rounded = Number(value.toFixed(digits));
  return `${rounded > 0 ? "+" : ""}${rounded}${unit}`;
}

function direction(
  value: number,
  positive: string,
  negative: string,
  neutral = "unchanged",
) {
  if (Math.abs(value) < 0.05) return neutral;
  return value > 0 ? positive : negative;
}

function GeometryDiagram({
  current,
  reference,
}: {
  current: GeometrySolution;
  reference: GeometrySolution;
}) {
  const toPoints = (solution: GeometrySolution) => {
    const bbX = Math.sqrt(
      Math.max(
        0,
        solution.reference.chainstayMm ** 2 -
          solution.bbDropMm ** 2,
      ),
    );
    return {
      rearAxle: { x: 0, y: solution.rearWheelRadiusMm },
      frontAxle: {
        x: solution.wheelbaseMm,
        y: solution.frontWheelRadiusMm,
      },
      bb: { x: bbX, y: solution.bbHeightMm },
      head: {
        x: bbX + solution.reachMm,
        y: solution.bbHeightMm + solution.stackMm,
      },
      saddle: {
        x: bbX + solution.saddle.xMm,
        y: solution.bbHeightMm + solution.saddle.yMm,
      },
      bar: {
        x: bbX + solution.bar.xMm,
        y: solution.bbHeightMm + solution.bar.yMm,
      },
    };
  };

  const a = toPoints(reference);
  const b = toPoints(current);
  const all = [...Object.values(a), ...Object.values(b)];
  const minX = Math.min(...all.map((p) => p.x)) - 90;
  const maxX = Math.max(...all.map((p) => p.x)) + 90;
  const minY = 0;
  const maxY = Math.max(...all.map((p) => p.y)) + 80;

  const width = 920;
  const height = 500;
  const pad = 34;
  const scale = Math.min(
    (width - pad * 2) / Math.max(1, maxX - minX),
    (height - pad * 2) / Math.max(1, maxY - minY),
  );
  const sx = (x: number) => pad + (x - minX) * scale;
  const sy = (y: number) => height - pad - (y - minY) * scale;

  const framePath = (p: ReturnType<typeof toPoints>) =>
    [
      [p.rearAxle, p.bb],
      [p.bb, p.head],
      [p.head, p.saddle],
      [p.saddle, p.bb],
      [p.rearAxle, p.saddle],
    ];

  const renderGeometry = (
    p: ReturnType<typeof toPoints>,
    cls: string,
    wheelRFront: number,
    wheelRRear: number,
  ) => (
    <g className={cls}>
      <circle
        cx={sx(p.rearAxle.x)}
        cy={sy(p.rearAxle.y)}
        r={wheelRRear * scale}
      />
      <circle
        cx={sx(p.frontAxle.x)}
        cy={sy(p.frontAxle.y)}
        r={wheelRFront * scale}
      />
      {framePath(p).map(([from, to], index) => (
        <line
          key={index}
          x1={sx(from.x)}
          y1={sy(from.y)}
          x2={sx(to.x)}
          y2={sy(to.y)}
        />
      ))}
      <line
        x1={sx(p.head.x)}
        y1={sy(p.head.y)}
        x2={sx(p.frontAxle.x)}
        y2={sy(p.frontAxle.y)}
      />
      <line
        x1={sx(p.head.x)}
        y1={sy(p.head.y)}
        x2={sx(p.bar.x)}
        y2={sy(p.bar.y)}
      />
      <line
        x1={sx(p.saddle.x)}
        y1={sy(p.saddle.y)}
        x2={sx(p.bar.x)}
        y2={sy(p.bar.y)}
        className="geometry-fit-line"
      />
      <circle cx={sx(p.bb.x)} cy={sy(p.bb.y)} r={5} />
      <circle cx={sx(p.saddle.x)} cy={sy(p.saddle.y)} r={5} />
      <circle cx={sx(p.bar.x)} cy={sy(p.bar.y)} r={5} />
    </g>
  );

  return (
    <svg
      className="geometry-diagram"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Reference and custom bicycle geometry side profile"
    >
      <line
        className="geometry-ground"
        x1={pad}
        y1={sy(0)}
        x2={width - pad}
        y2={sy(0)}
      />
      {renderGeometry(
        a,
        "geometry-reference-shape",
        reference.frontWheelRadiusMm,
        reference.rearWheelRadiusMm,
      )}
      {renderGeometry(
        b,
        "geometry-current-shape",
        current.frontWheelRadiusMm,
        current.rearWheelRadiusMm,
      )}
    </svg>
  );
}

function Metric({
  label,
  value,
  reference,
  unit,
  digits = 1,
}: {
  label: string;
  value: number;
  reference: number;
  unit: string;
  digits?: number;
}) {
  const delta = value - reference;
  return (
    <article className={Math.abs(delta) > 0.05 ? "is-changed" : ""}>
      <span>{label}</span>
      <strong>
        {fixed(value, digits)}
        {unit}
      </strong>
      <small>{signed(delta, digits, unit)}</small>
    </article>
  );
}

function GearingMap({
  combinations,
  selectedId,
  onSelect,
}: {
  combinations: GearCombination[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const max = Math.max(
    ...combinations.map((gear) => gear.overallRatio),
    1,
  );

  return (
    <div className="gearing-map">
      {combinations.map((gear) => (
        <button
          type="button"
          key={gear.id}
          className={gear.id === selectedId ? "is-selected" : ""}
          onClick={() => onSelect(gear.id)}
        >
          <span>{gear.label}</span>
          <i
            aria-hidden="true"
            style={{
              width: `${Math.max(
                5,
                (gear.overallRatio / max) * 100,
              )}%`,
            }}
          />
          <strong>{fixed(gear.speedKph, 1)} km/h</strong>
        </button>
      ))}
    </div>
  );
}

export function GeometryLabPanel({
  bikeId,
  buildSelections,
  onClose,
}: Props) {
  const bike = getBikeById(bikeId);
  const [tab, setTab] = useState<Tab>(readInitialTab);
  const [cadenceRpm, setCadenceRpm] = useState(readInitialCadence);
  const [selectedGearId, setSelectedGearId] = useState("");

  const geometry = useMemo(
    () => solveBuildGeometry(bikeId, buildSelections),
    [bikeId, buildSelections],
  );
  const referenceGeometry = useMemo(
    () => solveBuildGeometry(bikeId, {}),
    [bikeId],
  );
  const gearing = useMemo(
    () => solveBuildGearing(bikeId, buildSelections, cadenceRpm),
    [bikeId, buildSelections, cadenceRpm],
  );
  const analysis = useMemo(
    () => analyzeBuild(bikeId, buildSelections),
    [bikeId, buildSelections],
  );

  const selectedGear =
    gearing?.combinations.find((gear) => gear.id === selectedGearId) ??
    gearing?.combinations[
      Math.floor((gearing?.combinations.length ?? 1) / 2)
    ] ??
    null;

  useEffect(() => {
    if (!gearing) return;
    if (
      selectedGearId &&
      gearing.combinations.some((gear) => gear.id === selectedGearId)
    ) {
      return;
    }
    setSelectedGearId(
      gearing.combinations[
        Math.floor(gearing.combinations.length / 2)
      ]?.id ?? "",
    );
  }, [gearing, selectedGearId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("geometry", "1");
    if (tab === "geometry") url.searchParams.delete("geometryTab");
    else url.searchParams.set("geometryTab", tab);
    if (cadenceRpm === 90) url.searchParams.delete("gearCad");
    else url.searchParams.set("gearCad", String(cadenceRpm));
    window.history.replaceState({}, "", url);
  }, [cadenceRpm, tab]);

  if (!bike || !geometry || !referenceGeometry || !gearing) {
    return null;
  }

  return (
    <aside className="geometry-panel" aria-label="Bike geometry and gearing lab">
      <header className="geometry-header">
        <div>
          <span>Geometry Lab · build-derived</span>
          <h2>Change a part. Change the bicycle.</h2>
          <p>
            Reference frame dimensions stay fixed. Fork, tire, cockpit and
            drivetrain selections propagate into solved geometry, contact
            points and gearing.
          </p>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onClose}
          aria-label="Close Geometry Lab"
        >
          ×
        </button>
      </header>

      <nav className="geometry-tabs" aria-label="Geometry Lab views">
        <button
          type="button"
          className={tab === "geometry" ? "is-active" : ""}
          onClick={() => setTab("geometry")}
        >
          Geometry + fit
        </button>
        <button
          type="button"
          className={tab === "gearing" ? "is-active" : ""}
          onClick={() => setTab("gearing")}
        >
          Dynamic gearing
        </button>
      </nav>

      <div className="geometry-body">
        {tab === "geometry" ? (
          <>
            <section className="geometry-hero">
              <div>
                <span>{bike.name}</span>
                <strong>
                  {Object.keys(buildSelections).length
                    ? "Custom build"
                    : "Reference geometry"}
                </strong>
              </div>
              <div className="geometry-legend">
                <span><i className="is-reference" /> reference</span>
                <span><i className="is-current" /> current</span>
              </div>
            </section>

            <GeometryDiagram
              current={geometry}
              reference={referenceGeometry}
            />

            <section className="geometry-metrics">
              <Metric
                label="Head angle"
                value={geometry.headAngleDeg}
                reference={referenceGeometry.headAngleDeg}
                unit="°"
              />
              <Metric
                label="Seat angle"
                value={geometry.seatTubeAngleDeg}
                reference={referenceGeometry.seatTubeAngleDeg}
                unit="°"
              />
              <Metric
                label="Frame reach"
                value={geometry.reachMm}
                reference={referenceGeometry.reachMm}
                unit=" mm"
                digits={0}
              />
              <Metric
                label="Frame stack"
                value={geometry.stackMm}
                reference={referenceGeometry.stackMm}
                unit=" mm"
                digits={0}
              />
              <Metric
                label="Wheelbase"
                value={geometry.wheelbaseMm}
                reference={referenceGeometry.wheelbaseMm}
                unit=" mm"
                digits={0}
              />
              <Metric
                label="BB height"
                value={geometry.bbHeightMm}
                reference={referenceGeometry.bbHeightMm}
                unit=" mm"
                digits={0}
              />
              <Metric
                label="Trail"
                value={geometry.trailMm}
                reference={referenceGeometry.trailMm}
                unit=" mm"
                digits={0}
              />
              <Metric
                label="Fork A2C"
                value={geometry.forkAxleToCrownMm}
                reference={referenceGeometry.forkAxleToCrownMm}
                unit=" mm"
                digits={0}
              />
            </section>

            <section className="geometry-fit">
              <div className="geometry-section-title">
                <span>Contact-point consequences</span>
                <strong>not a rider-size recommendation</strong>
              </div>

              <div className="geometry-fit-grid">
                <article>
                  <span>Grip reach from BB</span>
                  <strong>{fixed(geometry.bar.xMm, 0)} mm</strong>
                  <small>
                    {signed(geometry.fit.barReachDeltaMm, 0, " mm")} ·{" "}
                    {direction(
                      geometry.fit.barReachDeltaMm,
                      "farther",
                      "closer",
                    )}
                  </small>
                </article>
                <article>
                  <span>Grip stack from BB</span>
                  <strong>{fixed(geometry.bar.yMm, 0)} mm</strong>
                  <small>
                    {signed(geometry.fit.barStackDeltaMm, 0, " mm")} ·{" "}
                    {direction(
                      geometry.fit.barStackDeltaMm,
                      "higher",
                      "lower",
                    )}
                  </small>
                </article>
                <article>
                  <span>Saddle → grip reach</span>
                  <strong>
                    {fixed(geometry.fit.saddleToGripReachMm, 0)} mm
                  </strong>
                  <small>
                    contact-point horizontal span
                  </small>
                </article>
                <article>
                  <span>Saddle → grip drop</span>
                  <strong>
                    {fixed(geometry.fit.saddleToGripDropMm, 0)} mm
                  </strong>
                  <small>
                    positive = saddle above grip
                  </small>
                </article>
                <article>
                  <span>Bar width</span>
                  <strong>{fixed(geometry.bar.widthMm, 0)} mm</strong>
                  <small>selected donor reference</small>
                </article>
                <article>
                  <span>Saddle setback change</span>
                  <strong>
                    {signed(
                      geometry.fit.saddleSetbackDeltaMm,
                      0,
                      " mm",
                    )}
                  </strong>
                  <small>
                    negative = farther behind BB
                  </small>
                </article>
              </div>
            </section>

            <section className="geometry-interpretation">
              <article>
                <span>Steering</span>
                <strong>
                  {direction(
                    geometry.deltas.headAngleDeg,
                    "steeper",
                    "slacker",
                  )}{" "}
                  ·{" "}
                  {direction(
                    geometry.deltas.trailMm,
                    "more trail",
                    "less trail",
                  )}
                </strong>
              </article>
              <article>
                <span>Chassis</span>
                <strong>
                  {direction(
                    geometry.deltas.wheelbaseMm,
                    "longer",
                    "shorter",
                  )}{" "}
                  wheelbase ·{" "}
                  {direction(
                    geometry.deltas.bbHeightMm,
                    "higher BB",
                    "lower BB",
                  )}
                </strong>
              </article>
              <article>
                <span>Fork</span>
                <strong>
                  {fixed(geometry.forkTravelMm, 0)} mm travel ·{" "}
                  {fixed(geometry.forkOffsetMm, 0)} mm offset
                </strong>
              </article>
            </section>
          </>
        ) : (
          <>
            <section className="gearing-controls">
              <div>
                <span>Cadence</span>
                <strong>{cadenceRpm} rpm</strong>
              </div>
              <input
                type="range"
                min={40}
                max={130}
                step={1}
                value={cadenceRpm}
                onChange={(event) =>
                  setCadenceRpm(Number(event.target.value))
                }
              />
            </section>

            <section className="gearing-summary">
              <article>
                <span>Architecture</span>
                <strong>
                  {gearing.architecture === "internal-gear"
                    ? "Internal gear"
                    : "External cassette"}
                </strong>
              </article>
              <article>
                <span>Gear range</span>
                <strong>{fixed(gearing.rangePercent, 0)}%</strong>
              </article>
              <article>
                <span>Easiest</span>
                <strong>{fixed(gearing.easiest.overallRatio, 2)}×</strong>
                <small>
                  {fixed(gearing.easiest.speedKph, 1)} km/h
                </small>
              </article>
              <article>
                <span>Hardest</span>
                <strong>{fixed(gearing.hardest.overallRatio, 2)}×</strong>
                <small>
                  {fixed(gearing.hardest.speedKph, 1)} km/h
                </small>
              </article>
            </section>

            <section className="gearing-layout">
              <div>
                <div className="geometry-section-title">
                  <span>Gear map</span>
                  <strong>
                    {gearing.combinations.length} combinations
                  </strong>
                </div>
                <GearingMap
                  combinations={gearing.combinations}
                  selectedId={selectedGear?.id ?? ""}
                  onSelect={setSelectedGearId}
                />
              </div>

              {selectedGear && (
                <aside className="gearing-inspector">
                  <span>Selected gear</span>
                  <h3>{selectedGear.label}</h3>
                  <div>
                    <article>
                      <span>Overall ratio</span>
                      <strong>
                        {fixed(selectedGear.overallRatio, 3)}×
                      </strong>
                    </article>
                    <article>
                      <span>Development</span>
                      <strong>
                        {fixed(selectedGear.developmentM, 2)} m/rev
                      </strong>
                    </article>
                    <article>
                      <span>Gear inches</span>
                      <strong>
                        {fixed(selectedGear.gearInches, 1)}
                      </strong>
                    </article>
                    <article>
                      <span>Speed @ {cadenceRpm} rpm</span>
                      <strong>
                        {fixed(selectedGear.speedKph, 1)} km/h
                      </strong>
                    </article>
                  </div>

                  {gearing.architecture === "internal-gear" ? (
                    <p>
                      Primary ratio {selectedGear.chainringTeeth} ÷{" "}
                      {selectedGear.rearTeeth}, then internal ratio{" "}
                      {fixed(selectedGear.internalRatio, 3)}×.
                    </p>
                  ) : (
                    <p>
                      {selectedGear.chainringTeeth}T chainring ÷{" "}
                      {selectedGear.rearTeeth}T sprocket.
                    </p>
                  )}
                </aside>
              )}
            </section>

            <section
              className={`gearing-system-state is-${analysis.health}`}
            >
              <strong>
                {analysis.health === "ready"
                  ? "Drivetrain coherent"
                  : analysis.health === "attention"
                    ? "Build warnings remain"
                    : "Drivetrain/build conflicts remain"}
              </strong>
              <p>
                Gear speeds are kinematic. They describe wheel speed at a
                cadence, not whether the rider has enough power to sustain
                that speed. Use Physics Lab for the power equilibrium.
              </p>
            </section>
          </>
        )}

        <section className="geometry-boundary">
          <strong>P24 model boundary</strong>
          <p>
            Bike Atlas uses fictional reference frame dimensions. The solver
            keeps the frame fixed and propagates authored component geometry.
            Fork-pitch calculations are static and unsagged; tire dimensions
            use archetype reference circumference. Contact-point output
            describes changes, not personal bike-fit prescriptions.
          </p>
        </section>
      </div>
    </aside>
  );
}
