import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixes a known class of bug where styles can be missing/wrong immediately
  // after a client-side navigation (vs. a fresh page load) — Safari surfaces
  // this more visibly than Chromium browsers. Groups CSS by what's actually
  // used together across pages instead of guessing from the route tree.
  experimental: {
    cssChunking: "graph",
  },
};

export default nextConfig;
