import roadJson from "@/content/geometry/road-r1.json";
import mtbJson from "@/content/geometry/mtb-m1.json";
import { getBikeById } from "@/domain/bike/catalog";
import type {
  BikeGeometryReference,
  GeometryComparisonRow,
} from "@/engine/comparison/types";

const GEOMETRY = new Map<string, BikeGeometryReference>([
  ["bike.road.r1", roadJson as BikeGeometryReference],
  ["bike.mtb.m1", mtbJson as BikeGeometryReference],
]);

export const GEOMETRY_METRICS = [
  ["wheelbaseMm", "Wheelbase", "mm"],
  ["reachMm", "Reach", "mm"],
  ["stackMm", "Stack", "mm"],
  ["headAngleDeg", "Head angle", "°"],
  ["seatAngleDeg", "Seat angle", "°"],
  ["chainstayMm", "Chainstay", "mm"],
  ["bottomBracketDropMm", "BB drop", "mm"],
  ["tireWidthMm", "Tire width", "mm"],
  ["handlebarWidthMm", "Handlebar", "mm"],
  ["frontTravelMm", "Front travel", "mm"],
  ["rearTravelMm", "Rear travel", "mm"],
] as const;

export function getBikeGeometry(bikeId: string) {
  return GEOMETRY.get(bikeId) ?? null;
}

export function compareBikeGeometry(
  bikeAId: string,
  bikeBId: string,
): GeometryComparisonRow[] {
  const a = getBikeGeometry(bikeAId);
  const b = getBikeGeometry(bikeBId);
  if (!a || !b) return [];

  return GEOMETRY_METRICS.map(([key, label, unit]) => ({
    key,
    label,
    unit,
    a: a[key],
    b: b[key],
    delta: b[key] - a[key],
  }));
}

export function compareComponentArchitecture(
  bikeAId: string,
  bikeBId: string,
) {
  const a = getBikeById(bikeAId);
  const b = getBikeById(bikeBId);
  if (!a || !b) {
    return { shared: [], onlyA: [], onlyB: [] };
  }

  const aBySlug = new Map(a.components.map((item) => [item.slug, item]));
  const bBySlug = new Map(b.components.map((item) => [item.slug, item]));
  const shared = [...aBySlug.keys()].filter((slug) => bBySlug.has(slug));
  const onlyA = a.components.filter((item) => !bBySlug.has(item.slug));
  const onlyB = b.components.filter((item) => !aBySlug.has(item.slug));

  return { shared, onlyA, onlyB };
}
