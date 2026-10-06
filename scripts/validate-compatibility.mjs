import reference from "../content/compatibility/reference.json" with { type: "json" };
import road from "../content/bikes/road-r1.json" with { type: "json" };
import mtb from "../content/bikes/mtb-m1.json" with { type: "json" };
import urban from "../content/bikes/urban-u1.json" with { type: "json" };
import gravel from "../content/bikes/gravel-g1.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}

const bikes = [road, mtb, urban, gravel];
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

const validSlots = new Set([
  "front-wheel",
  "rear-wheel",
  "front-tire",
  "rear-tire",
  "handlebar",
  "stem",
  "front-rotor",
  "rear-rotor",
  "seatpost",
  "saddle",
  "left-pedal",
  "right-pedal",
  "fork",
  "front-caliper",
  "rear-caliper",
  "crankset",
  "rear-transmission",
  "rear-derailleur",
]);

const profileByBike = new Map(
  reference.profiles.map((profile) => [profile.bikeId, profile]),
);
const partById = new Map(
  reference.parts.map((part) => [part.id, part]),
);

function evaluate(slot, part) {
  if (slot.id !== part.slotId) return "incompatible";

  let unknown = false;
  for (const requirement of slot.requirements) {
    const actual = part.interfaces[requirement.key];
    if (actual === undefined) {
      unknown = true;
      continue;
    }

    if (requirement.kind === "exact") {
      if (actual !== requirement.expected) return "incompatible";
    } else {
      if (
        typeof actual !== "number" ||
        actual < requirement.min ||
        actual > requirement.max
      ) {
        return "incompatible";
      }
    }
  }

  return unknown ? "unknown" : "compatible";
}

assert(
  reference.version === 1,
  "P21 compatibility schema version must remain 1.",
);
assert(
  reference.profiles.length === bikes.length,
  "P21 needs one compatibility profile per current bike.",
);
assert(
  reference.parts.length >= 71,
  "P23 should retain the advanced cross-bike reference part library.",
);
assert(
  new Set(reference.parts.map((part) => part.id)).size ===
    reference.parts.length,
  "Compatibility part IDs must be unique.",
);
assert(
  new Set(reference.profiles.map((profile) => profile.bikeId)).size ===
    reference.profiles.length,
  "Compatibility bike profiles must be unique.",
);

for (const bike of bikes) {
  const profile = profileByBike.get(bike.id);
  assert(Boolean(profile), `Missing compatibility profile: ${bike.id}`);
  if (!profile) continue;

  assert(
    profile.source === "bike-atlas-reference",
    `Compatibility profile must be marked reference data: ${bike.id}`,
  );
  const expectedSlotCount =
    bike.id === "bike.urban.u1" ? 17 : 18;
  assert(
    profile.slots.length === expectedSlotCount,
    `Unexpected P23 build-slot count for ${bike.id}: ${profile.slots.length}`,
  );
  assert(
    new Set(profile.slots.map((slot) => slot.id)).size ===
      profile.slots.length,
    `Compatibility slot IDs must be unique per bike: ${bike.id}`,
  );

  for (const slot of profile.slots) {
    assert(
      validSlots.has(slot.id),
      `Unknown P23 build slot: ${bike.id}/${slot.id}`,
    );
    assert(
      bike.componentIds.has(slot.hostComponentId),
      `Build slot targets unknown host component: ${slot.hostComponentId}`,
    );
    assert(
      slot.requirements.length >= 1,
      `Build slot has no compatibility requirements: ${bike.id}/${slot.id}`,
    );

    for (const requirement of slot.requirements) {
      assert(
        requirement.key?.trim().length > 0 &&
          requirement.label?.trim().length > 0,
        `Malformed compatibility requirement: ${bike.id}/${slot.id}`,
      );
      assert(
        requirement.kind === "exact" || requirement.kind === "range",
        `Unknown compatibility requirement kind: ${bike.id}/${slot.id}`,
      );
      if (requirement.kind === "range") {
        assert(
          Number.isFinite(requirement.min) &&
            Number.isFinite(requirement.max) &&
            requirement.min <= requirement.max,
          `Invalid compatibility range: ${bike.id}/${slot.id}/${requirement.key}`,
        );
      }
    }

    const installed = reference.parts.find(
      (part) =>
        part.sourceBikeId === bike.id &&
        part.slotId === slot.id,
    );
    assert(
      Boolean(installed),
      `Missing installed reference part: ${bike.id}/${slot.id}`,
    );
    if (installed) {
      assert(
        evaluate(slot, installed) === "compatible",
        `Installed reference part must fit its own host: ${bike.id}/${slot.id}`,
      );
    }

    for (const part of reference.parts.filter(
      (candidate) => candidate.slotId === slot.id,
    )) {
      const status = evaluate(slot, part);
      assert(
        status !== "unknown",
        `Authored P23 candidate lacks interface data: ${bike.id}/${slot.id} <- ${part.id}`,
      );
    }
  }
}

