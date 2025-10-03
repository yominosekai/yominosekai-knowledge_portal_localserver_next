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

  // バンドル分析とキャッシュ最適化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Cypressファイルをビルドから除外
    config.module.rules.push({
      test: /cypress\/.*\.(ts|tsx|js|jsx)$/,
      use: 'null-loader',
    });

    // Cypressディレクトリを完全に除外
    config.resolve.alias = {
      ...config.resolve.alias,
      'cypress': false,
    };

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

    // キャッシュの最適化（開発時は無効化）
    if (dev) {
      config.cache = false;
    } else {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // HMRの競合を解決するための設定
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // モジュール解決の最適化（キャッシュ問題を回避）
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          // 絶対パスでの解決
          '@': require('path').resolve(__dirname, 'src'),
        },
        // モジュール解決のキャッシュを無効化
        cache: false,
      };
    }

    // エラーハンドリングの改善
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

       // 実験的機能（キャッシュ最適化）
       experimental: {
         // キャッシュの無効化設定
         staleTimes: {
           dynamic: 0,
           static: 0,
         },
         // メモリ使用量の最適化
         memoryBasedWorkersCount: true,
         // バンドル最適化（CSS最適化を無効化してキャッシュ問題を回避）
         optimizeCss: false,
         // キャッシュ問題を回避するための設定
         webVitalsAttribution: ['CLS', 'LCP'],
         // 開発時のキャッシュ無効化
         forceSwcTransforms: true,
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
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate' 
              : 'public, max-age=31536000, immutable',
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

  // HMRとキャッシュの競合を解決するための設定
  onDemandEntries: {
    // ページがメモリに保持される時間（ミリ秒）
    maxInactiveAge: 25 * 1000,
    // 同時に保持されるページ数
    pagesBufferLength: 2,
  },

  // ログレベル
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;