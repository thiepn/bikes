"use client";

import { BIKE_CATALOG } from "@/domain/bike/catalog";

type BikeSwitcherProps = {
  bikeId: string;
  onChange: (bikeId: string) => void;
};

export function BikeSwitcher({
  bikeId,
  onChange,
}: BikeSwitcherProps) {
  return (
    <div className="bike-switcher" aria-label="Choose bicycle">
      {BIKE_CATALOG.map((bike) => (
        <button
          type="button"
          key={bike.id}
          className={
            bike.id === bikeId
              ? "bike-switcher__item is-active"
              : "bike-switcher__item"
          }
          aria-pressed={bike.id === bikeId}
          onClick={() => onChange(bike.id)}
        >
          <span>{bike.name}</span>
          <small>
            {bike.capabilities.model === "production"
              ? "production"
              : bike.capabilities.model}
          </small>
        </button>
      ))}
    </div>
  );
}
