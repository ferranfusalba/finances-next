const packageJson = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    APP_VERSION: packageJson.version,
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
