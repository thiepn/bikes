"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useBikeAccount } from "@/components/account/useBikeAccount";
import {
  fetchCloudPortfolio,
  mutateCloudPortfolio,
} from "@/domain/account/core-client";
import {
  ensurePortfolioSyncMeta,
  latestPortfolioRecovery,
  markPortfolioDirty,
  portfolioRecoveryCount,
  subscribePortfolioSyncMeta,
  markPortfolioSynced,
  preservePortfolioRecovery,
} from "@/domain/optimizer/portfolio-sync";
import {
  persistSavedBuilds,
} from "@/domain/optimizer/portfolio-storage";
import type { SavedBuild } from "@/engine/optimizer/portfolio-types";

type Props = {
  entries: readonly SavedBuild[];
  loaded: boolean;
  onReplaceEntries: (entries: SavedBuild[]) => void;
};

type Status =
  | "local"
  | "syncing"
  | "synced"
  | "conflict"
  | "error";

export function PortfolioSyncPanel({
  entries,
  loaded,
  onReplaceEntries,
}: Props) {
  const account = useBikeAccount();
  const [status, setStatus] = useState<Status>("local");
  const [notice, setNotice] = useState("");
  const recoveryCount = useSyncExternalStore(
    subscribePortfolioSyncMeta,
    portfolioRecoveryCount,
    () => 0,
  );
  const syncedIdentity = useRef<string | null>(null);

  const adoptRemote = useCallback(
    (remoteEntries: SavedBuild[], revision: number) => {
      persistSavedBuilds(remoteEntries);
      markPortfolioSynced(revision, remoteEntries);
      onReplaceEntries(remoteEntries);
    },
    [onReplaceEntries],
  );

  const syncNow = useCallback(async () => {
    if (!loaded || account.identity.status !== "signed-in") return;

    setStatus("syncing");
    setNotice("Checking cloud revision…");

    try {
      const token = await account.getAccessToken();
      if (!token) throw new Error("ACCOUNT_TOKEN_UNAVAILABLE");

      const meta = ensurePortfolioSyncMeta(entries);
      const remote = await fetchCloudPortfolio(token);

      if (meta.dirty && remote.revision !== meta.baseRevision) {
        preservePortfolioRecovery(entries, remote.revision);
        adoptRemote(remote.entries, remote.revision);
        setStatus("conflict");
        setNotice(
          "Another device advanced the cloud portfolio. Your local candidate was preserved as a recovery copy before the cloud version was restored.",
        );
        return;
      }

      if (!meta.dirty) {
        if (remote.revision !== meta.baseRevision) {
          adoptRemote(remote.entries, remote.revision);
          setNotice("Cloud portfolio restored on this device.");
        } else {
          markPortfolioSynced(remote.revision, entries);
          setNotice("Portfolio is up to date.");
        }
        setStatus("synced");
        return;
      }

      const result = await mutateCloudPortfolio(
        token,
        meta.baseRevision,
        entries,
      );

      if (result.status === "conflict") {
        preservePortfolioRecovery(entries, result.remoteRevision);
        adoptRemote(result.remote.entries, result.remoteRevision);
        setStatus("conflict");
        setNotice(
          "Sync conflict detected. The local candidate was preserved and the authoritative cloud revision was restored.",
        );
        return;
      }

      adoptRemote(result.document.entries, result.revision);
      setStatus("synced");
      setNotice("Portfolio synced across devices.");
    } catch {
      setStatus("error");
      setNotice(
        "Cloud sync is unavailable. Local Portfolio data remains unchanged.",
      );
    }
  }, [account, adoptRemote, entries, loaded]);

  useEffect(() => {
    if (!loaded) return;
    ensurePortfolioSyncMeta(entries);
  }, [entries, loaded]);

  useEffect(() => {
    if (
      account.identity.status !== "signed-in" ||
      !loaded ||
      syncedIdentity.current === account.identity.id
    ) {
      return;
    }

    syncedIdentity.current = account.identity.id;
    void syncNow();
  }, [account.identity, loaded, syncNow]);

  function restoreRecovery() {
    const recovery = latestPortfolioRecovery(entries);
    if (!recovery) return;

    const restored = recovery.entries.map((entry) => ({
      ...entry,
      selections: { ...entry.selections },
      updatedAt: Math.max(entry.updatedAt, Date.now()),
    }));
    persistSavedBuilds(restored);
    markPortfolioDirty(restored);
    onReplaceEntries(restored);
    setStatus("local");
    setNotice(
      "Recovery copy restored locally. Review it, then sync again to explicitly replace the current cloud Portfolio.",
    );
  }

  if (!account.configured) {
    return (
      <section className="portfolio-sync" aria-label="Portfolio cloud sync">
        <div>
          <span>P29 account sync</span>
          <strong>Local-first Portfolio is ready.</strong>
          <p>
            Production Account activation is pending the Bike Atlas public
            OAuth client registration. Local saving and P28 export remain
            fully available.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={"portfolio-sync portfolio-sync--" + status}
      aria-label="Portfolio cloud sync"
    >
      <div className="portfolio-sync__copy">
        <span>P29 account sync</span>
        {account.identity.status === "signed-in" ? (
          <>
            <strong>
              {status === "syncing"
                ? "Syncing Portfolio…"
                : status === "synced"
                  ? "Cross-device Portfolio active"
                  : status === "conflict"
                    ? "Recovery copy preserved"
                    : "Local-first Portfolio"}
            </strong>
            <p>{notice || "Signed in with THIEPN Account."}</p>
          </>
        ) : account.identity.status === "checking" ? (
          <>
            <strong>Checking THIEPN Account…</strong>
            <p>Local Portfolio data remains available during verification.</p>
          </>
        ) : (
          <>
            <strong>Optional cross-device recovery</strong>
            <p>
              Sign in to sync the saved Portfolio. Bike Atlas remains usable
              without an account.
            </p>
          </>
        )}
      </div>

      <div className="portfolio-sync__actions">
        {account.identity.status === "signed-in" ? (
          <>
            <button
              type="button"
              onClick={() => void syncNow()}
              disabled={status === "syncing"}
            >
              Sync now
            </button>
            <button type="button" onClick={account.signOut}>
              Sign out locally
            </button>
          </>
        ) : account.identity.status !== "checking" ? (
          <button type="button" onClick={() => void account.signIn()}>
            Sign in to sync
          </button>
        ) : null}

        {recoveryCount > 0 && (
          <button type="button" onClick={restoreRecovery}>
            Restore recovery ({recoveryCount})
          </button>
        )}
      </div>

      <small>
        Whole-document revision sync · no silent last-write-wins · local
        recovery retained on conflict.
      </small>
    </section>
  );
}
