export const CAMERA_TARGET: [number, number, number] = [0, 0.48, 0];

export const CAMERA_LIMITS = {
  minDistance: 1.15,
  maxDistance: 4.8,
  minPolarAngle: Math.PI * 0.15,
  maxPolarAngle: Math.PI * 0.82,
} as const;

export const CAMERA_PRESETS = {
  hero: { position: [1.85, 1.15, 2.2], target: CAMERA_TARGET, fov: 34 },
  side: { position: [2.35, 0.72, 0], target: CAMERA_TARGET, fov: 32 },
  drivetrain: { position: [1.1, 0.6, -0.5], target: [0, 0.45, -0.18], fov: 30 },
} as const;
