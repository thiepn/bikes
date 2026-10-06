"use client";

import { BIKE_CATALOG, getBikeById } from "@/domain/bike/catalog";
import {
  compareBikeGeometry,
  compareComponentArchitecture,
  getBikeGeometry,
} from "@/domain/comparison/geometry";

type Props = {
  bikeAId: string;
  bikeBId: string;
  overlayEnabled: boolean;
  onBikeBChange: (bikeId: string) => void;
  onOverlayChange: (enabled: boolean) => void;
  onSwap: () => void;
  onClose: () => void;
};

function signed(value: number, unit: string) {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  return `${value > 0 ? "+" : ""}${rounded}${unit}`;
}

export function ComparisonPanel({
  bikeAId,
  bikeBId,
  overlayEnabled,
  onBikeBChange,
  onOverlayChange,
  onSwap,
  onClose,
}: Props) {
  const a = getBikeById(bikeAId);
  const b = getBikeById(bikeBId);
  const aGeo = getBikeGeometry(bikeAId);
  const bGeo = getBikeGeometry(bikeBId);
  const rows = compareBikeGeometry(bikeAId, bikeBId);
  const architecture = compareComponentArchitecture(bikeAId, bikeBId);

  if (!a || !b || !aGeo || !bGeo) return null;

  return (
    <aside className="comparison-panel" aria-label="Bike geometry comparison">
      <div className="comparison-panel__header">
        <div>
          <span className="comparison-kicker">Engineering comparison</span>
          <h2>{a.name} <i>vs</i> {b.name}</h2>
          <p>Reference archetype geometry—not manufacturer sizing or fit advice.</p>
        </div>
        <button type="button" className="lesson-close" onClick={onClose} aria-label="Close comparison">×</button>
      </div>

      <div className="comparison-controls">
        <div className="comparison-bike">
          <span>Primary</span><strong>{a.name}</strong><small>{aGeo.wheelFormat} · {aGeo.sizeLabel}</small>
        </div>
        <button type="button" className="comparison-swap" onClick={onSwap} aria-label="Swap compared bikes">⇄</button>
        <label className="comparison-select">
          <span>Compare to</span>
          <select value={bikeBId} onChange={(event) => onBikeBChange(event.target.value)}>
            {BIKE_CATALOG.filter((bike) => bike.id !== bikeAId).map((bike) => (
              <option key={bike.id} value={bike.id}>{bike.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="comparison-overlay">
        <input type="checkbox" checked={overlayEnabled} onChange={(event) => onOverlayChange(event.target.checked)} />
        <span><strong>3D ghost overlay</strong><small>Superimpose {b.name} over {a.name} using the synchronized scene.</small></span>
      </label>

      <div className="comparison-key">
        {rows.filter((row) => ["wheelbaseMm","reachMm","headAngleDeg","tireWidthMm","frontTravelMm"].includes(row.key)).map((row) => (
          <article key={row.key}>
            <span>{row.label}</span>
            <div><strong>{row.a}{row.unit}</strong><i>→</i><strong>{row.b}{row.unit}</strong></div>
            <small>{signed(row.delta, row.unit)} from {a.name}</small>
          </article>
        ))}
      </div>

      <div className="comparison-table">
        <div className="comparison-table__head"><span>{a.name}</span><span>Geometry</span><span>{b.name}</span><span>Δ</span></div>
        {rows.map((row) => (
          <div className="comparison-table__row" key={row.key}>
            <strong>{row.a}{row.unit}</strong><span>{row.label}</span><strong>{row.b}{row.unit}</strong><small>{signed(row.delta,row.unit)}</small>
          </div>
        ))}
      </div>

      <section className="comparison-architecture">
        <div><span>Shared component concepts</span><strong>{architecture.shared.length}</strong></div>
        <div>
          <span>Only {a.name}</span>
          <p>{architecture.onlyA.slice(0,7).map((item) => item.name).join(" · ") || "None"}</p>
        </div>
        <div>
          <span>Only {b.name}</span>
          <p>{architecture.onlyB.slice(0,9).map((item) => item.name).join(" · ") || "None"}</p>
        </div>
      </section>
    </aside>
  );
}
