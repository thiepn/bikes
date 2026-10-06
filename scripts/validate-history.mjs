import timeline from "../content/history/timeline.json" with { type: "json" };
import road from "../content/bikes/road-r1.json" with { type: "json" };
import mtb from "../content/bikes/mtb-m1.json" with { type: "json" };
import urban from "../content/bikes/urban-u1.json" with { type: "json" };
import gravel from "../content/bikes/gravel-g1.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}

const bikes = new Map(
  [road, mtb, urban, gravel].map((bike) => [
    bike.id,
    {
      ...bike,
      componentIds: new Set(
        bike.components.map((component) => component.id),
      ),
    },
  ]),
);

const validCategories = new Set([
  "steering",
  "propulsion",
  "wheels-tires",
  "architecture",
  "drivetrain",
  "utility",
  "off-road",
  "sport",
]);

assert(timeline.version === 1, "History schema version must remain 1.");
assert(
  timeline.events.length >= 10,
  "P18 history should retain at least ten meaningful milestones.",
);
assert(
  timeline.eras.length >= 5,
  "P18 history should retain multiple navigable eras.",
);
assert(
  new Set(timeline.events.map((event) => event.id)).size ===
    timeline.events.length,
  "History event IDs must be unique.",
);
assert(
  new Set(timeline.eras.map((era) => era.id)).size ===
    timeline.eras.length,
  "History era IDs must be unique.",
);

let lastYear = -Infinity;
for (const event of timeline.events) {
  assert(
    event.startYear >= lastYear,
    `History events must remain chronological: ${event.id}`,
  );
  lastYear = event.startYear;

  assert(
    event.title.trim().length > 0 &&
      event.subtitle.trim().length > 0 &&
      event.summary.trim().length > 0,
    `History prose missing: ${event.id}`,
  );
  assert(
    event.engineeringShift.length >= 2,
    `History engineering shift is too thin: ${event.id}`,
  );
  assert(
    event.categoryIds.length >= 1,
    `History event has no category: ${event.id}`,
  );

  for (const category of event.categoryIds) {
    assert(
      validCategories.has(category),
      `Unknown history category ${category}: ${event.id}`,
    );
  }

  const era = timeline.eras.find(
    (candidate) =>
      event.startYear >= candidate.startYear &&
      (candidate.endYear === undefined ||
        event.startYear <= candidate.endYear),
  );
  assert(
    Boolean(era),
    `History event is outside all era ranges: ${event.id}`,
  );

  assert(
    event.lineageTargets.length >= 1,
    `History event has no modern lineage targets: ${event.id}`,
  );
  for (const target of event.lineageTargets) {
    const bike = bikes.get(target.bikeId);
    assert(
      Boolean(bike),
      `History lineage targets unknown bike: ${event.id} -> ${target.bikeId}`,
    );
    assert(
      Boolean(bike?.componentIds.has(target.componentId)),
      `History lineage targets unknown component: ${event.id} -> ${target.componentId}`,
    );
    assert(
      target.label.trim().length > 0,
      `History lineage label missing: ${event.id}`,
    );
  }

  assert(
    event.sources.length >= 1,
    `History event must cite at least one source: ${event.id}`,
  );
  assert(
    new Set(event.sources.map((source) => source.url)).size ===
      event.sources.length,
    `History source URLs must be unique inside event: ${event.id}`,
  );
  for (const source of event.sources) {
    assert(
      /^https:\/\//.test(source.url),
      `History source must use HTTPS: ${event.id}`,
    );
    assert(
      source.title.trim().length > 0 &&
        source.organization.trim().length > 0,
      `History source metadata missing: ${event.id}`,
    );
  }
}

const byId = new Map(
  timeline.events.map((event) => [event.id, event]),
);

for (const required of [
  "1817-draisine-steering",
  "1863-pedal-velocipede",
  "1871-ordinary-wire-wheel",
  "1880s-safety-bicycle",
  "1888-pneumatic-tire",
  "1902-internal-gear-hub",
  "1937-derailleur-tour",
  "1970s-mountain-bike-emergence",
  "1976-repack-race",
  "1990s-mtb-mainstream",
  "today-specialized-branches",
]) {
  assert(
    byId.has(required),
    `Required P18 milestone missing: ${required}`,
  );
}

assert(
  byId.get("1863-pedal-velocipede")?.caveat
    ?.toLowerCase()
    .includes("credit"),
  "1863 pedal event must preserve disputed-attribution note.",
);
assert(
  byId.get("1888-pneumatic-tire")?.caveat
    ?.toLowerCase()
    .includes("thomson"),
  "1888 pneumatic-tire event must preserve Thomson antecedent.",
);
assert(
  byId.get("1970s-mountain-bike-emergence")?.caveat
    ?.toLowerCase()
    .includes("one person"),
  "Mountain-bike origin event must reject single-inventor framing.",
);
assert(
  byId.get("1937-derailleur-tour")?.caveat
    ?.toLowerCase()
    .includes("not the invention"),
  "1937 derailleur event must remain framed as adoption, not invention.",
);

const modern = byId.get("today-specialized-branches");
assert(
  modern &&
    new Set(
      modern.lineageTargets.map((target) => target.bikeId),
    ).size === bikes.size,
  "Modern specialization event must connect all four Bike Atlas archetypes.",
);

const organizations = new Set(
  timeline.events.flatMap((event) =>
    event.sources.map((source) => source.organization),
  ),
);
for (const organization of [
  "Smithsonian Institution",
  "National Museums Scotland",
  "Sturmey-Archer",
  "Conservatoire national des arts et métiers",
  "Marin Museum of Bicycling / Mountain Bike Hall of Fame",
  "Union Cycliste Internationale",
]) {
  assert(
    organizations.has(organization),
    `P18 source set missing expected evidence family: ${organization}`,
  );
}

const viewerText = await readFile(
  "components/viewer/BikeViewer.tsx",
  "utf8",
);
assert(
  viewerText.includes("HistoryPanel") &&
    viewerText.includes('searchParams.get("history")') &&
    viewerText.includes('searchParams.set("history"') &&
    viewerText.includes("openHistoryTarget"),
  "BikeViewer must retain P18 History routing and lineage navigation.",
);

const panelText = await readFile(
  "components/history/HistoryPanel.tsx",
  "utf8",
);
assert(
  panelText.includes("Trace it into Bike Atlas") &&
    panelText.includes("Sources") &&
    panelText.includes("HISTORY_CATEGORY_LABELS"),
  "HistoryPanel must retain lineage, sources and filtering.",
);

if (errors.length) {
  console.error("\nP18 history validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `✓ P18 history valid: ${timeline.events.length} milestones, ${timeline.eras.length} eras, ${organizations.size} source organizations, ${bikes.size} modern archetypes linked.`,
);
