import { getBikeGeometryReference } from "@/domain/geometry/catalog";
import { getBikePhysicsProfile } from "@/domain/physics/catalog";
import {
  getEffectiveBuildPart,
} from "@/domain/compatibility/analyze-build";
import type { CompatibilityPart } from "@/engine/compatibility/types";
import type { GeometrySolution } from "@/engine/geometry/types";

function n(part: CompatibilityPart | null, key: string) {
  const value = part?.interfaces[key];
  return typeof value === "number" ? value : null;
}

function sourceWheelRadiusDeltaMm(
  hostBikeId: string,
  part: CompatibilityPart | null,
) {
  if (!part || part.sourceBikeId === hostBikeId) return 0;
  const host = getBikePhysicsProfile(hostBikeId);
  const donor = getBikePhysicsProfile(part.sourceBikeId);
  if (!host || !donor) return 0;
  return (
    ((donor.wheelCircumferenceM - host.wheelCircumferenceM) /
      (2 * Math.PI)) *
    1000
  );
}

function rotate(
  x: number,
  y: number,
  angleRad: number,
) {
  return {
    x: x * Math.cos(angleRad) - y * Math.sin(angleRad),
    y: x * Math.sin(angleRad) + y * Math.cos(angleRad),
  };
}

function rawSolve(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
) {
  const reference = getBikeGeometryReference(bikeId);
  if (!reference) return null;

  const fork = getEffectiveBuildPart(bikeId, "fork", selections);
  const frontTire = getEffectiveBuildPart(
    bikeId,
    "front-tire",
    selections,
  );
  const rearTire = getEffectiveBuildPart(
    bikeId,
    "rear-tire",
    selections,
  );
  const stem = getEffectiveBuildPart(bikeId, "stem", selections);
  const handlebar = getEffectiveBuildPart(
    bikeId,
    "handlebar",
    selections,
  );
  const seatpost = getEffectiveBuildPart(
    bikeId,
    "seatpost",
    selections,
  );

  const forkAxleToCrownMm =
    n(fork, "axleToCrown") ?? reference.forkAxleToCrownMm;
  const forkOffsetMm =
    n(fork, "forkOffsetMm") ?? reference.forkOffsetMm;
  const forkTravelMm = n(fork, "suspensionTravel") ?? 0;

  const frontWheelRadiusMm =
    reference.frontWheelRadiusMm +
    sourceWheelRadiusDeltaMm(bikeId, frontTire);
  const rearWheelRadiusMm =
    reference.rearWheelRadiusMm +
    sourceWheelRadiusDeltaMm(bikeId, rearTire);

  const baseHeadRad =
    (reference.headAngleDeg * Math.PI) / 180;
  const forkLengthDeltaMm =
    forkAxleToCrownMm - reference.forkAxleToCrownMm;

  const frontEndHeightDeltaMm =
    forkLengthDeltaMm * Math.sin(baseHeadRad) +
    (frontWheelRadiusMm - reference.frontWheelRadiusMm) -
    (rearWheelRadiusMm - reference.rearWheelRadiusMm);

  const pitchRad = Math.atan2(
    frontEndHeightDeltaMm,
    reference.wheelbaseMm,
  );
  const pitchDeltaDeg = (pitchRad * 180) / Math.PI;

  const headAngleDeg =
    reference.headAngleDeg - pitchDeltaDeg;
  const seatTubeAngleDeg =
    reference.seatTubeAngleDeg - pitchDeltaDeg;

  const frameHead = rotate(
    reference.reachMm,
    reference.stackMm,
    pitchRad,
  );

  const wheelbaseMm =
    reference.wheelbaseMm +
    forkLengthDeltaMm * Math.cos(baseHeadRad);

  const rearAxleToBbHorizontalMm = Math.sqrt(
    Math.max(
      0,
      reference.chainstayMm ** 2 - reference.bbDropMm ** 2,
    ),
  );
  const bbRelative = rotate(
    rearAxleToBbHorizontalMm,
    -reference.bbDropMm,
    pitchRad,
  );
  const bbHeightMm =
    rearWheelRadiusMm + bbRelative.y;
  const bbDropMm = rearWheelRadiusMm - bbHeightMm;

  const headRad = (headAngleDeg * Math.PI) / 180;
  const trailMm =
    (frontWheelRadiusMm * Math.cos(headRad) - forkOffsetMm) /
    Math.sin(headRad);

  const stemLengthMm = n(stem, "stemLengthMm") ?? 80;
  const stemRiseDeg = n(stem, "stemRiseDeg") ?? 0;
  const barReachMm = n(handlebar, "barReachMm") ?? 0;
  const barDropMm = n(handlebar, "barDropMm") ?? 0;
  const barWidthMm = n(handlebar, "barWidthMm") ?? 600;

  const stemAngleRad =
    ((stemRiseDeg + pitchDeltaDeg) * Math.PI) / 180;

  const barX =
    frameHead.x +
    stemLengthMm * Math.cos(stemAngleRad) +
    barReachMm;
  const barY =
    frameHead.y +
    stemLengthMm * Math.sin(stemAngleRad);

  const saddleRotated = rotate(
    reference.saddleXFromBbMm,
    reference.saddleYFromBbMm,
    pitchRad,
  );

  const installedSeatpost = getEffectiveBuildPart(
    bikeId,
    "seatpost",
    {},
  );
  const installedSetbackMm =
    n(installedSeatpost, "setbackMm") ?? 0;
  const selectedSetbackMm = n(seatpost, "setbackMm") ?? 0;
  const saddleX =
    saddleRotated.x -
    (selectedSetbackMm - installedSetbackMm);
  const saddleY = saddleRotated.y;

  return {
    reference,
    headAngleDeg,
    seatTubeAngleDeg,
    reachMm: frameHead.x,
    stackMm: frameHead.y,
    wheelbaseMm,
    bbHeightMm,
    bbDropMm,
    trailMm,
    frontWheelRadiusMm,
    rearWheelRadiusMm,
    forkAxleToCrownMm,
    forkOffsetMm,
    forkTravelMm,
    pitchDeltaDeg,
    bar: {
      xMm: barX,
      yMm: barY,
      widthMm: barWidthMm,
      lowerGripYFromBbMm: barY - barDropMm,
    },
    saddle: {
      xMm: saddleX,
      yMm: saddleY,
    },
  };
}

