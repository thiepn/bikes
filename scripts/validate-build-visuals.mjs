import visual from "../content/compatibility/visual-attachments.json" with { type: "json" };
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

const profileByBike = new Map(
  reference.profiles.map((profile) => [profile.bikeId, profile]),
);
const hostByBike = new Map(
  visual.hosts.map((host) => [host.bikeId, host]),
);
const donorByBike = new Map(
  visual.donorProfiles.map((donor) => [donor.bikeId, donor]),
);

assert(visual.version === 1, "P22 visual schema version must remain 1.");
assert(
  visual.hosts.length === bikes.length,
  "P22 needs one visual attachment host per bike.",
);
assert(
  visual.donorProfiles.length === bikes.length,
  "P22 needs one donor visual profile per bike.",
);
assert(
  new Set(visual.hosts.map((host) => host.bikeId)).size ===
    visual.hosts.length,
  "P22 visual host bike IDs must be unique.",
);
assert(
  new Set(visual.donorProfiles.map((donor) => donor.bikeId)).size ===
    visual.donorProfiles.length,
  "P22 donor visual bike IDs must be unique.",
);

for (const bike of bikes) {
  const compatibility = profileByBike.get(bike.id);
  const host = hostByBike.get(bike.id);
  const donor = donorByBike.get(bike.id);

  assert(Boolean(host), `Missing visual host: ${bike.id}`);
  assert(Boolean(donor), `Missing donor visual profile: ${bike.id}`);
  if (!host || !compatibility) continue;

  assert(
    Number.isFinite(host.yawRad),
    `Visual host yaw is invalid: ${bike.id}`,
  );
  assert(
    host.attachments.length === compatibility.slots.length,
    `Visual attachment count must equal compatibility slots: ${bike.id}`,
  );
  assert(
    new Set(host.attachments.map((attachment) => attachment.slotId))
      .size === host.attachments.length,
    `Visual attachment slot IDs must be unique: ${bike.id}`,
  );

  for (const slot of compatibility.slots) {
    const attachment = host.attachments.find(
      (item) => item.slotId === slot.id,
    );
    assert(
      Boolean(attachment),
      `Missing visual attachment: ${bike.id}/${slot.id}`,
    );
    if (!attachment) continue;

    assert(
      attachment.hiddenComponentIds.length >= 1,
      `Attachment must own at least one host semantic mesh: ${bike.id}/${slot.id}`,
    );
    for (const componentId of attachment.hiddenComponentIds) {
      assert(
        bike.componentIds.has(componentId),
        `Attachment hides unknown component: ${bike.id}/${slot.id} -> ${componentId}`,
      );
    }

    if (
      attachment.kind === "wheel" ||
      attachment.kind === "tire"
    ) {
      assert(
        Array.isArray(attachment.position) &&
          attachment.position.length === 3 &&
          Number.isFinite(attachment.radius) &&
          attachment.radius > 0,
        `Wheel/tire attachment requires position + radius: ${bike.id}/${slot.id}`,
      );
    } else if (attachment.kind === "tube") {
      assert(
        Array.isArray(attachment.from) &&
          attachment.from.length === 3 &&
          Array.isArray(attachment.to) &&
          attachment.to.length === 3,
        `Tube attachment requires from/to anchors: ${bike.id}/${slot.id}`,
      );
    } else {
      assert(
        Array.isArray(attachment.position) &&
          attachment.position.length === 3,
        `Attachment requires a position: ${bike.id}/${slot.id}`,
      );
    }
  }

  if (donor) {
    assert(
      donor.wheelSpokes >= 12 &&
        donor.wheelSpokes <= 40 &&
        donor.tireThickness > 0 &&
        donor.handlebarWidth > 0 &&
        donor.seatpostRadius > 0 &&
        donor.stemRadius > 0,
      `Invalid donor visual dimensions: ${bike.id}`,
    );
  }
}

for (const part of reference.parts) {
  assert(
    donorByBike.has(part.sourceBikeId),
    `Reference part lacks donor visual profile: ${part.id}`,
  );
}

const overlay = await readFile(
  "components/build/BuildDonorOverlay.tsx",
  "utf8",
);
for (const token of [
  "WheelProxy",
  "TireProxy",
  "HandlebarProxy",
  'attachment.kind === "tube"',
  'attachment.kind === "saddle"',
  'attachment.kind === "pedal"',
  'attachment.kind === "rotor"',
]) {
  assert(
    overlay.includes(token),
    `P22 donor renderer missing visual kind: ${token}`,
  );
}

const semantic = await readFile(
  "components/viewer/SemanticPart.tsx",
  "utf8",
);
assert(
  semantic.includes("hiddenByBuild") &&
    semantic.includes("visible={!hiddenByBuild}"),
  "P22 must fully hide host semantic parts replaced by donor geometry.",
);

const scene = await readFile(
  "components/viewer/BikeScene.tsx",
  "utf8",
);
assert(
  scene.includes("getBuildHiddenComponentIds") &&
    scene.includes("BuildDonorOverlay") &&
    scene.includes("buildSelections"),
  "BikeScene must apply P22 hidden host parts and donor rendering.",
);

const viewer = await readFile(
  "components/viewer/BikeViewer.tsx",
  "utf8",
);
assert(
  viewer.includes("effectiveBuildSelections") &&
    viewer.includes("sanitizeBuildSelections") &&
    viewer.includes("encodeBuildSelections") &&
    viewer.includes("decodeBuildSelections"),
  "P22 viewer must own, sanitize and serialize one authoritative build state.",
);
assert(
  viewer.includes("buildSelections={") &&
    viewer.includes("onSelectionsChange"),
  "P22 viewer must share the same build state with the scene and Build Lab.",
);

const panel = await readFile(
  "components/build/BuildLabPanel.tsx",
  "utf8",
);
assert(
  panel.includes("selections: Readonly<Record<string, string>>") &&
    panel.includes("onSelectionsChange") &&
    !panel.includes("encodeBuildSelections"),
  "Build Lab must be controlled by the P22 viewer state.",
);
assert(
  panel.includes("P22 renders normalized donor proxy geometry"),
  "Build Lab must disclose that P22 uses normalized donor proxies.",
);

if (errors.length) {
  console.error("\nP22 visual assembly validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ P22 visual assembly valid: ${visual.hosts.length} hosts, ${visual.hosts.reduce((n, host) => n + host.attachments.length, 0)} attachments, ${visual.donorProfiles.length} donor visual profiles.`,
);
