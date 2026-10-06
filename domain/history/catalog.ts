import timelineJson from "@/content/history/timeline.json";
import type {
  HistoryCategory,
  HistoryEvent,
  HistoryEra,
} from "@/engine/history/types";

export const HISTORY_EVENTS =
  timelineJson.events as HistoryEvent[];

export const HISTORY_ERAS =
  timelineJson.eras as HistoryEra[];

const BY_ID = new Map(
  HISTORY_EVENTS.map((event) => [event.id, event]),
);

export const HISTORY_CATEGORY_LABELS: Record<HistoryCategory, string> = {
  steering: "Steering",
  propulsion: "Propulsion",
  "wheels-tires": "Wheels & tires",
  architecture: "Architecture",
  drivetrain: "Drivetrain",
  utility: "Utility",
  "off-road": "Off-road",
  sport: "Sport",
};

export function getHistoryEvent(eventId: string | null) {
  if (!eventId) return null;
  return BY_ID.get(eventId) ?? null;
}

export function getHistoryEventsForCategory(
  category: HistoryCategory | "all",
) {
  if (category === "all") return HISTORY_EVENTS;
  return HISTORY_EVENTS.filter((event) =>
    event.categoryIds.includes(category),
  );
}

export function getHistoryEventIndex(eventId: string) {
  return HISTORY_EVENTS.findIndex((event) => event.id === eventId);
}
