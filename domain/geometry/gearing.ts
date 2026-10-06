import { getEffectiveBuildPart } from "@/domain/compatibility/analyze-build";
import { applyBuildToPhysicsProfile } from "@/domain/compatibility/physics-effects";
import type { CompatibilityPart } from "@/engine/compatibility/types";
import type {
  GearCombination,
  GearingArchitecture,
  GearingSolution,
} from "@/engine/geometry/gearing-types";

function nums(part: CompatibilityPart | null, key: string) {
  const value = part?.interfaces[key];
  return Array.isArray(value) &&
    value.every((item) => typeof item === "number")
    ? value
    : [];
}

function str(part: CompatibilityPart | null, key: string) {
  const value = part?.interfaces[key];
  return typeof value === "string" ? value : null;
}

export function solveBuildGearing(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
  cadenceRpm: number,
): GearingSolution | null {
  const crank = getEffectiveBuildPart(
    bikeId,
    "crankset",
    selections,
  );
  const rear = getEffectiveBuildPart(
    bikeId,
    "rear-transmission",
    selections,
  );
  const physics = applyBuildToPhysicsProfile(
    bikeId,
    selections,
  ).profile;

  if (!crank || !rear || !physics) return null;

  const chainrings = nums(crank, "chainringTeeth");
  const rearSprockets = nums(rear, "sprocketTeeth");
  const internalRatios = nums(rear, "internalGearRatios");
  const architecture =
    (str(
      rear,
      "transmissionArchitecture",
    ) as GearingArchitecture | null) ?? "external-cassette";

  if (!chainrings.length || !rearSprockets.length) return null;

  const wheelCircumferenceM = physics.wheelCircumferenceM;
  const wheelDiameterIn =
    (wheelCircumferenceM / Math.PI / 0.0254);

  const combinations: GearCombination[] = [];

  if (architecture === "internal-gear") {
    const front = chainrings[0];
    const rearTeeth = rearSprockets[0];
    const ratios = internalRatios.length
      ? internalRatios
      : [1];

    ratios.forEach((internalRatio, index) => {
      const overallRatio =
        (front / rearTeeth) * internalRatio;
      const developmentM =
        wheelCircumferenceM * overallRatio;
      combinations.push({
        id: "internal-" + (index + 1),
        label: "Gear " + (index + 1),
        architecture,
        chainringTeeth: front,
        rearTeeth,
        internalRatio,
        overallRatio,
        developmentM,
        gearInches: wheelDiameterIn * overallRatio,
        speedKph:
          (developmentM * cadenceRpm * 60) / 1000,
      });
    });
  } else {
    for (const chainring of chainrings) {
      for (const sprocket of rearSprockets) {
        const overallRatio = chainring / sprocket;
        const developmentM =
          wheelCircumferenceM * overallRatio;
        combinations.push({
          id: chainring + "x" + sprocket,
          label: chainring + " × " + sprocket,
          architecture,
          chainringTeeth: chainring,
          rearTeeth: sprocket,
          internalRatio: 1,
          overallRatio,
          developmentM,
          gearInches: wheelDiameterIn * overallRatio,
          speedKph:
            (developmentM * cadenceRpm * 60) / 1000,
        });
      }
    }
  }

  combinations.sort(
    (a, b) => a.overallRatio - b.overallRatio,
  );

  const easiest = combinations[0];
  const hardest = combinations[combinations.length - 1];

  return {
    bikeId,
    architecture,
    cadenceRpm,
    wheelCircumferenceM,
    wheelDiameterIn,
    chainrings,
    rearSprockets,
    internalRatios,
    combinations,
    easiest,
    hardest,
    rangePercent:
      easiest.overallRatio > 0
        ? (hardest.overallRatio /
            easiest.overallRatio) *
          100
        : 0,
  };
}
