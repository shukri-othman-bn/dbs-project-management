import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Repo root has its own package.json; DO clones the full repo but builds from apps/web.
// Pin Turbopack root here so production builds do not resolve to the wrong workspace.
const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
