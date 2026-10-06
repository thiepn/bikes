import referenceJson from "@/content/compatibility/reference.json";
import type {
  BikeCompatibilityProfile,
  CompatibilityPart,
  CompatibilitySlotId,
} from "@/engine/compatibility/types";

export const COMPATIBILITY_PROFILES =
  referenceJson.profiles as BikeCompatibilityProfile[];

export const COMPATIBILITY_PARTS =
  referenceJson.parts as CompatibilityPart[];

const PROFILE_BY_BIKE = new Map(
  COMPATIBILITY_PROFILES.map((profile) => [profile.bikeId, profile]),
);

const PART_BY_ID = new Map(
  COMPATIBILITY_PARTS.map((part) => [part.id, part]),
);

export function getCompatibilityProfile(bikeId: string) {
  return PROFILE_BY_BIKE.get(bikeId) ?? null;
}

export function getCompatibilityPart(partId: string) {
  return PART_BY_ID.get(partId) ?? null;
}

export function getCompatibilityPartsForSlot(slotId: CompatibilitySlotId) {
  return COMPATIBILITY_PARTS.filter((part) => part.slotId === slotId);
}

export function getInstalledReferencePart(
  bikeId: string,
  slotId: CompatibilitySlotId,
) {
  return (
    COMPATIBILITY_PARTS.find(
      (part) =>
        part.sourceBikeId === bikeId &&
        part.slotId === slotId,
    ) ?? null
  );
}
