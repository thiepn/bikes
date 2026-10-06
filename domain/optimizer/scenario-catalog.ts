import scenarioJson from "@/content/optimizer/scenarios.json";
import type {
  PortfolioScenario,
  PortfolioScenarioId,
} from "@/engine/optimizer/portfolio-types";

export const PORTFOLIO_SCENARIOS =
  scenarioJson.scenarios as PortfolioScenario[];

const BY_ID = new Map(
  PORTFOLIO_SCENARIOS.map((scenario) => [
    scenario.id,
    scenario,
  ]),
);

export function getPortfolioScenario(
  scenarioId: PortfolioScenarioId,
) {
  return BY_ID.get(scenarioId) ?? null;
}
