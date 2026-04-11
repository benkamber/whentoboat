import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "20b882db-5c5e-4d38-b72c-c6ef18f90df7-00-z7dul42gyxvz.janeway.replit.dev",
  ],
  // Turbopack doesn't support serwist's webpack plugin yet.
  // Add empty turbopack config to suppress the error; the build
  // will use webpack when --webpack is passed or when serwist adds its config.
  turbopack: {},
};

export default withSerwist(nextConfig);
