'use server';

import { Storage } from '@google-cloud/storage';
import type { VideoAsset } from '@/app/lib/gallery-data';
import { galleryVideos } from '@/app/lib/gallery-data';

const storage = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  ? new Storage({
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
    })
  : null;

// 您已经正确设置了存储桶名称
const bucketName = 'hww-private';

export interface SignedVideoAsset extends VideoAsset {
  signedVideoUrl: string;
  signedThumbnailUrl: string;
}

export async function getSignedVideoAssets(): Promise<SignedVideoAsset[]> {
  if (!storage) {
    throw new Error("Storage client is not initialized. Check server environment variables.");
  }


  const expires = Date.now() + 15 * 60 * 1000;

  const signUrlOptions = {
    version: 'v4' as const,
    action: 'read' as const,
    expires,
  };

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
