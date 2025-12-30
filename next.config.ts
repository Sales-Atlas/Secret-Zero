import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * ISCP Security Configuration
   * Disables logging of sensitive data and limits payload sizes
   */
  
  // Disable request and URL logging (may contain tokens)
  logging: {
    fetches: {
      fullUrl: false,
    },
    incomingRequests: false,
  },

  // Experimental features
  experimental: {
    // Server Actions
    serverActions: {
      // Limit payload size (encrypted data)
      bodySizeLimit: "100kb",
    },
    // React Taint API - prevents accidental secret leakage to client
    taint: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
