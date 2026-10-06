export type HistoryCategory =
  | "steering"
  | "propulsion"
  | "wheels-tires"
  | "architecture"
  | "drivetrain"
  | "utility"
  | "off-road"
  | "sport";

export type HistoryDateKind =
  | "year"
  | "approximate"
  | "period"
  | "present";

export interface HistorySource {
  title: string;
  organization: string;
  url: string;
}

export interface HistoryLineageTarget {
  bikeId: string;
  componentId: string;
  label: string;
}

export interface HistoryEvent {
  id: string;
  startYear: number;
  endYear?: number;
  yearLabel: string;
  dateKind: HistoryDateKind;
  title: string;
  subtitle: string;
  summary: string;
  engineeringShift: string[];
  categoryIds: HistoryCategory[];
  lineageTargets: HistoryLineageTarget[];
  caveat?: string;
  sources: HistorySource[];
}

export interface HistoryEra {
  id: string;
  label: string;
  startYear: number;
  endYear?: number;
}