for (const part of reference.parts) {
  assert(
    validSlots.has(part.slotId),
    `Compatibility part uses unknown slot: ${part.id}/${part.slotId}`,
  );

  const sourceBike = bikeById.get(part.sourceBikeId);
  assert(
    Boolean(sourceBike),
    `Compatibility part has unknown source bike: ${part.id}`,
  );
  assert(
    Boolean(sourceBike?.componentIds.has(part.sourceComponentId)),
    `Compatibility part has unknown source component: ${part.id}/${part.sourceComponentId}`,
  );
  assert(
    Object.keys(part.interfaces).length >= 1,
    `Compatibility part has no interfaces: ${part.id}`,
  );
  assert(
    part.notes.length >= 1,
    `Compatibility part must disclose reference context: ${part.id}`,
  );
}

function status(bikeId, slotId, partId) {
  const profile = profileByBike.get(bikeId);
  const slot = profile?.slots.find((item) => item.id === slotId);
  const part = partById.get(partId);
  if (!slot || !part) return null;
  return evaluate(slot, part);
}

// Cross-bike regression examples.
assert(
  status("bike.road.r1", "front-wheel", "part.gravel.front-wheel") ===
    "compatible",
  "Road R1 should accept the modeled Gravel G1 front wheel interfaces.",
);
assert(
  status("bike.road.r1", "front-wheel", "part.mtb.front-wheel") ===
    "incompatible",
  "Road R1 must reject the modeled MTB M1 front wheel interfaces.",
);
assert(
  status("bike.gravel.g1", "front-tire", "part.urban.front-tire") ===
    "compatible",
  "Gravel G1 reference tire envelope should accept the modeled Urban U1 47 mm tire.",
);
assert(
  status("bike.road.r1", "front-tire", "part.gravel.front-tire") ===
    "incompatible",
  "Road R1 reference tire envelope must reject the modeled 45 mm gravel tire.",
);
assert(
  status("bike.urban.u1", "handlebar", "part.mtb.handlebar") ===
    "compatible",
  "Urban U1 and MTB M1 handlebars should share the modeled flat-control interface.",
);
assert(
  status("bike.urban.u1", "handlebar", "part.road.handlebar") ===
    "incompatible",
  "Urban U1 must reject the modeled drop-integrated control family.",
);
assert(
  status("bike.road.r1", "seatpost", "part.urban.seatpost") ===
    "compatible",
  "Road R1 and Urban U1 should share the modeled 27.2 mm seatpost interface.",
);
assert(
  status("bike.mtb.m1", "seatpost", "part.road.seatpost") ===
    "incompatible",
  "MTB M1 must reject the modeled 27.2 mm post in its 31.6 mm host.",
);
assert(
  status("bike.road.r1", "front-rotor", "part.gravel.front-rotor") ===
    "compatible",
  "Road R1 should accept the modeled 160 mm center-lock Gravel front rotor.",
);
assert(
  status("bike.road.r1", "front-rotor", "part.urban.front-rotor") ===
    "incompatible",
  "Road R1 reference rotor envelope must reject the modeled 180 mm Urban front rotor.",
);
assert(
  status("bike.mtb.m1", "front-rotor", "part.road.front-rotor") ===
    "incompatible",
  "MTB M1 must reject the modeled center-lock Road front rotor.",
);
assert(
  status("bike.road.r1", "stem", "part.urban.stem") ===
    "compatible",
  "Road R1 and Urban U1 stems should share the modeled clamp interfaces.",
);
assert(
  status("bike.road.r1", "front-caliper", "part.gravel.front-caliper") ===
    "compatible",
  "Road R1 and Gravel G1 front calipers should share the modeled flat-mount hydraulic interface.",
);
assert(
  status("bike.mtb.m1", "front-caliper", "part.road.front-caliper") ===
    "incompatible",
  "MTB M1 must reject the modeled flat-mount Road caliper.",
);
assert(
  status("bike.gravel.g1", "fork", "part.road.fork") ===
    "compatible",
  "Gravel G1 should accept the modeled Road R1 fork inside its authored axle-to-crown envelope.",
);
assert(
  status("bike.road.r1", "fork", "part.gravel.fork") ===
    "incompatible",
  "Road R1 must reject the taller modeled Gravel G1 fork outside its authored axle-to-crown envelope.",
);
assert(
  status("bike.road.r1", "crankset", "part.gravel.crankset") ===
    "compatible",
  "Road R1 should physically accept the modeled Gravel crankset interfaces before system consequences are evaluated.",
);
assert(
  status("bike.road.r1", "rear-transmission", "part.gravel.rear-transmission") ===
    "compatible",
  "Road R1 should physically accept the modeled Gravel rear transmission carrier and chain family.",
);
assert(
  status("bike.road.r1", "rear-derailleur", "part.gravel.rear-derailleur") ===
    "compatible",
  "Road R1 should physically accept the modeled Gravel rear derailleur interface.",
);
assert(
  status("bike.mtb.m1", "rear-transmission", "part.road.rear-transmission") ===
    "incompatible",
  "MTB M1 must reject the Road rear-transmission carrier/chain family.",
);
assert(
  status("bike.urban.u1", "rear-transmission", "part.road.rear-transmission") ===
    "incompatible",
  "Urban U1 must reject an external Road cassette at its internal-gear transmission slot.",
);

