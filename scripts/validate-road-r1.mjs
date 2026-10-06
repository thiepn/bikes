import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { createHash } from "node:crypto";
import bike from "../content/bikes/road-r1.json" with { type: "json" };
import asset from "../content/assets/road-r1.asset.json" with { type: "json" };

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(bike.id === asset.bikeId, "Bike ID and asset bikeId must match.");
assert(bike.components.length >= 35, "Road R1 must define at least 35 semantic components.");
assert(new Set(bike.components.map((item) => item.id)).size === bike.components.length, "Component IDs must be unique.");
assert(new Set(bike.components.map((item) => item.modelNode)).size === bike.components.length, "Component modelNode values must be unique.");

for (const component of bike.components) {
  assert(component.id.startsWith("bike.road.r1."), `Invalid stable ID: ${component.id}`);
  assert(component.modelNode.startsWith("COMP__"), `Invalid semantic node: ${component.modelNode}`);
  assert(bike.systems.includes(component.systemId), `Unknown system ${component.systemId} for ${component.id}`);
}

assert(asset.source.license === "CC-BY-4.0", "Road R1 source license must remain explicit.");
assert(/^[0-9a-f]{40}$/.test(asset.source.gitBlobSha1), "Pinned source Git blob SHA must be a SHA-1.");
assert(asset.runtime.format === "glb", "Production runtime format must be GLB.");
assert(asset.runtime.lods.length === 4, "Road R1 requires four declared LOD targets.");
assert(asset.runtime.lods.map((lod) => lod.level).join(",") === "0,1,2,3", "LOD levels must be 0,1,2,3.");

try {
  await access(asset.local.sourcePath, constants.R_OK);
  const bytes = await readFile(asset.local.sourcePath);
  const header = Buffer.from(`blob ${bytes.byteLength}\0`);
  const actualSha = createHash("sha1").update(header).update(bytes).digest("hex");
  assert(actualSha === asset.source.gitBlobSha1, "Local Road R1 source does not match the pinned upstream Git blob SHA.");
  console.log("✓ Local Road R1 source is present and verified.");
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    console.log("• Road R1 source FBX not present locally (expected in CI). Run npm run asset:road-r1:fetch when authoring the asset.");
  } else {
    throw error;
  }
}

if (errors.length) {
  console.error("\nRoad R1 asset validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`✓ Road R1 metadata valid: ${bike.components.length} semantic components, 4 LOD targets, pinned CC BY source.`);
