import urban from "../content/bikes/urban-u1.json" with { type: "json" };
import graph from "../content/assembly/urban-u1.json" with { type: "json" };
import geometry from "../content/geometry/urban-u1.json" with { type: "json" };
import knowledge from "../content/knowledge/urban-u1.json" with { type: "json" };
import uprightLesson from "../content/lessons/urban-upright-utility.json" with { type: "json" };
import hubLesson from "../content/lessons/urban-internal-gear-hub.json" with { type: "json" };
import weatherLesson from "../content/lessons/urban-weather-systems.json" with { type: "json" };
import cargoLesson from "../content/lessons/urban-cargo-security.json" with { type: "json" };
import preRide from "../content/workshop/urban-pre-ride-check.json" with { type: "json" };
import rackCheck from "../content/workshop/urban-rack-cargo-check.json" with { type: "json" };
import drivetrainCheck from "../content/workshop/urban-drivetrain-check.json" with { type: "json" };
import weatherCheck from "../content/workshop/urban-weather-lighting-check.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];
const lessons = [
  uprightLesson,
  hubLesson,
  weatherLesson,
  cargoLesson,
];
const procedures = [
  preRide,
  rackCheck,
  drivetrainCheck,
  weatherCheck,
];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const componentIds = new Set(
  urban.components.map((item) => item.id),
);
const slugs = new Set(
  urban.components.map((item) => item.slug),
);
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
  new Set(urban.components.map((item) => item.id)).size ===
    urban.components.length,
  "Urban U1 component IDs must be unique.",
);
assert(
  new Set(urban.components.map((item) => item.modelNode)).size ===
    urban.components.length,
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
  assert(
    slugs.has(required),
    `Urban U1 missing defining component: ${required}`,
  );
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
  "Urban U1 must remain a rigid utility archetype.",
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

// Full encyclopedia coverage.
assert(
  knowledge.bikeId === urban.id,
  "Urban knowledge base must target Urban U1.",
);
assert(
  knowledge.profiles.length === urban.components.length,
  "Every Urban U1 component must have one encyclopedia profile.",
);
const profileIds = new Set(
  knowledge.profiles.map((profile) => profile.componentId),
);
assert(
  profileIds.size === knowledge.profiles.length,
  "Urban knowledge profile IDs must be unique.",
);

for (const component of urban.components) {
  assert(
    profileIds.has(component.id),
    `Missing Urban knowledge profile: ${component.id}`,
  );
}

for (const profile of knowledge.profiles) {
  assert(
    componentIds.has(profile.componentId),
    `Urban knowledge profile references unknown component: ${profile.componentId}`,
  );
  assert(
    profile.summary.trim().length > 0,
    `Urban knowledge summary missing: ${profile.componentId}`,
  );
  assert(
    profile.function.trim().length > 0,
    `Urban knowledge function missing: ${profile.componentId}`,
  );
  assert(
    profile.materials.length > 0,
    `Urban knowledge materials missing: ${profile.componentId}`,
  );
  assert(
    profile.standards.length > 0,
    `Urban knowledge standards missing: ${profile.componentId}`,
  );
  assert(
    profile.commonSymptoms.length > 0,
    `Urban knowledge symptoms missing: ${profile.componentId}`,
  );

  for (const relatedId of profile.relatedComponentIds) {
    assert(
      componentIds.has(relatedId),
      `Urban knowledge relation references unknown component: ${profile.componentId} -> ${relatedId}`,
    );
    assert(
      relatedId !== profile.componentId,
      `Urban knowledge profile cannot relate to itself: ${profile.componentId}`,
    );
  }
}

// Lessons.
const lessonIds = new Set(lessons.map((lesson) => lesson.id));
assert(
  lessonIds.size === lessons.length,
  "Urban lesson IDs must be unique.",
);

for (const lesson of lessons) {
  assert(
    lesson.bikeId === urban.id,
    `Urban lesson has wrong bike owner: ${lesson.id}`,
  );
  assert(
    lesson.steps.length >= 4,
    `${lesson.id} must contain at least four steps.`,
  );
  assert(
    urban.systems.includes(lesson.systemId),
    `Urban lesson uses unknown system: ${lesson.id}/${lesson.systemId}`,
  );
  assert(
    new Set(lesson.steps.map((step) => step.id)).size ===
      lesson.steps.length,
    `Lesson step IDs must be unique in ${lesson.id}.`,
  );

  for (const prerequisite of lesson.prerequisiteLessonIds) {
    assert(
      lessonIds.has(prerequisite),
      `Unknown Urban lesson prerequisite ${prerequisite} in ${lesson.id}`,
    );
  }

  for (const step of lesson.steps) {
    assert(
      componentIds.has(step.focusComponentId),
      `Urban lesson focus missing: ${lesson.id}/${step.id}`,
    );
    assert(
      interactiveIds.has(step.focusComponentId),
      `Urban lesson focus not interactive: ${lesson.id}/${step.id}`,
    );

    for (const componentId of step.highlightComponentIds) {
      assert(
        componentIds.has(componentId),
        `Urban lesson highlight missing: ${componentId}`,
      );
    }

    if (step.challenge?.type === "select-component") {
      for (const componentId of step.challenge.candidateComponentIds) {
        assert(
          componentIds.has(componentId),
          `Urban lesson candidate missing: ${componentId}`,
        );
        assert(
          interactiveIds.has(componentId),
          `Urban lesson candidate not interactive: ${componentId}`,
        );
      }
      for (const componentId of step.challenge.correctComponentIds) {
        assert(
          step.challenge.candidateComponentIds.includes(componentId),
          `Correct Urban challenge component must be a candidate: ${componentId}`,
        );
      }
    }

    if (step.challenge?.type === "multiple-choice") {
      const optionIds = new Set(
        step.challenge.options.map((option) => option.id),
      );
      assert(
        optionIds.has(step.challenge.correctOptionId),
        `Urban multiple-choice answer missing in ${lesson.id}/${step.id}`,
      );
    }
  }
}

// Workshop.
const procedureIds = new Set(
  procedures.map((procedure) => procedure.id),
);
assert(
  procedureIds.size === procedures.length,
  "Urban Workshop procedure IDs must be unique.",
);

for (const procedure of procedures) {
  assert(
    procedure.bikeId === urban.id,
    `Urban Workshop procedure has wrong bike owner: ${procedure.id}`,
  );
  assert(
    procedure.steps.length >= 4,
    `${procedure.id} must contain at least four steps.`,
  );
  assert(
    urban.systems.includes(procedure.systemId),
    `Urban Workshop procedure uses unknown system: ${procedure.id}/${procedure.systemId}`,
  );

  const toolIds = new Set(
    procedure.tools.map((tool) => tool.id),
  );
  assert(
    toolIds.size === procedure.tools.length,
    `Urban Workshop tool IDs must be unique in ${procedure.id}.`,
  );

  for (const prerequisite of procedure.prerequisiteProcedureIds) {
    assert(
      procedureIds.has(prerequisite),
      `Unknown Urban Workshop prerequisite ${prerequisite} in ${procedure.id}`,
    );
  }

  for (const assumed of procedure.assumedOperationIds) {
    assert(
      graph.operations.some((operation) => operation.id === assumed),
      `Unknown Urban assumed operation ${assumed} in ${procedure.id}`,
    );
  }

  for (const step of procedure.steps) {
    assert(
      componentIds.has(step.focusComponentId),
      `Urban Workshop focus missing: ${procedure.id}/${step.id}`,
    );
    assert(
      interactiveIds.has(step.focusComponentId),
      `Urban Workshop focus not interactive: ${procedure.id}/${step.id}`,
    );
    assert(
      step.explosionAmount >= 0 && step.explosionAmount <= 1,
      `Invalid Urban Workshop explosion amount: ${procedure.id}/${step.id}`,
    );

    for (const componentId of step.highlightComponentIds) {
      assert(
        componentIds.has(componentId),
        `Urban Workshop highlight missing: ${componentId}`,
      );
    }

    for (const componentId of step.removedComponentIds) {
      assert(
        componentIds.has(componentId),
        `Urban Workshop removed component missing: ${componentId}`,
      );
      assert(
        interactiveIds.has(componentId),
        `Urban Workshop removed component not interactive: ${componentId}`,
      );
    }

    for (const toolId of step.tools) {
      assert(
        toolIds.has(toolId),
        `Unknown Urban Workshop tool ${toolId} in ${procedure.id}/${step.id}`,
      );
    }

    if (step.operationId) {
      assert(
        graph.operations.some((operation) => operation.id === step.operationId),
        `Unknown Urban Workshop operation ${step.operationId}`,
      );
    }
  }
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
  `✓ Urban U1 valid: ${urban.components.length} components, ${knowledge.profiles.length} encyclopedia profiles, ${interactiveIds.size} interactive prototype parts, ${graph.connections.length} assembly connections, ${lessons.length} lessons, ${procedures.length} workshop procedures.`,
);