for (const saddlePart of reference.parts.filter(
  (part) => part.slotId === "saddle",
)) {
  assert(
    status("bike.road.r1", "saddle", saddlePart.id) === "compatible",
    `Road R1 saddle rail interface should accept ${saddlePart.id}`,
  );
}

const evaluatorText = await readFile(
  "domain/compatibility/evaluate.ts",
  "utf8",
);
assert(
  evaluatorText.includes('"compatible"') &&
    evaluatorText.includes('"incompatible"') &&
    evaluatorText.includes('"unknown"') &&
    evaluatorText.includes("reasons"),
  "P21 evaluator must retain explainable three-state results.",
);

const buildStateText = await readFile(
  "domain/compatibility/build-state.ts",
  "utf8",
);
assert(
  buildStateText.includes("encodeBuildSelections") &&
    buildStateText.includes("decodeBuildSelections"),
  "P21 must retain shareable build-draft serialization.",
);

const panelText = await readFile(
  "components/build/BuildLabPanel.tsx",
  "utf8",
);
assert(
  panelText.includes("Does it actually fit?") &&
    panelText.includes("Compatibility explanation") &&
    panelText.includes("Use in draft") &&
    panelText.includes("P23 also evaluates cross-component dependencies"),
  "Build Lab must retain explanations, gated slot application and the P23 system-analysis boundary.",
);

const viewerText = await readFile(
  "components/viewer/BikeViewer.tsx",
  "utf8",
);
assert(
  viewerText.includes("BuildLabPanel") &&
    viewerText.includes('searchParams.get("build")') &&
    viewerText.includes("BUILD_QUERY_KEYS") &&
    viewerText.includes("buildOpen"),
  "BikeViewer must retain P21 Build Lab routing and URL lifecycle.",
);
assert(
  viewerText.includes("else if (buildOpen) setBuildOpen(false);"),
  "Escape must close the P21 Build Lab.",
);

if (errors.length) {
  console.error("\nP21 compatibility validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ P23 compatibility valid: ${reference.profiles.length} hosts, ${reference.parts.length} reference parts, asymmetric 18/17-slot profiles.`,
);
