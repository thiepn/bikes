"use client";

import { useEffect, useMemo, useState } from "react";
import { getBikeById } from "@/domain/bike/catalog";
import {
  getCompatibilityPart,
  getCompatibilityPartsForSlot,
  getCompatibilityProfile,
  getInstalledReferencePart,
} from "@/domain/compatibility/catalog";
import { evaluateCompatibility } from "@/domain/compatibility/evaluate";
import { analyzeBuild } from "@/domain/compatibility/analyze-build";
import type {
  CompatibilityPart,
  CompatibilityResult,
  CompatibilitySlotId,
} from "@/engine/compatibility/types";

type Props = {
  bikeId: string;
  selections: Readonly<Record<string, string>>;
  onSelectionsChange: (selections: Record<string, string>) => void;
  onPreviewComponent: (componentId: string) => void;
  onClose: () => void;
};

function signed(value: number, digits = 2) {
  const rounded = Number(value.toFixed(digits));
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function statusLabel(result: CompatibilityResult) {
  if (result.status === "compatible") return "Compatible";
  if (result.status === "unknown") return "Not enough data";
  return "Does not fit";
}

function CandidateCard({
  part,
  result,
  installed,
  selected,
  onInspect,
}: {
  part: CompatibilityPart;
  result: CompatibilityResult;
  installed: boolean;
  selected: boolean;
  onInspect: () => void;
}) {
  const sourceBike = getBikeById(part.sourceBikeId);

  return (
    <button
      type="button"
      className={[
        "build-candidate",
        `is-${result.status}`,
        selected ? "is-selected" : "",
      ].join(" ")}
      onClick={onInspect}
    >
      <div className="build-candidate__meta">
        <span>{sourceBike?.name ?? "Bike Atlas"}</span>
        <b>{statusLabel(result)}</b>
      </div>
      <strong>{part.label}</strong>
      <p>{part.notes[0]}</p>
      <footer>
        {installed && <span>Installed reference</span>}
        {selected && <span>Draft selection</span>}
      </footer>
    </button>
  );
}

export function BuildLabPanel({
  bikeId,
  selections,
  onSelectionsChange,
  onPreviewComponent,
  onClose,
}: Props) {
  const bike = getBikeById(bikeId);
  const profile = getCompatibilityProfile(bikeId);

  const [slotId, setSlotId] = useState<CompatibilitySlotId>(
    profile?.slots[0]?.id ?? "front-wheel",
  );
  const [inspectedPartId, setInspectedPartId] = useState<string | null>(
    null,
  );

  const slot =
    profile?.slots.find((item) => item.id === slotId) ??
    profile?.slots[0] ??
    null;

  const candidates = useMemo(() => {
    if (!slot) return [];
    return getCompatibilityPartsForSlot(slot.id)
      .map((part) => ({
        part,
        result: evaluateCompatibility(slot, part),
      }))
      .sort((a, b) => {
        const order = { compatible: 0, unknown: 1, incompatible: 2 };
        return (
          order[a.result.status] - order[b.result.status] ||
          a.part.label.localeCompare(b.part.label)
        );
      });
  }, [slot]);

  const installedPart = slot
    ? getInstalledReferencePart(bikeId, slot.id)
    : null;

  const draftPartId =
    (slot && selections[slot.id]) ||
    installedPart?.id ||
    null;

  const inspected =
    candidates.find((candidate) => candidate.part.id === inspectedPartId) ??
    candidates.find((candidate) => candidate.part.id === draftPartId) ??
    candidates[0] ??
    null;

  const buildAnalysis = useMemo(
    () => analyzeBuild(bikeId, selections),
    [bikeId, selections],
  );

  const changedSelections = useMemo(() => {
    if (!profile) return [];

    return profile.slots.flatMap((candidateSlot) => {
      const selectedPartId = selections[candidateSlot.id];
      if (!selectedPartId) return [];

      const installed = getInstalledReferencePart(
        bikeId,
        candidateSlot.id,
      );
      if (!installed || installed.id === selectedPartId) return [];

      const part = getCompatibilityPart(selectedPartId);
      if (!part) return [];

      return [{ slot: candidateSlot, part }];
    });
  }, [bikeId, profile, selections]);

  useEffect(() => {
    if (!slot) return;
    onPreviewComponent(slot.hostComponentId);
  }, [onPreviewComponent, slot]);


  if (!bike || !profile || !slot) return null;

  const applyInspected = () => {
    if (!inspected || inspected.result.status !== "compatible") return;

    const installed = getInstalledReferencePart(bikeId, slot.id);
    const next = { ...selections };
    if (installed?.id === inspected.part.id) {
      delete next[slot.id];
    } else {
      next[slot.id] = inspected.part.id;
    }
    onSelectionsChange(next);
  };

  return (
    <aside className="build-panel" aria-label="Bike Atlas Build Lab">
      <header className="build-header">
        <div>
          <span className="build-kicker">
            Build Lab · compatibility + 3D assembly
          </span>
          <h2>Does it actually fit?</h2>
          <p>
            Build a compatibility-checked draft and see normalized donor
            geometry assembled directly onto the host bike. Every decision
            still shows why it passes or fails.
          </p>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onClose}
          aria-label="Close Build Lab"
        >
          ×
        </button>
      </header>

      <div className="build-body">
        <nav className="build-slots" aria-label="Build slots">
          <div className="build-slots__head">
            <span>{bike.name}</span>
            <strong>
              {changedSelections.length} change
              {changedSelections.length === 1 ? "" : "s"}
            </strong>
          </div>

          {profile.slots.map((item) => {
            const installed = getInstalledReferencePart(
              bikeId,
              item.id,
            );
            const selected = selections[item.id];
            const changed = Boolean(
              selected && installed?.id !== selected,
            );

            return (
              <button
                type="button"
                key={item.id}
                className={[
                  "build-slot",
                  item.id === slot.id ? "is-active" : "",
                  changed ? "is-changed" : "",
                ].join(" ")}
                onClick={() => {
                  setSlotId(item.id);
                  setInspectedPartId(null);
                }}
              >
                <span>{item.label}</span>
                <small>{changed ? "modified" : "reference"}</small>
              </button>
            );
          })}

          <div className="build-draft-summary">
            <span>Draft status</span>
            {changedSelections.length === 0 ? (
              <p>Reference build unchanged.</p>
            ) : (
              <div>
                {changedSelections.map(({ slot: changedSlot, part }) => (
                  <button
                    type="button"
                    key={changedSlot.id}
                    onClick={() => {
                      setSlotId(changedSlot.id);
                      setInspectedPartId(part.id);
                    }}
                  >
                    <span>{changedSlot.label}</span>
                    <strong>{part.label}</strong>
                  </button>
                ))}
              </div>
            )}

            {changedSelections.length > 0 && (
              <button
                type="button"
                className="build-reset-all"
                onClick={() => {
                  onSelectionsChange({});
                  setInspectedPartId(null);
                }}
              >
                Reset draft
              </button>
            )}
          </div>
        </nav>

        <main className="build-main">
          <section className="build-slot-intro">
            <div>
              <span>{slot.label}</span>
              <h3>{slot.description}</h3>
            </div>
            <p>
              {slot.requirements.length} modeled interface
              {slot.requirements.length === 1 ? "" : "s"} decide this
              P21 result.
            </p>
          </section>

          <section
            className={`build-consequences is-${buildAnalysis.health}`}
            aria-label="Build consequence analysis"
          >
            <div className="build-consequences__head">
              <div>
                <span>System analysis</span>
                <strong>
                  {buildAnalysis.health === "ready"
                    ? "Build coherent"
                    : buildAnalysis.health === "attention"
                      ? "Review consequences"
                      : "Companion changes required"}
                </strong>
              </div>
              <b>
                {buildAnalysis.issues.filter(
                  (issue) => issue.severity === "blocking",
                ).length}{" "}
                blocking ·{" "}
                {buildAnalysis.issues.filter(
                  (issue) => issue.severity === "warning",
                ).length}{" "}
                warning
              </b>
            </div>

            <div className="build-consequence-metrics">
              <article>
                <span>Mass</span>
                <strong>
                  {signed(buildAnalysis.metrics.massDeltaKg, 2)} kg
                </strong>
              </article>
              <article>
                <span>CdA</span>
                <strong>
                  {signed(buildAnalysis.metrics.cdaDeltaM2, 3)} m²
                </strong>
              </article>
              <article>
                <span>Front brake leverage</span>
                <strong>
                  {signed(
                    (buildAnalysis.metrics.frontBrakeTorqueRatio - 1) *
                      100,
                    1,
                  )}
                  %
                </strong>
              </article>
              <article>
                <span>Rear brake leverage</span>
                <strong>
                  {signed(
                    (buildAnalysis.metrics.rearBrakeTorqueRatio - 1) *
                      100,
                    1,
                  )}
                  %
                </strong>
              </article>
              <article>
                <span>Gear range</span>
                <strong>
                  {buildAnalysis.metrics.gearRangePercent
                    ? `${Math.round(
                        buildAnalysis.metrics.gearRangePercent,
                      )}%`
                    : "—"}
                </strong>
              </article>
              <article>
                <span>Fork A2C</span>
                <strong>
                  {signed(
                    buildAnalysis.metrics.axleToCrownDeltaMm,
                    0,
                  )}{" "}
                  mm
                </strong>
              </article>
            </div>

            {buildAnalysis.issues.length === 0 ? (
              <p className="build-consequences__clear">
                No modeled cross-component conflicts in this draft.
              </p>
            ) : (
              <div className="build-issues">
                {buildAnalysis.issues.map((issue) => (
                  <button
                    type="button"
                    key={issue.id}
                    className={`is-${issue.severity}`}
                    onClick={() => {
                      const target = issue.relatedSlots.find(
                        (related) =>
                          profile.slots.some(
                            (candidateSlot) =>
                              candidateSlot.id === related,
                          ),
                      );
                      if (target) {
                        setSlotId(target);
                        setInspectedPartId(null);
                      }
                    }}
                  >
                    <span>
                      {issue.system} · {issue.severity}
                    </span>
                    <strong>{issue.title}</strong>
                    <p>{issue.detail}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="build-candidates">
            <div className="build-section-title">
              <span>Candidate library</span>
              <strong>
                {
                  candidates.filter(
                    (candidate) =>
                      candidate.result.status === "compatible",
                  ).length
                }{" "}
                compatible
              </strong>
            </div>
            <div className="build-candidates__grid">
              {candidates.map(({ part, result }) => (
                <CandidateCard
                  key={part.id}
                  part={part}
                  result={result}
                  installed={installedPart?.id === part.id}
                  selected={draftPartId === part.id}
                  onInspect={() => setInspectedPartId(part.id)}
                />
              ))}
            </div>
          </section>

          {inspected && (
            <section className="build-inspector">
              <div className="build-inspector__head">
                <div>
                  <span>Compatibility explanation</span>
                  <h4>{inspected.part.label}</h4>
                </div>
                <b className={`is-${inspected.result.status}`}>
                  {statusLabel(inspected.result)}
                </b>
              </div>

              <div className="build-reasons">
                {inspected.result.reasons.map((reason) => (
                  <article
                    key={reason.key}
                    className={`is-${reason.status}`}
                  >
                    <div>
                      <span>{reason.label}</span>
                      <b>
                        {reason.status === "match"
                          ? "match"
                          : reason.status === "mismatch"
                            ? "mismatch"
                            : "unknown"}
                      </b>
                    </div>
                    <p>
                      <span>Host</span>
                      <strong>{reason.expected}</strong>
                    </p>
                    <p>
                      <span>Part</span>
                      <strong>{reason.actual}</strong>
                    </p>
                  </article>
                ))}
              </div>

              <div className="build-inspector__actions">
                <button
                  type="button"
                  className="build-apply"
                  disabled={inspected.result.status !== "compatible"}
                  onClick={applyInspected}
                >
                  {draftPartId === inspected.part.id
                    ? installedPart?.id === inspected.part.id
                      ? "Reference part installed"
                      : "Keep in draft"
                    : "Use in draft"}
                </button>

                {selections[slot.id] && (
                  <button
                    type="button"
                    className="build-reset-slot"
                    onClick={() => {
                      const next = { ...selections };
                      delete next[slot.id];
                      onSelectionsChange(next);
                      setInspectedPartId(installedPart?.id ?? null);
                    }}
                  >
                    Restore reference
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="build-boundary">
            <strong>What “compatible” means in P21</strong>
            <p>
              Every modeled interface for this slot matches. Bike Atlas
              does not yet certify interfaces it has not modeled—such as
              unlisted clearances, fastener lengths, structural limits,
              cable/hose routing, warranty requirements or legal rules.
            </p>
            <p>
              P23 also evaluates cross-component dependencies and build
              consequences. Normalized donor proxy geometry still proves
              assembly transforms rather than manufacturer CAD accuracy.
            </p>
          </section>
        </main>
      </div>
    </aside>
  );
}
