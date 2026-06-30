import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  allowedDevOrigins: ["192.168.4.230", ".value-it.local"],
};

export default nextConfig;
