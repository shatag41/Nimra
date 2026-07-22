import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [72, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'sonner'],
  },
};

export default nextConfig;
