"use client";

import { BIKES_CORE_URL } from "@/domain/account/session";
import type { SavedBuild } from "@/engine/optimizer/portfolio-types";

export type CloudPortfolio = {
  schemaVersion: 1;
  revision: number;
  updatedAt: string;
  entries: SavedBuild[];
};

export type PortfolioMutationResult =
  | {
      status: "applied";
      revision: number;
      document: CloudPortfolio;
    }
  | {
      status: "conflict";
      remoteRevision: number;
      remote: CloudPortfolio;
    };

type Envelope<T> =
  | { ok: true; data: T; meta: { requestId: string } }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        requestId: string;
      };
    };

function validEntry(value: unknown): value is SavedBuild {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<SavedBuild>;
  return (
    typeof entry.id === "string" &&
    typeof entry.bikeId === "string" &&
    typeof entry.name === "string" &&
    typeof entry.savedAt === "number" &&
    typeof entry.updatedAt === "number" &&
    Boolean(entry.selections) &&
    typeof entry.selections === "object" &&
    (entry.source === "current" ||
      entry.source === "ranked" ||
      entry.source === "frontier")
  );
}

function parseCloudPortfolio(value: unknown): CloudPortfolio {
  if (!value || typeof value !== "object") {
    throw new Error("BIKES_SYNC_INVALID_RESPONSE");
  }
  const row = value as Partial<CloudPortfolio>;
  if (
    row.schemaVersion !== 1 ||
    typeof row.revision !== "number" ||
    !Number.isSafeInteger(row.revision) ||
    row.revision < 0 ||
    typeof row.updatedAt !== "string" ||
    !Array.isArray(row.entries) ||
    !row.entries.every(validEntry)
  ) {
    throw new Error("BIKES_SYNC_INVALID_RESPONSE");
  }
  return row as CloudPortfolio;
}

async function request<T>(
  path: string,
  token: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(new URL(path, BIKES_CORE_URL), {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    credentials: "omit",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });

  const payload = (await response.json()) as Envelope<unknown>;
  if (!response.ok || !payload.ok) {
    const code =
      payload && !payload.ok
        ? payload.error.code
        : "BIKES_SYNC_UNAVAILABLE";
    throw new Error(code);
  }
  return payload.data as T;
}

export async function fetchCloudPortfolio(token: string) {
  return parseCloudPortfolio(
    await request<unknown>("/v1/bikes/portfolio", token, {
      method: "GET",
    }),
  );
}

export async function mutateCloudPortfolio(
  token: string,
  baseRevision: number,
  entries: readonly SavedBuild[],
): Promise<PortfolioMutationResult> {
  const raw = await request<unknown>(
    "/v1/bikes/portfolio/mutations",
    token,
    {
      method: "POST",
      body: JSON.stringify({
        mutationId: crypto.randomUUID(),
        baseRevision,
        document: {
          schemaVersion: 1,
          entries,
        },
      }),
    },
  );

  if (!raw || typeof raw !== "object") {
    throw new Error("BIKES_SYNC_INVALID_RESPONSE");
  }
  const row = raw as Record<string, unknown>;

  if (
    row.status === "applied" &&
    typeof row.revision === "number"
  ) {
    return {
      status: "applied",
      revision: row.revision,
      document: parseCloudPortfolio(row.document),
    };
  }

  if (
    row.status === "conflict" &&
    typeof row.remoteRevision === "number"
  ) {
    return {
      status: "conflict",
      remoteRevision: row.remoteRevision,
      remote: parseCloudPortfolio(row.remote),
    };
  }

  throw new Error("BIKES_SYNC_INVALID_RESPONSE");
}
