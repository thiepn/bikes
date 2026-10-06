import { getBikeComponentById } from "@/domain/bike/catalog";
import type { BikeSystemId } from "@/domain/bike/types";

export type Vector3Tuple = [number, number, number];

export const SYSTEM_COLORS: Record<BikeSystemId, string> = {
  frame: "#d9ff67",
  "fork-suspension": "#b5f36b",
  "rear-suspension": "#8ee69a",
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

const XRAY_SHELL_SLUGS = new Set([
  "frame",
  "fork",
  "front-tire",
  "rear-tire",
  "front-rim",
  "rear-rim",
  "handlebar",
  "stem",
  "saddle",
  "seatpost",
  "dropper-post",
]);

const EXPLOSION_VECTORS_BY_SLUG: Record<string, Vector3Tuple> = {
  frame: [0, 0, 0],
  fork: [0, 0.05, 0.2],
  headset: [0, 0.12, 0.08],
  "rear-shock": [0.18, 0.12, -0.04],
  "suspension-linkage": [0.2, 0.05, -0.14],

  "front-wheel": [0, 0, 0.28],
  "front-tire": [0, 0, 0.32],
  "front-rim": [0.08, 0, 0.3],
  "front-hub": [0.16, 0, 0.27],
  "front-thru-axle": [0.34, 0, 0.28],
  "front-rotor": [0.25, 0, 0.26],
  "front-caliper": [0.2, 0.12, 0.18],

  "rear-wheel": [0, 0, -0.28],
  "rear-tire": [0, 0, -0.32],
  "rear-rim": [0.08, 0, -0.3],
  "rear-hub": [0.16, 0, -0.27],
  "rear-thru-axle": [0.34, 0, -0.28],
  "rear-rotor": [0.25, 0, -0.26],
  "rear-caliper": [0.2, 0.12, -0.18],

  handlebar: [0, 0.24, 0.22],
  stem: [0, 0.16, 0.15],
  "left-grip": [-0.28, 0.03, 0],
  "right-grip": [0.28, 0.03, 0],
  saddle: [0, 0.24, -0.15],
  seatpost: [0, 0.17, -0.08],
  "dropper-post": [0, 0.17, -0.08],

  crankset: [0.22, 0, 0],
  "large-chainring": [0.29, 0, 0],
  chainring: [0.29, 0, 0],
  chain: [0.18, -0.04, -0.02],
  cassette: [0.3, 0, -0.06],
  "rear-derailleur": [0.23, -0.12, -0.15],
  "left-pedal": [-0.3, 0, 0],
  "right-pedal": [0.3, 0, 0],
};

export function getSystemColor(componentId: string) {
  const systemId = getBikeComponentById(componentId)?.systemId;
  return systemId ? SYSTEM_COLORS[systemId] : "#a9b1ba";
}

export function isXrayShell(componentId: string) {
  const slug = getBikeComponentById(componentId)?.slug;
  return slug ? XRAY_SHELL_SLUGS.has(slug) : false;
}

export function getExplosionOffset(
  componentId: string,
  amount: number,
): Vector3Tuple {
  const slug = getBikeComponentById(componentId)?.slug;
  const vector =
    (slug && EXPLOSION_VECTORS_BY_SLUG[slug]) ?? [0, 0, 0];
  const normalized = Math.min(1, Math.max(0, amount));

  return [
    vector[0] * normalized,
    vector[1] * normalized,
    vector[2] * normalized,
  ];
}
