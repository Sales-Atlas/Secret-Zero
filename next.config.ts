import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Konfiguracja bezpieczeństwa ISCP
   * Wyłącza logowanie wrażliwych danych i ogranicza wielkość payloadów
   */
  
  // Wyłącz logowanie żądań i URL-i z parametrami (mogą zawierać tokeny)
  logging: {
    fetches: {
      fullUrl: false,
    },
    incomingRequests: false,
  },

  // Konfiguracja eksperymentalna
  experimental: {
    // Server Actions
    serverActions: {
      // Ograniczenie wielkości payloadu (zaszyfrowane dane)
      bodySizeLimit: "100kb",
    },
    // React Taint API - zapobiega przypadkowemu przekazaniu sekretów do klienta
    taint: true,
  },

  // Nagłówki bezpieczeństwa
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
