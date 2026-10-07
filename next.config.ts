import type { NextConfig } from "next";

const pagesBasePath =
  process.env.GITHUB_ACTIONS === "true" ? "/bikes" : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: pagesBasePath,
  assetPrefix: pagesBasePath || undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
