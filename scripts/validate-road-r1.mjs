import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { createHash } from "node:crypto";
import bike from "../content/bikes/road-r1.json" with { type: "json" };
import asset from "../content/assets/road-r1.asset.json" with { type: "json" };
import assembly from "../content/assembly/road-r1.json" with { type: "json" };
import lesson from "../content/lessons/drivetrain-basics.json" with { type: "json" };

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(bike.id === asset.bikeId, "Bike ID and asset bikeId must match.");
assert(bike.components.length >= 35, "Road R1 must define at least 35 semantic components.");
assert(new Set(bike.components.map((item) => item.id)).size === bike.components.length, "Component IDs must be unique.");
assert(new Set(bike.components.map((item) => item.modelNode)).size === bike.components.length, "Component modelNode values must be unique.");

const componentIds = new Set(bike.components.map((component) => component.id));

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

assert(assembly.bikeId === bike.id, "Assembly graph must target Road R1.");
for (const connection of assembly.connections) {
  assert(componentIds.has(connection.from), `Assembly connection source missing: ${connection.from}`);
  assert(componentIds.has(connection.to), `Assembly connection target missing: ${connection.to}`);
}

const operationIds = new Set(assembly.operations.map((operation) => operation.id));
assert(operationIds.size === assembly.operations.length, "Assembly operation IDs must be unique.");

for (const operation of assembly.operations) {
  assert(componentIds.has(operation.targetId), `Assembly operation target missing: ${operation.targetId}`);
  for (const prerequisite of operation.prerequisites) {
    assert(operationIds.has(prerequisite), `Unknown assembly prerequisite: ${prerequisite}`);
  }
}

const operationMap = new Map(
  assembly.operations.map((operation) => [operation.id, operation]),
);
const visiting = new Set();
const visited = new Set();

function visitOperation(id) {
  if (visiting.has(id)) {
    errors.push(`Assembly prerequisite cycle detected at ${id}`);
    return;
  }
  if (visited.has(id)) return;

  visiting.add(id);
  const operation = operationMap.get(id);
  for (const prerequisite of operation?.prerequisites ?? []) {
    visitOperation(prerequisite);
  }
  visiting.delete(id);
  visited.add(id);
}

for (const id of operationIds) visitOperation(id);

assert(lesson.steps.length >= 5, "Drivetrain lesson should contain at least five steps.");
assert(new Set(lesson.steps.map((step) => step.id)).size === lesson.steps.length, "Lesson step IDs must be unique.");

for (const step of lesson.steps) {
  assert(componentIds.has(step.focusComponentId), `Lesson focus component missing: ${step.focusComponentId}`);
  for (const componentId of step.highlightComponentIds) {
    assert(componentIds.has(componentId), `Lesson highlight component missing: ${componentId}`);
  }
  assert(
    Number.isInteger(step.demo.gearIndex) &&
      step.demo.gearIndex >= 0 &&
      step.demo.gearIndex <= 4,
    `Invalid lesson gear index in step ${step.id}`,
  );
  assert(step.demo.cadenceRpm >= 0, `Invalid cadence in step ${step.id}`);
}

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
  console.error("\nRoad R1 validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ Road R1 valid: ${bike.components.length} components, ${assembly.connections.length} assembly connections, ${assembly.operations.length} operations, ${lesson.steps.length}-step drivetrain lesson.`,
);
