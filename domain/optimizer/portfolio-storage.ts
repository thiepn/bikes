import type { SavedBuild } from "@/engine/optimizer/portfolio-types";

export const PORTFOLIO_STORAGE_KEY =
  "bike-atlas:p27-portfolio:v1";
export const MAX_PORTFOLIO_BUILDS_PER_BIKE = 8;

function isSavedBuild(value: unknown): value is SavedBuild {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<SavedBuild>;

  return (
    typeof entry.id === "string" &&
    typeof entry.bikeId === "string" &&
    typeof entry.name === "string" &&
    typeof entry.savedAt === "number" &&
    (entry.source === "current" ||
      entry.source === "ranked" ||
      entry.source === "frontier") &&
    Boolean(entry.selections) &&
    typeof entry.selections === "object"
  );
}

export function loadSavedBuilds(): SavedBuild[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(
      PORTFOLIO_STORAGE_KEY,
    );
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isSavedBuild)
      .map((entry) => ({
        ...entry,
        name: entry.name.slice(0, 48),
      }));
  } catch {
    return [];
  }
}

export function persistSavedBuilds(
  entries: readonly SavedBuild[],
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      PORTFOLIO_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // Browser storage can be unavailable or full. The in-memory
    // portfolio remains usable for the current session.
  }
}
