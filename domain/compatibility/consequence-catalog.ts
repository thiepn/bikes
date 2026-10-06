import consequenceJson from "@/content/compatibility/consequences.json";
import type { PartConsequenceProfile } from "@/engine/compatibility/consequence-types";

export const PART_CONSEQUENCE_PROFILES =
  consequenceJson.parts as PartConsequenceProfile[];

const BY_PART = new Map(
  PART_CONSEQUENCE_PROFILES.map((profile) => [profile.partId, profile]),
);

export function getPartConsequenceProfile(partId: string) {
  return BY_PART.get(partId) ?? null;
}
