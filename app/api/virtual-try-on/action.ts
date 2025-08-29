"use server";

import { verifyTokenAndCheckQuota, deductQuota } from "../auth-and-quota";
import type { AuthClient } from "google-auth-library/build/src/auth/authclient";
import type { GaxiosResponse, GaxiosOptions } from "gaxios";
import { appContextDataI } from "../../context/app-context";
import { downloadMediaFromGcs } from "../cloud-storage/action";
import { VirtualTryOnFormI } from "../virtual-try-on-utils";
import { ImageI } from "../generate-image-utils";

function generateUniqueFolderId() {
  let number = Math.floor(Math.random() * 9) + 1;
  for (let i = 0; i < 12; i++) number = number * 10 + Math.floor(Math.random() * 10);
  return number.toString();
}

interface Prediction {
  bytesBase64Encoded?: string;
  mimeType?: string;
  gcsUri?: string;
  error?: { message?: string };
}

interface PredictionResponse {
  predictions: Prediction[];
}

export const generateVtoImage = async (
  formData: VirtualTryOnFormI,
  appContext: appContextDataI,
  idToken: string
): Promise<ImageI | { error: string }> => {
  let uid: string;
  try {
    const result = await verifyTokenAndCheckQuota("imagen", idToken);
    uid = result.uid;
  } catch (error: any) {
    console.error("虚拟试穿的认证或配额检查失败:", error.message);
    return { error: error.message };
  }

  if (!appContext?.gcsURI) {
    return { error: "应用上下文中未配置用户 GCS URI。" };
  }

  if (!appContext?.userID) {
    return { error: "应用上下文中未配置用户 ID。" };
  }

  let client: AuthClient;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
    client = await auth.getClient();
  } catch (error) {
    console.error("认证错误:", error);
    return { error: "无法验证您的账户。" };
  }

  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION || "us-central1";
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

  if (!projectId) {
    return { error: "环境变量中未配置项目 ID。" };
  }

  const modelVersion = formData.modelVersion;
  const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`;

  const uniqueId = generateUniqueFolderId();
  const storageUriPrefix = `gs://${appContext.gcsURI.replace("gs://", "")}/vto-generations/${uniqueId}`;

  const reqData = {
    instances: [
      {
        personImage: { image: { bytesBase64Encoded: formData.humanImage.base64Image } },
        productImages: formData.garmentImages.map((img) => ({
          image: { bytesBase64Encoded: img.base64Image },
        })),
      },
    ],
    parameters: {
      sampleCount: parseInt(formData.sampleCount, 10),
      personGeneration: formData.personGeneration,
      outputOptions: { mimeType: formData.outputFormat },
      storageUri: storageUriPrefix,
      ...(formData.seedNumber && { seed: parseInt(formData.seedNumber, 10) }),
    },
  };

  const opts: GaxiosOptions = {
    url: apiUrl,
    method: "POST",
    data: reqData,
  };

  try {
    const res: GaxiosResponse<PredictionResponse> = await client.request(opts);

    if (typeof res.data !== "object" || res.data === null || !("predictions" in res.data)) {
      throw new Error("API 响应结构异常。");
    }

    const responseData = res.data;

    if (!responseData.predictions || responseData.predictions.length === 0) {
      throw new Error("API 未返回任何预测结果。");
    }

    const predictionResult = responseData.predictions[0];

    if (predictionResult.error) {
      throw new Error(`API 返回错误: ${predictionResult.error.message || "未知错误"}`);
    }

    let generatedImageBase64: string;
    const mimeType = predictionResult.mimeType || formData.outputFormat;
    const finalGcsUri = predictionResult.gcsUri;

    if (!finalGcsUri) {
      throw new Error("API 未返回生成图片的 GCS URI。");
    }

    if (predictionResult.bytesBase64Encoded) {
      generatedImageBase64 = predictionResult.bytesBase64Encoded;
    } else {
      console.log(`在 API 响应中未找到图片数据，尝试从 GCS 路径下载: ${finalGcsUri}`);
      const downloadResult = await downloadMediaFromGcs(finalGcsUri, idToken);

      if (downloadResult.error) {
        throw new Error(`从 GCS 下载生成图片失败: ${downloadResult.error}`);
      }

      if (!downloadResult.data) {
        throw new Error(`从 GCS 成功下载后，图片数据缺失。`);
      }

      generatedImageBase64 = downloadResult.data;
    }

    const cleanFormat = (mimeType.split("/")[1] || "png").toUpperCase();

    const resultImage: ImageI = {
      src: `data:${mimeType};base64,${generatedImageBase64}`,
      gcsUri: finalGcsUri,
      ratio: "",
      width: 0,
      height: 0,
      altText: "生成的试穿图片",
      key: uniqueId,
      format: cleanFormat,
      prompt: `虚拟试穿模型版本: ${formData.modelVersion}`,
      date: new Date().toISOString(),
      author: appContext.userID || "未知用户",
      modelVersion: formData.modelVersion,
      mode: "try-on",
    };

    await deductQuota(uid, "imagen");
    return resultImage;
  } catch (error: any) {
    console.error("调用虚拟试穿 API 时出错:", error);
    const errorMessage = error.response?.data?.error?.message || error.message || "发生未知错误。";
    return { error: errorMessage };
  }
};
