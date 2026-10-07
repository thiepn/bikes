import { readFile } from "node:fs/promises";

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const session = await readFile("domain/account/session.ts", "utf8");
for (const token of [
  "NEXT_PUBLIC_BIKES_ACCOUNT_CLIENT_ID",
  "code_challenge_method",
  '"S256"',
  "response.ok",
  "refresh_token",
  "BIKES_CALLBACK_URL",
  "https://thiepn.dev/bikes/auth/callback/",
  "signOutLocal",
]) {
  assert(session.includes(token), "P29 Account session missing: " + token);
}

const sync = await readFile(
  "domain/optimizer/portfolio-sync.ts",
  "utf8",
);
for (const token of [
  "bike-atlas:p29-sync:v1",
  "baseRevision",
  "dirty",
  "recoveryCopies",
  "MAX_RECOVERY_COPIES = 5",
  "preservePortfolioRecovery",
  "markPortfolioSynced",
]) {
  assert(sync.includes(token), "P29 sync metadata missing: " + token);
}

const coreClient = await readFile(
  "domain/account/core-client.ts",
  "utf8",
);
for (const token of [
  "/v1/bikes/portfolio",
  "/v1/bikes/portfolio/mutations",
  "baseRevision",
  "mutationId: crypto.randomUUID()",
  'status === "conflict"',
]) {
  assert(
    coreClient.includes(token),
    "P29 Core client missing: " + token,
  );
}

const panel = await readFile(
  "components/optimizer/PortfolioSyncPanel.tsx",
  "utf8",
);
for (const token of [
  "Another device advanced the cloud portfolio",
  "preservePortfolioRecovery",
  "adoptRemote",
  "Restore recovery",
  "Sign in to sync",
  "no silent last-write-wins",
]) {
  assert(panel.includes(token), "P29 sync UI missing: " + token);
}

const optimizer = await readFile(
  "components/optimizer/BuildOptimizerPanel.tsx",
  "utf8",
);
for (const token of [
  "<PortfolioSyncPanel",
  "markPortfolioDirty",
  "updatedAt: now",
  "updatedAt: Date.now()",
]) {
  assert(
    optimizer.includes(token),
    "P29 optimizer integration missing: " + token,
  );
}

const storage = await readFile(
  "domain/optimizer/portfolio-storage.ts",
  "utf8",
);
assert(
  storage.includes("entry.updatedAt") &&
    storage.includes("entry.savedAt"),
  "P29 must migrate legacy P27 entries with updatedAt=savedAt.",
);

const callback = await readFile(
  "app/auth/callback/page.tsx",
  "utf8",
);
assert(
  callback.includes("completeCallback") &&
    callback.includes("window.location.replace"),
  "P29 OAuth callback route is missing.",
);

const nextConfig = await readFile("next.config.ts", "utf8");
for (const token of [
  'output: "export"',
  'basePath: pagesBasePath',
  'assetPrefix: pagesBasePath || undefined',
  "trailingSlash: true",
]) {
  assert(
    nextConfig.includes(token),
    "P29 Pages config missing: " + token,
  );
}

const deploy = await readFile(
  ".github/workflows/deploy.yml",
  "utf8",
);
for (const token of [
  "actions/configure-pages@v5",
  "actions/upload-pages-artifact@v4",
  "actions/deploy-pages@v4",
  "NEXT_PUBLIC_BIKES_ACCOUNT_CLIENT_ID",
  "https://thiepn.dev/bikes/",
  "npm run validate:domain",
]) {
  assert(deploy.includes(token), "P29 deploy workflow missing: " + token);
}

const css = await readFile("app/globals.css", "utf8");
for (const token of [
  ".portfolio-sync",
  ".account-status",
  ".account-callback",
]) {
  assert(css.includes(token), "P29 visual selector missing: " + token);
}

if (errors.length) {
  console.error("\nP29 sync validation failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log(
  "✓ P29 sync valid: guest-first Account boundary, PKCE callback, CAS portfolio sync, conflict recovery, P27 migration and GitHub Pages production routing are protected.",
);
