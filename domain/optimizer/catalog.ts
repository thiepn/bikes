import goalJson from "@/content/optimizer/goals.json";
import type {
  OptimizationGoalId,
  OptimizationGoalProfile,
} from "@/engine/optimizer/types";

export const OPTIMIZATION_GOALS =
  goalJson.goals as OptimizationGoalProfile[];

const BY_ID = new Map(
  OPTIMIZATION_GOALS.map((goal) => [goal.id, goal]),
);

export function getOptimizationGoal(
  goalId: OptimizationGoalId,
) {
  return BY_ID.get(goalId) ?? OPTIMIZATION_GOALS[0];
}
