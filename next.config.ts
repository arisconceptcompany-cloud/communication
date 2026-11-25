import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  // Évite que Next remonte jusqu'au lockfile du dossier parent et trace tout
  // le répertoire home pendant le build (build très lent / timeout).
  outputFileTracingRoot: path.resolve(__dirname),
  // Les URLs historiques /uploads/... doivent être servies par l'API : le
  // handler statique de public/ ne connaît que les fichiers présents au
  // démarrage, donc les uploads créés ensuite renvoient 404.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/uploads/:path*", destination: "/api/uploads/:path*" },
      ],
    };
  },
  allowedDevOrigins: ["192.168.4.230", ".value-it.local"],
};

export default nextConfig;
