import questionsJson from "@/content/finder/questions.json";
import profilesJson from "@/content/finder/profiles.json";
import presetsJson from "@/content/finder/presets.json";
import type {
  BikeFinderProfile,
  BikeFinderResult,
  FinderAnswers,
  FinderPreset,
  FinderQuestion,
  FinderRecommendation,
  FinderTraitId,
  FinderTraitNeed,
} from "@/engine/finder/types";

export const FINDER_QUESTIONS =
  questionsJson.questions as FinderQuestion[];
export const FINDER_PRESETS =
  presetsJson.presets as FinderPreset[];
export const BIKE_FINDER_PROFILES =
  profilesJson.profiles as BikeFinderProfile[];

const PROFILES_BY_BIKE = new Map(
  BIKE_FINDER_PROFILES.map((profile) => [profile.bikeId, profile]),
);

export const FINDER_TRAIT_LABELS: Record<FinderTraitId, string> = {
  pavedEfficiency: "Paved efficiency",
  mixedSurface: "Mixed-surface ability",
  technicalTerrain: "Technical terrain",
  distanceEfficiency: "Distance efficiency",
  climbingCapability: "Climbing",
  comfortControl: "Comfort & control",
  cargoUtility: "Cargo utility",
  allWeather: "All-weather use",
  maintenanceSimplicity: "Maintenance simplicity",
  suspensionCapability: "Suspension capability",
};

export function getFinderQuestion(questionId: string) {
  return FINDER_QUESTIONS.find((question) => question.id === questionId) ?? null;
}

export function getFinderOption(questionId: string, optionId: string) {
  return (
    getFinderQuestion(questionId)?.options.find(
      (option) => option.id === optionId,
    ) ?? null
  );
}

export function sanitizeFinderAnswers(
  answers: FinderAnswers,
): FinderAnswers {
  const clean: FinderAnswers = {};

  for (const question of FINDER_QUESTIONS) {
    const answer = answers[question.id];
    if (
      answer &&
      question.options.some((option) => option.id === answer)
    ) {
      clean[question.id] = answer;
    }
  }

  return clean;
}

export function isFinderComplete(answers: FinderAnswers) {
  const clean = sanitizeFinderAnswers(answers);
  return FINDER_QUESTIONS.every((question) => Boolean(clean[question.id]));
}

export function getFinderNeeds(answers: FinderAnswers): FinderTraitNeed[] {
  const clean = sanitizeFinderAnswers(answers);
  const accumulator = new Map<
    FinderTraitId,
    { weightedDemand: number; weight: number }
  >();

  for (const question of FINDER_QUESTIONS) {
    const answerId = clean[question.id];
    if (!answerId) continue;

    const option = question.options.find((item) => item.id === answerId);
    if (!option) continue;

    for (const [rawTraitId, effect] of Object.entries(option.effects)) {
      if (!effect) continue;
      const traitId = rawTraitId as FinderTraitId;
      const current = accumulator.get(traitId) ?? {
        weightedDemand: 0,
        weight: 0,
      };

      current.weightedDemand += effect.demand * effect.weight;
      current.weight += effect.weight;
      accumulator.set(traitId, current);
    }
  }

  return [...accumulator.entries()]
    .filter(([, value]) => value.weight > 0)
    .map(([traitId, value]) => ({
      traitId,
      demand: value.weightedDemand / value.weight,
      weight: value.weight,
    }));
}

function scoreBike(
  profile: BikeFinderProfile,
  needs: FinderTraitNeed[],
): BikeFinderResult {
  const totalWeight = needs.reduce((sum, need) => sum + need.weight, 0);

  let weightedLoss = 0;
  const factors = needs.map((need) => {
    const capability = profile.traits[need.traitId];
    const shortfall = Math.max(0, need.demand - capability);
    const loss = Math.pow(shortfall, 1.35) * need.weight;
    weightedLoss += loss;

    return {
      traitId: need.traitId,
      score: need.weight * Math.min(need.demand, capability),
      demand: need.demand,
      capability,
      shortfall,
      reason: profile.traitReasons[need.traitId],
      importance: need.weight,
    };
  });

  const rawScore =
    totalWeight === 0
      ? 0
      : 100 * (1 - weightedLoss / totalWeight);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const matchedFactors = factors
    .filter((factor) => factor.demand >= 0.35 && factor.capability >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(
      ({ shortfall: _shortfall, importance: _importance, ...factor }) =>
        factor,
    );

  const unmetFactors = factors
    .filter(
      (factor) =>
        factor.shortfall >= 0.18 &&
        factor.demand >= 0.45,
    )
    .sort(
      (a, b) =>
        b.shortfall * b.importance -
        a.shortfall * a.importance,
    )
    .slice(0, 4)
    .map(
      ({ shortfall: _shortfall, importance: _importance, ...factor }) =>
        factor,
    );

  return {
    bikeId: profile.bikeId,
    score,
    fitBand:
      score >= 86 ? "strong" : score >= 72 ? "good" : "partial",
    matchedFactors,
    unmetFactors,
    generalStrengths: profile.generalStrengths,
    generalTradeoffs: profile.generalTradeoffs,
  };
}

export function recommendBikes(
  answers: FinderAnswers,
): FinderRecommendation {
  const clean = sanitizeFinderAnswers(answers);
  const answered = Object.keys(clean).length;
  const needs = getFinderNeeds(clean);
  const results = BIKE_FINDER_PROFILES
    .map((profile) => scoreBike(profile, needs))
    .sort((a, b) => b.score - a.score);

  const top = results[0] ?? null;
  const alternative = results[1] ?? null;
  const highPriorityGap =
    top?.unmetFactors.some(
      (factor) =>
        factor.demand >= 0.78 &&
        factor.capability < 0.5,
    ) ?? false;

  return {
    complete: isFinderComplete(clean),
    answered,
    total: FINDER_QUESTIONS.length,
    needs,
    results,
    top,
    alternative,
    catalogGap:
      Boolean(top) &&
      (top!.score < 72 || highPriorityGap),
  };
}

export function encodeFinderAnswers(answers: FinderAnswers) {
  const clean = sanitizeFinderAnswers(answers);
  if (!isFinderComplete(clean)) return "";

  return [
    "v1",
    ...FINDER_QUESTIONS.map(
      (question) => clean[question.id],
    ),
  ].join(":");
}

export function decodeFinderAnswers(value: string | null): FinderAnswers {
  if (!value) return {};

  const parts = value.split(":");
  if (parts[0] !== "v1") return {};
  if (parts.length !== FINDER_QUESTIONS.length + 1) return {};

  const answers: FinderAnswers = {};

  FINDER_QUESTIONS.forEach((question, index) => {
    const optionId = parts[index + 1];
    if (
      question.options.some((option) => option.id === optionId)
    ) {
      answers[question.id] = optionId;
    }
  });

  return sanitizeFinderAnswers(answers);
}

export function getFinderProfile(bikeId: string) {
  return PROFILES_BY_BIKE.get(bikeId) ?? null;
}
