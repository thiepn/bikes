import { getBikeById } from "@/domain/bike/catalog";
import {
  getCompatibilityPart,
  getCompatibilityProfile,
  getInstalledReferencePart,
} from "@/domain/compatibility/catalog";
import { getPartConsequenceProfile } from "@/domain/compatibility/consequence-catalog";
import type {
  BuildAnalysis,
  BuildIssue,
  BuildIssueSeverity,
} from "@/engine/compatibility/consequence-types";
import type {
  CompatibilityPart,
  CompatibilitySlotId,
} from "@/engine/compatibility/types";

function numberInterface(
  part: CompatibilityPart | null,
  key: string,
) {
  const value = part?.interfaces[key];
  return typeof value === "number" ? value : null;
}

function stringInterface(
  part: CompatibilityPart | null,
  key: string,
) {
  const value = part?.interfaces[key];
  return typeof value === "string" ? value : null;
}

export function getEffectiveBuildPart(
  bikeId: string,
  slotId: CompatibilitySlotId,
  selections: Readonly<Record<string, string>>,
) {
  const selectedId = selections[slotId];
  if (selectedId) {
    const selected = getCompatibilityPart(selectedId);
    if (selected) return selected;
  }
  return getInstalledReferencePart(bikeId, slotId);
}

function makeIssue(
  id: string,
  severity: BuildIssueSeverity,
  system: BuildIssue["system"],
  title: string,
  detail: string,
  relatedSlots: CompatibilitySlotId[],
): BuildIssue {
  return { id, severity, system, title, detail, relatedSlots };
}

function massDelta(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
) {
  let delta = 0;

  for (const [slotId, partId] of Object.entries(selections)) {
    const selected = getPartConsequenceProfile(partId);
    const installed = getInstalledReferencePart(
      bikeId,
      slotId as CompatibilitySlotId,
    );
    const installedEffect = installed
      ? getPartConsequenceProfile(installed.id)
      : null;

    if (selected && installedEffect) {
      delta += selected.massKg - installedEffect.massKg;
    }
  }

  return delta;
}

function aeroDelta(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
) {
  const selectedId = selections.handlebar;
  if (!selectedId) return 0;

  const selected = getPartConsequenceProfile(selectedId);
  const installed = getInstalledReferencePart(bikeId, "handlebar");
  const installedEffect = installed
    ? getPartConsequenceProfile(installed.id)
    : null;

  return (
    (selected?.aeroCdAContributionM2 ?? 0) -
    (installedEffect?.aeroCdAContributionM2 ?? 0)
  );
}

function brakeRatio(
  bikeId: string,
  side: "front" | "rear",
  selections: Readonly<Record<string, string>>,
) {
  const slotId = (side + "-rotor") as CompatibilitySlotId;
  const selected = getEffectiveBuildPart(bikeId, slotId, selections);
  const installed = getInstalledReferencePart(bikeId, slotId);
  const selectedDiameter = numberInterface(selected, "rotorDiameter");
  const installedDiameter = numberInterface(installed, "rotorDiameter");

  if (!selectedDiameter || !installedDiameter) return 1;
  return selectedDiameter / installedDiameter;
}