export function solveBuildGeometry(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
): GeometrySolution | null {
  const current = rawSolve(bikeId, selections);
  const baseline = rawSolve(bikeId, {});
  if (!current || !baseline) return null;

  return {
    bikeId,
    ...current,
    fit: {
      saddleToGripReachMm:
        current.bar.xMm - current.saddle.xMm,
      saddleToGripDropMm:
        current.saddle.yMm - current.bar.yMm,
      frameReachDeltaMm:
        current.reachMm - baseline.reachMm,
      frameStackDeltaMm:
        current.stackMm - baseline.stackMm,
      barReachDeltaMm:
        current.bar.xMm - baseline.bar.xMm,
      barStackDeltaMm:
        current.bar.yMm - baseline.bar.yMm,
      saddleSetbackDeltaMm:
        current.saddle.xMm - baseline.saddle.xMm,
    },
    deltas: {
      headAngleDeg:
        current.headAngleDeg - baseline.headAngleDeg,
      seatTubeAngleDeg:
        current.seatTubeAngleDeg - baseline.seatTubeAngleDeg,
      wheelbaseMm:
        current.wheelbaseMm - baseline.wheelbaseMm,
      bbHeightMm:
        current.bbHeightMm - baseline.bbHeightMm,
      trailMm:
        current.trailMm - baseline.trailMm,
    },
  };
}
