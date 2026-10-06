import { getBikeComponentById } from "@/domain/bike/catalog";

export type CameraFocus = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

export const HERO_FOCUS: CameraFocus = {
  position: [1.85, 1.15, 2.2],
  target: [0, 0.48, 0],
  fov: 34,
};

const FOCUS_BY_SLUG: Record<string, CameraFocus> = {
  frame: { position: [1.35, 0.95, 1.45], target: [0, 0.58, -0.02], fov: 31 },
  fork: { position: [0.95, 0.82, 1.18], target: [0, 0.56, 0.45], fov: 27 },
  headset: { position: [0.58, 0.82, 0.72], target: [0, 0.69, 0.36], fov: 18 },
  "rear-shock": { position: [0.62, 0.72, -0.23], target: [0, 0.58, -0.2], fov: 18 },
  "suspension-linkage": { position: [0.65, 0.66, -0.48], target: [0, 0.51, -0.33], fov: 19 },
  "front-wheel": { position: [0.92, 0.56, 1.34], target: [0, 0.36, 0.58], fov: 26 },
  "rear-wheel": { position: [0.92, 0.56, -1.34], target: [0, 0.36, -0.58], fov: 26 },
  "front-tire": { position: [0.72, 0.62, 1.15], target: [0, 0.36, 0.58], fov: 24 },
  "rear-tire": { position: [0.72, 0.62, -1.15], target: [0, 0.36, -0.58], fov: 24 },
  "front-rim": { position: [0.68, 0.58, 1.08], target: [0, 0.36, 0.58], fov: 23 },
  "rear-rim": { position: [0.68, 0.58, -1.08], target: [0, 0.36, -0.58], fov: 23 },
  "front-hub": { position: [0.55, 0.46, 0.91], target: [0, 0.36, 0.58], fov: 20 },
  "rear-hub": { position: [0.55, 0.46, -0.91], target: [0, 0.36, -0.58], fov: 20 },
  "front-thru-axle": { position: [0.48, 0.42, 0.86], target: [0, 0.36, 0.58], fov: 17 },
  "rear-thru-axle": { position: [0.48, 0.42, -0.86], target: [0, 0.36, -0.58], fov: 17 },
  "front-rotor": { position: [0.52, 0.44, 0.9], target: [0, 0.36, 0.58], fov: 19 },
  "rear-rotor": { position: [0.52, 0.44, -0.9], target: [0, 0.36, -0.58], fov: 19 },
  "front-caliper": { position: [0.52, 0.56, 0.86], target: [0.08, 0.45, 0.54], fov: 18 },
  "rear-caliper": { position: [0.52, 0.56, -0.86], target: [0.08, 0.45, -0.54], fov: 18 },
  handlebar: { position: [0.82, 1.03, 0.83], target: [0, 0.9, 0.405], fov: 23 },
  stem: { position: [0.62, 0.98, 0.72], target: [0, 0.85, 0.39], fov: 21 },
  saddle: { position: [0.72, 1.02, -0.55], target: [0, 0.855, -0.24], fov: 21 },
  seatpost: { position: [0.68, 0.92, -0.45], target: [0, 0.75, -0.22], fov: 21 },
  "dropper-post": { position: [0.67, 0.9, -0.44], target: [0, 0.73, -0.23], fov: 20 },
  crankset: { position: [0.68, 0.55, 0.1], target: [0, 0.39, -0.1], fov: 20 },
  "large-chainring": { position: [0.55, 0.5, 0.03], target: [0, 0.39, -0.1], fov: 18 },
  chainring: { position: [0.55, 0.5, 0.03], target: [0, 0.39, -0.1], fov: 18 },
  chain: { position: [0.7, 0.52, -0.28], target: [0.04, 0.37, -0.33], fov: 20 },
  cassette: { position: [0.56, 0.46, -0.9], target: [0.04, 0.36, -0.58], fov: 18 },
  "rear-derailleur": { position: [0.58, 0.45, -0.92], target: [0.06, 0.27, -0.55], fov: 18 },
  "left-pedal": { position: [-0.55, 0.48, -0.02], target: [-0.14, 0.39, -0.1], fov: 20 },
  "right-pedal": { position: [0.55, 0.48, -0.02], target: [0.14, 0.39, -0.1], fov: 20 },
  "rear-sprocket": { position: [0.54, 0.45, -0.9], target: [0.04, 0.37, -0.62], fov: 18 },
  "chain-guard": { position: [0.68, 0.55, -0.28], target: [0.04, 0.4, -0.28], fov: 20 },
  "front-fender": { position: [0.72, 0.73, 1.13], target: [0, 0.52, 0.62], fov: 23 },
  "rear-fender": { position: [0.72, 0.73, -1.13], target: [0, 0.52, -0.62], fov: 23 },
  "rear-rack": { position: [0.82, 0.96, -1.05], target: [0, 0.79, -0.62], fov: 22 },
  "front-light": { position: [0.5, 0.86, 0.84], target: [0, 0.72, 0.52], fov: 17 },
  "rear-light": { position: [0.5, 0.9, -1.08], target: [0, 0.79, -0.91], fov: 17 },
  kickstand: { position: [0.62, 0.38, -0.55], target: [-0.1, 0.22, -0.34], fov: 19 },
  "frame-lock": { position: [0.52, 0.67, -0.82], target: [0, 0.55, -0.54], fov: 18 },
  bell: { position: [0.45, 1.12, 0.47], target: [-0.2, 1.02, 0.28], fov: 16 },
  "front-axle": { position: [0.48, 0.42, 0.86], target: [0, 0.37, 0.62], fov: 17 },
  "rear-axle": { position: [0.48, 0.42, -0.86], target: [0, 0.37, -0.62], fov: 17 },
};

export function getComponentFocus(componentId: string | null): CameraFocus {
  if (!componentId) return HERO_FOCUS;

  const component = getBikeComponentById(componentId);
  if (!component) return HERO_FOCUS;

  return FOCUS_BY_SLUG[component.slug] ?? HERO_FOCUS;
}
