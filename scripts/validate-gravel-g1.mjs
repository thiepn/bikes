import gravel from "../content/bikes/gravel-g1.json" with { type: "json" };
import graph from "../content/assembly/gravel-g1.json" with { type: "json" };
import geometry from "../content/geometry/gravel-g1.json" with { type: "json" };
import knowledge from "../content/knowledge/gravel-g1.json" with { type: "json" };
import tireLesson from "../content/lessons/gravel-tire-volume-pressure.json" with { type: "json" };
import oneByLesson from "../content/lessons/gravel-one-by-gearing.json" with { type: "json" };
import controlLesson from "../content/lessons/gravel-flared-drop-control.json" with { type: "json" };
import mountsLesson from "../content/lessons/gravel-mounts-bikepacking.json" with { type: "json" };
import preRide from "../content/workshop/gravel-pre-ride-check.json" with { type: "json" };
import tireCheck from "../content/workshop/gravel-tire-rim-check.json" with { type: "json" };
import drivetrainCheck from "../content/workshop/gravel-drivetrain-check.json" with { type: "json" };
import mountCheck from "../content/workshop/gravel-mount-cargo-check.json" with { type: "json" };
import profilesJson from "../content/finder/profiles.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];
const lessons = [
  tireLesson,
  oneByLesson,
  controlLesson,
  mountsLesson,
];
const procedures = [
  preRide,
  tireCheck,
  drivetrainCheck,
  mountCheck,
];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const componentIds = new Set(
  gravel.components.map((item) => item.id),
);
const slugs = new Set(
  gravel.components.map((item) => item.slug),
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

assert(
  gravel.id === "bike.gravel.g1",
  "Gravel G1 ID must remain stable.",
);
assert(
  gravel.slug === "gravel-g1",
  "Gravel G1 slug must remain stable.",
);
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
  "Gravel G1 reference is intentionally rigid.",
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
  geometry.frontTravelMm === 0 &&
    geometry.rearTravelMm === 0,
  "Gravel G1 must remain a rigid all-road archetype.",
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
  "Gravel prototype should expose every semantic component.",
);
for (const componentId of interactiveIds) {
  assert(
    componentIds.has(componentId),
    `Interactive Gravel component missing from bike definition: ${componentId}`,
  );
}

// Full encyclopedia coverage.
assert(
  knowledge.bikeId === gravel.id,
  "Gravel knowledge base must target Gravel G1.",
);
assert(
  knowledge.profiles.length === gravel.components.length,
  "Every Gravel G1 component must have one encyclopedia profile.",
);
const profileIds = new Set(
  knowledge.profiles.map((profile) => profile.componentId),
);
assert(
  profileIds.size === knowledge.profiles.length,
  "Gravel knowledge profile IDs must be unique.",
);

for (const component of gravel.components) {
  assert(
    profileIds.has(component.id),
    `Missing Gravel knowledge profile: ${component.id}`,
  );
}

for (const profile of knowledge.profiles) {
  assert(
    componentIds.has(profile.componentId),
    `Gravel knowledge profile references unknown component: ${profile.componentId}`,
  );
  assert(
    profile.summary.trim().length > 0,
    `Gravel knowledge summary missing: ${profile.componentId}`,
  );
  assert(
    profile.function.trim().length > 0,
    `Gravel knowledge function missing: ${profile.componentId}`,
  );
  assert(
    profile.materials.length > 0,
    `Gravel knowledge materials missing: ${profile.componentId}`,
  );
  assert(
    profile.standards.length > 0,
    `Gravel knowledge standards missing: ${profile.componentId}`,
  );
  assert(
    profile.commonSymptoms.length > 0,
    `Gravel knowledge symptoms missing: ${profile.componentId}`,
  );

  for (const relatedId of profile.relatedComponentIds) {
    assert(
      componentIds.has(relatedId),
      `Gravel knowledge relation references unknown component: ${profile.componentId} -> ${relatedId}`,
    );
    assert(
      relatedId !== profile.componentId,
      `Gravel knowledge profile cannot relate to itself: ${profile.componentId}`,
    );
  }
}

// Lessons.
const lessonIds = new Set(
  lessons.map((lesson) => lesson.id),
);
assert(
  lessonIds.size === lessons.length,
  "Gravel lesson IDs must be unique.",
);

