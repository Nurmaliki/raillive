import type { NextConfig } from "next";

/**
 * Catatan konfigurasi:
 * - `cacheComponents` sengaja TIDAK diaktifkan. Aplikasi ini menyajikan data
 *   real-time (posisi & delay kereta) sehingga seluruh halaman harus dirender
 *   saat request (`dynamic = "force-dynamic"`), yang tidak kompatibel dengan
 *   model Cache Components.
 * - Tailwind v4 diproses lewat Turbopack (bundler default Next.js 16).
 */
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
