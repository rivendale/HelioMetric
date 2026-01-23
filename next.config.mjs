/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,

  // Output standalone for optimized deployment
  output: 'standalone',

  // Disable source maps in production to reduce memory usage
  productionBrowserSourceMaps: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
