"use client";

import type { InspectionMode } from "@/engine/inspection/types";

type InspectionToolbarProps = {
  mode: InspectionMode;
  explosionAmount: number;
  onModeChange: (mode: InspectionMode) => void;
  onExplosionChange: (amount: number) => void;
};

const MODES: Array<{
  id: InspectionMode;
  label: string;
  shortcut: string;
}> = [
  { id: "normal", label: "Normal", shortcut: "N" },
  { id: "systems", label: "Systems", shortcut: "S" },
  { id: "xray", label: "X-Ray", shortcut: "X" },
  { id: "exploded", label: "Exploded", shortcut: "E" },
];

export function InspectionToolbar({
  mode,
  explosionAmount,
  onModeChange,
  onExplosionChange,
}: InspectionToolbarProps) {
  return (
    <div className="inspection-toolbar" aria-label="Inspection mode">
      <div className="inspection-toolbar__modes" role="group" aria-label="View modes">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              mode === item.id
                ? "inspection-mode is-active"
                : "inspection-mode"
            }
            aria-pressed={mode === item.id}
            onClick={() => onModeChange(item.id)}
          >
            <span>{item.label}</span>
            <kbd>{item.shortcut}</kbd>
          </button>
        ))}
      </div>

      {mode === "exploded" && (
        <label className="explosion-control">
          <span>
            Assembly
            <strong>{Math.round(explosionAmount * 100)}%</strong>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(explosionAmount * 100)}
            onChange={(event) =>
              onExplosionChange(Number(event.target.value) / 100)
            }
            aria-label="Exploded view amount"
          />
        </label>
      )}

      <p className="inspection-toolbar__note">
        {mode === "normal" && "Photoreal inspection"}
        {mode === "systems" && "Color by mechanical system"}
        {mode === "xray" && "Structure fades; mechanisms remain readable"}
        {mode === "exploded" && "Scrub through authored component separation"}
      </p>
    </div>
  );
}
