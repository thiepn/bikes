const ROAD_R1_INTERACTIVE = new Set([
  "bike.road.r1.frame",
  "bike.road.r1.fork",
  "bike.road.r1.headset",
  "bike.road.r1.front-wheel",
  "bike.road.r1.rear-wheel",
  "bike.road.r1.front-tire",
  "bike.road.r1.rear-tire",
  "bike.road.r1.front-rim",
  "bike.road.r1.rear-rim",
  "bike.road.r1.front-hub",
  "bike.road.r1.rear-hub",
  "bike.road.r1.front-rotor",
  "bike.road.r1.rear-rotor",
  "bike.road.r1.front-caliper",
  "bike.road.r1.rear-caliper",
  "bike.road.r1.rear-thru-axle",
  "bike.road.r1.handlebar",
  "bike.road.r1.stem",
  "bike.road.r1.saddle",
  "bike.road.r1.seatpost",
  "bike.road.r1.crankset",
  "bike.road.r1.large-chainring",
  "bike.road.r1.chain",
  "bike.road.r1.cassette",
  "bike.road.r1.rear-derailleur",
  "bike.road.r1.left-pedal",
  "bike.road.r1.right-pedal",
]);

const MTB_M1_INTERACTIVE = new Set([
  "bike.mtb.m1.frame",
  "bike.mtb.m1.fork",
  "bike.mtb.m1.rear-shock",
  "bike.mtb.m1.suspension-linkage",
  "bike.mtb.m1.headset",
  "bike.mtb.m1.handlebar",
  "bike.mtb.m1.stem",
  "bike.mtb.m1.front-wheel",
  "bike.mtb.m1.rear-wheel",
  "bike.mtb.m1.front-tire",
  "bike.mtb.m1.rear-tire",
  "bike.mtb.m1.front-rim",
  "bike.mtb.m1.rear-rim",
  "bike.mtb.m1.front-hub",
  "bike.mtb.m1.rear-hub",
  "bike.mtb.m1.front-rotor",
  "bike.mtb.m1.rear-rotor",
  "bike.mtb.m1.front-caliper",
  "bike.mtb.m1.rear-caliper",
  "bike.mtb.m1.crankset",
  "bike.mtb.m1.chainring",
  "bike.mtb.m1.chain",
  "bike.mtb.m1.cassette",
  "bike.mtb.m1.rear-derailleur",
  "bike.mtb.m1.saddle",
  "bike.mtb.m1.dropper-post",
  "bike.mtb.m1.left-pedal",
  "bike.mtb.m1.right-pedal",
  "bike.mtb.m1.front-thru-axle",
  "bike.mtb.m1.rear-thru-axle",
]);

const BY_BIKE = new Map<string, ReadonlySet<string>>([
  ["bike.road.r1", ROAD_R1_INTERACTIVE],
  ["bike.mtb.m1", MTB_M1_INTERACTIVE],
]);

export function getInteractiveComponentIds(bikeId: string) {
  return BY_BIKE.get(bikeId) ?? new Set<string>();
}

export function isInteractiveComponent(
  bikeId: string,
  componentId: string,
) {
  return getInteractiveComponentIds(bikeId).has(componentId);
}

// Backwards-compatible export for Road R1 content validation.
export const CALIBRATION_COMPONENT_IDS = ROAD_R1_INTERACTIVE;
