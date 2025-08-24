"use server";

// 导入我们新的认证工具函数
import { verifyTokenOnly } from "../auth-and-quota";

const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import os from "os";

// 【核心修复】: 导入所有需要的类型
import type { Storage, GetSignedUrlConfig } from "@google-cloud/storage";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// 【核心修复】: 已移除顶层的 'const { Storage } = require("@google-cloud/storage");'

// 【核心修复】: 创建一个辅助函数来按需初始化 Storage 客户端
async function getStorageClient(): Promise<Storage> {
    const { Storage } = await import("@google-cloud/storage");
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
    return new Storage({ projectId });
}


export async function decomposeUri(uri: string) {
    const sourceUriParts = uri.replace("gs://", "").split("/");
    const sourceBucketName = sourceUriParts[0];
    const sourceObjectName = sourceUriParts.slice(1).join("/");

    return {
        bucketName: sourceBucketName,
        fileName: sourceObjectName,
    };
}

export async function getSignedURL(gcsURI: string): Promise<string | { error: string }> {
    try {
        const { bucketName, fileName } = await decomposeUri(gcsURI);
        if (!bucketName || !fileName) {
            throw new Error(`Invalid GCS URI provided: ${gcsURI}. Could not extract bucket or file name.`);
        }
        const storage = await getStorageClient();
        const options: GetSignedUrlConfig = {
            version: "v4",
            action: "read",
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
        };
        const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options);
        return url;
    } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Error while getting secured access to content.";
        return { error: message };
    }
}

