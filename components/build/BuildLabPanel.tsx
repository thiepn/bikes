"use client";

import { useEffect, useMemo, useState } from "react";
import { getBikeById } from "@/domain/bike/catalog";
import {
  getCompatibilityPart,
  getCompatibilityPartsForSlot,
  getCompatibilityProfile,
  getInstalledReferencePart,
} from "@/domain/compatibility/catalog";
import {
  decodeBuildSelections,
  encodeBuildSelections,
} from "@/domain/compatibility/build-state";
import { evaluateCompatibility } from "@/domain/compatibility/evaluate";
import type {
  CompatibilityPart,
  CompatibilityResult,
  CompatibilitySlotId,
} from "@/engine/compatibility/types";

type Props = {
  bikeId: string;
  onPreviewComponent: (componentId: string) => void;
  onClose: () => void;
};

function initialSelections(bikeId: string) {
  if (typeof window === "undefined") return {};

  const profile = getCompatibilityProfile(bikeId);
  const raw = decodeBuildSelections(
    new URL(window.location.href).searchParams.get("buildParts"),
  );
  if (!profile) return {};

  const safe: Record<string, string> = {};
  for (const [slotId, partId] of Object.entries(raw)) {
    const slot = profile.slots.find((item) => item.id === slotId);
    const part = getCompatibilityPart(partId);
    if (!slot || !part) continue;

    const result = evaluateCompatibility(slot, part);
    if (result.status === "compatible") {
      safe[slotId] = part.id;
    }
  }
  return safe;
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
  onPreviewComponent,
  onClose,
}: Props) {
  const bike = getBikeById(bikeId);
  const profile = getCompatibilityProfile(bikeId);

  const [slotId, setSlotId] = useState<CompatibilitySlotId>(
    profile?.slots[0]?.id ?? "front-wheel",
  );
  const [selections, setSelections] = useState<Record<string, string>>(
    () => initialSelections(bikeId),
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("build", "1");

    const encoded = encodeBuildSelections(selections);
    if (encoded) url.searchParams.set("buildParts", encoded);
    else url.searchParams.delete("buildParts");

    window.history.replaceState({}, "", url);
  }, [selections]);

  if (!bike || !profile || !slot) return null;

  const applyInspected = () => {
    if (!inspected || inspected.result.status !== "compatible") return;

    const installed = getInstalledReferencePart(bikeId, slot.id);
    setSelections((current) => {
      const next = { ...current };
      if (installed?.id === inspected.part.id) {
        delete next[slot.id];
      } else {
        next[slot.id] = inspected.part.id;
      }
      return next;
    });
  };

  return (
    <aside className="build-panel" aria-label="Bike Atlas Build Lab">
      <header className="build-header">
        <div>
          <span className="build-kicker">
            Build Lab · compatibility foundation
          </span>
          <h2>Does it actually fit?</h2>
          <p>
            Build a logical draft from explicit Bike Atlas interfaces.
            Every decision shows why it passes or fails.
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
                  setSelections({});
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
                      setSelections((current) => {
                        const next = { ...current };
                        delete next[slot.id];
                        return next;
                      });
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
              P21 stores a logical draft only. Cross-bike donor meshes are
              not transplanted into the 3D scene yet.
            </p>
          </section>
        </main>
      </div>
    </aside>
  );
}
