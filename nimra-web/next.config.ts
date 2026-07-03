import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [72, 75],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'sonner'],
  },
};

export default nextConfig;
