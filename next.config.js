/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Handle pdf.js canvas dependency
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Handle tesseract.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
  images: {
    domains: [],
    remotePatterns: [],
  },
  // Suppress specific warnings
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js', 'mammoth'],
  },
};

module.exports = nextConfig;