export async function copyImageToTeamBucket(sourceGcsUri: string, id: string): Promise<string> {
    try {
        await verifyTokenOnly();
    } catch (error: any) {
        throw new Error(error.message);
    }

    try {
        const storage = await getStorageClient();
        if (!sourceGcsUri || !sourceGcsUri.startsWith("gs://")) {
            throw new Error("Invalid source GCS URI format. It must start with gs://");
        }
        if (!id) {
            throw new Error("Invalid id. It cannot be empty.");
        }
        const { bucketName, fileName } = await decomposeUri(sourceGcsUri);
        const destinationBucketName = process.env.NEXT_PUBLIC_TEAM_BUCKET;
        if (!bucketName || !fileName || !destinationBucketName) {
            throw new Error("Invalid source or destination URI.");
        }
        const sourceObject = storage.bucket(bucketName).file(fileName);
        const destinationBucket = storage.bucket(destinationBucketName);
        const destinationFile = destinationBucket.file(id);
        const [exists] = await destinationFile.exists();
        if (!exists) {
            await sourceObject.copy(destinationFile);
        }
        return `gs://${destinationBucketName}/${id}`;
    } catch (error) {
        console.error("Error in copyImageToTeamBucket:", error);
        throw new Error(`Error while moving media to team Library: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function downloadMediaFromGcs(gcsUri: string): Promise<{ data?: string; error?: string }> {
    if (!gcsUri || !gcsUri.startsWith("gs://")) {
        return { error: "Invalid GCS URI format. It must start with gs://" };
    }
    try {
        const storage = await getStorageClient();
        const { bucketName, fileName } = await decomposeUri(gcsUri);
        if (!bucketName || !fileName) {
            return { error: "Invalid GCS URI, could not extract bucket or file name." };
        }
        const [fileBuffer] = await storage.bucket(bucketName).file(fileName).download();
        const base64Data = fileBuffer.toString("base64");
        return { data: base64Data };
    } catch (error: any) {
        const errorMessage = error.message || "Error while downloading the media";
        return { error: errorMessage };
    }
}

export async function downloadTempVideo(gcsUri: string): Promise<string> {
    const storage = await getStorageClient();
    const { bucketName, fileName } = await decomposeUri(gcsUri);
    if (!bucketName || !fileName) {
        throw new Error(`Invalid GCS URI provided: ${gcsUri}. Could not extract bucket or file name.`);
    }
    const tempFileName = `video_${Date.now()}_${path.basename(fileName)}`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);
    await storage.bucket(bucketName).file(fileName).download({
        destination: tempFilePath,
    });
    return tempFilePath;
}

export async function fetchJsonFromStorage(gcsUri: string): Promise<any> {
    try {
        const storage = await getStorageClient();
        const { bucketName, fileName } = await decomposeUri(gcsUri);
        if (!bucketName || !fileName) {
            throw new Error(`Invalid GCS URI provided: ${gcsUri}. Could not extract bucket or file name.`);
        }
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);
        const [contents] = await file.download();
        const jsonData = JSON.parse(contents.toString());
        return jsonData;
    } catch (error) {
        console.error("Error fetching JSON from storage:", error);
        if (error instanceof SyntaxError) {
            console.error("JSON parsing error. Downloaded content might not be valid JSON.");
        }
        throw error;
    }
}

export async function uploadBase64Image(
    base64Image: string,
    bucketName: string,
    objectName: string,
    contentType: string = "image/png"
): Promise<{ success?: boolean; message?: string; error?: string; fileUrl?: string }> {
    try {
        await verifyTokenOnly();
    } catch (error: any) {
        return { error: error.message };
    }

    try {
        const storage = await getStorageClient();
        if (!base64Image) return { error: "Invalid base64 data." };
        if (!objectName) return { error: "Object name (file name) cannot be empty." };
        const imageBuffer = Buffer.from(base64Image, "base64");
        const options = {
            destination: objectName,
            metadata: {
                contentType: contentType,
            },
        };
        await storage.bucket(bucketName).file(objectName).save(imageBuffer, options);
        const fileUrl = `gs://${bucketName}/${objectName}`;
        return {
            success: true,
            message: `File uploaded to: ${fileUrl}`,
            fileUrl: fileUrl,
        };
    } catch (error) {
        console.error("Error uploading file:", error);
        return {
            error: "Error uploading file to Google Cloud Storage.",
        };
    }
}

export async function getVideoThumbnailBase64(
    videoSourceGcsUri: string,
    ratio: string
): Promise<{ thumbnailBase64Data?: string; mimeType?: string; error?: string }> {
    const outputMimeType = "image/png";
    const tempThumbnailFileName = `thumbnail_${Date.now()}.png`;
    const tempThumbnailPath = path.join(os.tmpdir(), tempThumbnailFileName);
    let localVideoPath: string | null = null;
    try {
        localVideoPath = await downloadTempVideo(videoSourceGcsUri);
        if (!localVideoPath) throw Error("Failed to download video");
        await new Promise<void>((resolve, reject) => {
            let command = ffmpeg(localVideoPath!).seekInput("00:00:01").frames(1);
            const size = ratio === "16:9" ? "320x180" : "180x320";
            command = command.size(size);
            command = command.outputFormat("image2");
            command
                .output(tempThumbnailPath)
                .on("end", () => {
                    resolve();
                })
                .on("error", (err: { message: any }) => {
                    console.error("FFmpeg Error:", err.message);
                    reject(new Error(`FFmpeg failed to extract thumbnail: ${err.message}`));
                })
                .run();
        });
        const thumbnailBuffer = await fs.readFile(tempThumbnailPath);
        const thumbnailBase64Data = thumbnailBuffer.toString("base64");
        return {
            thumbnailBase64Data,
            mimeType: outputMimeType,
        };
    } catch (error: any) {
        console.error("Error in getVideoThumbnailBase64:", error);
        return { error: error.message || "An unexpected error occurred while generating thumbnail." };
    } finally {
        if (localVideoPath)
            await fs
                .unlink(localVideoPath)
                .catch((err: any) => console.error(`Failed to delete temp video file: ${localVideoPath}`, err));
        await fs.unlink(tempThumbnailPath).catch((err: { code: string }) => {
            if (err.code !== "ENOENT") console.error(`Failed to delete temp thumbnail file: ${tempThumbnailPath}`, err);
        });
    }
}

export async function deleteMedia(gcsURI: string): Promise<boolean | { error: string }> {
    try {
        await verifyTokenOnly();
    } catch (error: any) {
        return { error: error.message };
    }

    try {
        const storage = await getStorageClient();
        if (!gcsURI || !gcsURI.startsWith("gs://")) return { error: 'Invalid GCS URI. It must start with "gs://".' };
        const { bucketName, fileName: objectName } = await decomposeUri(gcsURI);
        if (!bucketName || !objectName) return { error: "Invalid GCS URI" };
        await storage.bucket(bucketName).file(objectName).delete();
        return true;
    } catch (error: any) {
        console.error(`Error deleting file ${gcsURI} from GCS:`, error);
        if (error.code === 404)
            return {
                error: `File ${gcsURI} not found in Google Cloud Storage.`,
            };
        return {
            error: `An error occurred while deleting file ${gcsURI} from Google Cloud Storage.`,
        };
    }
}
