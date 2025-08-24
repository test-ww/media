

/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  staticPageGenerationTimeout: 500,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.mtls.cloud.google.com',
      }
    ],

    minimumCacheTTL: 60, // Minimum cache time in seconds (e.g., 1 minute)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Common device widths
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Sizes for generated images
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      if (!config.externals) {
        config.externals = [];
      }
      const externalsToAdd = ['@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe'];
      for (const ext of externalsToAdd)
        if (!config.externals.includes(ext))
          config.externals.push(ext);

      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(.\/README\.md|.\/types\/.*\.d\.ts|.\/tsconfig\.json)$/,
          contextRegExp: /@ffprobe-installer[\\/]ffprobe$/,
        })
      );
    }

    return config;
  },
}

export default nextConfig
