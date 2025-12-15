import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for optimized production deployment
  output: "standalone",

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
