import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixa a raiz do workspace nesta pasta. Sem isso, o Turbopack encontra o
  // package-lock.json do diretório pai (egolpe/) e infere a raiz errada.
  turbopack: {
    root: __dirname,
  },
  devIndicators: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|png|jpg|webp|avif|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

