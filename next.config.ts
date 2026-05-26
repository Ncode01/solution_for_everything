import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@xyflow/react", "lucide-react"],
  },
};

export default nextConfig;
