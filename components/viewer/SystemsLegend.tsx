"use client";

import { SYSTEM_COLORS } from "@/engine/inspection/config";
import type { BikeSystemId } from "@/domain/bike/types";

const VISIBLE_SYSTEMS: Array<[BikeSystemId, string]> = [
  ["frame", "Frame"],
  ["fork-suspension", "Fork"],
  ["cockpit", "Cockpit"],
  ["front-wheel", "Front wheel"],
  ["rear-wheel", "Rear wheel"],
  ["tires", "Tires"],
  ["drivetrain", "Drivetrain"],
  ["transmission", "Transmission"],
  ["braking", "Braking"],
  ["saddle-seatpost", "Saddle"],
  ["pedals", "Pedals"],
];

export function SystemsLegend() {
  return (
    <div className="systems-legend" aria-label="Bicycle system colors">
      {VISIBLE_SYSTEMS.map(([systemId, label]) => (
        <span key={systemId}>
          <i style={{ background: SYSTEM_COLORS[systemId] }} />
          {label}
        </span>
      ))}
    </div>
  );
}
