import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
  },
  webpack: (config) => {
    config.externals.push({ canvas: "canvas" });
    return config;
  },
};

export default nextConfig;