for (const lesson of lessons) {
  assert(
    lesson.bikeId === gravel.id,
    `Gravel lesson has wrong bike owner: ${lesson.id}`,
  );
  assert(
    lesson.steps.length >= 4,
    `${lesson.id} must contain at least four steps.`,
  );
  assert(
    gravel.systems.includes(lesson.systemId),
    `Gravel lesson uses unknown system: ${lesson.id}/${lesson.systemId}`,
  );
  assert(
    new Set(lesson.steps.map((step) => step.id)).size ===
      lesson.steps.length,
    `Lesson step IDs must be unique in ${lesson.id}.`,
  );

  for (const prerequisite of lesson.prerequisiteLessonIds) {
    assert(
      lessonIds.has(prerequisite),
      `Unknown Gravel lesson prerequisite ${prerequisite} in ${lesson.id}`,
    );
  }

  for (const step of lesson.steps) {
    assert(
      componentIds.has(step.focusComponentId),
      `Gravel lesson focus missing: ${lesson.id}/${step.id}`,
    );
    assert(
      interactiveIds.has(step.focusComponentId),
      `Gravel lesson focus not interactive: ${lesson.id}/${step.id}`,
    );

    for (const componentId of step.highlightComponentIds) {
      assert(
        componentIds.has(componentId),
        `Gravel lesson highlight missing: ${componentId}`,
      );
    }

    if (step.challenge?.type === "select-component") {
      for (const componentId of step.challenge.candidateComponentIds) {
        assert(
          componentIds.has(componentId),
          `Gravel lesson candidate missing: ${componentId}`,
        );
        assert(
          interactiveIds.has(componentId),
          `Gravel lesson candidate not interactive: ${componentId}`,
        );
      }

      for (const componentId of step.challenge.correctComponentIds) {
        assert(
          step.challenge.candidateComponentIds.includes(componentId),
          `Correct Gravel challenge component must be a candidate: ${componentId}`,
        );
      }
    }

    if (step.challenge?.type === "multiple-choice") {
      const optionIds = new Set(
        step.challenge.options.map((option) => option.id),
      );
      assert(
        optionIds.has(step.challenge.correctOptionId),
        `Gravel multiple-choice answer missing in ${lesson.id}/${step.id}`,
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
  "Gravel Workshop procedure IDs must be unique.",
);

for (const procedure of procedures) {
  assert(
    procedure.bikeId === gravel.id,
    `Gravel Workshop procedure has wrong bike owner: ${procedure.id}`,
  );
  assert(
    procedure.steps.length >= 4,
    `${procedure.id} must contain at least four steps.`,
  );
  assert(
    gravel.systems.includes(procedure.systemId),
    `Gravel Workshop procedure uses unknown system: ${procedure.id}/${procedure.systemId}`,
  );

  const toolIds = new Set(
    procedure.tools.map((tool) => tool.id),
  );
  assert(
    toolIds.size === procedure.tools.length,
    `Gravel Workshop tool IDs must be unique in ${procedure.id}.`,
  );

  for (const prerequisite of procedure.prerequisiteProcedureIds) {
    assert(
      procedureIds.has(prerequisite),
      `Unknown Gravel Workshop prerequisite ${prerequisite} in ${procedure.id}`,
    );
  }

  for (const assumed of procedure.assumedOperationIds) {
    assert(
      graph.operations.some((operation) => operation.id === assumed),
      `Unknown Gravel assumed operation ${assumed} in ${procedure.id}`,
    );
  }

  for (const step of procedure.steps) {
    assert(
      componentIds.has(step.focusComponentId),
      `Gravel Workshop focus missing: ${procedure.id}/${step.id}`,
    );
    assert(
      interactiveIds.has(step.focusComponentId),
      `Gravel Workshop focus not interactive: ${procedure.id}/${step.id}`,
    );
    assert(
      step.explosionAmount >= 0 &&
        step.explosionAmount <= 1,
      `Invalid Gravel Workshop explosion amount: ${procedure.id}/${step.id}`,
    );

    for (const componentId of step.highlightComponentIds) {
      assert(
        componentIds.has(componentId),
        `Gravel Workshop highlight missing: ${componentId}`,
      );
    }

    for (const componentId of step.removedComponentIds) {
      assert(
        componentIds.has(componentId),
        `Gravel Workshop removed component missing: ${componentId}`,
      );
      assert(
        interactiveIds.has(componentId),
        `Gravel Workshop removed component not interactive: ${componentId}`,
      );
    }

    for (const toolId of step.tools) {
      assert(
        toolIds.has(toolId),
        `Unknown Gravel Workshop tool ${toolId} in ${procedure.id}/${step.id}`,
      );
    }

    if (step.operationId) {
      assert(
        graph.operations.some(
          (operation) => operation.id === step.operationId,
        ),
        `Unknown Gravel Workshop operation ${step.operationId}`,
      );
    }
  }
}

const sceneText = await readFile(
  "components/viewer/BikeScene.tsx",
  "utf8",
);
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

const bikeDomainText = await readFile(
  "domain/bike/gravel-g1.ts",
  "utf8",
);
assert(
  bikeDomainText.includes('encyclopedia: "full"') &&
    bikeDomainText.includes("lessons: true") &&
    bikeDomainText.includes("workshop: true"),
  "Gravel G1 must remain a full Learn/Workshop content family after P17.",
);

const finderProfile = profilesJson.profiles.find(
  (profile) => profile.bikeId === gravel.id,
);
assert(
  Boolean(finderProfile),
  "Gravel G1 must retain a Finder capability profile.",
);

if (errors.length) {
  console.error("\nGravel G1 validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ Gravel G1 valid: ${gravel.components.length} components, ${knowledge.profiles.length} encyclopedia profiles, ${interactiveIds.size} interactive prototype parts, ${graph.connections.length} assembly connections, ${lessons.length} lessons, ${procedures.length} workshop procedures.`,
);
