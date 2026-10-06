import gravel from "../content/bikes/gravel-g1.json" with { type: "json" };
import graph from "../content/assembly/gravel-g1.json" with { type: "json" };
import geometry from "../content/geometry/gravel-g1.json" with { type: "json" };
import profilesJson from "../content/finder/profiles.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}

const componentIds = new Set(gravel.components.map((item) => item.id));
const slugs = new Set(gravel.components.map((item) => item.slug));
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

assert(gravel.id === "bike.gravel.g1", "Gravel G1 ID must remain stable.");
assert(gravel.slug === "gravel-g1", "Gravel G1 slug must remain stable.");
assert(
  gravel.archetype === "gravel-all-road",
  "Gravel G1 must remain the gravel/all-road archetype.",
);
assert(
  gravel.components.length >= 32,
  "Gravel G1 must retain at least 32 semantic components.",
);
assert(
  new Set(gravel.components.map((item) => item.id)).size ===
    gravel.components.length,
  "Gravel G1 component IDs must be unique.",
);
assert(
  new Set(gravel.components.map((item) => item.modelNode)).size ===
    gravel.components.length,
  "Gravel G1 modelNode values must be unique.",
);

for (const required of [
  "handlebar",
  "chainring",
  "cassette",
  "rear-derailleur",
  "front-tire",
  "rear-tire",
  "frame-mounts",
  "fork-mounts",
  "downtube-protector",
]) {
  assert(
    slugs.has(required),
    `Gravel G1 missing defining component: ${required}`,
  );
}

assert(
  !slugs.has("front-derailleur"),
  "Gravel G1 is intentionally 1x and must not contain a front derailleur.",
);
assert(
  !slugs.has("rear-shock"),
  "Gravel G1 reference is intentionally rigid in P16.",
);

for (const component of gravel.components) {
  assert(
    component.id.startsWith("bike.gravel.g1."),
    `Invalid Gravel G1 component ID: ${component.id}`,
  );
  assert(
    component.modelNode.startsWith("COMP__"),
    `Invalid Gravel G1 model node: ${component.modelNode}`,
  );
  assert(
    gravel.systems.includes(component.systemId),
    `Unknown Gravel G1 system for ${component.id}: ${component.systemId}`,
  );
}

assert(
  graph.bikeId === gravel.id,
  "Gravel assembly graph must target Gravel G1.",
);
assert(
  graph.connections.length >= 18,
  "Gravel G1 needs at least 18 structural/drivetrain connections.",
);

for (const connection of graph.connections) {
  assert(
    componentIds.has(connection.from),
    `Gravel assembly source missing: ${connection.from}`,
  );
  assert(
    componentIds.has(connection.to),
    `Gravel assembly target missing: ${connection.to}`,
  );
  assert(
    validConnectionTypes.has(connection.type),
    `Gravel assembly uses invalid connection type: ${connection.type}`,
  );
}

assert(
  geometry.bikeId === gravel.id,
  "Gravel geometry must target Gravel G1.",
);
assert(
  geometry.source === "bike-atlas-reference",
  "Gravel geometry must be marked as Bike Atlas reference data.",
);
assert(
  geometry.frontTravelMm === 0 && geometry.rearTravelMm === 0,
  "Gravel G1 reference must remain rigid in P16.",
);

const interactionText = await readFile(
  "engine/interaction/component-availability.ts",
  "utf8",
);
const interactiveIds = new Set(
  [...interactionText.matchAll(/"bike\.gravel\.g1\.[^"]+"/g)]
    .map((match) => match[0].slice(1, -1)),
);

assert(
  interactiveIds.size === gravel.components.length,
  "P16 Gravel prototype should expose every semantic component.",
);
for (const componentId of interactiveIds) {
  assert(
    componentIds.has(componentId),
    `Interactive Gravel component missing from bike definition: ${componentId}`,
  );
}

const sceneText = await readFile("components/viewer/BikeScene.tsx", "utf8");
assert(
  sceneText.includes("GravelPrototypeBike"),
  "Shared BikeScene must render GravelPrototypeBike.",
);

const knowledgeText = await readFile(
  "domain/knowledge/catalog.ts",
  "utf8",
);
assert(
  knowledgeText.includes("getGravelKnowledgeNode") &&
    knowledgeText.includes("searchGravelKnowledge"),
  "Shared knowledge catalog must route Gravel G1.",
);

const finderProfile = profilesJson.profiles.find(
  (profile) => profile.bikeId === gravel.id,
);
assert(
  Boolean(finderProfile),
  "Gravel G1 must have a Finder capability profile.",
);

if (errors.length) {
  console.error("\nGravel G1 validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ Gravel G1 valid: ${gravel.components.length} components, ${interactiveIds.size} interactive prototype parts, ${graph.connections.length} assembly connections.`,
);
