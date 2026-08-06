import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Needed for testing through ngrok (or any tunnel) in dev mode — without
  // this, Next.js blocks JS asset requests from origins other than
  // localhost, so the page HTML loads but React never actually hydrates
  // (forms fall back to native submission, nothing becomes interactive).
  // Not needed in production — this only affects `next dev`.
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io", "*.ngrok.app"],
};

export default nextConfig;
