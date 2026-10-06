"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BIKE_CATALOG,
  getBikeById,
} from "@/domain/bike/catalog";
import {
  getBikePhysicsProfile,
  PHYSICS_SURFACES,
} from "@/domain/physics/catalog";
import {
  calculatePhysicsBreakdown,
  cadenceForSpeed,
  cadenceSpeed,
  simulateBike,
  simulateProfile,
} from "@/engine/physics/model";
import type {
  BikePhysicsProfile,
  PhysicsScenario,
  PhysicsSurfaceId,
} from "@/engine/physics/types";

type Props = {
  bikeId: string;
  onClose: () => void;
};

type Overrides = {
  bikeMassKg: number | null;
  cdaM2: number | null;
  drivetrainEfficiency: number | null;
  crr: number | null;
};

const DEFAULTS = {
  riderPowerW: 250,
  riderMassKg: 75,
  cargoMassKg: 0,
  gradePercent: 0,
  windSpeedKph: 0,
  airDensityKgM3: 1.225,
  surfaceId: "smooth-asphalt" as PhysicsSurfaceId,
  cadenceRpm: 90,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readNumber(
  params: URLSearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
) {
  const value = Number(params.get(key));
  return Number.isFinite(value)
    ? clamp(value, min, max)
    : fallback;
}

function initialState(profile: BikePhysicsProfile): {
  scenario: PhysicsScenario;
  overrides: Overrides;
} {
  if (typeof window === "undefined") {
    return {
      scenario: {
        ...DEFAULTS,
        driveRatio: profile.defaultDriveRatio,
      },
      overrides: {
        bikeMassKg: null,
        cdaM2: null,
        drivetrainEfficiency: null,
        crr: null,
      },
    };
  }

  const params = new URL(window.location.href).searchParams;
  const surface = PHYSICS_SURFACES.some(
    (item) => item.id === params.get("surface"),
  )
    ? (params.get("surface") as PhysicsSurfaceId)
    : DEFAULTS.surfaceId;

  return {
    scenario: {
      riderPowerW: readNumber(params, "pwr", DEFAULTS.riderPowerW, 0, 600),
      riderMassKg: readNumber(params, "rider", DEFAULTS.riderMassKg, 40, 140),
      cargoMassKg: readNumber(params, "cargo", DEFAULTS.cargoMassKg, 0, 40),
      gradePercent: readNumber(params, "grade", DEFAULTS.gradePercent, -15, 20),
      windSpeedKph: readNumber(params, "wind", DEFAULTS.windSpeedKph, -40, 60),
      airDensityKgM3: readNumber(params, "rho", DEFAULTS.airDensityKgM3, 0.8, 1.4),
      surfaceId: surface,
      cadenceRpm: readNumber(params, "cad", DEFAULTS.cadenceRpm, 40, 140),
      driveRatio: readNumber(
        params,
        "ratio",
        profile.defaultDriveRatio,
        0.5,
        5,
      ),
    },
    overrides: {
      bikeMassKg: params.has("bm")
        ? readNumber(params, "bm", profile.bikeMassKg, 3, 40)
        : null,
      cdaM2: params.has("cda")
        ? readNumber(params, "cda", profile.cdaM2, 0.15, 1.2)
        : null,
      drivetrainEfficiency: params.has("eta")
        ? readNumber(
            params,
            "eta",
            profile.drivetrainEfficiency,
            0.75,
            1,
          )
        : null,
      crr: params.has("crr")
        ? readNumber(
            params,
            "crr",
            profile.rollingResistance[surface],
            0.001,
            0.08,
          )
        : null,
    },
  };
}

function fixed(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function signed(value: number, digits = 0) {
  if (!Number.isFinite(value)) return "—";
  const n = Number(value.toFixed(digits));
  return `${n > 0 ? "+" : ""}${n}`;
}

function MetricControl({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="physics-control">
      <span>
        <strong>{label}</strong>
        <small>
          {Number(value.toFixed(step < 1 ? 2 : 0))}
          {unit}
        </small>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function AssumptionField({
  label,
  value,
  unit,
  min,
  max,
  step,
  reference,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  reference: number;
  onChange: (value: number | null) => void;
}) {
  const changed = Math.abs(value - reference) > 1e-9;

  return (
    <label className={changed ? "physics-assumption is-custom" : "physics-assumption"}>
      <span>{label}</span>
      <div>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number(value.toFixed(step < 0.01 ? 4 : step < 1 ? 3 : 1))}
          onChange={(event) =>
            onChange(
              clamp(Number(event.target.value), min, max),
            )
          }
        />
        <small>{unit}</small>
        {changed && (
          <button type="button" onClick={() => onChange(null)}>
            reset
          </button>
        )}
      </div>
    </label>
  );
}

export function PhysicsLabPanel({ bikeId, onClose }: Props) {
  const bike = getBikeById(bikeId) ?? BIKE_CATALOG[0];
  const reference =
    getBikePhysicsProfile(bike.id) ??
    getBikePhysicsProfile(BIKE_CATALOG[0].id)!;

  const initial = useMemo(
    () => initialState(reference),
    [reference],
  );

  const [scenario, setScenario] = useState<PhysicsScenario>(
    initial.scenario,
  );
  const [overrides, setOverrides] = useState<Overrides>(
    initial.overrides,
  );
  const [showAssumptions, setShowAssumptions] = useState(false);

  const effectiveProfile = useMemo<BikePhysicsProfile>(() => {
    const rollingResistance = {
      ...reference.rollingResistance,
      [scenario.surfaceId]:
        overrides.crr ??
        reference.rollingResistance[scenario.surfaceId],
    };

    return {
      ...reference,
      bikeMassKg: overrides.bikeMassKg ?? reference.bikeMassKg,
      cdaM2: overrides.cdaM2 ?? reference.cdaM2,
      drivetrainEfficiency:
        overrides.drivetrainEfficiency ??
        reference.drivetrainEfficiency,
      rollingResistance,
    };
  }, [overrides, reference, scenario.surfaceId]);

  const primary = useMemo(
    () => simulateProfile(effectiveProfile, scenario),
    [effectiveProfile, scenario],
  );

  const comparison = useMemo(
    () =>
      BIKE_CATALOG.map((item) => {
        if (item.id === bikeId) return primary;
        return simulateBike(item.id, scenario);
      })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((a, b) => b.speedKph - a.speedKph),
    [bikeId, primary, scenario],
  );

  const cadenceProjection = useMemo(
    () =>
      cadenceSpeed(
        scenario.cadenceRpm,
        scenario.driveRatio,
        effectiveProfile.wheelCircumferenceM,
      ),
    [
      effectiveProfile.wheelCircumferenceM,
      scenario.cadenceRpm,
      scenario.driveRatio,
    ],
  );

  const cadencePower = useMemo(
    () =>
      calculatePhysicsBreakdown(
        cadenceProjection.speedKph / 3.6,
        effectiveProfile,
        scenario,
      ),
    [cadenceProjection.speedKph, effectiveProfile, scenario],
  );

  const equilibriumCadence = cadenceForSpeed(
    primary.speedKph,
    scenario.driveRatio,
    effectiveProfile.wheelCircumferenceM,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("physics", "1");

    const setOrDelete = (
      key: string,
      value: number | string,
      defaultValue: number | string,
      digits = 3,
    ) => {
      const same =
        typeof value === "number" && typeof defaultValue === "number"
          ? Math.abs(value - defaultValue) < 1e-9
          : value === defaultValue;
      if (same) url.searchParams.delete(key);
      else {
        url.searchParams.set(
          key,
          typeof value === "number"
            ? String(Number(value.toFixed(digits)))
            : value,
        );
      }
    };

    setOrDelete("pwr", scenario.riderPowerW, DEFAULTS.riderPowerW, 0);
    setOrDelete("rider", scenario.riderMassKg, DEFAULTS.riderMassKg, 1);
    setOrDelete("cargo", scenario.cargoMassKg, DEFAULTS.cargoMassKg, 1);
    setOrDelete("grade", scenario.gradePercent, DEFAULTS.gradePercent, 1);
    setOrDelete("wind", scenario.windSpeedKph, DEFAULTS.windSpeedKph, 1);
    setOrDelete("rho", scenario.airDensityKgM3, DEFAULTS.airDensityKgM3, 3);
    setOrDelete("surface", scenario.surfaceId, DEFAULTS.surfaceId);
    setOrDelete("cad", scenario.cadenceRpm, DEFAULTS.cadenceRpm, 0);
    setOrDelete("ratio", scenario.driveRatio, reference.defaultDriveRatio, 2);

    if (overrides.bikeMassKg === null) url.searchParams.delete("bm");
    else url.searchParams.set("bm", String(overrides.bikeMassKg));

    if (overrides.cdaM2 === null) url.searchParams.delete("cda");
    else url.searchParams.set("cda", String(overrides.cdaM2));

    if (overrides.drivetrainEfficiency === null) {
      url.searchParams.delete("eta");
    } else {
      url.searchParams.set(
        "eta",
        String(overrides.drivetrainEfficiency),
      );
    }

    if (overrides.crr === null) url.searchParams.delete("crr");
    else url.searchParams.set("crr", String(overrides.crr));

    window.history.replaceState({}, "", url);
  }, [overrides, reference.defaultDriveRatio, scenario]);

  const applyPreset = (
    patch: Partial<PhysicsScenario>,
  ) => {
    setScenario((current) => ({ ...current, ...patch }));
    setOverrides((current) => ({ ...current, crr: null }));
  };

  const dominantLoss = [
    ["Aerodynamic", primary.aeroPowerW] as const,
    ["Climbing", primary.gravityPowerW] as const,
    ["Rolling", primary.rollingPowerW] as const,
  ]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])[0];

  const kinematicPowerMargin =
    scenario.riderPowerW - cadencePower.requiredRiderPowerW;

  return (
    <aside className="physics-panel" aria-label="Bicycle physics lab">
      <header className="physics-header">
        <div>
          <span className="physics-kicker">
            Physics lab · steady-state model
          </span>
          <h2>Power becomes speed.</h2>
          <p>
            Explore how power, mass, grade, wind, aerodynamics and
            rolling resistance interact. Gearing is modeled separately
            as a cadence relationship.
          </p>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onClose}
          aria-label="Close physics lab"
        >
          ×
        </button>
      </header>

      <div className="physics-body">
        <section className="physics-presets" aria-label="Physics scenario presets">
          <button
            type="button"
            onClick={() =>
              applyPreset({
                gradePercent: 0,
                windSpeedKph: 0,
                surfaceId: "smooth-asphalt",
              })
            }
          >
            Flat road
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                gradePercent: 7,
                windSpeedKph: 0,
                surfaceId: "smooth-asphalt",
              })
            }
          >
            7% climb
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                gradePercent: 2,
                windSpeedKph: 5,
                surfaceId: "hardpack-gravel",
              })
            }
          >
            Gravel
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                gradePercent: 0,
                windSpeedKph: 20,
                surfaceId: "smooth-asphalt",
              })
            }
          >
            Headwind
          </button>
        </section>

        <div className="physics-layout">
          <div className="physics-inputs">
            <section>
              <div className="physics-section-title">
                <span>Rider & environment</span>
                <strong>{bike.name}</strong>
              </div>

              <MetricControl
                label="Rider power"
                value={scenario.riderPowerW}
                unit=" W"
                min={0}
                max={600}
                step={5}
                onChange={(value) =>
                  setScenario((current) => ({
                    ...current,
                    riderPowerW: value,
                  }))
                }
              />
              <MetricControl
                label="Rider mass"
                value={scenario.riderMassKg}
                unit=" kg"
                min={40}
                max={140}
                step={1}
                onChange={(value) =>
                  setScenario((current) => ({
                    ...current,
                    riderMassKg: value,
                  }))
                }
              />
              <MetricControl
                label="Cargo"
                value={scenario.cargoMassKg}
                unit=" kg"
                min={0}
                max={40}
                step={1}
                onChange={(value) =>
                  setScenario((current) => ({
                    ...current,
                    cargoMassKg: value,
                  }))
                }
              />
              <MetricControl
                label="Grade"
                value={scenario.gradePercent}
                unit="%"
                min={-15}
                max={20}
                step={0.5}
                onChange={(value) =>
                  setScenario((current) => ({
                    ...current,
                    gradePercent: value,
                  }))
                }
              />
              <MetricControl
                label="Wind"
                value={scenario.windSpeedKph}
                unit=" km/h"
                min={-40}
                max={60}
                step={1}
                onChange={(value) =>
                  setScenario((current) => ({
                    ...current,
                    windSpeedKph: value,
                  }))
                }
              />

              <label className="physics-select">
                <span>
                  <strong>Surface</strong>
                  <small>
                    Crr {fixed(effectiveProfile.rollingResistance[scenario.surfaceId], 3)}
                  </small>
                </span>
                <select
                  value={scenario.surfaceId}
                  onChange={(event) => {
                    setScenario((current) => ({
                      ...current,
                      surfaceId: event.target.value as PhysicsSurfaceId,
                    }));
                    setOverrides((current) => ({
                      ...current,
                      crr: null,
                    }));
                  }}
                >
                  {PHYSICS_SURFACES.map((surface) => (
                    <option key={surface.id} value={surface.id}>
                      {surface.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section>
              <div className="physics-section-title">
                <span>Cadence & gearing</span>
                <strong>kinematic only</strong>
              </div>
              <MetricControl
                label="Cadence"
                value={scenario.cadenceRpm}
                unit=" rpm"
                min={40}
                max={140}
                step={1}
                onChange={(value) =>
                  setScenario((current) => ({
                    ...current,
                    cadenceRpm: value,
                  }))
                }
              />
              <MetricControl
                label="Overall drive ratio"
                value={scenario.driveRatio}
                unit="×"
                min={0.5}
                max={5}
                step={0.05}
                onChange={(value) =>
                  setScenario((current) => ({
                    ...current,
                    driveRatio: value,
                  }))
                }
              />

              <div className="physics-cadence-result">
                <div>
                  <span>At selected cadence</span>
                  <strong>{fixed(cadenceProjection.speedKph, 1)} km/h</strong>
                  <small>
                    requires {fixed(cadencePower.requiredRiderPowerW, 0)} W
                    under this scenario
                  </small>
                </div>
                <div>
                  <span>At physics equilibrium</span>
                  <strong>{fixed(equilibriumCadence, 0)} rpm</strong>
                  <small>
                    in the selected {fixed(scenario.driveRatio, 2)}× ratio
                  </small>
                </div>
                <p
                  className={
                    kinematicPowerMargin >= 0
                      ? "is-positive"
                      : "is-negative"
                  }
                >
                  {kinematicPowerMargin >= 0
                    ? `+${fixed(kinematicPowerMargin, 0)} W power margin at cadence-selected speed`
                    : `${fixed(kinematicPowerMargin, 0)} W short of cadence-selected speed`}
                </p>
              </div>
            </section>

            <section className="physics-assumptions">
              <button
                type="button"
                className="physics-assumptions__toggle"
                onClick={() => setShowAssumptions((value) => !value)}
                aria-expanded={showAssumptions}
              >
                <span>
                  <strong>Reference assumptions</strong>
                  <small>Editable Bike Atlas model inputs</small>
                </span>
                <i aria-hidden="true">{showAssumptions ? "−" : "+"}</i>
              </button>

              {showAssumptions && (
                <div className="physics-assumptions__body">
                  <AssumptionField
                    label="Bike mass"
                    value={effectiveProfile.bikeMassKg}
                    unit="kg"
                    min={3}
                    max={40}
                    step={0.1}
                    reference={reference.bikeMassKg}
                    onChange={(value) =>
                      setOverrides((current) => ({
                        ...current,
                        bikeMassKg: value,
                      }))
                    }
                  />
                  <AssumptionField
                    label="CdA"
                    value={effectiveProfile.cdaM2}
                    unit="m²"
                    min={0.15}
                    max={1.2}
                    step={0.01}
                    reference={reference.cdaM2}
                    onChange={(value) =>
                      setOverrides((current) => ({
                        ...current,
                        cdaM2: value,
                      }))
                    }
                  />
                  <AssumptionField
                    label="Drivetrain efficiency"
                    value={effectiveProfile.drivetrainEfficiency}
                    unit=""
                    min={0.75}
                    max={1}
                    step={0.005}
                    reference={reference.drivetrainEfficiency}
                    onChange={(value) =>
                      setOverrides((current) => ({
                        ...current,
                        drivetrainEfficiency: value,
                      }))
                    }
                  />
                  <AssumptionField
                    label="Crr"
                    value={effectiveProfile.rollingResistance[scenario.surfaceId]}
                    unit=""
                    min={0.001}
                    max={0.08}
                    step={0.001}
                    reference={reference.rollingResistance[scenario.surfaceId]}
                    onChange={(value) =>
                      setOverrides((current) => ({
                        ...current,
                        crr: value,
                      }))
                    }
                  />
                  <AssumptionField
                    label="Air density"
                    value={scenario.airDensityKgM3}
                    unit="kg/m³"
                    min={0.8}
                    max={1.4}
                    step={0.005}
                    reference={DEFAULTS.airDensityKgM3}
                    onChange={(value) =>
                      setScenario((current) => ({
                        ...current,
                        airDensityKgM3:
                          value ?? DEFAULTS.airDensityKgM3,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="physics-reset-assumptions"
                    onClick={() => {
                      setOverrides({
                        bikeMassKg: null,
                        cdaM2: null,
                        drivetrainEfficiency: null,
                        crr: null,
                      });
                      setScenario((current) => ({
                        ...current,
                        airDensityKgM3: DEFAULTS.airDensityKgM3,
                        driveRatio: reference.defaultDriveRatio,
                      }));
                    }}
                  >
                    Reset all reference assumptions
                  </button>
                </div>
              )}
            </section>
          </div>

          <div className="physics-results">
            <section className="physics-hero">
              <span>{bike.name} · estimated steady state</span>
              <div>
                <strong>{fixed(primary.speedKph, 1)}</strong>
                <small>km/h</small>
              </div>
              <p>
                {scenario.riderPowerW} W rider input ·{" "}
                {fixed(primary.wheelPowerW, 0)} W after drivetrain ·{" "}
                {fixed(primary.totalMassKg, 1)} kg system mass
              </p>
              {dominantLoss && (
                <b>
                  Largest positive demand: {dominantLoss[0]} ·{" "}
                  {fixed(dominantLoss[1], 0)} W
                </b>
              )}
            </section>

            <section className="physics-breakdown">
              <div className="physics-section-title">
                <span>Power at equilibrium</span>
                <strong>wheel-side</strong>
              </div>
              <article>
                <span>Aerodynamic</span>
                <strong>{signed(primary.aeroPowerW)} W</strong>
              </article>
              <article>
                <span>Gravity</span>
                <strong>{signed(primary.gravityPowerW)} W</strong>
              </article>
              <article>
                <span>Rolling</span>
                <strong>{signed(primary.rollingPowerW)} W</strong>
              </article>
              <article className="is-total">
                <span>Required wheel power</span>
                <strong>{signed(primary.requiredWheelPowerW)} W</strong>
              </article>
            </section>

            <section className="physics-comparison">
              <div className="physics-section-title">
                <span>Same rider & environment</span>
                <strong>reference bike assumptions</strong>
              </div>
              <div>
                {comparison.map((result, index) => {
                  const comparedBike = getBikeById(result.bikeId);
                  const max = Math.max(...comparison.map((item) => item.speedKph), 1);
                  return (
                    <article
                      key={result.bikeId}
                      className={
                        result.bikeId === bike.id ? "is-primary" : ""
                      }
                    >
                      <div>
                        <span>
                          {index + 1}. {comparedBike?.name ?? result.bikeId}
                        </span>
                        <strong>{fixed(result.speedKph, 1)} km/h</strong>
                      </div>
                      <i
                        aria-hidden="true"
                        style={{
                          width: `${Math.max(3, (result.speedKph / max) * 100)}%`,
                        }}
                      />
                      <small>
                        {fixed(result.profile.bikeMassKg, 1)} kg · CdA{" "}
                        {fixed(result.profile.cdaM2, 2)} · Crr{" "}
                        {fixed(result.crr, 3)}
                      </small>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="physics-model-note">
              <strong>Model boundary</strong>
              <p>
                Educational steady-state estimate. It does not model
                acceleration, cornering, braking, rider position changes,
                gusts, tire deformation beyond effective Crr, suspension
                dynamics, terrain impacts or manufacturer test data.
              </p>
              <p>
                Positive wind means headwind; negative wind means tailwind.
                Negative gravity power on a descent assists motion.
              </p>
            </section>
          </div>
        </div>
      </div>
    </aside>
  );
}
