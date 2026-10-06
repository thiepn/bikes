import {
  getCompatibilityPart,
  getCompatibilityProfile,
  getInstalledReferencePart,
} from "@/domain/compatibility/catalog";
import { evaluateCompatibility } from "@/domain/compatibility/evaluate";
import type {
  BuildSelection,
  CompatibilitySlotId,
} from "@/engine/compatibility/types";

const VALID_SLOT_IDS = new Set<CompatibilitySlotId>([
  "front-wheel",
  "rear-wheel",
  "front-tire",
  "rear-tire",
  "handlebar",
  "stem",
  "front-rotor",
  "rear-rotor",
  "seatpost",
  "saddle",
  "left-pedal",
  "right-pedal",
  "fork",
  "front-caliper",
  "rear-caliper",
  "crankset",
  "rear-transmission",
  "rear-derailleur",
]);

export function encodeBuildSelections(
  selections: Readonly<Record<string, string>>,
) {
  return Object.entries(selections)
    .filter(([slotId, partId]) => VALID_SLOT_IDS.has(slotId as CompatibilitySlotId) && Boolean(partId))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slotId, partId]) => `${slotId}=${partId}`)
    .join(";");
}

export function decodeBuildSelections(raw: string | null) {
  const selections: Record<string, string> = {};
  if (!raw) return selections;

  for (const item of raw.split(";")) {
    const [slotId, partId] = item.split("=");
    if (
      !slotId ||
      !partId ||
      !VALID_SLOT_IDS.has(slotId as CompatibilitySlotId)
    ) {
      continue;
    }
    selections[slotId] = partId;
  }

  return selections;
}

export function buildSelectionList(
  selections: Readonly<Record<string, string>>,
): BuildSelection[] {
  return Object.entries(selections)
    .filter(([slotId, partId]) => VALID_SLOT_IDS.has(slotId as CompatibilitySlotId) && Boolean(partId))
    .map(([slotId, partId]) => ({
      slotId: slotId as CompatibilitySlotId,
      partId,
    }));
}

export function sanitizeBuildSelections(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
) {
  const profile = getCompatibilityProfile(bikeId);
  if (!profile) return {};

  const safe: Record<string, string> = {};
  for (const [slotId, partId] of Object.entries(selections)) {
    const slot = profile.slots.find((item) => item.id === slotId);
    const part = getCompatibilityPart(partId);
    if (!slot || !part) continue;

    const installed = getInstalledReferencePart(bikeId, slot.id);
    if (
      evaluateCompatibility(slot, part).status === "compatible" &&
      installed?.id !== part.id
    ) {
      safe[slotId] = part.id;
    }
  }
  return safe;
}
