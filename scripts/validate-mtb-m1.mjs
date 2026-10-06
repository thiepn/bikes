import mtb from "../content/bikes/mtb-m1.json" with { type: "json" };
import graph from "../content/assembly/mtb-m1.json" with { type: "json" };
import knowledge from "../content/knowledge/mtb-m1.json" with { type: "json" };
import suspensionLesson from "../content/lessons/mtb-suspension-basics.json" with { type: "json" };
import dropperLesson from "../content/lessons/mtb-dropper-basics.json" with { type: "json" };
import oneByLesson from "../content/lessons/mtb-one-by-drivetrain.json" with { type: "json" };
import tireLesson from "../content/lessons/mtb-trail-tires.json" with { type: "json" };
import suspensionCheck from "../content/workshop/mtb-suspension-pre-ride.json" with { type: "json" };
import sagBaseline from "../content/workshop/mtb-sag-baseline.json" with { type: "json" };
import dropperCheck from "../content/workshop/mtb-dropper-function-check.json" with { type: "json" };
import tireCheck from "../content/workshop/mtb-trail-tire-check.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];
const lessons = [
  suspensionLesson,
  dropperLesson,
  oneByLesson,
  tireLesson,
];
const procedures = [
  suspensionCheck,
  sagBaseline,
  dropperCheck,
  tireCheck,
];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(mtb.id === "bike.mtb.m1", "MTB M1 ID must remain stable.");
assert(mtb.slug === "mtb-m1", "MTB M1 slug must remain stable.");
assert(
  mtb.archetype === "trail-full-suspension",
  "MTB M1 must remain a full-suspension trail archetype.",
);
assert(
  mtb.components.length >= 35,
  "MTB M1 must define at least 35 semantic components.",
);
assert(
  new Set(mtb.components.map((item) => item.id)).size ===
    mtb.components.length,
  "MTB component IDs must be unique.",
);
assert(
  new Set(mtb.components.map((item) => item.modelNode)).size ===
    mtb.components.length,
  "MTB modelNode values must be unique.",
);
assert(
  mtb.systems.includes("rear-suspension"),
  "MTB M1 must expose a rear-suspension system.",
);

const componentIds = new Set(
  mtb.components.map((component) => component.id),
);
const slugs = new Set(
  mtb.components.map((component) => component.slug),
);

for (const component of mtb.components) {
  assert(
    component.id.startsWith("bike.mtb.m1."),
    `Invalid MTB stable ID: ${component.id}`,
  );
  assert(
    !component.id.startsWith("bike.road.r1."),
    `Road component leaked into MTB M1: ${component.id}`,
  );
  assert(
    component.modelNode.startsWith("COMP__"),
    `Invalid MTB semantic node: ${component.modelNode}`,
  );
  assert(
    mtb.systems.includes(component.systemId),
    `Unknown MTB system ${component.systemId} for ${component.id}`,
  );
}

for (const required of [
  "rear-shock",
  "suspension-linkage",
  "dropper-post",
  "dropper-remote",
  "chainring",
]) {
  assert(
    slugs.has(required),
    `MTB M1 missing distinguishing component: ${required}`,
  );
}

assert(
  !slugs.has("front-derailleur"),
  "MTB M1 is intentionally 1x and must not contain a front derailleur.",
);

assert(
  graph.bikeId === mtb.id,
  "MTB assembly graph must target MTB M1.",
);
assert(
  graph.connections.length >= 15,
  "MTB M1 needs a meaningful assembly connection foundation.",
);

for (const connection of graph.connections) {
  assert(
    componentIds.has(connection.from),
    `MTB assembly source missing: ${connection.from}`,
  );
  assert(
    componentIds.has(connection.to),
    `MTB assembly target missing: ${connection.to}`,
  );
}

const operationIds = new Set(
  graph.operations.map((operation) => operation.id),
);
for (const operation of graph.operations) {
  assert(
    componentIds.has(operation.targetId),
    `MTB operation target missing: ${operation.targetId}`,
  );
  for (const prerequisite of operation.prerequisites) {
    assert(
      operationIds.has(prerequisite),
      `Unknown MTB operation prerequisite: ${prerequisite}`,
    );
  }
}

