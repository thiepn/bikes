import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { createHash } from "node:crypto";
import bike from "../content/bikes/road-r1.json" with { type: "json" };
import asset from "../content/assets/road-r1.asset.json" with { type: "json" };
import assembly from "../content/assembly/road-r1.json" with { type: "json" };
import drivetrain from "../content/lessons/drivetrain-basics.json" with { type: "json" };
import wheels from "../content/lessons/wheels-hubs-basics.json" with { type: "json" };
import brakes from "../content/lessons/braking-basics.json" with { type: "json" };
import steering from "../content/lessons/frame-steering-basics.json" with { type: "json" };
import rearWheelProcedure from "../content/workshop/rear-wheel-removal.json" with { type: "json" };
import cassetteProcedure from "../content/workshop/cassette-removal.json" with { type: "json" };
import chainProcedure from "../content/workshop/chain-replacement.json" with { type: "json" };
import brakeProcedure from "../content/workshop/disc-brake-inspection.json" with { type: "json" };

const errors = [];
const lessons = [drivetrain, wheels, brakes, steering];
const procedures = [
  rearWheelProcedure,
  cassetteProcedure,
  chainProcedure,
  brakeProcedure,
];

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
const visitingOperations = new Set();
const visitedOperations = new Set();

function visitOperation(id) {
  if (visitingOperations.has(id)) {
    errors.push(`Assembly prerequisite cycle detected at ${id}`);
    return;
  }
  if (visitedOperations.has(id)) return;

  visitingOperations.add(id);
  const operation = operationMap.get(id);
  for (const prerequisite of operation?.prerequisites ?? []) {
    visitOperation(prerequisite);
  }
  visitingOperations.delete(id);
  visitedOperations.add(id);
}

for (const id of operationIds) visitOperation(id);

const lessonIds = new Set(lessons.map((lesson) => lesson.id));
assert(lessonIds.size === lessons.length, "Lesson IDs must be unique.");

