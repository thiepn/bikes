import mtb from "../content/bikes/mtb-m1.json" with { type: "json" };
import graph from "../content/assembly/mtb-m1.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(mtb.id === "bike.mtb.m1", "MTB M1 ID must remain stable.");
assert(mtb.slug === "mtb-m1", "MTB M1 slug must remain stable.");
assert(mtb.archetype === "trail-full-suspension", "MTB M1 must remain a full-suspension trail archetype.");
assert(mtb.components.length >= 35, "MTB M1 must define at least 35 semantic components.");
assert(new Set(mtb.components.map((item) => item.id)).size === mtb.components.length, "MTB component IDs must be unique.");
assert(new Set(mtb.components.map((item) => item.modelNode)).size === mtb.components.length, "MTB modelNode values must be unique.");
assert(mtb.systems.includes("rear-suspension"), "MTB M1 must expose a rear-suspension system.");

const componentIds = new Set(mtb.components.map((component) => component.id));
const slugs = new Set(mtb.components.map((component) => component.slug));

for (const component of mtb.components) {
  assert(component.id.startsWith("bike.mtb.m1."), `Invalid MTB stable ID: ${component.id}`);
  assert(!component.id.startsWith("bike.road.r1."), `Road component leaked into MTB M1: ${component.id}`);
  assert(component.modelNode.startsWith("COMP__"), `Invalid MTB semantic node: ${component.modelNode}`);
  assert(mtb.systems.includes(component.systemId), `Unknown MTB system ${component.systemId} for ${component.id}`);
}

for (const required of [
  "rear-shock",
  "suspension-linkage",
  "dropper-post",
  "dropper-remote",
  "chainring",
]) {
  assert(slugs.has(required), `MTB M1 missing distinguishing component: ${required}`);
}

assert(!slugs.has("front-derailleur"), "MTB M1 foundation is intentionally 1x and must not contain a front derailleur.");

assert(graph.bikeId === mtb.id, "MTB assembly graph must target MTB M1.");
assert(graph.connections.length >= 15, "MTB M1 needs a meaningful assembly connection foundation.");

for (const connection of graph.connections) {
  assert(componentIds.has(connection.from), `MTB assembly source missing: ${connection.from}`);
  assert(componentIds.has(connection.to), `MTB assembly target missing: ${connection.to}`);
}

const interactionText = await readFile(
  "engine/interaction/component-availability.ts",
  "utf8",
);
const interactiveIds = new Set(
  [...interactionText.matchAll(/"bike\.mtb\.m1\.[^"]+"/g)]
    .map((match) => match[0].slice(1, -1)),
);

assert(interactiveIds.size >= 25, "MTB prototype must expose at least 25 semantic components.");

for (const componentId of interactiveIds) {
  assert(componentIds.has(componentId), `Interactive MTB component does not exist in semantic model: ${componentId}`);
}

if (errors.length) {
  console.error("\nMTB M1 validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ MTB M1 valid: ${mtb.components.length} components, ${interactiveIds.size} interactive prototype parts, ${graph.connections.length} assembly connections.`,
);
