import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (dev)
  turbopack: {
    resolveAlias: {
      "plotly.js": "plotly.js-basic-dist-min",
    },
  },
  // Webpack (production / Vercel)
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "plotly.js": "plotly.js-basic-dist-min",
    };
    return config;
  },
};

export default nextConfig;
