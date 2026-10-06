"use client";

import { useMemo, useState } from "react";
import { getBikeById } from "@/domain/bike/catalog";
import {
  FINDER_PRESETS,
  FINDER_QUESTIONS,
  FINDER_TRAIT_LABELS,
  getFinderOption,
  recommendBikes,
} from "@/domain/finder/recommend";
import type { FinderAnswers } from "@/engine/finder/types";

type Props = {
  answers: FinderAnswers;
  onAnswersChange: (answers: FinderAnswers) => void;
  onExploreBike: (bikeId: string) => void;
  onCompareBikes: (primaryBikeId: string, secondaryBikeId: string) => void;
  onClose: () => void;
};

export function BikeFinderPanel({
  answers,
  onAnswersChange,
  onExploreBike,
  onCompareBikes,
  onClose,
}: Props) {
  const recommendation = useMemo(
    () => recommendBikes(answers),
    [answers],
  );
  const firstMissing = FINDER_QUESTIONS.findIndex(
    (question) => !answers[question.id],
  );
  const [stepIndex, setStepIndex] = useState(
    firstMissing >= 0 ? firstMissing : FINDER_QUESTIONS.length,
  );

  const showingResult = stepIndex >= FINDER_QUESTIONS.length;
  const question = FINDER_QUESTIONS[
    Math.min(stepIndex, FINDER_QUESTIONS.length - 1)
  ];
  const selectedOption = question
    ? answers[question.id]
    : undefined;

  const topBike = recommendation.top
    ? getBikeById(recommendation.top.bikeId)
    : null;
  const alternativeBike = recommendation.alternative
    ? getBikeById(recommendation.alternative.bikeId)
    : null;

  const applyPreset = (presetId: string) => {
    const preset = FINDER_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    onAnswersChange({ ...preset.answers });
    setStepIndex(FINDER_QUESTIONS.length);
  };

  const answerQuestion = (optionId: string) => {
    if (!question) return;
    onAnswersChange({
      ...answers,
      [question.id]: optionId,
    });
  };

  const goNext = () => {
    if (!selectedOption) return;
    setStepIndex((current) =>
      Math.min(FINDER_QUESTIONS.length, current + 1),
    );
  };

  const reset = () => {
    onAnswersChange({});
    setStepIndex(0);
  };

  return (
    <aside className="finder-panel" aria-label="Bike finder">
      <div className="finder-header">
        <div>
          <span className="finder-kicker">Bike Finder</span>
          <h2>
            {showingResult ? "Your closest match." : "What do you need?"}
          </h2>
          <p>
            Explainable recommendations from Bike Atlas archetype data.
            No brands, prices or hidden AI ranking.
          </p>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onClose}
          aria-label="Close bike finder"
        >
          ×
        </button>
      </div>

      {!showingResult ? (
        <>
          <div className="finder-presets">
            <span>Start from a use case</span>
            <div>
              {FINDER_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="finder-progress">
            <span>
              {stepIndex + 1} / {FINDER_QUESTIONS.length}
            </span>
            <div aria-hidden="true">
              {FINDER_QUESTIONS.map((item, index) => (
                <i
                  key={item.id}
                  className={
                    index <= stepIndex ? "is-active" : ""
                  }
                />
              ))}
            </div>
          </div>

          <section className="finder-question">
            <span>{question.title}</span>
            <h3>{question.prompt}</h3>

            <div className="finder-options">
              {question.options.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={
                    selectedOption === option.id
                      ? "finder-option is-selected"
                      : "finder-option"
                  }
                  onClick={() => answerQuestion(option.id)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </section>

          <div className="finder-nav">
            <button
              type="button"
              className="finder-nav__secondary"
              disabled={stepIndex === 0}
              onClick={() =>
                setStepIndex((current) => Math.max(0, current - 1))
              }
            >
              Back
            </button>
            <button
              type="button"
              className="finder-nav__primary"
              disabled={!selectedOption}
              onClick={goNext}
            >
              {stepIndex === FINDER_QUESTIONS.length - 1
                ? "See match"
                : "Continue"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      ) : topBike && recommendation.top ? (
        <div className="finder-result">
          <div className="finder-result__hero">
            <span>
              {recommendation.catalogGap
                ? "Closest current match"
                : recommendation.top.fitBand === "strong"
                  ? "Strong current match"
                  : "Good current match"}
            </span>
            <div>
              <h3>{topBike.name}</h3>
              <strong>{recommendation.top.score}</strong>
              <small>/100 fit</small>
            </div>
            <p>{topBike.description}</p>
          </div>

          {recommendation.catalogGap && (
            <div className="finder-gap">
              <strong>Current catalog gap</strong>
              <p>
                One or more high-priority needs are not covered well by
                Road R1 or MTB M1. The result below is the closest current
                archetype, not a claim that it is ideal.
              </p>
            </div>
          )}

          <section className="finder-reasons">
            <h4>Why it fits</h4>
            {recommendation.top.matchedFactors.slice(0, 3).map((factor) => (
              <article key={factor.traitId}>
                <span>{FINDER_TRAIT_LABELS[factor.traitId]}</span>
                <p>{factor.reason}</p>
              </article>
            ))}
          </section>

          {recommendation.top.unmetFactors.length > 0 && (
            <section className="finder-reasons finder-reasons--watch">
              <h4>Watch-outs</h4>
              {recommendation.top.unmetFactors.slice(0, 3).map((factor) => (
                <article key={factor.traitId}>
                  <span>{FINDER_TRAIT_LABELS[factor.traitId]}</span>
                  <p>{factor.reason}</p>
                </article>
              ))}
            </section>
          )}

          <section className="finder-tradeoffs">
            <h4>Platform trade-offs</h4>
            <div>
              {recommendation.top.generalTradeoffs.map((tradeoff) => (
                <span key={tradeoff}>{tradeoff}</span>
              ))}
            </div>
          </section>

          <div className="finder-result__actions">
            <button
              type="button"
              className="finder-primary"
              onClick={() => onExploreBike(topBike.id)}
            >
              Explore {topBike.name}
              <span aria-hidden="true">→</span>
            </button>
            {alternativeBike && recommendation.alternative && (
              <button
                type="button"
                className="finder-secondary"
                onClick={() =>
                  onCompareBikes(topBike.id, alternativeBike.id)
                }
              >
                Compare with {alternativeBike.name}
              </button>
            )}
          </div>

          {alternativeBike && recommendation.alternative && (
            <div className="finder-alternative">
              <span>Alternative</span>
              <div>
                <strong>{alternativeBike.name}</strong>
                <b>{recommendation.alternative.score}/100</b>
              </div>
              <p>
                {recommendation.alternative.generalStrengths
                  .slice(0, 2)
                  .join(" · ")}
              </p>
            </div>
          )}

          <section className="finder-summary">
            <h4>Your answers</h4>
            <div>
              {FINDER_QUESTIONS.map((item, index) => {
                const option = getFinderOption(
                  item.id,
                  answers[item.id],
                );
                if (!option) return null;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setStepIndex(index)}
                  >
                    <span>{item.title}</span>
                    <strong>{option.label}</strong>
                  </button>
                );
              })}
            </div>
          </section>

          <button
            type="button"
            className="finder-reset"
            onClick={reset}
          >
            Start over
          </button>
        </div>
      ) : null}
    </aside>
  );
}
