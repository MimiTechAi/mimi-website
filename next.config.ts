/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    quality: 85,
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'slelguoygbfzlpylpxfs.supabase.co',
      },
    ],
  },
  turbopack: {},
  poweredByHeader: false,
  reactStrictMode: true,

  // Performance optimizations for 2026 standards
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Advanced bundle splitting and optimizations
  webpack: (config: any, { buildId, dev, isServer, defaultLoaders, webpack }: any) => {
    // FIX: Handle @xenova/transformers for Next.js compatibility
    if (isServer) {
      // Externalize transformers.js on server to prevent SSR issues
      config.externals = config.externals || [];
      config.externals.push('@xenova/transformers');
    } else {
      // Browser-side: provide fallbacks for Node.js modules
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        perf_hooks: false,
      };

      // Ensure process.env is available
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
        })
      );
    }

    if (!dev && !isServer) {
      // Tree shaking and dead code elimination
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Advanced bundle splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          framer: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // Minification optimizations
      config.optimization.minimize = true;
      config.optimization.minimizer = [
        ...config.optimization.minimizer,
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        }),
      ];
    }

    // NEW: Add support for importing .md files as raw strings
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source', // Webpack 5 built-in, replaces raw-loader
    });

    return config;
  },

  // CRITICAL: Security Headers für WebGPU/SharedArrayBuffer
  // Ohne diese Header funktioniert die LLM-Inferenz nicht!
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Cross-Origin Isolation für SharedArrayBuffer
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          // Zusätzliche Security Headers
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/kontakt',
        destination: '/contact',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
