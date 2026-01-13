/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly target Node.js runtime (not Edge)
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
