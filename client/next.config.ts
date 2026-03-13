import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
