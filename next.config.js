/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['web-push'],
    serverActions: {
      bodySizeLimit: '10mb', // para subida de Excel SIAGIE
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('web-push');
    }

    return config;
  },
};

module.exports = nextConfig;
