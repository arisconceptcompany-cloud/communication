import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  // Évite que Next remonte jusqu'au lockfile du dossier parent et trace tout
  // le répertoire home pendant le build (build très lent / timeout).
  outputFileTracingRoot: path.resolve(__dirname),
  allowedDevOrigins: ["192.168.4.230", ".value-it.local"],
};

export default nextConfig;
