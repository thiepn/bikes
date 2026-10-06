import road from "../content/bikes/road-r1.json" with { type: "json" };
import mtb from "../content/bikes/mtb-m1.json" with { type: "json" };
import urban from "../content/bikes/urban-u1.json" with { type: "json" };
import roadGeometry from "../content/geometry/road-r1.json" with { type: "json" };
import mtbGeometry from "../content/geometry/mtb-m1.json" with { type: "json" };
import urbanGeometry from "../content/geometry/urban-u1.json" with { type: "json" };

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}

const entries = [
  [road, roadGeometry],
  [mtb, mtbGeometry],
  [urban, urbanGeometry],
];

const numericFields = [
  "wheelbaseMm",
  "reachMm",
  "stackMm",
  "headAngleDeg",
  "seatAngleDeg",
  "chainstayMm",
  "bottomBracketDropMm",
  "tireWidthMm",
  "handlebarWidthMm",
  "frontTravelMm",
  "rearTravelMm",
];

for (const [bike, geometry] of entries) {
  assert(
    geometry.bikeId === bike.id,
    `Geometry owner mismatch: ${geometry.bikeId} != ${bike.id}`,
  );
  assert(
    geometry.source === "bike-atlas-reference",
    `Geometry must be marked Bike Atlas reference data: ${bike.id}`,
  );
  assert(
    typeof geometry.sizeLabel === "string" && geometry.sizeLabel.length > 0,
    `Geometry size label missing: ${bike.id}`,
  );
  assert(
    typeof geometry.wheelFormat === "string" && geometry.wheelFormat.length > 0,
    `Wheel format missing: ${bike.id}`,
  );
  assert(
    Array.isArray(geometry.notes) && geometry.notes.length >= 2,
    `Reference notes missing: ${bike.id}`,
  );

  for (const field of numericFields) {
    assert(
      Number.isFinite(geometry[field]),
      `Geometry field must be numeric: ${bike.id}/${field}`,
    );
  }

  assert(
    geometry.wheelbaseMm > 700 && geometry.wheelbaseMm < 1600,
    `Wheelbase outside broad sanity range: ${bike.id}`,
  );
  assert(
    geometry.reachMm > 250 && geometry.reachMm < 650,
    `Reach outside broad sanity range: ${bike.id}`,
  );
  assert(
    geometry.stackMm > 350 && geometry.stackMm < 850,
    `Stack outside broad sanity range: ${bike.id}`,
  );
  assert(
    geometry.headAngleDeg > 50 && geometry.headAngleDeg < 85,
    `Head angle outside broad sanity range: ${bike.id}`,
  );
  assert(
    geometry.seatAngleDeg > 55 && geometry.seatAngleDeg < 85,
    `Seat angle outside broad sanity range: ${bike.id}`,
  );
  assert(
    geometry.tireWidthMm > 15 && geometry.tireWidthMm < 150,
    `Tire width outside broad sanity range: ${bike.id}`,
  );
  assert(
    geometry.frontTravelMm >= 0 && geometry.frontTravelMm < 260,
    `Front travel outside broad sanity range: ${bike.id}`,
  );
  assert(
    geometry.rearTravelMm >= 0 && geometry.rearTravelMm < 260,
    `Rear travel outside broad sanity range: ${bike.id}`,
  );
}

const differing = numericFields.filter(
  (field) => roadGeometry[field] !== mtbGeometry[field],
);
assert(
  differing.length >= 8,
  "Road R1 and MTB M1 reference geometry must remain meaningfully distinct.",
);
assert(
  roadGeometry.frontTravelMm === 0 && roadGeometry.rearTravelMm === 0,
  "Road R1 reference geometry must remain rigid in P12.",
);
assert(
  mtbGeometry.frontTravelMm > 0 && mtbGeometry.rearTravelMm > 0,
  "MTB M1 reference geometry must retain front and rear suspension travel.",
);
assert(
  mtbGeometry.tireWidthMm > roadGeometry.tireWidthMm,
  "MTB M1 reference tire must remain wider than Road R1.",
);
assert(
  mtbGeometry.headAngleDeg < roadGeometry.headAngleDeg,
  "MTB M1 reference head angle must remain slacker than Road R1.",
);
assert(
  urbanGeometry.frontTravelMm === 0 && urbanGeometry.rearTravelMm === 0,
  "Urban U1 reference must remain rigid.",
);
assert(
  urbanGeometry.tireWidthMm > roadGeometry.tireWidthMm &&
    urbanGeometry.tireWidthMm < mtbGeometry.tireWidthMm,
  "Urban U1 tire width must remain between Road R1 and MTB M1 references.",
);
assert(
  urbanGeometry.handlebarWidthMm > roadGeometry.handlebarWidthMm &&
    urbanGeometry.handlebarWidthMm < mtbGeometry.handlebarWidthMm,
  "Urban U1 handlebar width must remain between Road R1 and MTB M1 references.",
);
assert(
  urbanGeometry.stackMm > roadGeometry.stackMm,
  "Urban U1 reference stack should remain more upright than Road R1.",
);

if (errors.length) {
  console.error("\nP12 comparison validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ P12 comparison valid: ${entries.length} bike geometry references, ${numericFields.length} metrics, ${differing.length} differing dimensions.`,
);