const calibrationText = await readFile(
  "engine/interaction/calibration-components.ts",
  "utf8",
);
const calibrationIds = new Set(
  [...calibrationText.matchAll(/"bike\.road\.r1\.[^"]+"/g)]
    .map((match) => match[0].slice(1, -1)),
);

for (const lesson of lessons) {
  assert(lesson.steps.length >= 4, `${lesson.id} must contain at least four steps.`);
  assert(new Set(lesson.steps.map((step) => step.id)).size === lesson.steps.length, `Lesson step IDs must be unique in ${lesson.id}.`);

  for (const prerequisite of lesson.prerequisiteLessonIds) {
    assert(lessonIds.has(prerequisite), `Unknown lesson prerequisite ${prerequisite} in ${lesson.id}`);
    assert(prerequisite !== lesson.id, `Lesson cannot depend on itself: ${lesson.id}`);
  }

  for (const step of lesson.steps) {
    assert(componentIds.has(step.focusComponentId), `Lesson focus component missing: ${step.focusComponentId}`);
    assert(calibrationIds.has(step.focusComponentId), `Lesson focus component is not exposed by calibration rig: ${step.focusComponentId}`);

    for (const componentId of step.highlightComponentIds) {
      assert(componentIds.has(componentId), `Lesson highlight component missing: ${componentId}`);
    }

    if (step.demo) {
      assert(
        Number.isInteger(step.demo.gearIndex) &&
          step.demo.gearIndex >= 0 &&
          step.demo.gearIndex <= 4,
        `Invalid lesson gear index in step ${step.id}`,
      );
      assert(step.demo.cadenceRpm >= 0, `Invalid cadence in step ${step.id}`);
    }

    if (step.challenge?.type === "multiple-choice") {
      const optionIds = new Set(step.challenge.options.map((option) => option.id));
      assert(optionIds.size === step.challenge.options.length, `Duplicate challenge option in ${lesson.id}/${step.id}`);
      assert(optionIds.has(step.challenge.correctOptionId), `Missing correct multiple-choice option in ${lesson.id}/${step.id}`);
    }

    if (step.challenge?.type === "select-component") {
      for (const componentId of step.challenge.candidateComponentIds) {
        assert(componentIds.has(componentId), `Challenge candidate missing: ${componentId}`);
        assert(calibrationIds.has(componentId), `Challenge candidate not exposed by calibration rig: ${componentId}`);
      }
      for (const componentId of step.challenge.correctComponentIds) {
        assert(step.challenge.candidateComponentIds.includes(componentId), `Correct challenge component must be a candidate: ${componentId}`);
      }
    }
  }
}

const lessonMap = new Map(lessons.map((lesson) => [lesson.id, lesson]));
const visitingLessons = new Set();
const visitedLessons = new Set();

function visitLesson(id) {
  if (visitingLessons.has(id)) {
    errors.push(`Lesson prerequisite cycle detected at ${id}`);
    return;
  }
  if (visitedLessons.has(id)) return;

  visitingLessons.add(id);
  for (const prerequisite of lessonMap.get(id)?.prerequisiteLessonIds ?? []) {
    visitLesson(prerequisite);
  }
  visitingLessons.delete(id);
  visitedLessons.add(id);
}

for (const id of lessonIds) visitLesson(id);

const procedureIds = new Set(
  procedures.map((procedure) => procedure.id),
);
assert(
  procedureIds.size === procedures.length,
  "Workshop procedure IDs must be unique.",
);

for (const procedure of procedures) {
  assert(
    procedure.steps.length >= 4,
    `${procedure.id} must contain at least four workshop steps.`,
  );
  assert(
    new Set(procedure.steps.map((step) => step.id)).size ===
      procedure.steps.length,
    `Workshop step IDs must be unique in ${procedure.id}.`,
  );
  assert(
    new Set(procedure.tools.map((tool) => tool.id)).size ===
      procedure.tools.length,
    `Workshop tool IDs must be unique in ${procedure.id}.`,
  );

  const toolIds = new Set(procedure.tools.map((tool) => tool.id));

  for (const prerequisite of procedure.prerequisiteProcedureIds) {
    assert(
      procedureIds.has(prerequisite),
      `Unknown workshop prerequisite ${prerequisite} in ${procedure.id}`,
    );
    assert(
      prerequisite !== procedure.id,
      `Workshop procedure cannot depend on itself: ${procedure.id}`,
    );
  }

  const simulatedOperations = new Set(
    procedure.assumedOperationIds,
  );
  for (const operationId of procedure.assumedOperationIds) {
    assert(
      operationIds.has(operationId),
      `Unknown assumed operation ${operationId} in ${procedure.id}`,
    );
  }

  for (const step of procedure.steps) {
    assert(
      componentIds.has(step.focusComponentId),
      `Workshop focus component missing: ${step.focusComponentId}`,
    );
    assert(
      calibrationIds.has(step.focusComponentId),
      `Workshop focus component not exposed by calibration rig: ${step.focusComponentId}`,
    );

    for (const componentId of step.highlightComponentIds) {
      assert(
        componentIds.has(componentId),
        `Workshop highlight component missing: ${componentId}`,
      );
    }

    for (const componentId of step.removedComponentIds) {
      assert(
        componentIds.has(componentId),
        `Workshop removed component missing: ${componentId}`,
      );
      assert(
        calibrationIds.has(componentId),
        `Workshop removed component not exposed by calibration rig: ${componentId}`,
      );
    }

    for (const toolId of step.tools) {
      assert(
        toolIds.has(toolId),
        `Unknown workshop tool ${toolId} in ${procedure.id}/${step.id}`,
      );
    }

    assert(
      step.explosionAmount >= 0 && step.explosionAmount <= 1,
      `Invalid workshop explosion amount in ${procedure.id}/${step.id}`,
    );

    if (step.operationId) {
      assert(
        operationIds.has(step.operationId),
        `Unknown workshop operation ${step.operationId} in ${procedure.id}/${step.id}`,
      );
      const operation = operationMap.get(step.operationId);
      for (const prerequisite of operation?.prerequisites ?? []) {
        assert(
          simulatedOperations.has(prerequisite),
          `Workshop operation order invalid in ${procedure.id}: ${step.operationId} requires ${prerequisite}`,
        );
      }
      simulatedOperations.add(step.operationId);
    }
  }
}

const procedureMap = new Map(
  procedures.map((procedure) => [procedure.id, procedure]),
);
const visitingProcedures = new Set();
const visitedProcedures = new Set();

function visitProcedure(id) {
  if (visitingProcedures.has(id)) {
    errors.push(`Workshop prerequisite cycle detected at ${id}`);
    return;
  }
  if (visitedProcedures.has(id)) return;

  visitingProcedures.add(id);
  for (
    const prerequisite of
    procedureMap.get(id)?.prerequisiteProcedureIds ?? []
  ) {
    visitProcedure(prerequisite);
  }
  visitingProcedures.delete(id);
  visitedProcedures.add(id);
}

for (const id of procedureIds) visitProcedure(id);

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
  `✓ Road R1 valid: ${bike.components.length} components, ${assembly.connections.length} assembly connections, ${assembly.operations.length} operations, ${lessons.length} lessons, ${procedures.length} workshop procedures.`,
);
