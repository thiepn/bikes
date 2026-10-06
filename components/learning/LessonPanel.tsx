"use client";

import { useEffect, useMemo, useState } from "react";
import { DRIVETRAIN_BASICS_LESSON } from "@/domain/learning/drivetrain-basics";
import {
  getDrivetrainKinematics,
  ROAD_R1_DEMO_SPROCKET_TEETH,
} from "@/engine/learning/drivetrain-math";
import type { LessonStep } from "@/engine/learning/types";

type LessonPanelProps = {
  stepIndex: number;
  running: boolean;
  cadenceRpm: number;
  gearIndex: number;
  onStepChange: (index: number) => void;
  onRunningChange: (running: boolean) => void;
  onGearChange: (gearIndex: number) => void;
  onExit: () => void;
};

export function LessonPanel({
  stepIndex,
  running,
  cadenceRpm,
  gearIndex,
  onStepChange,
  onRunningChange,
  onGearChange,
  onExit,
}: LessonPanelProps) {
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const lesson = DRIVETRAIN_BASICS_LESSON;
  const step = lesson.steps[stepIndex] as LessonStep;
  const stats = useMemo(
    () => getDrivetrainKinematics(gearIndex, cadenceRpm),
    [cadenceRpm, gearIndex],
  );
  const lastStep = stepIndex === lesson.steps.length - 1;

  useEffect(() => {
    setQuizAnswer(null);
  }, [stepIndex]);

  const quizCorrect =
    step.quiz && quizAnswer
      ? quizAnswer === step.quiz.correctOptionId
      : null;

  return (
    <aside className="lesson-panel" aria-label={lesson.title}>
      <div className="lesson-panel__top">
        <div>
          <span className="lesson-kicker">Interactive lesson</span>
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
            <span aria-hidden="true">{running ? "Ⅱ" : "▶"}</span>
            {running ? "Pause motion" : "Run drivetrain"}
          </button>
        </div>

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

        {step.quiz && (
          <div className="lesson-quiz">
            <span>Check your understanding</span>
            <p>{step.quiz.question}</p>
            <div className="lesson-quiz__options">
              {step.quiz.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={
                    quizAnswer === option.id
                      ? "lesson-quiz__option is-selected"
                      : "lesson-quiz__option"
                  }
                  onClick={() => setQuizAnswer(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {quizAnswer && (
              <p
                className={
                  quizCorrect
                    ? "lesson-quiz__feedback is-correct"
                    : "lesson-quiz__feedback"
                }
              >
                <strong>
                  {quizCorrect ? "Correct." : "Not quite."}
                </strong>{" "}
                {step.quiz.explanation}
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
          onClick={() =>
            lastStep ? onExit() : onStepChange(stepIndex + 1)
          }
        >
          {lastStep ? "Finish lesson" : "Next →"}
        </button>
      </div>
    </aside>
  );
}
