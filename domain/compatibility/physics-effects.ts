import {
  PHYSICS_SURFACES,
  getBikePhysicsProfile,
} from "@/domain/physics/catalog";
import { getCompatibilityPart } from "@/domain/compatibility/catalog";
import { analyzeBuild } from "@/domain/compatibility/analyze-build";
import type { BikePhysicsProfile } from "@/engine/physics/types";

export function applyBuildToPhysicsProfile(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
): {
  profile: BikePhysicsProfile | null;
  analysis: ReturnType<typeof analyzeBuild>;
} {
  const base = getBikePhysicsProfile(bikeId);
  const analysis = analyzeBuild(bikeId, selections);

  if (!base) {
    return { profile: null, analysis };
  }

  const rollingResistance = {
    ...base.rollingResistance,
  };

  let wheelCircumferenceM = base.wheelCircumferenceM;

  for (const slotId of ["front-tire", "rear-tire"] as const) {
    const selectedId = selections[slotId];
    if (!selectedId) continue;

    const part = getCompatibilityPart(selectedId);
    const sourceProfile = part
      ? getBikePhysicsProfile(part.sourceBikeId)
      : null;
    if (!sourceProfile) continue;

    for (const surface of PHYSICS_SURFACES) {
      rollingResistance[surface.id] +=
        (sourceProfile.rollingResistance[surface.id] -
          base.rollingResistance[surface.id]) /
        2;
    }

    wheelCircumferenceM +=
      (sourceProfile.wheelCircumferenceM -
        base.wheelCircumferenceM) /
      2;
  }

  let drivetrainEfficiency = base.drivetrainEfficiency;
  const selectedTransmissionId =
    selections["rear-transmission"];
  if (selectedTransmissionId) {
    const part = getCompatibilityPart(selectedTransmissionId);
    const sourceProfile = part
      ? getBikePhysicsProfile(part.sourceBikeId)
      : null;
    if (sourceProfile) {
      drivetrainEfficiency =
        sourceProfile.drivetrainEfficiency;
    }
  }

  return {
    analysis,
    profile: {
      ...base,
      bikeMassKg: Math.max(
        3,
        base.bikeMassKg + analysis.metrics.massDeltaKg,
      ),
      cdaM2: Math.max(
        0.15,
        base.cdaM2 + analysis.metrics.cdaDeltaM2,
      ),
      drivetrainEfficiency: Math.min(
        1,
        Math.max(0.75, drivetrainEfficiency),
      ),
      wheelCircumferenceM,
      rollingResistance,
      notes: [
        ...base.notes,
        ...(Object.keys(selections).length > 0
          ? [
              "P23 build effects applied from Bike Atlas reference component deltas.",
            ]
          : []),
      ],
    },
  };
}
