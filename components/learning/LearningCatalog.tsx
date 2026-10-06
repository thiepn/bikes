"use client";

import {
  LESSON_CATALOG,
  getLessonPrerequisites,
} from "@/domain/learning/catalog";
import {
  isLessonCompleted,
} from "@/engine/learning/progress";
import type { LearningProgressStore } from "@/engine/learning/types";

type LearningCatalogProps = {
  progress: LearningProgressStore;
  hydrated: boolean;
  onStartLesson: (lessonId: string, stepIndex: number) => void;
  onClose: () => void;
};

export function LearningCatalog({
  progress,
  hydrated,
  onStartLesson,
  onClose,
}: LearningCatalogProps) {
  const completed = LESSON_CATALOG.filter((lesson) =>
    isLessonCompleted(progress, lesson.id),
  ).length;
  const percentage = Math.round(
    (completed / LESSON_CATALOG.length) * 100,
  );

  return (
    <aside className="learning-catalog" aria-label="Bike Atlas lessons">
      <div className="learning-catalog__header">
        <div>
          <span className="lesson-kicker">Learn Bike Atlas</span>
          <h2>Understand the systems.</h2>
          <p>
            Short interactive lessons use the same 3D bike you explore.
            Progress stays on this device.
          </p>
        </div>
        <button
          type="button"
          className="lesson-close"
          onClick={onClose}
          aria-label="Close lesson catalog"
        >
          ×
        </button>
      </div>

      <div className="learning-overview">
        <span>
          <strong>{completed}</strong> / {LESSON_CATALOG.length} completed
        </span>
        <span>{percentage}%</span>
        <div aria-hidden="true">
          <i style={{ transform: `scaleX(${percentage / 100})` }} />
        </div>
      </div>

      <div className="learning-list">
        {LESSON_CATALOG.map((lesson, index) => {
          const record = progress.lessons[lesson.id];
          const prerequisites = getLessonPrerequisites(lesson);
          const locked =
            hydrated &&
            prerequisites.some(
              (item) => !isLessonCompleted(progress, item.id),
            );
          const complete = record?.status === "completed";
          const inProgress = record?.status === "in-progress";
          const resumeStep = Math.min(
            lesson.steps.length - 1,
            Math.max(0, record?.lastStepIndex ?? 0),
          );

          return (
            <article
              className={
                locked
                  ? "learning-card is-locked"
                  : complete
                    ? "learning-card is-complete"
                    : "learning-card"
              }
              key={lesson.id}
            >
              <div className="learning-card__index">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="learning-card__body">
                <div className="learning-card__meta">
                  <span>{lesson.systemId.replaceAll("-", " ")}</span>
                  <span>{lesson.durationMinutes} min</span>
                  <span>{lesson.difficulty}</span>
                </div>
                <h3>{lesson.title}</h3>
                <p>{lesson.summary}</p>

                {locked && (
                  <small className="learning-card__lock">
                    Complete{" "}
                    {prerequisites.map((item) => item.title).join(", ")} first.
                  </small>
                )}

                {complete && (
                  <small className="learning-card__score">
                    Completed · best score {record.bestScore}%
                  </small>
                )}
              </div>

              <button
                type="button"
                className="learning-card__action"
                disabled={locked}
                onClick={() =>
                  onStartLesson(
                    lesson.id,
                    inProgress ? resumeStep : 0,
                  )
                }
              >
                {locked
                  ? "Locked"
                  : complete
                    ? "Review"
                    : inProgress
                      ? "Resume"
                      : "Start"}
                {!locked && <span aria-hidden="true">→</span>}
              </button>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
