/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@medical/global',
    '@medical/service',
    '@medical/web',
    'three',
    '@react-three/fiber',
    '@react-three/drei',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};

module.exports = nextConfig;
