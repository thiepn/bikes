import type { SavedBuild } from "@/engine/optimizer/portfolio-types";

export const PORTFOLIO_STORAGE_KEY =
  "bike-atlas:p27-portfolio:v1";
export const MAX_PORTFOLIO_BUILDS_PER_BIKE = 8;

function capPerBike(entries: readonly SavedBuild[]) {
  const counts = new Map<string, number>();

  return [...entries]
    .sort((a, b) => a.savedAt - b.savedAt)
    .filter((entry) => {
      const count = counts.get(entry.bikeId) ?? 0;
      if (count >= MAX_PORTFOLIO_BUILDS_PER_BIKE) return false;
      counts.set(entry.bikeId, count + 1);
      return true;
    });
}

function isSavedBuild(value: unknown): value is SavedBuild {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<SavedBuild>;

  return (
    typeof entry.id === "string" &&
    typeof entry.bikeId === "string" &&
    typeof entry.name === "string" &&
    typeof entry.savedAt === "number" &&
    (entry.updatedAt === undefined ||
      typeof entry.updatedAt === "number") &&
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

    return capPerBike(
      parsed
        .filter(isSavedBuild)
        .map((entry) => ({
          ...entry,
          name: entry.name.slice(0, 48),
          updatedAt:
            typeof entry.updatedAt === "number"
              ? entry.updatedAt
              : entry.savedAt,
        })),
    );
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
      JSON.stringify(
        capPerBike(entries).map((entry) => ({
          ...entry,
          updatedAt:
            typeof entry.updatedAt === "number"
              ? entry.updatedAt
              : entry.savedAt,
        })),
      ),
    );
  } catch {
    // Browser storage can be unavailable or full. The in-memory
    // portfolio remains usable for the current session.
  }
}
