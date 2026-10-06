import drivetrain from "@/content/lessons/drivetrain-basics.json";
import wheels from "@/content/lessons/wheels-hubs-basics.json";
import brakes from "@/content/lessons/braking-basics.json";
import steering from "@/content/lessons/frame-steering-basics.json";
import mtbSuspension from "@/content/lessons/mtb-suspension-basics.json";
import mtbDropper from "@/content/lessons/mtb-dropper-basics.json";
import mtbOneBy from "@/content/lessons/mtb-one-by-drivetrain.json";
import mtbTires from "@/content/lessons/mtb-trail-tires.json";
import type { InteractiveLesson } from "@/engine/learning/types";

export const LESSON_CATALOG = [
  drivetrain,
  wheels,
  brakes,
  steering,
  mtbSuspension,
  mtbDropper,
  mtbOneBy,
  mtbTires,
] as unknown as InteractiveLesson[];

const LESSONS_BY_ID = new Map(
  LESSON_CATALOG.map((lesson) => [lesson.id, lesson]),
);

export function getLessonById(lessonId: string | null) {
  if (!lessonId) return null;
  return LESSONS_BY_ID.get(lessonId) ?? null;
}

export function getLessonsForBike(bikeId: string) {
  return LESSON_CATALOG.filter((lesson) => lesson.bikeId === bikeId);
}

export function getLessonPrerequisites(lesson: InteractiveLesson) {
  return lesson.prerequisiteLessonIds
    .map((lessonId) => LESSONS_BY_ID.get(lessonId))
    .filter((item): item is InteractiveLesson => Boolean(item));
}
