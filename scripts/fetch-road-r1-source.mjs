import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import manifest from "../content/assets/road-r1.asset.json" with { type: "json" };

function gitBlobSha1(bytes) {
  const header = Buffer.from(`blob ${bytes.byteLength}\0`);
  return createHash("sha1")
    .update(header)
    .update(Buffer.from(bytes))
    .digest("hex");
}

const destination = resolve(manifest.local.sourcePath);

console.log(`Fetching Road R1 source from ${manifest.source.sourceRepositoryUrl}`);
const response = await fetch(manifest.source.downloadUrl, {
  headers: { "User-Agent": "bike-atlas-asset-fetcher" },
});

if (!response.ok) {
  throw new Error(
    `Road R1 source download failed: ${response.status} ${response.statusText}`,
  );
}

const bytes = new Uint8Array(await response.arrayBuffer());
const actualSha = gitBlobSha1(bytes);

if (actualSha !== manifest.source.gitBlobSha1) {
  throw new Error(
    [
      "Road R1 source integrity check failed.",
      `Expected Git blob SHA: ${manifest.source.gitBlobSha1}`,
      `Actual Git blob SHA:   ${actualSha}`,
      "The upstream model may have changed. Review provenance before updating the pinned SHA.",
    ].join("\n"),
  );
}

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, bytes);

console.log(
  `Verified and wrote ${bytes.byteLength.toLocaleString()} bytes to ${destination}`,
);
