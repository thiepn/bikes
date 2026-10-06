import visualJson from "@/content/compatibility/visual-attachments.json";
import type {
  BikeBuildVisualProfile,
  DonorVisualProfile,
} from "@/engine/compatibility/visual-types";

export const BUILD_VISUAL_HOSTS =
  visualJson.hosts as BikeBuildVisualProfile[];

export const DONOR_VISUAL_PROFILES =
  visualJson.donorProfiles as DonorVisualProfile[];

const HOST_BY_BIKE = new Map(
  BUILD_VISUAL_HOSTS.map((profile) => [profile.bikeId, profile]),
);

const DONOR_BY_BIKE = new Map(
  DONOR_VISUAL_PROFILES.map((profile) => [profile.bikeId, profile]),
);

export function getBuildVisualHost(bikeId: string) {
  return HOST_BY_BIKE.get(bikeId) ?? null;
}

export function getDonorVisualProfile(bikeId: string) {
  return DONOR_BY_BIKE.get(bikeId) ?? null;
}

export function getBuildHiddenComponentIds(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
) {
  const host = getBuildVisualHost(bikeId);
  if (!host) return [];

  const changedSlots = new Set(Object.keys(selections));
  return host.attachments.flatMap((attachment) =>
    changedSlots.has(attachment.slotId)
      ? attachment.hiddenComponentIds
      : [],
  );
}
