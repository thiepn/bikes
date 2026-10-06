"use client";

import { SYSTEM_COLORS } from "@/engine/inspection/config";
import { getBikeById } from "@/domain/bike/catalog";
import type { BikeSystemId } from "@/domain/bike/types";

const VISIBLE_SYSTEMS: Array<[BikeSystemId, string]> = [
  ["frame", "Frame"],
  ["fork-suspension", "Fork"],
  ["rear-suspension", "Rear suspension"],
  ["steering", "Steering"],
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

export function SystemsLegend({ bikeId }: { bikeId: string }) {
  const bike = getBikeById(bikeId);
  const systems = bike
    ? VISIBLE_SYSTEMS.filter(([systemId]) =>
        bike.systems.includes(systemId),
      )
    : VISIBLE_SYSTEMS;

  return (
    <div className="systems-legend" aria-label="Bicycle system colors">
      {systems.map(([systemId, label]) => (
        <span key={systemId}>
          <i style={{ background: SYSTEM_COLORS[systemId] }} />
          {label}
        </span>
      ))}
    </div>
  );
}
