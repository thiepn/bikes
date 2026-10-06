export const ROAD_R1_DEMO_CHAINRING_TEETH = 50;
export const ROAD_R1_DEMO_SPROCKET_TEETH = [11, 13, 15, 17, 19] as const;
export const ROAD_R1_DEMO_WHEEL_CIRCUMFERENCE_M = 2.105;

export function clampGearIndex(index: number) {
  return Math.min(
    ROAD_R1_DEMO_SPROCKET_TEETH.length - 1,
    Math.max(0, Math.round(index)),
  );
}

export function getDrivetrainKinematics(
  gearIndex: number,
  cadenceRpm: number,
) {
  const index = clampGearIndex(gearIndex);
  const rearTeeth = ROAD_R1_DEMO_SPROCKET_TEETH[index];
  const ratio = ROAD_R1_DEMO_CHAINRING_TEETH / rearTeeth;
  const wheelRpm = cadenceRpm * ratio;
  const speedKmh =
    (wheelRpm * ROAD_R1_DEMO_WHEEL_CIRCUMFERENCE_M * 60) / 1000;

  return {
    gearIndex: index,
    frontTeeth: ROAD_R1_DEMO_CHAINRING_TEETH,
    rearTeeth,
    ratio,
    wheelRpm,
    speedKmh,
  };
}