const interactionText = await readFile(
  "engine/interaction/component-availability.ts",
  "utf8",
);
const interactiveIds = new Set(
  [...interactionText.matchAll(/"bike\.mtb\.m1\.[^"]+"/g)]
    .map((match) => match[0].slice(1, -1)),
);

assert(
  interactiveIds.size >= 25,
  "MTB prototype must expose at least 25 semantic components.",
);
for (const componentId of interactiveIds) {
  assert(
    componentIds.has(componentId),
    `Interactive MTB component missing: ${componentId}`,
  );
}

// Full encyclopedia coverage.
assert(
  knowledge.bikeId === mtb.id,
  "MTB knowledge base must target MTB M1.",
);
assert(
  knowledge.profiles.length === mtb.components.length,
  "Every MTB M1 component must have one encyclopedia profile.",
);
const profileIds = new Set(
  knowledge.profiles.map((profile) => profile.componentId),
);
assert(
  profileIds.size === knowledge.profiles.length,
  "MTB knowledge profile IDs must be unique.",
);

for (const component of mtb.components) {
  assert(
    profileIds.has(component.id),
    `Missing MTB knowledge profile: ${component.id}`,
  );
}

for (const profile of knowledge.profiles) {
  assert(
    componentIds.has(profile.componentId),
    `MTB knowledge profile references unknown component: ${profile.componentId}`,
  );
  assert(
    profile.summary.trim().length > 0,
    `MTB knowledge summary missing: ${profile.componentId}`,
  );
  assert(
    profile.function.trim().length > 0,
    `MTB knowledge function missing: ${profile.componentId}`,
  );
  assert(
    profile.materials.length > 0,
    `MTB knowledge materials missing: ${profile.componentId}`,
  );
  assert(
    profile.standards.length > 0,
    `MTB knowledge standards missing: ${profile.componentId}`,
  );
  assert(
    profile.commonSymptoms.length > 0,
    `MTB knowledge symptoms missing: ${profile.componentId}`,
  );

  for (const relatedId of profile.relatedComponentIds) {
    assert(
      componentIds.has(relatedId),
      `MTB knowledge relation references unknown component: ${profile.componentId} -> ${relatedId}`,
    );
    assert(
      relatedId !== profile.componentId,
      `MTB knowledge profile cannot relate to itself: ${profile.componentId}`,
    );
  }
}

// Lessons.
const lessonIds = new Set(lessons.map((lesson) => lesson.id));
assert(
  lessonIds.size === lessons.length,
  "MTB lesson IDs must be unique.",
);

for (const lesson of lessons) {
  assert(
    lesson.bikeId === mtb.id,
    `MTB lesson has wrong bike owner: ${lesson.id}`,
  );
  assert(
    lesson.steps.length >= 4,
    `${lesson.id} must contain at least four steps.`,
  );
  assert(
    new Set(lesson.steps.map((step) => step.id)).size ===
      lesson.steps.length,
    `Lesson step IDs must be unique in ${lesson.id}.`,
  );

  for (const prerequisite of lesson.prerequisiteLessonIds) {
    assert(
      lessonIds.has(prerequisite),
      `Unknown MTB lesson prerequisite ${prerequisite} in ${lesson.id}`,
    );
  }

  for (const step of lesson.steps) {
    assert(
      componentIds.has(step.focusComponentId),
      `MTB lesson focus missing: ${lesson.id}/${step.id}`,
    );
    assert(
      interactiveIds.has(step.focusComponentId),
      `MTB lesson focus not interactive: ${lesson.id}/${step.id}`,
    );

    for (const componentId of step.highlightComponentIds) {
      assert(
        componentIds.has(componentId),
        `MTB lesson highlight missing: ${componentId}`,
      );
    }

    if (step.challenge?.type === "select-component") {
      for (const componentId of step.challenge.candidateComponentIds) {
        assert(
          componentIds.has(componentId),
          `MTB lesson candidate missing: ${componentId}`,
        );
        assert(
          interactiveIds.has(componentId),
          `MTB lesson candidate not interactive: ${componentId}`,
        );
      }
      for (const componentId of step.challenge.correctComponentIds) {
        assert(
          step.challenge.candidateComponentIds.includes(componentId),
          `Correct MTB challenge component must be a candidate: ${componentId}`,
        );
      }
    }

    if (step.challenge?.type === "multiple-choice") {
      const optionIds = new Set(
        step.challenge.options.map((option) => option.id),
      );
      assert(
        optionIds.has(step.challenge.correctOptionId),
        `MTB multiple-choice answer missing in ${lesson.id}/${step.id}`,
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
  "MTB Workshop procedure IDs must be unique.",
);

for (const procedure of procedures) {
  assert(
    procedure.bikeId === mtb.id,
    `MTB Workshop procedure has wrong bike owner: ${procedure.id}`,
  );
  assert(
    procedure.steps.length >= 4,
    `${procedure.id} must contain at least four steps.`,
  );

  const toolIds = new Set(
    procedure.tools.map((tool) => tool.id),
  );
  assert(
    toolIds.size === procedure.tools.length,
    `MTB Workshop tool IDs must be unique in ${procedure.id}.`,
  );

  for (const prerequisite of procedure.prerequisiteProcedureIds) {
    assert(
      procedureIds.has(prerequisite),
      `Unknown MTB Workshop prerequisite ${prerequisite} in ${procedure.id}`,
    );
  }

  for (const assumed of procedure.assumedOperationIds) {
    assert(
      operationIds.has(assumed),
      `Unknown MTB assumed operation ${assumed} in ${procedure.id}`,
    );
  }

  for (const step of procedure.steps) {
    assert(
      componentIds.has(step.focusComponentId),
      `MTB Workshop focus missing: ${procedure.id}/${step.id}`,
    );
    assert(
      interactiveIds.has(step.focusComponentId),
      `MTB Workshop focus not interactive: ${procedure.id}/${step.id}`,
    );
    assert(
      step.explosionAmount >= 0 && step.explosionAmount <= 1,
      `Invalid MTB Workshop explosion amount: ${procedure.id}/${step.id}`,
    );

    for (const componentId of step.highlightComponentIds) {
      assert(
        componentIds.has(componentId),
        `MTB Workshop highlight missing: ${componentId}`,
      );
    }

    for (const componentId of step.removedComponentIds) {
      assert(
        componentIds.has(componentId),
        `MTB Workshop removed component missing: ${componentId}`,
      );
      assert(
        interactiveIds.has(componentId),
        `MTB Workshop removed component not interactive: ${componentId}`,
      );
    }

    for (const toolId of step.tools) {
      assert(
        toolIds.has(toolId),
        `Unknown MTB Workshop tool ${toolId} in ${procedure.id}/${step.id}`,
      );
    }

    if (step.operationId) {
      assert(
        operationIds.has(step.operationId),
        `Unknown MTB Workshop operation ${step.operationId}`,
      );
    }
  }
}

if (errors.length) {
  console.error("\nMTB M1 validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ MTB M1 valid: ${mtb.components.length} components, ${knowledge.profiles.length} encyclopedia profiles, ${interactiveIds.size} interactive prototype parts, ${graph.connections.length} assembly connections, ${lessons.length} lessons, ${procedures.length} workshop procedures.`,
);
