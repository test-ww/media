"use server";

import { verifyTokenAndCheckQuota, deductQuota, verifyTokenOnly } from "../auth-and-quota";
import { decomposeUri, getSignedURL, uploadBase64Image } from "../cloud-storage/action";
import { appContextDataI } from "../../context/app-context";
import {
  GenerateVideoFormI,
  videoGenerationUtils,
  VideoI,
  GenerateVideoFormFields,
  ErrorResult,
  GenerateVideoInitiationResult,
  PollingResponse,
  VideoGenerationStatusResult,
  VideoRatioToPixel,
  BuildVideoListParams,
  ProcessedVideoResult,
  cameraPresetsOptions,
} from "../generate-video-utils";
import type { AuthClient } from "google-auth-library/build/src/auth/authclient";
import type { GaxiosResponse, GaxiosOptions } from "gaxios";
import { translatePromptToEnglish } from "../gemini/action";

function isErrorResult(value: any): value is { error: string } {
  return typeof value === 'object' && value !== null && 'error' in value;
}

// 【核心修复】: 重新添加缺失的类型定义
interface VeoInitiationApiResponse {
  name?: string;
  error?: {
    message: string;
    [key: string]: any;
  };
  [key: string]: any;
}

function normalizeSentence(sentence: string) {
  const words = sentence.toLowerCase().split(" ");
  let normalizedSentence = "";
  let newSentence = true;
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    if (newSentence) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
      newSentence = false;
    }
    if (word.endsWith(".") || word.endsWith("!") || word.endsWith("?")) {
      newSentence = true;
    }
    normalizedSentence += word + " ";
  }
  normalizedSentence = normalizedSentence.replace(/  +/g, " ");
  normalizedSentence = normalizedSentence.trim();
  normalizedSentence = normalizedSentence.replace(/, ,/g, ",");
  return normalizedSentence;
}