export function analyzeBuild(
  bikeId: string,
  selections: Readonly<Record<string, string>>,
): BuildAnalysis {
  const profile = getCompatibilityProfile(bikeId);
  const bike = getBikeById(bikeId);
  const issues: BuildIssue[] = [];

  if (!profile || !bike) {
    return {
      health: "blocked",
      modifiedSlotCount: 0,
      issues: [
        makeIssue(
          "missing-host",
          "blocking",
          "drivetrain",
          "Build host unavailable",
          "The active Bike Atlas compatibility host could not be resolved.",
          [],
        ),
      ],
      metrics: {
        massDeltaKg: 0,
        cdaDeltaM2: 0,
        frontBrakeTorqueRatio: 1,
        rearBrakeTorqueRatio: 1,
        lowGearRatio: null,
        highGearRatio: null,
        gearRangePercent: null,
        forkTravelDeltaMm: 0,
        axleToCrownDeltaMm: 0,
      },
    };
  }

  const frontRotor = getEffectiveBuildPart(bikeId, "front-rotor", selections);
  const rearRotor = getEffectiveBuildPart(bikeId, "rear-rotor", selections);
  const frontCaliper = getEffectiveBuildPart(bikeId, "front-caliper", selections);
  const rearCaliper = getEffectiveBuildPart(bikeId, "rear-caliper", selections);
  const fork = getEffectiveBuildPart(bikeId, "fork", selections);
  const frontWheel = getEffectiveBuildPart(bikeId, "front-wheel", selections);
  const rearWheel = getEffectiveBuildPart(bikeId, "rear-wheel", selections);
  const crankset = getEffectiveBuildPart(bikeId, "crankset", selections);
  const rearTransmission = getEffectiveBuildPart(
    bikeId,
    "rear-transmission",
    selections,
  );
  const rearDerailleur = getEffectiveBuildPart(
    bikeId,
    "rear-derailleur",
    selections,
  );

  const frontRotorDiameter = numberInterface(frontRotor, "rotorDiameter");
  const rearRotorDiameter = numberInterface(rearRotor, "rotorDiameter");

  function checkCaliper(
    side: "front" | "rear",
    rotorDiameter: number | null,
    caliper: CompatibilityPart | null,
  ) {
    if (!rotorDiameter || !caliper) return;

    const min = numberInterface(caliper, "rotorMinDiameter");
    const max = numberInterface(caliper, "rotorMaxDiameter");
    if (
      min !== null &&
      max !== null &&
      (rotorDiameter < min || rotorDiameter > max)
    ) {
      issues.push(
        makeIssue(
          side + "-caliper-rotor-range",
          "blocking",
          "braking",
          (side === "front" ? "Front" : "Rear") +
            " rotor / caliper mismatch",
          "The selected " +
            rotorDiameter +
            " mm rotor is outside this caliper's authored " +
            min +
            "–" +
            max +
            " mm operating range.",
          [
            (side + "-rotor") as CompatibilitySlotId,
            (side + "-caliper") as CompatibilitySlotId,
          ],
        ),
      );
    }
  }

  checkCaliper("front", frontRotorDiameter, frontCaliper);
  checkCaliper("rear", rearRotorDiameter, rearCaliper);

  const forkMaxRotor = numberInterface(fork, "maxRotorDiameter");
  if (
    frontRotorDiameter !== null &&
    forkMaxRotor !== null &&
    frontRotorDiameter > forkMaxRotor
  ) {
    issues.push(
      makeIssue(
        "fork-front-rotor-limit",
        "blocking",
        "braking",
        "Front rotor exceeds fork reference limit",
        "The selected fork is authored for rotors up to " +
          forkMaxRotor +
          " mm, but the build uses " +
          frontRotorDiameter +
          " mm.",
        ["fork", "front-rotor"],
      ),
    );
  }

  const forkAxle = stringInterface(fork, "frontAxle");
  const wheelAxle = stringInterface(frontWheel, "frontAxle");
  if (forkAxle && wheelAxle && forkAxle !== wheelAxle) {
    issues.push(
      makeIssue(
        "fork-wheel-axle",
        "blocking",
        "wheels",
        "Fork and front wheel use different axle interfaces",
        "Fork: " + forkAxle + ". Front wheel: " + wheelAxle + ".",
        ["fork", "front-wheel"],
      ),
    );
  }

  const frontRotorMount = stringInterface(frontRotor, "discInterface");
  const frontWheelRotorMount = stringInterface(frontWheel, "discInterface");
  if (
    frontRotorMount &&
    frontWheelRotorMount &&
    frontRotorMount !== frontWheelRotorMount
  ) {
    issues.push(
      makeIssue(
        "front-wheel-rotor-interface",
        "blocking",
        "braking",
        "Front wheel and rotor use different mounting interfaces",
        "Wheel: " +
          frontWheelRotorMount +
          ". Rotor: " +
          frontRotorMount +
          ".",
        ["front-wheel", "front-rotor"],
      ),
    );
  }

  const rearRotorMount = stringInterface(rearRotor, "discInterface");
  const rearWheelRotorMount = stringInterface(rearWheel, "discInterface");
  if (
    rearRotorMount &&
    rearWheelRotorMount &&
    rearRotorMount !== rearWheelRotorMount
  ) {
    issues.push(
      makeIssue(
        "rear-wheel-rotor-interface",
        "blocking",
        "braking",
        "Rear wheel and rotor use different mounting interfaces",
        "Wheel: " +
          rearWheelRotorMount +
          ". Rotor: " +
          rearRotorMount +
          ".",
        ["rear-wheel", "rear-rotor"],
      ),
    );
  }

  const rearCarrier = stringInterface(rearTransmission, "carrierFamily");
  const rearWheelCarrier = stringInterface(rearWheel, "freehubFamily");
  if (
    rearCarrier &&
    rearWheelCarrier &&
    rearCarrier !== rearWheelCarrier
  ) {
    issues.push(
      makeIssue(
        "rear-wheel-transmission-carrier",
        "blocking",
        "drivetrain",
        "Rear transmission does not match the selected rear wheel",
        "Rear wheel carrier: " +
          rearWheelCarrier +
          ". Transmission requires: " +
          rearCarrier +
          ".",
        ["rear-wheel", "rear-transmission"],
      ),
    );
  }

  const crankChain = stringInterface(crankset, "chainFamily");
  const transmissionChain = stringInterface(
    rearTransmission,
    "chainFamily",
  );
  const derailleurChain = stringInterface(
    rearDerailleur,
    "chainFamily",
  );

  if (
    crankChain &&
    transmissionChain &&
    crankChain !== transmissionChain
  ) {
    issues.push(
      makeIssue(
        "crank-transmission-chain-family",
        "blocking",
        "drivetrain",
        "Crankset and rear transmission use different chain families",
        "Crankset: " +
          crankChain +
          ". Rear transmission: " +
          transmissionChain +
          ".",
        ["crankset", "rear-transmission"],
      ),
    );
  }

  if (
    derailleurChain &&
    transmissionChain &&
    derailleurChain !== transmissionChain
  ) {
    issues.push(
      makeIssue(
        "derailleur-chain-family",
        "blocking",
        "drivetrain",
        "Rear derailleur and transmission use different chain families",
        "Derailleur: " +
          derailleurChain +
          ". Transmission: " +
          transmissionChain +
          ".",
        ["rear-derailleur", "rear-transmission"],
      ),
    );
  }

  const architecture = stringInterface(
    rearTransmission,
    "transmissionArchitecture",
  );
  const frontSmall = numberInterface(crankset, "frontSmallTeeth");
  const frontLarge = numberInterface(crankset, "frontLargeTeeth");
  const rearSmall = numberInterface(rearTransmission, "rearSmallTeeth");
  const rearLarge = numberInterface(rearTransmission, "rearLargeTeeth");

  if (architecture === "external-cassette") {
    if (!rearDerailleur) {
      issues.push(
        makeIssue(
          "missing-rear-derailleur",
          "blocking",
          "drivetrain",
          "External cassette requires a rear derailleur",
          "This host does not currently provide an effective rear derailleur for the selected external transmission.",
          ["rear-transmission", "rear-derailleur"],
        ),
      );
    } else {
      const maxSprocket = numberInterface(
        rearDerailleur,
        "maxSprocketTeeth",
      );
      if (
        rearLarge !== null &&
        maxSprocket !== null &&
        rearLarge > maxSprocket
      ) {
        issues.push(
          makeIssue(
            "rear-derailleur-largest-sprocket",
            "blocking",
            "drivetrain",
            "Rear derailleur cannot clear the largest sprocket",
            "Cassette largest sprocket: " +
              rearLarge +
              "T. Derailleur authored maximum: " +
              maxSprocket +
              "T.",
            ["rear-transmission", "rear-derailleur"],
          ),
        );
      }

      const capacity = numberInterface(
        rearDerailleur,
        "totalCapacityTeeth",
      );
      if (
        capacity !== null &&
        frontSmall !== null &&
        frontLarge !== null &&
        rearSmall !== null &&
        rearLarge !== null
      ) {
        const required =
          frontLarge -
          frontSmall +
          (rearLarge - rearSmall);

        if (required > capacity) {
          issues.push(
            makeIssue(
              "rear-derailleur-capacity",
              "blocking",
              "drivetrain",
              "Drivetrain exceeds rear-derailleur capacity",
              "This combination requires " +
                required +
                "T of total capacity; the selected derailleur is authored for " +
                capacity +
                "T.",
              ["crankset", "rear-transmission", "rear-derailleur"],
            ),
          );
        }
      }
    }
  }

  const ringCount = numberInterface(crankset, "ringCount");
  const hasFrontDerailleur = bike.components.some(
    (component) => component.slug === "front-derailleur",
  );
  const hasLeftShifter = bike.components.some(
    (component) => component.slug === "left-shifter",
  );

  if (ringCount !== null && ringCount > 1 && !hasFrontDerailleur) {
    issues.push(
      makeIssue(
        "multi-ring-no-front-derailleur",
        "blocking",
        "drivetrain",
        "Multi-ring crankset needs a front shifting system",
        "The selected crankset has multiple chainrings, but this host archetype has no authored front derailleur.",
        ["crankset"],
      ),
    );
  }

  if (ringCount !== null && ringCount > 1 && !hasLeftShifter) {
    issues.push(
      makeIssue(
        "multi-ring-no-left-shifter",
        "blocking",
        "drivetrain",
        "Multi-ring crankset needs an authored front shift control",
        "This host has no left/front shift control in its current component model.",
        ["crankset"],
      ),
    );
  }

  if (
    ringCount === 1 &&
    hasFrontDerailleur &&
    Boolean(selections.crankset)
  ) {
    issues.push(
      makeIssue(
        "single-ring-front-derailleur-redundant",
        "warning",
        "drivetrain",
        "Front derailleur becomes redundant",
        "The selected 1× crankset no longer needs the host's front derailleur. Bike Atlas leaves that component visible until a later removal/configuration phase.",
        ["crankset"],
      ),
    );
  }

  const installedFork = getInstalledReferencePart(bikeId, "fork");
  const installedA2c = numberInterface(installedFork, "axleToCrown");
  const selectedA2c = numberInterface(fork, "axleToCrown");
  const installedTravel = numberInterface(installedFork, "suspensionTravel");
  const selectedTravel = numberInterface(fork, "suspensionTravel");

  const axleToCrownDeltaMm =
    installedA2c !== null && selectedA2c !== null
      ? selectedA2c - installedA2c
      : 0;
  const forkTravelDeltaMm =
    installedTravel !== null && selectedTravel !== null
      ? selectedTravel - installedTravel
      : 0;

  if (
    Boolean(selections.fork) &&
    Math.abs(axleToCrownDeltaMm) >= 15
  ) {
    issues.push(
      makeIssue(
        "fork-geometry-change",
        "warning",
        "suspension",
        "Fork changes the host's front-end geometry",
        "Axle-to-crown changes by " +
          (axleToCrownDeltaMm > 0 ? "+" : "") +
          axleToCrownDeltaMm +
          " mm. Handling consequences are directional only in P23; a full geometry solver comes later.",
        ["fork"],
      ),
    );
  }

  if (
    Boolean(selections.fork) &&
    Math.abs(forkTravelDeltaMm) >= 20
  ) {
    issues.push(
      makeIssue(
        "fork-travel-change",
        "warning",
        "suspension",
        "Suspension travel changes materially",
        "Reference fork travel changes by " +
          (forkTravelDeltaMm > 0 ? "+" : "") +
          forkTravelDeltaMm +
          " mm.",
        ["fork"],
      ),
    );
  }

  let lowGearRatio: number | null = null;
  let highGearRatio: number | null = null;
  let gearRangePercent: number | null = null;

  if (
    frontSmall !== null &&
    frontLarge !== null &&
    rearSmall !== null &&
    rearLarge !== null &&
    rearSmall > 0 &&
    rearLarge > 0
  ) {
    if (architecture === "internal-gear") {
      const internalRange = numberInterface(
        rearTransmission,
        "internalRangePercent",
      );
      const primary = frontLarge / rearSmall;
      if (internalRange && internalRange > 0) {
        const factor = Math.sqrt(internalRange / 100);
        lowGearRatio = primary / factor;
        highGearRatio = primary * factor;
        gearRangePercent = internalRange;
      }
    } else {
      lowGearRatio = frontSmall / rearLarge;
      highGearRatio = frontLarge / rearSmall;
      if (lowGearRatio > 0) {
        gearRangePercent = (highGearRatio / lowGearRatio) * 100;
      }
    }
  }

  const blocking = issues.some(
    (issue) => issue.severity === "blocking",
  );
  const warnings = issues.some(
    (issue) => issue.severity === "warning",
  );

  return {
    health: blocking ? "blocked" : warnings ? "attention" : "ready",
    issues,
    modifiedSlotCount: Object.keys(selections).length,
    metrics: {
      massDeltaKg: massDelta(bikeId, selections),
      cdaDeltaM2: aeroDelta(bikeId, selections),
      frontBrakeTorqueRatio: brakeRatio(bikeId, "front", selections),
      rearBrakeTorqueRatio: brakeRatio(bikeId, "rear", selections),
      lowGearRatio,
      highGearRatio,
      gearRangePercent,
      forkTravelDeltaMm,
      axleToCrownDeltaMm,
    },
  };
}
