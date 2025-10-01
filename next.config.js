/** @type {import('next').NextConfig} */
const nextConfig = {
  // サーバー外部パッケージ
  serverExternalPackages: [],

  // 画像最適化
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 圧縮
  compress: true,

  // パフォーマンス最適化
  poweredByHeader: false,
  generateEtags: true,

  // バンドル分析
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // バンドルサイズの最適化
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // ヘッダーの設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // リダイレクト
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // リライト
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health/route',
      },
    ];
  },

  // 環境変数
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 出力設定
  output: 'standalone',

  // TypeScript設定
  typescript: {
    // 本番ビルド時にTypeScriptエラーを無視
    ignoreBuildErrors: false,
  },

  // ESLint設定
  eslint: {
    // 本番ビルド時にESLintエラーを無視
    ignoreDuringBuilds: false,
  },

  // トレーリングスラッシュ
  trailingSlash: false,

  // 国際化はApp Routerでは別の方法で実装
  // i18n: {
  //   locales: ['ja', 'en'],
  //   defaultLocale: 'ja',
  // },

  // 開発サーバー設定
  devIndicators: {
    position: 'bottom-right',
  },

  // ログレベル
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;