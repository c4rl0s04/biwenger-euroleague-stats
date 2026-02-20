import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enabled for Docker builds
  serverExternalPackages: ['better-sqlite3'],
  allowedDevOrigins: ['192.168.1.40', '192.168.1.68', 'localhost'],
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
      {
        protocol: 'https',
        hostname: 'media-cdn.cortextech.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'biwenger.as.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media-cdn.incrowdsports.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ak-static.cms.nba.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default bundleAnalyzer(nextConfig);

