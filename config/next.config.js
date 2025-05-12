/** @type {import('next').NextConfig} */

const nextConfig = {
  // Base path configuration for deployment environments
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Set to static export mode
  // Handle TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow importing TypeScript files directly
  experimental: {
    esmExternals: true,
    allowImportingTsExtensions: true
  },
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configure webpack with necessary polyfills
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      path: 'path-browserify',
      buffer: 'buffer/',
    };
    return config;
  },
  // Transpile problematic packages
  transpilePackages: [
    'wagmi', 
    '@coinbase/onchainkit', 
    'viem', 
    'next-themes',
    'ethers'
  ],
  // Use standard Next.js settings
  poweredByHeader: false,
  reactStrictMode: false,
  // Optimize for Netlify deployment
  trailingSlash: false,
  // Ensure proper handling of SVG and other static assets
  images: {
    domains: ['nedapay.com'],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
