import { encodeBuildSelections } from "@/domain/compatibility/build-state";
import { PORTFOLIO_SCENARIOS } from "@/domain/optimizer/scenario-catalog";
import type {
  PortfolioEvaluation,
  PortfolioScenarioId,
} from "@/engine/optimizer/portfolio-types";

export const BUILD_REPORT_SCHEMA_VERSION = 1;

export interface BuildDecisionExplanation {
  summary: string;
  strengths: string[];
  tradeoffs: string[];
  rank: number;
  totalCandidates: number;
}

export interface BuildDecisionReport {
  schemaVersion: 1;
  kind: "bike-atlas-build-report";
  generatedAt: string;
  bikeId: string;
  name: string;
  source: string;
  health: PortfolioEvaluation["health"];
  rank: number;
  totalCandidates: number;
  aggregateScore: number;
  selectedScenarioIds: PortfolioScenarioId[];
  scenarioResults: Array<{
    id: PortfolioScenarioId;
    name: string;
    score: number;
    speedKph: number;
    cadenceRpm: number;
    closestGearLabel: string;
    closestGearSpeedKph: number;
  }>;
  metrics: {
    bikeMassKg: number;
    cdaM2: number;
    lowGearRatio: number;
    highGearRatio: number;
    saddleToGripDropMm: number;
    changedSlots: number;
  };
  selections: Record<string, string>;
  encodedSelections: string;
  explanation: BuildDecisionExplanation;
}

export interface PortfolioExport {
  schemaVersion: 1;
  kind: "bike-atlas-portfolio-export";
  generatedAt: string;
  selectedScenarioIds: PortfolioScenarioId[];
  builds: BuildDecisionReport[];
}

function scenarioName(id: PortfolioScenarioId) {
  return (
    PORTFOLIO_SCENARIOS.find((scenario) => scenario.id === id)?.name ??
    id
  );
}

function signed(value: number, digits = 1) {
  const rounded = value.toFixed(digits);
  return value > 0 ? `+${rounded}` : rounded;
}

