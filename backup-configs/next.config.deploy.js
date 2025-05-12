/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set output directory for Netlify
  distDir: '.next',
  // Completely ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
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
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify'),
      path: require.resolve('path-browserify'),
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
};

module.exports = nextConfig;
