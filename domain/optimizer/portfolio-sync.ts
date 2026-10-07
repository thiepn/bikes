import type { SavedBuild } from "@/engine/optimizer/portfolio-types";

export const PORTFOLIO_SYNC_STORAGE_KEY =
  "bike-atlas:p29-sync:v1";
const MAX_RECOVERY_COPIES = 5;
const PORTFOLIO_SYNC_EVENT = "bike-atlas:p29-sync-change";

export type PortfolioRecoveryCopy = {
  id: string;
  createdAt: number;
  remoteRevision: number;
  entries: SavedBuild[];
};

export type PortfolioSyncMeta = {
  version: 1;
  baseRevision: number;
  dirty: boolean;
  lastSyncedAt: number | null;
  recoveryCopies: PortfolioRecoveryCopy[];
};

const EMPTY_META: PortfolioSyncMeta = {
  version: 1,
  baseRevision: 0,
  dirty: false,
  lastSyncedAt: null,
  recoveryCopies: [],
};

function isRecovery(value: unknown): value is PortfolioRecoveryCopy {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<PortfolioRecoveryCopy>;
  return (
    typeof row.id === "string" &&
    typeof row.createdAt === "number" &&
    typeof row.remoteRevision === "number" &&
    Array.isArray(row.entries)
  );
}

export function loadPortfolioSyncMeta(
  localEntries: readonly SavedBuild[] = [],
): PortfolioSyncMeta {
  if (typeof window === "undefined") {
    return {
      ...EMPTY_META,
      dirty: localEntries.length > 0,
    };
  }

  try {
    const raw = window.localStorage.getItem(
      PORTFOLIO_SYNC_STORAGE_KEY,
    );
    if (!raw) {
      return {
        ...EMPTY_META,
        dirty: localEntries.length > 0,
      };
    }

    const value = JSON.parse(raw) as Partial<PortfolioSyncMeta>;
    if (
      value.version !== 1 ||
      typeof value.baseRevision !== "number" ||
      typeof value.dirty !== "boolean"
    ) {
      return {
        ...EMPTY_META,
        dirty: localEntries.length > 0,
      };
    }

    return {
      version: 1,
      baseRevision: Math.max(0, Math.floor(value.baseRevision)),
      dirty: value.dirty,
      lastSyncedAt:
        typeof value.lastSyncedAt === "number"
          ? value.lastSyncedAt
          : null,
      recoveryCopies: Array.isArray(value.recoveryCopies)
        ? value.recoveryCopies
            .filter(isRecovery)
            .slice(0, MAX_RECOVERY_COPIES)
        : [],
    };
  } catch {
    return {
      ...EMPTY_META,
      dirty: localEntries.length > 0,
    };
  }
}

function writeMeta(meta: PortfolioSyncMeta) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PORTFOLIO_SYNC_STORAGE_KEY,
      JSON.stringify(meta),
    );
    window.dispatchEvent(new Event(PORTFOLIO_SYNC_EVENT));
  } catch {
    // Local-first behavior remains available even when metadata storage fails.
  }
}

export function subscribePortfolioSyncMeta(
  listener: () => void,
) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === PORTFOLIO_SYNC_STORAGE_KEY) listener();
  };

  window.addEventListener(PORTFOLIO_SYNC_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(PORTFOLIO_SYNC_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function portfolioRecoveryCount() {
  return loadPortfolioSyncMeta().recoveryCopies.length;
}

export function ensurePortfolioSyncMeta(
  localEntries: readonly SavedBuild[],
) {
  const meta = loadPortfolioSyncMeta(localEntries);
  writeMeta(meta);
  return meta;
}

export function markPortfolioDirty(
  localEntries: readonly SavedBuild[],
) {
  const meta = loadPortfolioSyncMeta(localEntries);
  const next = { ...meta, dirty: true };
  writeMeta(next);
  return next;
}

export function markPortfolioSynced(
  revision: number,
  localEntries: readonly SavedBuild[],
) {
  const meta = loadPortfolioSyncMeta(localEntries);
  const next: PortfolioSyncMeta = {
    ...meta,
    baseRevision: revision,
    dirty: false,
    lastSyncedAt: Date.now(),
  };
  writeMeta(next);
  return next;
}

export function preservePortfolioRecovery(
  entries: readonly SavedBuild[],
  remoteRevision: number,
) {
  const meta = loadPortfolioSyncMeta(entries);
  const recovery: PortfolioRecoveryCopy = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    remoteRevision,
    entries: entries.map((entry) => ({
      ...entry,
      selections: { ...entry.selections },
    })),
  };

  const next: PortfolioSyncMeta = {
    ...meta,
    recoveryCopies: [
      recovery,
      ...meta.recoveryCopies,
    ].slice(0, MAX_RECOVERY_COPIES),
  };
  writeMeta(next);
  return recovery;
}

export function latestPortfolioRecovery(
  localEntries: readonly SavedBuild[],
) {
  return loadPortfolioSyncMeta(localEntries).recoveryCopies[0] ?? null;
}
