/** @type {import('next').NextConfig} */
import cryptoBrowserify from 'crypto-browserify';
import streamBrowserify from 'stream-browserify';
import streamHttp from 'stream-http';
import httpsBrowserify from 'https-browserify';
import osBrowserify from 'os-browserify';
import pathBrowserify from 'path-browserify';
import buffer from 'buffer';

const nextConfig = {
  // Base path configuration for deployment environments
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Set to static export mode
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
      crypto: cryptoBrowserify,
      stream: streamBrowserify,
      http: streamHttp,
      https: httpsBrowserify,
      os: osBrowserify,
      path: pathBrowserify,
      buffer: buffer,
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
