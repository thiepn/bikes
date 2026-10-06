import urban from "../content/bikes/urban-u1.json" with { type: "json" };
import graph from "../content/assembly/urban-u1.json" with { type: "json" };
import geometry from "../content/geometry/urban-u1.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}

const componentIds = new Set(urban.components.map((item) => item.id));
const slugs = new Set(urban.components.map((item) => item.slug));
const validConnectionTypes = new Set([
  "bolted",
  "threaded",
  "clamped",
  "pressed",
  "bearing",
  "chain",
  "freehub",
  "axle",
  "splined",
  "mounted",
]);

assert(urban.id === "bike.urban.u1", "Urban U1 ID must remain stable.");
assert(urban.slug === "urban-u1", "Urban U1 slug must remain stable.");
assert(
  urban.archetype === "dutch-utility-city",
  "Urban U1 must remain the Dutch-style utility archetype.",
);
assert(
  urban.components.length >= 40,
  "Urban U1 must retain at least 40 semantic components.",
);
assert(
  new Set(urban.components.map((item) => item.id)).size === urban.components.length,
  "Urban U1 component IDs must be unique.",
);
assert(
  new Set(urban.components.map((item) => item.modelNode)).size === urban.components.length,
  "Urban U1 modelNode values must be unique.",
);

for (const system of ["lighting", "cargo-utility", "accessories"]) {
  assert(
    urban.systems.includes(system),
    `Urban U1 missing utility system: ${system}`,
  );
}

for (const required of [
  "chain-guard",
  "rear-rack",
  "front-fender",
  "rear-fender",
  "front-light",
  "rear-light",
  "kickstand",
  "frame-lock",
  "rear-hub",
  "rear-sprocket",
  "bell",
]) {
  assert(slugs.has(required), `Urban U1 missing defining component: ${required}`);
}

assert(
  !slugs.has("rear-derailleur"),
  "Urban U1 internal-gear architecture must not contain a rear derailleur.",
);
assert(
  !slugs.has("cassette"),
  "Urban U1 internal-gear architecture must not contain a cassette.",
);

for (const component of urban.components) {
  assert(
    component.id.startsWith("bike.urban.u1."),
    `Invalid Urban U1 component ID: ${component.id}`,
  );
  assert(
    component.modelNode.startsWith("COMP__"),
    `Invalid Urban U1 model node: ${component.modelNode}`,
  );
  assert(
    urban.systems.includes(component.systemId),
    `Unknown Urban U1 system for ${component.id}: ${component.systemId}`,
  );
}

assert(graph.bikeId === urban.id, "Urban assembly graph must target Urban U1.");
assert(
  graph.connections.length >= 20,
  "Urban U1 needs at least 20 structural/utility connections.",
);

for (const connection of graph.connections) {
  assert(
    componentIds.has(connection.from),
    `Urban assembly source missing: ${connection.from}`,
  );
  assert(
    componentIds.has(connection.to),
    `Urban assembly target missing: ${connection.to}`,
  );
  assert(
    validConnectionTypes.has(connection.type),
    `Urban assembly uses invalid connection type: ${connection.type}`,
  );
}

assert(geometry.bikeId === urban.id, "Urban geometry must target Urban U1.");
assert(
  geometry.source === "bike-atlas-reference",
  "Urban geometry must be marked as Bike Atlas reference data.",
);
assert(
  geometry.frontTravelMm === 0 && geometry.rearTravelMm === 0,
  "Urban U1 must remain a rigid utility archetype in P14.",
);

const interactionText = await readFile(
  "engine/interaction/component-availability.ts",
  "utf8",
);
const interactiveIds = new Set(
  [...interactionText.matchAll(/"bike\.urban\.u1\.[^"]+"/g)]
    .map((match) => match[0].slice(1, -1)),
);

assert(
  interactiveIds.size >= 35,
  "Urban U1 prototype must expose at least 35 semantic parts.",
);
for (const componentId of interactiveIds) {
  assert(
    componentIds.has(componentId),
    `Interactive Urban component missing from bike definition: ${componentId}`,
  );
}

const sceneText = await readFile("components/viewer/BikeScene.tsx", "utf8");
assert(
  sceneText.includes("UrbanPrototypeBike"),
  "Shared BikeScene must render UrbanPrototypeBike.",
);

const knowledgeText = await readFile(
  "domain/knowledge/catalog.ts",
  "utf8",
);
assert(
  knowledgeText.includes("getUrbanKnowledgeNode") &&
    knowledgeText.includes("searchUrbanKnowledge"),
  "Shared knowledge catalog must route Urban U1.",
);

if (errors.length) {
  console.error("\nUrban U1 validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ Urban U1 valid: ${urban.components.length} components, ${interactiveIds.size} interactive prototype parts, ${graph.connections.length} assembly connections.`,
);
