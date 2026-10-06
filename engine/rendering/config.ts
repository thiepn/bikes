export type RenderQuality = "low" | "balanced" | "high";

export const RENDER_PROFILES = {
  low: { maxDpr: 1, shadowMap: 512, environmentResolution: 128, postprocessing: false, preferredLod: 2 },
  balanced: { maxDpr: 1.5, shadowMap: 1024, environmentResolution: 256, postprocessing: false, preferredLod: 1 },
  high: { maxDpr: 2, shadowMap: 2048, environmentResolution: 512, postprocessing: true, preferredLod: 0 },
} satisfies Record<RenderQuality, {
  maxDpr: number;
  shadowMap: number;
  environmentResolution: number;
  postprocessing: boolean;
  preferredLod: number;
}>;
