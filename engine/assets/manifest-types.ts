export type AssetSourceStatus =
  | "candidate"
  | "source-locked"
  | "audited"
  | "prepared"
  | "production";

export interface BikeAssetLod {
  level: number;
  path: string;
  purpose: string;
  maxTriangles: number;
}

export interface BikeAssetManifest {
  id: string;
  bikeId: string;
  status: AssetSourceStatus;
  source: {
    provider: string;
    repository: string;
    branch: string;
    path: string;
    downloadUrl: string;
    gitBlobSha1: string;
    reportedSizeBytes: number;
    creator: string;
    license: string;
    licenseUrl: string;
    sourceRepositoryUrl: string;
    notes: string;
  };
  local: {
    sourcePath: string;
    auditPath: string;
    workingBlendPath: string;
  };
  runtime: {
    format: "glb";
    lods: BikeAssetLod[];
    textures: {
      encoding: "ktx2";
      desktopMax: number;
      mobileMax: number;
      heroComponentMax: number;
    };
    compression: string[];
  };
}
