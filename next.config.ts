import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase request body size limit for large file uploads (100MB)
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
    // Increase timeout for chunked uploads (5 minutes)
    responseLimit: "100mb",
  },
  // Custom server timeout for large uploads
  serverRuntimeConfig: {
    // خوشبختانه Next.js از این استفاده می‌کند
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "www.pishrosarmaye.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost:3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost:3001",
        pathname: "/uploads/**",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
