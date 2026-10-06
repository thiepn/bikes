import manifestJson from "@/content/assets/road-r1.asset.json";
import type { BikeAssetManifest } from "./manifest-types";

export const ROAD_R1_ASSET = manifestJson as BikeAssetManifest;

export const ROAD_R1_RUNTIME_READY =
  ROAD_R1_ASSET.status === "production";
