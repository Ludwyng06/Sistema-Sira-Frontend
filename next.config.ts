import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Oculta el indicador flotante de Next (solo existe en desarrollo).
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
