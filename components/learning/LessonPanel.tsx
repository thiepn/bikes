"use client";

import { useMemo } from "react";
import { ROAD_R1_COMPONENTS_BY_ID } from "@/domain/bike/road-r1";
import {
  getDrivetrainKinematics,
  ROAD_R1_DEMO_SPROCKET_TEETH,
} from "@/engine/learning/drivetrain-math";
import type {
  InteractiveLesson,
  LessonChallengeResult,
} from "@/engine/learning/types";

type LessonPanelProps = {
  lesson: InteractiveLesson;
  stepIndex: number;
  running: boolean;
  cadenceRpm: number;
  gearIndex: number;
  challengeResult?: LessonChallengeResult;
  onStepChange: (index: number) => void;
  onRunningChange: (running: boolean) => void;
  onGearChange: (gearIndex: number) => void;
  onChallengeAnswer: (answerId: string) => void;
  onFinish: () => void;
  onExit: () => void;
};

export function LessonPanel({
  lesson,
  stepIndex,
  running,
  cadenceRpm,
  gearIndex,
  challengeResult,
  onStepChange,
  onRunningChange,
  onGearChange,
  onChallengeAnswer,
  onFinish,
  onExit,
}: LessonPanelProps) {
  const step = lesson.steps[stepIndex];
  const stats = useMemo(
    () => getDrivetrainKinematics(gearIndex, cadenceRpm),
    [cadenceRpm, gearIndex],
  );
  const lastStep = stepIndex === lesson.steps.length - 1;
  const challengePassed =
    !step.challenge || challengeResult?.correct === true;

  function feedbackText() {
    if (!step.challenge || !challengeResult) return null;

    if (step.challenge.type === "multiple-choice") {
      return challengeResult.correct
        ? step.challenge.explanation
        : "Try again. Compare the mechanical relationship shown on the bike.";
    }

    return challengeResult.correct
      ? step.challenge.successText
      : step.challenge.retryText;
  }

  return (
    <aside className="lesson-panel" aria-label={lesson.title}>
      <div className="lesson-panel__top">
        <div>
          <span className="lesson-kicker">
            Interactive lesson · {lesson.durationMinutes} min
          </span>
          <strong>{lesson.title}</strong>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onExit}
          aria-label="Exit lesson"
        >
          ×
        </button>
      </div>

      <div
        className="lesson-progress"
        style={{
          gridTemplateColumns: `repeat(${lesson.steps.length}, 1fr)`,
        }}
        aria-label={`Step ${stepIndex + 1} of ${lesson.steps.length}`}
      >
        {lesson.steps.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={
              index === stepIndex
                ? "lesson-progress__step is-active"
                : index < stepIndex
                  ? "lesson-progress__step is-complete"
                  : "lesson-progress__step"
            }
            onClick={() => onStepChange(index)}
            aria-label={`Go to step ${index + 1}: ${item.title}`}
          />
        ))}
      </div>

      <div className="lesson-content" aria-live="polite">
        <span className="lesson-step-eyebrow">{step.eyebrow}</span>
        <h2>{step.title}</h2>
        <p>{step.body}</p>

        <div className="lesson-fact">
          <span>Key idea</span>
          <p>{step.keyFact}</p>
        </div>

        {step.demo && (
          <div className="lesson-demo">
            <div className="lesson-demo__header">
              <span>Live drivetrain</span>
              <strong>{cadenceRpm} rpm</strong>
            </div>

            <button
              type="button"
              className={
                running
                  ? "lesson-play is-running"
                  : "lesson-play"
              }
              onClick={() => onRunningChange(!running)}
            >
              <span aria-hidden="true">
                {running ? "Ⅱ" : "▶"}
              </span>
              {running ? "Pause motion" : "Run drivetrain"}
            </button>
          </div>
        )}

        {step.showRatio && (
          <div className="lesson-ratio">
            <div>
              <span>Gear ratio</span>
              <strong>{stats.ratio.toFixed(2)}×</strong>
              <small>
                {stats.frontTeeth}T ÷ {stats.rearTeeth}T
              </small>
            </div>
            <div>
              <span>Wheel rpm</span>
              <strong>{Math.round(stats.wheelRpm)}</strong>
              <small>at {cadenceRpm} rpm cadence</small>
            </div>
            <div>
              <span>Kinematic speed</span>
              <strong>{stats.speedKmh.toFixed(1)}</strong>
              <small>km/h · approx. 700c wheel</small>
            </div>
          </div>
        )}

        {step.allowGearControl && (
          <div className="lesson-gears">
            <span>Rear sprocket</span>
            <div className="lesson-gears__control">
              <button
                type="button"
                disabled={gearIndex === 0}
                onClick={() => onGearChange(gearIndex - 1)}
                aria-label="Move to smaller rear sprocket"
              >
                −
              </button>
              <strong>
                {ROAD_R1_DEMO_SPROCKET_TEETH[gearIndex]}T
              </strong>
              <button
                type="button"
                disabled={
                  gearIndex ===
                  ROAD_R1_DEMO_SPROCKET_TEETH.length - 1
                }
                onClick={() => onGearChange(gearIndex + 1)}
                aria-label="Move to larger rear sprocket"
              >
                +
              </button>
            </div>
            <small>
              Smaller = higher ratio · larger = easier ratio
            </small>
          </div>
        )}

        {step.challenge && (
          <div className="lesson-quiz">
            <span>
              {step.challenge.type === "select-component"
                ? "3D challenge"
                : "Check your understanding"}
            </span>
            <p>{step.challenge.prompt}</p>

            {step.challenge.type === "multiple-choice" ? (
              <div className="lesson-quiz__options">
                {step.challenge.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={
                      challengeResult?.answerId === option.id
                        ? "lesson-quiz__option is-selected"
                        : "lesson-quiz__option"
                    }
                    onClick={() => onChallengeAnswer(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <p className="lesson-quiz__instruction">
                  Tap the component on the bike, or use these accessible
                  choices:
                </p>
                <div className="lesson-quiz__options">
                  {step.challenge.candidateComponentIds.map(
                    (componentId) => {
                      const component =
                        ROAD_R1_COMPONENTS_BY_ID.get(componentId);
                      return (
                        <button
                          key={componentId}
                          type="button"
                          className={
                            challengeResult?.answerId === componentId
                              ? "lesson-quiz__option is-selected"
                              : "lesson-quiz__option"
                          }
                          onClick={() =>
                            onChallengeAnswer(componentId)
                          }
                        >
                          {component?.name ?? componentId}
                        </button>
                      );
                    },
                  )}
                </div>
              </>
            )}

            {challengeResult && (
              <p
                className={
                  challengeResult.correct
                    ? "lesson-quiz__feedback is-correct"
                    : "lesson-quiz__feedback"
                }
              >
                <strong>
                  {challengeResult.correct
                    ? "Correct."
                    : "Not quite."}
                </strong>{" "}
                {feedbackText()}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="lesson-footer">
        <button
          type="button"
          className="lesson-nav lesson-nav--secondary"
          disabled={stepIndex === 0}
          onClick={() => onStepChange(stepIndex - 1)}
        >
          ← Previous
        </button>
        <button
          type="button"
          className="lesson-nav lesson-nav--primary"
          disabled={!challengePassed}
          onClick={() =>
            lastStep ? onFinish() : onStepChange(stepIndex + 1)
          }
        >
          {lastStep ? "Finish lesson" : "Next →"}
        </button>
      </div>
    </aside>
  );
}
