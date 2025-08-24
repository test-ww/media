'use server'

// 【核心修复】: 导入所有需要的类型
import type { AuthClient } from "google-auth-library/build/src/auth/authclient";
import type { GaxiosResponse, GaxiosOptions } from "gaxios";

// 【核心修复】: 已移除顶层的 'const { GoogleAuth } = require("google-auth-library");'

// 【核心修复】: 为 API 响应定义接口
interface SegPrediction {
    bytesBase64Encoded: string;
    [key: string]: any;
}

interface SegApiResponse {
    predictions: SegPrediction[];
}

export async function segmentImage(
    imageBase64: string,
    segMode: string,
    semanticSelection: string[],
    promptSelection: string,
    maskImage: string
): Promise<string | { error: string }> {
    let client: AuthClient;
    try {
        // 【核心修复】: 在函数内部动态导入
        const { GoogleAuth } = await import("google-auth-library");
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
        });
        client = await auth.getClient();
    } catch (error) {
        console.error(error);
        return {
            error: 'Unable to authenticate your account to access model',
        };
    }

    try {
        const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION;
        const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
        const modelVersion = process.env.NEXT_PUBLIC_SEG_MODEL;

        if (!location || !projectId || !modelVersion) {
            throw new Error("Missing required environment variables for Vertex Segmentation.");
        }

        const segAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`;

        const reqData: any = {
            instances: [
                {
                    image: {
                        bytesBase64Encoded: imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64,
                    },
                },
            ],
            parameters: {
                mode: segMode,
                maxPredictions: 1,
            },
        };

        if (segMode === 'prompt') {
            reqData.instances[0].prompt = promptSelection;
        }
        if (segMode === 'semantic') {
            reqData.instances[0].prompt = semanticSelection.toString().toLocaleLowerCase();
        }
        if (segMode === 'interactive') {
            reqData.instances[0].scribble = {
                image: {
                    bytesBase64Encoded: maskImage.startsWith('data:') ? maskImage.split(',')[1] : maskImage,
                }
            };
        }

        const opts: GaxiosOptions = {
            url: segAPIurl,
            method: 'POST',
            data: reqData,
        };

        const res: GaxiosResponse<SegApiResponse> = await client.request(opts);

        if (!res.data?.predictions?.[0]?.bytesBase64Encoded) {
            throw new Error('There was an issue, no segmentation were done or response format is invalid');
        }

        console.log('Image segmented with success');
        let segmentation = res.data.predictions[0].bytesBase64Encoded;

        if (!segmentation.startsWith('data:')) {
            segmentation = `data:image/png;base64,${segmentation}`;
        }

        return segmentation;
    } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'Issue while segmenting image.';
        return {
            error: message,
        };
    }
}
