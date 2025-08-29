'use server';

import { Storage } from '@google-cloud/storage';
// *** THE FIX IS HERE ***
// 修正了导入路径，直接从 @/lib/... 开始，因为 @/ 已经代表了项目根目录
import type { VideoAsset } from '../../lib/gallery-data';
import { galleryVideos } from '../../lib/gallery-data';

// 初始化 Storage。它会自动从环境变量中读取凭证。
const storage = new Storage({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!),
});

// ===================================================================
// !!! 关键：将这里替换为您在GCP中创建的那个私有存储桶的名称 !!!
const bucketName = 'your-private-bucket-name-goes-here';
// =================================================================== 

export interface SignedVideoAsset extends VideoAsset {
  signedVideoUrl: string;
  signedThumbnailUrl: string;
}

export async function getSignedVideoAssets(): Promise<SignedVideoAsset[]> {
  if (!bucketName || bucketName === 'your-private-bucket-name-goes-here') {
    throw new Error("GCS bucket name is not configured in app/api/gallery/action.ts");
  }

  const expires = Date.now() + 15 * 60 * 1000; // URL 有效期 15 分钟

  const signUrlOptions = {
    version: 'v4' as const,
    action: 'read' as const,
    expires,
  };

  // 因为现在 VideoAsset 类型被正确导入，所以这里的 'video' 参数类型会被自动推断
  const signedAssets = await Promise.all(
    galleryVideos.map(async (video) => {
      const [signedVideoUrl] = await storage
        .bucket(bucketName)
        .file(video.videoFilename)
        .getSignedUrl(signUrlOptions);

      const [signedThumbnailUrl] = await storage
        .bucket(bucketName)
        .file(video.thumbnailFilename)
        .getSignedUrl(signUrlOptions);

      return {
        ...video,
        signedVideoUrl,
        signedThumbnailUrl,
      };
    })
  );

  return signedAssets;
}
