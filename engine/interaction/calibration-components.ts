export const CALIBRATION_COMPONENT_IDS = new Set([
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
  "bike.road.r1.right-pedal"
]);

export function isCalibrationComponent(componentId: string) {
  return CALIBRATION_COMPONENT_IDS.has(componentId);
}
