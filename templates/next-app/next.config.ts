import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep this app independently deployable.
  // Add workspace package transpilation here if required by the shared packages:
  // transpilePackages: ["@platform/ui", "@platform/auth-client", ...],
};

export default nextConfig;
