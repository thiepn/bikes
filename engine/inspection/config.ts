import { ROAD_R1_COMPONENTS_BY_ID } from "@/domain/bike/road-r1";
import type { BikeSystemId } from "@/domain/bike/types";

export type Vector3Tuple = [number, number, number];

export const SYSTEM_COLORS: Record<BikeSystemId, string> = {
  frame: "#d9ff67",
  "fork-suspension": "#b5f36b",
  steering: "#65e3ff",
  cockpit: "#60cfff",
  "front-wheel": "#b897ff",
  "rear-wheel": "#9f82ff",
  tires: "#76808a",
  drivetrain: "#ffb456",
  transmission: "#ff8b4f",
  braking: "#ff626f",
  "saddle-seatpost": "#e8d36e",
  pedals: "#f3a85e",
  electrical: "#62a7ff",
  lighting: "#ffe46e",
  "cargo-utility": "#ff955d",
  accessories: "#a9b1ba",
};

const XRAY_SHELL_IDS = new Set([
  "bike.road.r1.frame",
  "bike.road.r1.fork",
  "bike.road.r1.front-tire",
  "bike.road.r1.rear-tire",
  "bike.road.r1.front-rim",
  "bike.road.r1.rear-rim",
  "bike.road.r1.handlebar",
  "bike.road.r1.stem",
  "bike.road.r1.saddle",
  "bike.road.r1.seatpost",
]);

const EXPLOSION_VECTORS: Record<string, Vector3Tuple> = {
  "bike.road.r1.frame": [0, 0, 0],
  "bike.road.r1.fork": [0, 0.05, 0.2],

  "bike.road.r1.front-wheel": [0, 0, 0.28],
  "bike.road.r1.front-tire": [0, 0, 0.32],
  "bike.road.r1.front-rim": [0.08, 0, 0.3],
  "bike.road.r1.front-hub": [0.16, 0, 0.27],
  "bike.road.r1.front-rotor": [0.25, 0, 0.26],

  "bike.road.r1.rear-wheel": [0, 0, -0.28],
  "bike.road.r1.rear-tire": [0, 0, -0.32],
  "bike.road.r1.rear-rim": [0.08, 0, -0.3],
  "bike.road.r1.rear-hub": [0.16, 0, -0.27],
  "bike.road.r1.rear-rotor": [0.25, 0, -0.26],

  "bike.road.r1.handlebar": [0, 0.24, 0.22],
  "bike.road.r1.stem": [0, 0.16, 0.15],
  "bike.road.r1.saddle": [0, 0.24, -0.15],
  "bike.road.r1.seatpost": [0, 0.17, -0.08],

  "bike.road.r1.crankset": [0.22, 0, 0],
  "bike.road.r1.large-chainring": [0.29, 0, 0],
  "bike.road.r1.chain": [0.18, -0.04, -0.02],
  "bike.road.r1.cassette": [0.3, 0, -0.06],
  "bike.road.r1.rear-derailleur": [0.23, -0.12, -0.15],
  "bike.road.r1.left-pedal": [-0.3, 0, 0],
  "bike.road.r1.right-pedal": [0.3, 0, 0],
};

export function getSystemColor(componentId: string) {
  const systemId = ROAD_R1_COMPONENTS_BY_ID.get(componentId)?.systemId;
  return systemId ? SYSTEM_COLORS[systemId] : "#a9b1ba";
}

export function isXrayShell(componentId: string) {
  return XRAY_SHELL_IDS.has(componentId);
}

export function getExplosionOffset(
  componentId: string,
  amount: number,
): Vector3Tuple {
  const vector = EXPLOSION_VECTORS[componentId] ?? [0, 0, 0];
  const normalized = Math.min(1, Math.max(0, amount));

  return [
    vector[0] * normalized,
    vector[1] * normalized,
    vector[2] * normalized,
  ];
}
