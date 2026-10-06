import conceptsJson from "../content/knowledge/concepts.json" with { type: "json" };
import historyJson from "../content/history/timeline.json" with { type: "json" };
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}

async function readJsonDir(path) {
  const names = (await readdir(path)).filter((name) => name.endsWith(".json"));
  const items = [];
  for (const name of names) {
    items.push(
      JSON.parse(await readFile(join(path, name), "utf8")),
    );
  }
  return items;
}

const bikes = await readJsonDir("content/bikes");
const lessons = await readJsonDir("content/lessons");
const procedures = await readJsonDir("content/workshop");

const bikeById = new Map(
  bikes.map((bike) => [
    bike.id,
    {
      ...bike,
      componentIds: new Set(
        bike.components.map((component) => component.id),
      ),
    },
  ]),
);
const lessonIds = new Set(lessons.map((lesson) => lesson.id));
const procedureIds = new Set(
  procedures.map((procedure) => procedure.id),
);
const historyIds = new Set(
  historyJson.events.map((event) => event.id),
);

const concepts = conceptsJson.concepts;

assert(
  conceptsJson.version === 1,
  "P19 concept schema version must remain 1.",
);
assert(
  concepts.length >= 8,
  "P19 must retain a useful cross-bike concept layer.",
);
assert(
  new Set(concepts.map((concept) => concept.id)).size === concepts.length,
  "P19 concept IDs must be unique.",
);

const requiredConceptIds = new Set([
  "braking-systems",
  "tire-volume-pressure",
  "chain-drive-power",
  "gearing-range-shifting",
  "steering-geometry-control",
  "suspension-compliance",
  "wheels-hubs-axles",
  "cargo-mounting-utility",
  "frame-architecture-rider-position",
]);

for (const id of requiredConceptIds) {
  assert(
    concepts.some((concept) => concept.id === id),
    `Required P19 concept missing: ${id}`,
  );
}

const coveredBikeIds = new Set();

for (const concept of concepts) {
  assert(
    concept.title.trim().length > 0 &&
      concept.shortTitle.trim().length > 0 &&
      concept.summary.trim().length > 0,
    `P19 concept prose missing: ${concept.id}`,
  );
  assert(
    concept.principles.length >= 2,
    `P19 concept needs at least two principles: ${concept.id}`,
  );
  assert(
    concept.aliases.length >= 2,
    `P19 concept needs multiple aliases: ${concept.id}`,
  );
  assert(
    concept.componentTargets.length >= 2,
    `P19 concept must cross more than one component: ${concept.id}`,
  );

  const targetKeys = new Set();
  const localBikeIds = new Set();

  for (const target of concept.componentTargets) {
    const bike = bikeById.get(target.bikeId);
    assert(
      Boolean(bike),
      `Concept targets unknown bike: ${concept.id} -> ${target.bikeId}`,
    );
    assert(
      Boolean(bike?.componentIds.has(target.componentId)),
      `Concept targets unknown component: ${concept.id} -> ${target.componentId}`,
    );
    assert(
      target.note.trim().length > 0,
      `Concept target note missing: ${concept.id} -> ${target.componentId}`,
    );

    const key = `${target.bikeId}:${target.componentId}`;
    assert(
      !targetKeys.has(key),
      `Duplicate concept target: ${concept.id} -> ${key}`,
    );
    targetKeys.add(key);
    localBikeIds.add(target.bikeId);
    coveredBikeIds.add(target.bikeId);
  }

  assert(
    localBikeIds.size >= 2,
    `Concept must link at least two bike families: ${concept.id}`,
  );

  for (const lessonId of concept.lessonIds) {
    assert(
      lessonIds.has(lessonId),
      `Concept references unknown lesson: ${concept.id} -> ${lessonId}`,
    );
  }

  for (const procedureId of concept.procedureIds) {
    assert(
      procedureIds.has(procedureId),
      `Concept references unknown Workshop procedure: ${concept.id} -> ${procedureId}`,
    );
  }

  for (const eventId of concept.historyEventIds) {
    assert(
      historyIds.has(eventId),
      `Concept references unknown history event: ${concept.id} -> ${eventId}`,
    );
  }
}

for (const bike of bikes) {
  assert(
    coveredBikeIds.has(bike.id),
    `Bike family has no P19 concept coverage: ${bike.id}`,
  );
}

const globalIndex = await readFile(
  "domain/knowledge/global.ts",
  "utf8",
);
for (const type of [
  '"concept"',
  '"bike"',
  '"component"',
  '"lesson"',
  '"workshop"',
  '"history"',
]) {
  assert(
    globalIndex.includes(type),
    `Global search index missing entity type: ${type}`,
  );
}
assert(
  globalIndex.includes("getBikeKnowledgeNode") &&
    globalIndex.includes("LESSON_CATALOG") &&
    globalIndex.includes("WORKSHOP_CATALOG") &&
    globalIndex.includes("HISTORY_EVENTS") &&
    globalIndex.includes("ENGINEERING_CONCEPTS"),
  "P19 global index must derive from all canonical content catalogs.",
);

const viewer = await readFile(
  "components/viewer/BikeViewer.tsx",
  "utf8",
);
assert(
  viewer.includes("GlobalKnowledgePanel") &&
    viewer.includes('searchParams.get("concept")') &&
    viewer.includes('searchParams.set("concept"') &&
    viewer.includes("activeConceptId"),
  "BikeViewer must retain global search and concept deep-link routing.",
);
assert(
  viewer.includes("openKnowledgeHistory") &&
    viewer.includes("onOpenComponent={openHistoryTarget}"),
  "P19 global search must bridge to History and modern 3D components.",
);

const globalPanel = await readFile(
  "components/knowledge/GlobalKnowledgePanel.tsx",
  "utf8",
);
assert(
  globalPanel.includes("searchGlobalKnowledge") &&
    globalPanel.includes("ENGINEERING_CONCEPTS") &&
    globalPanel.includes("Across Bike Atlas") &&
    globalPanel.includes("History lineage"),
  "GlobalKnowledgePanel must retain global search and cross-bike concept pages.",
);

const componentPanel = await readFile(
  "components/viewer/ComponentPanel.tsx",
  "utf8",
);
assert(
  componentPanel.includes("conceptsForComponent") &&
    componentPanel.includes("Engineering concepts") &&
    componentPanel.includes("onOpenConcept"),
  "Component pages must retain backlinks into the P19 concept graph.",
);

if (errors.length) {
  console.error("\nP19 global knowledge validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ P19 global knowledge valid: ${concepts.length} concepts, ${bikes.length} bike families, ${lessons.length} lessons, ${procedures.length} Workshop procedures, ${historyIds.size} history milestones.`,
);