export function explainPortfolioDecision(
  selected: PortfolioEvaluation,
  evaluations: readonly PortfolioEvaluation[],
): BuildDecisionExplanation {
  const rankIndex = evaluations.findIndex(
    (candidate) => candidate.entry.id === selected.entry.id,
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : 1;
  const totalCandidates = Math.max(evaluations.length, 1);
  const leader = evaluations[0] ?? selected;

  const scenarioResults = [...selected.scenarioResults].sort(
    (a, b) => b.score - a.score,
  );
  const strongest = scenarioResults[0];
  const weakest = scenarioResults.at(-1);

  const strengths: string[] = [];
  const tradeoffs: string[] = [];

  if (strongest) {
    strengths.push(
      `Strongest in ${scenarioName(strongest.scenarioId)}: ${strongest.score.toFixed(
        0,
      )}/100 at ${strongest.speedKph.toFixed(1)} km/h.`,
    );
  }

  if (
    weakest &&
    strongest &&
    weakest.scenarioId !== strongest.scenarioId
  ) {
    tradeoffs.push(
      `Weakest in ${scenarioName(weakest.scenarioId)}: ${weakest.score.toFixed(
        0,
      )}/100 at ${weakest.speedKph.toFixed(1)} km/h.`,
    );
  }

  if (leader.entry.id !== selected.entry.id) {
    const wins: string[] = [];
    const trails: string[] = [];

    for (const result of selected.scenarioResults) {
      const leaderResult = leader.scenarioResults.find(
        (candidate) => candidate.scenarioId === result.scenarioId,
      );
      if (!leaderResult) continue;

      const delta = result.score - leaderResult.score;
      if (delta > 0.5) {
        wins.push(
          `${scenarioName(result.scenarioId)} ${signed(delta)} points`,
        );
      } else if (delta < -0.5) {
        trails.push(
          `${scenarioName(result.scenarioId)} ${signed(delta)} points`,
        );
      }
    }

    if (wins.length) {
      strengths.push(
        `Beats “${leader.entry.name}” in ${wins.join(", ")}.`,
      );
    }

    if (trails.length) {
      tradeoffs.push(
        `Trails “${leader.entry.name}” in ${trails.join(", ")}.`,
      );
    }

    const massDelta = selected.bikeMassKg - leader.bikeMassKg;
    if (Math.abs(massDelta) >= 0.05) {
      const direction = massDelta < 0 ? "lighter" : "heavier";
      const note = `${Math.abs(massDelta).toFixed(2)} kg ${direction} than “${leader.entry.name}”.`;
      (massDelta < 0 ? strengths : tradeoffs).push(note);
    }

    const lowGearDelta =
      selected.lowGearRatio - leader.lowGearRatio;
    if (Math.abs(lowGearDelta) >= 0.03) {
      const easier = lowGearDelta < 0;
      const note = `${easier ? "Easier" : "Harder"} lowest gear than “${leader.entry.name}” (${selected.lowGearRatio.toFixed(
        2,
      )}× vs ${leader.lowGearRatio.toFixed(2)}×).`;
      (easier ? strengths : tradeoffs).push(note);
    }
  }

  if (selected.health === "attention") {
    tradeoffs.push(
      "Current system analysis flags this build for attention.",
    );
  } else if (selected.health === "blocked") {
    tradeoffs.push(
      "Current system analysis blocks this historical build; it should not be restored as a coherent configuration.",
    );
  } else {
    strengths.push(
      "Current compatibility and system analysis classify the build as ready.",
    );
  }

  const summary =
    leader.entry.id === selected.entry.id
      ? `Ranks #1 of ${totalCandidates} across the selected scenarios with an aggregate score of ${selected.aggregateScore.toFixed(
          1,
        )}.`
      : `Ranks #${rank} of ${totalCandidates}, ${Math.max(
          0,
          leader.aggregateScore - selected.aggregateScore,
        ).toFixed(1)} points behind “${leader.entry.name}” on the selected scenario mix.`;

  return {
    summary,
    strengths,
    tradeoffs,
    rank,
    totalCandidates,
  };
}

export function createBuildDecisionReport(
  selected: PortfolioEvaluation,
  evaluations: readonly PortfolioEvaluation[],
  selectedScenarioIds: readonly PortfolioScenarioId[],
  generatedAt: string,
): BuildDecisionReport {
  const explanation = explainPortfolioDecision(
    selected,
    evaluations,
  );

  return {
    schemaVersion: BUILD_REPORT_SCHEMA_VERSION,
    kind: "bike-atlas-build-report",
    generatedAt,
    bikeId: selected.entry.bikeId,
    name: selected.entry.name,
    source: selected.entry.source,
    health: selected.health,
    rank: explanation.rank,
    totalCandidates: explanation.totalCandidates,
    aggregateScore: selected.aggregateScore,
    selectedScenarioIds: [...selectedScenarioIds],
    scenarioResults: selected.scenarioResults.map((result) => {
      const scenario = PORTFOLIO_SCENARIOS.find(
        (candidate) => candidate.id === result.scenarioId,
      );
      return {
        id: result.scenarioId,
        name: scenario?.name ?? result.scenarioId,
        score: result.score,
        speedKph: result.speedKph,
        cadenceRpm: scenario?.scenario.cadenceRpm ?? 0,
        closestGearLabel: result.closestGearLabel,
        closestGearSpeedKph: result.closestGearSpeedKph,
      };
    }),
    metrics: {
      bikeMassKg: selected.bikeMassKg,
      cdaM2: selected.cdaM2,
      lowGearRatio: selected.lowGearRatio,
      highGearRatio: selected.highGearRatio,
      saddleToGripDropMm: selected.saddleToGripDropMm,
      changedSlots: selected.changedSlots,
    },
    selections: { ...selected.entry.selections },
    encodedSelections: encodeBuildSelections(
      selected.entry.selections,
    ),
    explanation,
  };
}

export function createPortfolioExport(
  evaluations: readonly PortfolioEvaluation[],
  selectedScenarioIds: readonly PortfolioScenarioId[],
  generatedAt: string,
): PortfolioExport {
  return {
    schemaVersion: BUILD_REPORT_SCHEMA_VERSION,
    kind: "bike-atlas-portfolio-export",
    generatedAt,
    selectedScenarioIds: [...selectedScenarioIds],
    builds: evaluations.map((evaluation) =>
      createBuildDecisionReport(
        evaluation,
        evaluations,
        selectedScenarioIds,
        generatedAt,
      ),
    ),
  };
}

export function createShareableBuildUrl(
  currentUrl: string,
  report: BuildDecisionReport,
) {
  const url = new URL(currentUrl);
  const optimizerKeys = [
    "optimize",
    "optGoal",
    "optChanges",
    "optGuard",
    "optPreserve",
    "optView",
    "optX",
    "optY",
    "optPoint",
    "portSc",
  ];

  for (const key of optimizerKeys) {
    url.searchParams.delete(key);
  }

  url.searchParams.set("build", "1");
  if (report.encodedSelections) {
    url.searchParams.set("buildParts", report.encodedSelections);
  } else {
    url.searchParams.delete("buildParts");
  }

  return url.toString();
}

export function formatBuildDecisionReport(
  report: BuildDecisionReport,
) {
  const lines = [
    `# Bike Atlas — ${report.name}`,
    "",
    `Generated: ${report.generatedAt}`,
    `Bike: ${report.bikeId}`,
    `Source: ${report.source}`,
    `System health: ${report.health}`,
    `Portfolio rank: #${report.rank} of ${report.totalCandidates}`,
    `Aggregate scenario score: ${report.aggregateScore.toFixed(1)} / 100`,
    "",
    "## Decision explanation",
    "",
    report.explanation.summary,
    "",
    "### Strengths",
    ...report.explanation.strengths.map((item) => `- ${item}`),
    "",
    "### Trade-offs",
    ...(
      report.explanation.tradeoffs.length
        ? report.explanation.tradeoffs
        : ["No additional trade-off note was generated for the selected scenario mix."]
    ).map((item) => `- ${item}`),
    "",
    "## Scenario results",
    "",
    "| Scenario | Score | Speed | Cadence reference | Closest gear |",
    "| --- | ---: | ---: | ---: | --- |",
    ...report.scenarioResults.map(
      (result) =>
        `| ${result.name} | ${result.score.toFixed(0)} | ${result.speedKph.toFixed(
          1,
        )} km/h | ${result.cadenceRpm} rpm | ${result.closestGearLabel} · ${result.closestGearSpeedKph.toFixed(
          1,
        )} km/h |`,
    ),
    "",
    "## Build metrics",
    "",
    `- Mass: ${report.metrics.bikeMassKg.toFixed(2)} kg`,
    `- CdA: ${report.metrics.cdaM2.toFixed(3)} m²`,
    `- Gear span: ${report.metrics.lowGearRatio.toFixed(
      2,
    )}× → ${report.metrics.highGearRatio.toFixed(2)}×`,
    `- Saddle → grip drop: ${Math.round(
      report.metrics.saddleToGripDropMm,
    )} mm`,
    `- Modified slots: ${report.metrics.changedSlots}`,
    "",
    "## Component selections",
    "",
    ...(Object.keys(report.selections).length
      ? Object.entries(report.selections)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([slotId, partId]) => `- ${slotId}: ${partId}`)
      : ["- Stock/reference configuration"]),
    "",
    "> Bike Atlas report scores are educational comparison indexes, not rider-specific predictions, purchasing advice, fit certification, or structural approval.",
  ];

  return lines.join("\n");
}
