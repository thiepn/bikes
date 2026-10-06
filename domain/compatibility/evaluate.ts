import {
  getCompatibilityPart,
  getCompatibilityProfile,
} from "@/domain/compatibility/catalog";
import type {
  CompatibilityPart,
  CompatibilityReason,
  CompatibilityResult,
  CompatibilitySlot,
  CompatibilitySlotId,
  InterfaceRequirement,
} from "@/engine/compatibility/types";

function display(value: unknown, unit?: string) {
  if (value === undefined || value === null) return "not provided";
  return `${String(value)}${unit ? ` ${unit}` : ""}`;
}

function evaluateRequirement(
  requirement: InterfaceRequirement,
  part: CompatibilityPart,
): CompatibilityReason {
  const actual = part.interfaces[requirement.key];

  if (actual === undefined) {
    return {
      key: requirement.key,
      label: requirement.label,
      status: "unknown",
      expected:
        requirement.kind === "exact"
          ? display(requirement.expected, requirement.unit)
          : `${requirement.min}–${requirement.max}${requirement.unit ? ` ${requirement.unit}` : ""}`,
      actual: "not provided",
    };
  }

  if (requirement.kind === "exact") {
    const matches = actual === requirement.expected;
    return {
      key: requirement.key,
      label: requirement.label,
      status: matches ? "match" : "mismatch",
      expected: display(requirement.expected, requirement.unit),
      actual: display(actual, requirement.unit),
    };
  }

  if (typeof actual !== "number") {
    return {
      key: requirement.key,
      label: requirement.label,
      status: "unknown",
      expected: `${requirement.min}–${requirement.max}${requirement.unit ? ` ${requirement.unit}` : ""}`,
      actual: display(actual, requirement.unit),
    };
  }

  const matches =
    actual >= requirement.min && actual <= requirement.max;

  return {
    key: requirement.key,
    label: requirement.label,
    status: matches ? "match" : "mismatch",
    expected: `${requirement.min}–${requirement.max}${requirement.unit ? ` ${requirement.unit}` : ""}`,
    actual: display(actual, requirement.unit),
  };
}

export function evaluateCompatibility(
  slot: CompatibilitySlot,
  part: CompatibilityPart,
): CompatibilityResult {
  if (slot.id !== part.slotId) {
    return {
      status: "incompatible",
      slotId: slot.id,
      partId: part.id,
      reasons: [
        {
          key: "slot",
          label: "Component role",
          status: "mismatch",
          expected: slot.label,
          actual: part.slotId,
        },
      ],
    };
  }

  const reasons = slot.requirements.map((requirement) =>
    evaluateRequirement(requirement, part),
  );

  const status = reasons.some((reason) => reason.status === "mismatch")
    ? "incompatible"
    : reasons.some((reason) => reason.status === "unknown")
      ? "unknown"
      : "compatible";

  return {
    status,
    slotId: slot.id,
    partId: part.id,
    reasons,
  };
}

export function evaluatePartForBike(
  bikeId: string,
  slotId: CompatibilitySlotId,
  partId: string,
) {
  const profile = getCompatibilityProfile(bikeId);
  const slot = profile?.slots.find((item) => item.id === slotId);
  const part = getCompatibilityPart(partId);
  if (!slot || !part) return null;
  return evaluateCompatibility(slot, part);
}

export function compatiblePartsForBikeSlot(
  bikeId: string,
  slotId: CompatibilitySlotId,
) {
  const profile = getCompatibilityProfile(bikeId);
  const slot = profile?.slots.find((item) => item.id === slotId);
  if (!slot) return [];

  return import("@/domain/compatibility/catalog").then(
    ({ getCompatibilityPartsForSlot }) =>
      getCompatibilityPartsForSlot(slotId)
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
        }),
  );
}
