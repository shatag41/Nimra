import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [72, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'nimrawater.com',
      }
    ],
  },
};

export default nextConfig;
