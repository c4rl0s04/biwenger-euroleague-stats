import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // Disabled by user request
  serverExternalPackages: ['better-sqlite3'],
  // experimental: {
  //   allowedOrigins: ['192.168.1.40:3000', 'localhost:3000'],
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.biwenger.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.biwenger.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default bundleAnalyzer(nextConfig);