function cleanResult(inputString: string) {
  return inputString.toString().replaceAll("\n", "").replaceAll(/\//g, "").replaceAll("*", "");
}

const customRateLimitMessage = "抱歉，当前访问量过大，请稍后再试！";

function isResourceExhaustedError(source: any) {
  if (!source) return false;
  let message = "";
  let code = null;
  if (typeof source === "string") {
    message = source.toLowerCase();
    if (message.includes("code: 8") || message.includes("code === 8")) code = 8;
  } else if (typeof source === "object" && source !== null) {
    message = String(source.message || "").toLowerCase();
    code = source.code;
  } else return false;
  if (
    (code === 8 && message.includes("resource exhausted")) ||
    message.includes("{ code: 8, message: 'resource exhausted.' }") ||
    (message.includes("resource exhausted") &&
      (code === 8 || message.includes("code: 8") || message.includes("code === 8")))
  )
    return true;
  return false;
}

function generatePrompt(formData: any) {
  let fullPrompt = formData["prompt"];
  fullPrompt = `A ${formData["secondary_style"]} ${formData["style"]} of ` + fullPrompt;
  let parameters = "";
  videoGenerationUtils.fullPromptFields.forEach((additionalField) => {
    if (formData[additionalField] !== "")
      parameters += ` ${formData[additionalField]} ${additionalField.replaceAll("_", " ")}, `;
  });
  if (parameters !== "") fullPrompt = `${fullPrompt}, ${parameters}`;
  fullPrompt = normalizeSentence(fullPrompt);
  return fullPrompt;
}

export async function buildVideoListFromURI({
  videosInGCS,
  aspectRatio,
  resolution,
  duration,
  width,
  height,
  usedPrompt,
  userID,
  modelVersion,
  mode,
}: BuildVideoListParams): Promise<VideoI[]> {
  const promises = videosInGCS.map(async (videoResult): Promise<ProcessedVideoResult | null> => {
    const raiReason = (videoResult as any).raiFilteredReason;
    if (raiReason) {
      console.warn(`视频因 RAI 被过滤: ${raiReason}. GCS URI: ${videoResult.gcsUri || "N/A"}`);
      return { warning: `视频因内容安全策略被过滤: ${raiReason}` };
    }
    if (!videoResult.gcsUri) {
      console.warn("因缺少 gcsUri，跳过视频结果。");
      return null;
    }
    try {
      const { fileName } = await decomposeUri(videoResult.gcsUri);
      const mimeType = videoResult.mimeType || "video/mp4";
      const format = mimeType.replace("video/", "").toUpperCase();
      const ID = fileName
        .replaceAll("/", "")
        .replace(userID, "")
        .replace("generated-videos", "")
        .replace("sample_", "")
        .replace(`.${format.toLowerCase()}`, "");
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const signedURLResult: string | { error: string } = await getSignedURL(videoResult.gcsUri);
      if (typeof signedURLResult === "object" && signedURLResult["error"])
        throw new Error(
          `为 ${videoResult.gcsUri} 获取签名URL失败: ${cleanResult ? cleanResult(signedURLResult["error"]) : signedURLResult["error"]
          }`
        );
      const signedURL = signedURLResult as string;
      const videoDetails: VideoI = {
        src: signedURL,
        gcsUri: videoResult.gcsUri,
        thumbnailGcsUri: "",
        format: format,
        prompt: usedPrompt,
        altText: `生成的 ${format} 视频`,
        key: ID || Date.now().toString(),
        width: width,
        height: height,
        ratio: aspectRatio,
        resolution: resolution,
        duration: duration,
        date: formattedDate,
        author: userID,
        modelVersion: modelVersion,
        mode: mode,
      };
      return videoDetails;
    } catch (error) {
      console.error(`处理视频结果 ${videoResult.gcsUri} 时出错:`, error);
      return {
        error: `处理视频 ${videoResult.gcsUri} 时出错: ${error instanceof Error ? error.message : "未知错误"
          }`,
      };
    }
  });
  const processedResults = await Promise.all(promises);
  const generatedVideosToDisplay = processedResults.filter(
    (result): result is VideoI =>
      result !== null && typeof result === "object" && !("error" in result) && !("warning" in result)
  );
  processedResults.forEach((result) => {
    if (result && typeof result === "object") {
      if ("error" in result) console.error(`视频处理错误已跳过: ${result.error}`);
      else if ("warning" in result) console.warn(`视频处理警告已跳过: ${result.warning}`);
    }
  });
  return generatedVideosToDisplay;
}

export async function generateVideo(
  formData: GenerateVideoFormI,
  appContext: appContextDataI | null,
  idToken: string
): Promise<GenerateVideoInitiationResult | ErrorResult> {
  try {
    await verifyTokenAndCheckQuota("veo", idToken);
  } catch (error: any) {
    console.error("generateVideo 的认证或配额检查失败:", error.message);
    return { error: error.message };
  }

  try {
    let processedPrompt: string = formData.prompt;
    const isPureEnglish = /^[a-zA-Z0-9\s.,!?'"-]*$/.test(processedPrompt);

    if (processedPrompt && !isPureEnglish) {
      console.log(`检测到非英文 VEO prompt，正在翻译: "${processedPrompt}"`);
      const translationResult = await translatePromptToEnglish(processedPrompt, idToken);

      if (isErrorResult(translationResult)) {
        throw new Error(`翻译失败: ${translationResult.error}`);
      } else {
        processedPrompt = translationResult;
        console.log(`已翻译 VEO prompt 为英文: "${processedPrompt}"`);
      }
    }

    const hasInterpolImageFirst = formData.interpolImageFirst && formData.interpolImageFirst.base64Image !== "" && formData.interpolImageFirst.format !== "";
    const hasInterpolImageLast = formData.interpolImageLast && formData.interpolImageLast.base64Image !== "" && formData.interpolImageLast.format !== "";
    const isImageToVideo = (hasInterpolImageFirst && !hasInterpolImageLast) || (hasInterpolImageLast && !hasInterpolImageFirst);
    const isInterpolation = hasInterpolImageFirst && hasInterpolImageLast;
    const isCameraPreset = formData.cameraPreset !== "";

    let client: AuthClient;
    try {
      const { GoogleAuth } = await import("google-auth-library");
      const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
      client = await auth.getClient();
    } catch (error) {
      console.error("认证错误:", error);
      return { error: "无法验证您的账户以访问视频生成服务。" };
    }

    const location = "us-central1";
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
    let modelVersion = formData.modelVersion || GenerateVideoFormFields.modelVersion.default;
    if (isInterpolation || isCameraPreset) modelVersion = "veo-2.0-generate-exp";

    const videoAPIUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predictLongRunning`;

    if (!appContext?.gcsURI || !appContext?.userID) {
      console.error("应用上下文错误: 缺少 GCS URI 或用户 ID。");
      return { error: "应用上下文缺少必要信息 (GCS URI 或用户 ID)。" };
    }
    const generationGcsURI = `${appContext.gcsURI}/${appContext.userID}/generated-videos`;

    let parameters: any = {
      sampleCount: parseInt(formData.sampleCount, 10),
      aspectRatio: formData.aspectRatio,
      durationSeconds: parseInt(formData.durationSeconds, 10),
      storageUri: generationGcsURI,
      negativePrompt: formData.negativePrompt,
      personGeneration: formData.personGeneration,
      generateAudio: formData.modelVersion.includes("veo-3.0") && formData.isVideoWithAudio,
    };

    if (formData.modelVersion.includes("veo-3.0")) parameters["resolution"] = formData.resolution;
    if (formData["seedNumber"]) parameters["seed"] = parseInt(formData["seedNumber"], 10);

    const reqData: any = {
      instances: [{ prompt: processedPrompt }],
      parameters: parameters,
    };

    if (formData.cameraPreset)
      reqData.instances[0].cameraControl = cameraPresetsOptions.find(
        (item) => item.label === formData.cameraPreset
      )?.value;

    if (isImageToVideo) {
      if (hasInterpolImageFirst) {
        const interpolImageFirst = formData.interpolImageFirst.base64Image.startsWith("data:")
          ? formData.interpolImageFirst.base64Image.split(",")[1]
          : formData.interpolImageFirst.base64Image;
        reqData.instances[0].image = {
          bytesBase64Encoded: interpolImageFirst,
          mimeType: formData.interpolImageFirst.format,
        };
      } else {
        const interpolImageLast = formData.interpolImageLast.base64Image.startsWith("data:")
          ? formData.interpolImageLast.base64Image.split(",")[1]
          : formData.interpolImageLast.base64Image;
        reqData.instances[0].lastFrame = {
          bytesBase64Encoded: interpolImageLast,
          mimeType: formData.interpolImageLast.format,
        };
      }
    }

    if (isInterpolation) {
      try {
        const interpolationGcsURI = `${appContext.gcsURI}/${appContext.userID}/generated-videos/interpolation-frames`;
        const bucketName = interpolationGcsURI.replace("gs://", "").split("/")[0];
        const folderName = interpolationGcsURI.split(bucketName + "/")[1];
        let interpolImageFirstUri = "";
        const objectNameFirst = `${folderName}/${Math.random().toString(36).substring(2, 15)}.${formData.interpolImageFirst.format.split("/")[1]
          }`;
        await uploadBase64Image(formData.interpolImageFirst.base64Image.split(",")[1], bucketName, objectNameFirst, formData.interpolImageFirst.format, idToken).then(
          (result) => {
            if (!result.success) throw Error(cleanResult(result.error ?? "无法将图片上传到 GCS"));
            interpolImageFirstUri = result.fileUrl ?? "";
          }
        );
        reqData.instances[0].image = {
          gcsUri: interpolImageFirstUri,
          mimeType: formData.interpolImageFirst.format,
        };
        let interpolImageLastUri = "";
        const objectNameLast = `${folderName}/${Math.random().toString(36).substring(2, 15)}.${formData.interpolImageLast.format.split("/")[1]
          }`;
        await uploadBase64Image(formData.interpolImageLast.base64Image.split(",")[1], bucketName, objectNameLast, formData.interpolImageLast.format, idToken).then(
          (result) => {
            if (!result.success) throw Error(cleanResult(result.error ?? "无法将图片上传到 GCS"));
            interpolImageLastUri = result.fileUrl ?? "";
          }
        );
        reqData.instances[0].lastFrame = {
          gcsUri: interpolImageLastUri,
          mimeType: formData.interpolImageLast.format,
        };
      } catch (error) {
        console.error(error);
        return {
          error: "获取内容安全访问权限时出错。",
        };
      }
    }

    const opts: GaxiosOptions = {
      url: videoAPIUrl,
      method: "POST",
      data: reqData,
    };

    const res: GaxiosResponse<VeoInitiationApiResponse> = await client.request(opts);

    if (res.data?.name) {
      return { operationName: res.data.name, prompt: processedPrompt };
    }

    const apiError = res.data?.error;
    if (apiError) {
      if (isResourceExhaustedError(apiError)) return { error: customRateLimitMessage };
      const errorDetail = apiError.message || "视频生成初始化期间发生未知错误。";
      return { error: `视频初始化失败: ${errorDetail}` };
    }

    return { error: "视频初始化失败: 响应数据中存在未知的错误结构。" };

  } catch (error: any) {
    console.error("视频生成请求错误:", error.response?.data || error.message || error);
    const nestedError = error.response?.data?.error;
    if (error.response?.status === 429 || error.response?.status === 503 || isResourceExhaustedError(error) || isResourceExhaustedError(nestedError) || isResourceExhaustedError(error.response?.data) || (error.errors && Array.isArray(error.errors) && error.errors.length > 0 && isResourceExhaustedError(error.errors[0])))
      return { error: customRateLimitMessage };
    if (error.response?.status === 400)
      return { error: "请求错误: 视频生成的请求参数存在问题。" };

    const errorMessage = error instanceof Error ? error.message : "初始化视频生成时发生意外错误。";
    return { error: errorMessage };
  }
}

export async function getVideoGenerationStatus(
  operationName: string,
  appContext: appContextDataI | null,
  formData: GenerateVideoFormI,
  passedPrompt: string,
  idToken: string
): Promise<VideoGenerationStatusResult> {
  let uid: string;
  try {
    const result = await verifyTokenOnly(idToken);
    uid = result.uid;
  } catch (error: any) {
    return { done: true, error: error.message };
  }

  let client: AuthClient;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
    client = await auth.getClient();
  } catch (error) {
    console.error("轮询认证错误:", error);
    return { done: true, error: "无法为轮询状态进行身份验证。" };
  }

  const parts = operationName.split("/");
  if (parts.length < 8) {
    console.error(`无效的 operationName 格式: ${operationName}`);
    return { done: true, error: "无效的操作名称格式。" };
  }
  const projectId = parts[1];
  const location = parts[3];
  const modelId = parts[7];

  const pollingAPIUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;

  const opts: GaxiosOptions = {
    url: pollingAPIUrl,
    method: "POST",
    data: {
      operationName: operationName,
    },
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const res: GaxiosResponse<PollingResponse> = await client.request(opts);
    const pollingData = res.data;

    if (!pollingData.done) {
      return { done: false, name: operationName };
    } else {
      if (pollingData.error) {
        console.error(`操作 ${operationName} 失败:`, pollingData.error);
        if (
          pollingData.error.code === 8 &&
          typeof pollingData.error.message === "string" &&
          pollingData.error.message.toLowerCase().includes("resource exhausted")
        )
          return { done: true, error: customRateLimitMessage };

        if (
          typeof pollingData.error.message === "string" &&
          pollingData.error.message.includes("{ code: 8, message: 'Resource exhausted.' }")
        )
          return { done: true, error: customRateLimitMessage };

        return { done: true, error: pollingData.error.message || "视频生成失败。" };
      } else if (pollingData.response && pollingData.response.videos) {

        await deductQuota(uid, "veo");

        const rawVideoResults = pollingData.response.videos.map((video: any) => ({
          gcsUri: video.gcsUri,
          mimeType: video.mimeType,
        }));

        const usedRatio = VideoRatioToPixel.find((item) => item.ratio === formData.aspectRatio);

        const enhancedVideoList = await buildVideoListFromURI({
          videosInGCS: rawVideoResults,
          aspectRatio: formData.aspectRatio,
          resolution: formData.resolution,
          duration: parseInt(formData.durationSeconds, 10),
          width: usedRatio?.width ?? 1280,
          height: usedRatio?.height ?? 720,
          usedPrompt: passedPrompt,
          userID: appContext?.userID || "",
          modelVersion: formData.modelVersion,
          mode: "Generated",
        });
        return { done: true, videos: enhancedVideoList };
      } else {
        console.error(`操作 ${operationName} 已完成，但响应格式不符合预期。`, pollingData);
        return { done: true, error: "操作已完成，但响应格式不符合预期。" };
      }
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error(`轮询错误 404 for ${operationName}: 在 ${pollingAPIUrl} 未找到操作`);
      return { done: true, error: `操作 ${operationName} 未找到。它可能已过期或从未存在。` };
    }
    if (error.response?.status === 429 || error.response?.status === 503)
      return { done: true, error: customRateLimitMessage };

    console.error(`轮询错误 for ${operationName}:`, error.response?.data || error.message);
    let errorMessage = "轮询视频生成状态时发生错误。";
    const nestedError = error.response?.data?.error;
    if (nestedError) {
      if (
        nestedError.code === 8 &&
        typeof nestedError.message === "string" &&
        nestedError.message.toLowerCase().includes("resource exhausted")
      )
        return { done: true, error: customRateLimitMessage };

      if (
        typeof nestedError.message === "string" &&
        nestedError.message.includes("{ code: 8, message: 'Resource exhausted.' }")
      )
        return { done: true, error: customRateLimitMessage };

      if (nestedError.message) errorMessage = nestedError.message;
    } else if (error instanceof Error && error.message) {
      errorMessage = error.message;
      if (errorMessage.toLowerCase().includes("resource exhausted") && errorMessage.includes("code: 8")) {
        return { done: true, error: customRateLimitMessage };
      }
    }
    return { done: true, error: errorMessage };
  }
}
