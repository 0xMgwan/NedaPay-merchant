/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Fix for ethereum-provider issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      zlib: require.resolve('browserify-zlib'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
    };
    
    // Add specific resolution for ethereum-provider
    config.resolve.alias = {
      ...config.resolve.alias,
      '@walletconnect/ethereum-provider': false
    };
    
    return config;
  },
};

export default nextConfig;
