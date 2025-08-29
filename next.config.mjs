/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 Standalone 输出模式，以匹配 Dockerfile 的期望
  output: 'standalone',


  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

    NEXT_PUBLIC_VERTEX_API_LOCATION: process.env.NEXT_PUBLIC_VERTEX_API_LOCATION,
    NEXT_PUBLIC_GCS_BUCKET_LOCATION: process.env.NEXT_PUBLIC_GCS_BUCKET_LOCATION,
    NEXT_PUBLIC_GEMINI_MODEL: process.env.NEXT_PUBLIC_GEMINI_MODEL,
    NEXT_PUBLIC_SEG_MODEL: process.env.NEXT_PUBLIC_SEG_MODEL,
    NEXT_PUBLIC_OUTPUT_BUCKET: process.env.NEXT_PUBLIC_OUTPUT_BUCKET,
    NEXT_PUBLIC_TEAM_BUCKET: process.env.NEXT_PUBLIC_TEAM_BUCKET,
    NEXT_PUBLIC_GCS_UPLOAD_BUCKET: process.env.NEXT_PUBLIC_GCS_UPLOAD_BUCKET,
    NEXT_PUBLIC_EXPORT_FIELDS_OPTIONS_URI: process.env.NEXT_PUBLIC_EXPORT_FIELDS_OPTIONS_URI,

    // --- 功能开关 ---
    NEXT_PUBLIC_EDIT_ENABLED: process.env.NEXT_PUBLIC_EDIT_ENABLED,
    NEXT_PUBLIC_VEO_ENABLED: process.env.NEXT_PUBLIC_VEO_ENABLED,
    NEXT_PUBLIC_VEO_ITV_ENABLED: process.env.NEXT_PUBLIC_VEO_ITV_ENABLED,
    NEXT_PUBLIC_VEO_ADVANCED_ENABLED: process.env.NEXT_PUBLIC_VEO_ADVANCED_ENABLED,
    NEXT_PUBLIC_VTO_ENABLED: process.env.NEXT_PUBLIC_VTO_ENABLED,
    NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS: process.env.NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS,
  },

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
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
  webpack: (config, { isServer, webpack }) => {
   /* if (isServer) {
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
          //contextRegExp: /@ffprobe-installer[\\/]ffprobe$/,
        })
      );
    } */

    return config;
  },
};

export default nextConfig;
