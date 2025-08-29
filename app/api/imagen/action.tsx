"use server";

import { verifyTokenAndCheckQuota, deductQuota } from "../auth-and-quota";
import {
  GenerateImageFormI,
  ImagenModelResultI,
  ImageI,
  RatioToPixel,
  referenceTypeMatching,
  ReferenceObjectI,
  imageGenerationUtils,
} from "../generate-image-utils";
import {
  decomposeUri,
  downloadMediaFromGcs,
  getSignedURL,
  uploadBase64Image,
} from "../cloud-storage/action";
import { getFullReferenceDescription, translatePromptToEnglish } from "../gemini/action";
import { appContextDataI } from "../../context/app-context";
import { EditImageFormI } from "../edit-utils";
import type { AuthClient } from "google-auth-library/build/src/auth/authclient";
import type { GaxiosResponse, GaxiosOptions } from "gaxios";

function isErrorResult(value: any): value is { error: string } {
  return typeof value === 'object' && value !== null && 'error' in value;
}

interface VertexAIPrediction {
  gcsUri?: string;
  mimeType?: string;
  bytesBase64Encoded?: string;
  raiFilteredReason?: string;
  [key: string]: any;
}

interface VertexAIResponse {
  predictions: VertexAIPrediction[];
}

function cleanResult(inputString: string) {
  return inputString.toString().replaceAll("\n", "").replaceAll(/\//g, "").replaceAll("*", "");
}
function generateUniqueFolderId() {
  let number = Math.floor(Math.random() * 9) + 1;
  for (let i = 0; i < 12; i++) number = number * 10 + Math.floor(Math.random() * 10);
  return number;
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

function generatePrompt(formData: any, references?: ReferenceObjectI[]) {
  let fullPrompt = formData["prompt"];

  if (references !== undefined && references.length > 0) {
    let reference = "Generate an image ";
    let subjects: string[] = [];
    let subjectsID: number[] = [];
    let styles: string[] = [];
    let stylesID: number[] = [];

    for (const [index, reference] of references.entries()) {
      if (!reference || !reference.referenceType) {
        console.warn(`因缺少 referenceType，跳过索引为 ${index} 的引用。`);
        continue;
      }

      const params = referenceTypeMatching[reference.referenceType as keyof typeof referenceTypeMatching];

      if (!params) {
        console.warn(`因未知的引用类型 "${reference.referenceType}" 而跳过。`);
        continue;
      }

      if (params.referenceType === "REFERENCE_TYPE_SUBJECT")
        if (!subjectsID.includes(reference.refId)) {
          subjects.push(`a ${reference.description.toLowerCase()} [${reference.refId}]`);
          subjectsID.push(reference.refId);
        }
      if (params.referenceType === "REFERENCE_TYPE_STYLE")
        if (!stylesID.includes(reference.refId)) {
          styles.push(`in a ${reference.description.toLowerCase()} style [${reference.refId}]`);
          stylesID.push(reference.refId);
        }
    }

    if (subjects.length > 0) reference = reference + "about " + subjects.join(", ");
    if (styles.length > 0) reference = reference.trim() + ", " + styles.join(", ");
    reference = reference + " to match the description: ";
    fullPrompt = reference + fullPrompt;
    fullPrompt = normalizeSentence(fullPrompt);
  }

  return fullPrompt;
}

export async function buildImageListFromURI({ imagesInGCS, aspectRatio, width, height, usedPrompt, userID, modelVersion, mode, idToken }: { imagesInGCS: ImagenModelResultI[]; aspectRatio: string; width: number; height: number; usedPrompt: string; userID: string; modelVersion: string; mode: string; idToken: string; }) {
  const promises = imagesInGCS.map(async (image) => {
    if ("raiFilteredReason" in image) {
      return { warning: `图片因内容安全策略被过滤: ${image["raiFilteredReason"]}` };
    } else {
      const { fileName } = await decomposeUri(image.gcsUri ?? "");
      const format = image.mimeType.replace("image/", "").toUpperCase();
      const ID = fileName.replaceAll("/", "").replace(userID, "").replace("generated-images", "").replace("edited-images", "").replace("sample_", "").replace(`.${format.toLowerCase()}`, "");
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      try {
        const signedURL: string | { error: string } = await getSignedURL(image.gcsUri ?? "");
        if (typeof signedURL === "object" && "error" in signedURL) {
          throw Error(cleanResult(signedURL["error"]));
        } else {
          return { src: signedURL, gcsUri: image.gcsUri, format: format, prompt: image.prompt && image.prompt != "" ? image.prompt : usedPrompt, altText: `生成的图片 ${fileName}`, key: ID, width: width, height: height, ratio: aspectRatio, date: formattedDate, author: userID, modelVersion: modelVersion, mode: mode };
        }
      } catch (error) {
        console.error(error);
        return { error: "获取内容安全访问权限时出错。" };
      }
    }
  });
  const generatedImagesToDisplay = (await Promise.all(promises)).filter((image) => image !== null) as unknown as ImageI[];
  return generatedImagesToDisplay;
}

export async function buildImageListFromBase64({ imagesBase64, targetGcsURI, aspectRatio, width, height, usedPrompt, userID, modelVersion, mode, idToken }: { imagesBase64: ImagenModelResultI[]; targetGcsURI: string; aspectRatio: string; width: number; height: number; usedPrompt: string; userID: string; modelVersion: string; mode: string; idToken: string; }) {
  const bucketName = targetGcsURI.replace("gs://", "").split("/")[0];
  let uniqueFolderId = generateUniqueFolderId();
  const folderName = targetGcsURI.split(bucketName + "/")[1] + "/" + uniqueFolderId;
  const promises = imagesBase64.map(async (image) => {
    if ("raiFilteredReason" in image) {
      return { warning: `图片因内容安全策略被过滤: ${image["raiFilteredReason"]}` };
    } else {
      const format = image.mimeType.replace("image/", "").toUpperCase();
      const index = imagesBase64.findIndex((obj) => obj.bytesBase64Encoded === image.bytesBase64Encoded);
      const fileName = "sample_" + index.toString();
      const fullOjectName = folderName + "/" + fileName + "." + format.toLocaleLowerCase();
      const ID = fullOjectName.replaceAll("/", "").replace(userID, "").replace("generated-images", "").replace("edited-images", "").replace("sample_", "").replace(`.${format.toLowerCase()}`, "");
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      try {
        let imageGcsUri = "";
        await uploadBase64Image(image.bytesBase64Encoded ?? "", bucketName, fullOjectName, "image/png", idToken).then((result) => {
          if (!result.success) throw Error(cleanResult(result.error ?? "无法将图片上传到 GCS"));
          imageGcsUri = result.fileUrl ?? "";
        });
        const signedURL: string | { error: string } = await getSignedURL(imageGcsUri);
        if (typeof signedURL === "object" && "error" in signedURL) {
          throw Error(cleanResult(signedURL["error"]));
        } else {
          return { src: signedURL, gcsUri: imageGcsUri, format: format, prompt: image.prompt && image.prompt != "" ? image.prompt : usedPrompt, altText: `生成的图片 ${fileName}`, key: ID, width: width, height: height, ratio: aspectRatio, date: formattedDate, author: userID, modelVersion: modelVersion, mode: mode };
        }
      } catch (error) {
        console.error(error);
        return { error: "获取内容安全访问权限时出错。" };
      }
    }
  });
  const generatedImagesToDisplay = (await Promise.all(promises)).filter((image) => image !== null) as unknown as ImageI[];
  return generatedImagesToDisplay;
}

export async function generateImage(
  formData: GenerateImageFormI,
  areAllRefValid: boolean,
  isGeminiRewrite: boolean,
  appContext: appContextDataI | null,
  idToken: string
) {
  let uid: string;
  try {
    const result = await verifyTokenAndCheckQuota("imagen", idToken);
    uid = result.uid;
  } catch (error: any) {
    console.error("认证或配额检查失败:", error.message);
    return { error: error.message };
  }

  let client: AuthClient;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
    client = await auth.getClient();
  } catch (error) {
    console.error(error);
    return { error: "无法验证您的账户以访问图片生成服务。" };
  }

  try {
    let processedPrompt: string = formData["prompt"];
    const isPureEnglish = /^[a-zA-Z0-9\s.,!?'"-]*$/.test(processedPrompt);

    if (!isPureEnglish) {
      console.log(`检测到非英文 prompt，正在翻译: "${processedPrompt}"`);
      const translationResult = await translatePromptToEnglish(processedPrompt, idToken);

      if (isErrorResult(translationResult)) {
        throw new Error(`翻译失败: ${translationResult.error}`);
      } else {
        processedPrompt = translationResult;
        console.log(`已翻译为英文: "${processedPrompt}"`);
      }
    }

    const finalFormData = { ...formData, prompt: processedPrompt };
    let fullPrompt = generatePrompt(finalFormData, formData["referenceObjects"]);

    let references = formData["referenceObjects"];
    if (!areAllRefValid) references = [];
    const modelVersion = formData["modelVersion"];
    const location = modelVersion.includes("imagen-4.0") ? "us-central1" : process.env.NEXT_PUBLIC_VERTEX_API_LOCATION;
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
    const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`;

    if (appContext === undefined) throw Error("未提供应用上下文。");
    let generationGcsURI = "";
    if (appContext === null || appContext.gcsURI === undefined || appContext.userID === undefined)
      throw Error("应用上下文缺少必要信息。");
    else {
      generationGcsURI = `${appContext.gcsURI}/${appContext.userID}/generated-images`;
    }

    let reqData: any = {
      instances: [{ prompt: fullPrompt as string }],
      parameters: {
        sampleCount: parseInt(formData["sampleCount"]),
        negativePrompt: formData["negativePrompt"],
        aspectRatio: formData["aspectRatio"],
        outputOptions: { mimeType: formData["outputOptions"] },
        includeRaiReason: true,
        personGeneration: formData["personGeneration"],
        storageUri: generationGcsURI,
        enhancePrompt: false
      },
    };

    if (!areAllRefValid) {
      if (formData["seedNumber"]) {
        reqData.parameters.seed = parseInt(formData["seedNumber"]);
        reqData.parameters.addWatermark = false;
      } else reqData.parameters.addWatermark = true;
    }

    if (areAllRefValid) {
      reqData.parameters.editMode = "EDIT_MODE_DEFAULT";
      reqData.instances[0].referenceImages = [];
      let fullRefDescriptionDone: number[] = [];
      for (const [index, reference] of references.entries()) {
        if (!reference || !reference.referenceType) {
          console.warn(`跳过索引为 ${index} 的无效引用。`);
          continue;
        }
        const params = referenceTypeMatching[reference.referenceType as keyof typeof referenceTypeMatching];
        if (!params) {
          console.warn(`因未知的引用类型 "${reference.referenceType}" 而跳过。`);
          continue;
        }
        if (!reference.base64Image || typeof reference.base64Image !== 'string' || reference.base64Image.trim() === '') {
          console.warn(`因缺少或无效的 base64 数据，跳过索引为 ${index} 的引用图片。`);
          continue;
        }
        let newReference: any = {
          referenceType: params.referenceType,
          referenceId: reference.refId,
          referenceImage: { bytesBase64Encoded: reference.base64Image.startsWith("data:") ? reference.base64Image.split(",")[1] : reference.base64Image },
        };
        if (params.referenceType === "REFERENCE_TYPE_SUBJECT")
          newReference = { ...newReference, subjectImageConfig: { subjectDescription: reference.description, subjectType: params.subjectType } };
        if (params.referenceType === "REFERENCE_TYPE_STYLE")
          newReference = { ...newReference, styleImageConfig: { styleDescription: reference.description } };
        reqData.instances[0].referenceImages.push(newReference);
        if (!fullRefDescriptionDone.includes(reference.refId)) {
          fullRefDescriptionDone.push(reference.refId);
          const fullAIrefDescription = await getFullReferenceDescription(reference.base64Image, reference.referenceType, idToken);

          if (isErrorResult(fullAIrefDescription)) {
            console.error("获取完整引用描述时出错:", fullAIrefDescription.error);
          } else {
            reqData.instances[0].prompt = reqData.instances[0].prompt + `\n\n[${reference.refId}] ` + fullAIrefDescription;
          }
        }
      }
    }

    const opts: GaxiosOptions = { url: imagenAPIurl, method: "POST", data: reqData };
    const res: GaxiosResponse<VertexAIResponse> = await client.request(opts);

    if (res.data.predictions === undefined) throw Error("出现问题，未生成任何图片。");

    const usedRatio = RatioToPixel.find((item) => item.ratio === opts.data.parameters.aspectRatio);
    const resultImages: ImagenModelResultI[] = res.data.predictions as ImagenModelResultI[];
    const isResultBase64Images: boolean = resultImages.every((image) => "bytesBase64Encoded" in image);

    let enhancedImageList;
    if (isResultBase64Images)
      enhancedImageList = await buildImageListFromBase64({ imagesBase64: resultImages, targetGcsURI: generationGcsURI, aspectRatio: opts.data.parameters.aspectRatio, width: usedRatio?.width ?? 0, height: usedRatio?.height ?? 0, usedPrompt: opts.data.instances[0].prompt, userID: appContext?.userID ? appContext?.userID : "", modelVersion: modelVersion, mode: "Generated", idToken });
    else
      enhancedImageList = await buildImageListFromURI({
        imagesInGCS: resultImages,
        aspectRatio: opts.data.parameters.aspectRatio,
        width: usedRatio?.width ?? 0,
        height: usedRatio?.height ?? 0,
        usedPrompt: opts.data.instances[0].prompt,
        userID: appContext?.userID ? appContext?.userID : "",
        modelVersion: modelVersion,
        mode: "Generated",
        idToken
      });

    const hasSuccessfulImages = enhancedImageList.some((img: ImageI) => !img.warning && !img.error);
    if (hasSuccessfulImages) {
      await deductQuota(uid, "imagen");
    }

    return enhancedImageList;
  } catch (error) {
    const errorString = error instanceof Error ? error.toString() : String(error);
    console.error(errorString);
    if (errorString.includes("safety settings for peopleface generation") || errorString.includes("All images were filtered out because they violated Vertex AI's usage guidelines") || errorString.includes("Person Generation"))
      return { error: `图片生成失败，因为内容触发了安全策略：${errorString.replace(/^Error: /i, "")}` };

    const myError = error as Error & { errors: any[] };
    let myErrorMsg = "";
    if (myError.errors && myError.errors[0] && myError.errors[0].message)
      myErrorMsg = myError.errors[0].message.replace("Image generation failed with the following error: ", "");

    return { error: myErrorMsg || errorString || "发生意外错误。" };
  }
}


export async function editImage(
  formData: EditImageFormI,
  appContext: appContextDataI | null,
  idToken: string
) {
  let uid: string;
  try {
    const result = await verifyTokenAndCheckQuota("imagen", idToken);
    uid = result.uid;
  } catch (error: any) {
    console.error("editImage 的认证或配额检查失败:", error.message);
    return { error: error.message };
  }

  try {
    let processedPrompt: string = formData.prompt;
    const isPureEnglish = /^[a-zA-Z0-9\s.,!?'"-]*$/.test(processedPrompt);

    if (processedPrompt && !isPureEnglish) {
      console.log(`检测到非英文编辑 prompt，正在翻译: "${processedPrompt}"`);
      const translationResult = await translatePromptToEnglish(processedPrompt, idToken);

      if (isErrorResult(translationResult)) {
        throw new Error(`翻译失败: ${translationResult.error}`);
      } else {
        processedPrompt = translationResult;
        console.log(`已翻译编辑 prompt 为英文: "${processedPrompt}"`);
      }
    }

    if (!formData.inputImage || typeof formData.inputImage !== 'string' || formData.inputImage.trim() === '') {
      return { error: "输入图片数据缺失或无效。请确保已提供要编辑的图片。" };
    }
    if (!formData.inputMask || typeof formData.inputMask !== 'string' || formData.inputMask.trim() === '') {
      return { error: "蒙版图片数据缺失或无效。请确保已提供编辑区域的蒙版。" };
    }

    let client: AuthClient;
    try {
      const { GoogleAuth } = await import("google-auth-library");
      const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
      client = await auth.getClient();
    } catch (error) {
      console.error(error);
      return { error: "无法验证您的账户以访问图片编辑服务。" };
    }

    const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION;
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
    const modelVersion = formData["modelVersion"];
    const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`;

    if (appContext === undefined) throw Error("未提供应用上下文。");
    let editGcsURI = "";
    if (appContext === null || appContext.gcsURI === undefined || appContext.userID === undefined)
      throw Error("应用上下文缺少必要信息。");
    else {
      editGcsURI = `${appContext.gcsURI}/${appContext.userID}/edited-images`;
    }

    const refInputImage = formData["inputImage"].startsWith("data:") ? formData["inputImage"].split(",")[1] : formData["inputImage"];
    const refInputMask = formData["inputMask"].startsWith("data:") ? formData["inputMask"].split(",")[1] : formData["inputMask"];
    const editMode = formData["editMode"];

    const reqData = {
      instances: [{
        prompt: processedPrompt,
        referenceImages: [{
          referenceType: "REFERENCE_TYPE_RAW",
          referenceId: 1,
          referenceImage: { bytesBase64Encoded: refInputImage },
        }, {
          referenceType: "REFERENCE_TYPE_MASK",
          referenceId: 2,
          referenceImage: { bytesBase64Encoded: refInputMask },
          maskImageConfig: { maskMode: "MASK_MODE_USER_PROVIDED", dilation: parseFloat(formData["maskDilation"]) },
        }],
      }],
      parameters: { negativePrompt: formData["negativePrompt"], editConfig: { baseSteps: parseInt(formData["baseSteps"]) }, editMode: editMode, sampleCount: parseInt(formData["sampleCount"]), outputOptions: { mimeType: formData["outputOptions"] }, includeRaiReason: true, personGeneration: formData["personGeneration"], storageUri: editGcsURI },
    };

    if (editMode === "EDIT_MODE_BGSWAP") {
      const referenceImage = reqData.instances[0].referenceImages[1] as any;
      delete referenceImage.referenceImage;
      referenceImage.maskImageConfig.maskMode = "MASK_MODE_BACKGROUND";
      delete referenceImage.maskImageConfig.dilation;
    }

    const opts: GaxiosOptions = { url: imagenAPIurl, method: "POST", data: reqData };

    let res: GaxiosResponse<VertexAIResponse>;
    try {
      res = await client.request(opts);
      if (res.data.predictions === undefined) {
        throw new Error("出现问题，未生成任何图片。");
      }
      if ("raiFilteredReason" in res.data.predictions[0]) {
        throw new Error(`图片编辑失败，因为内容触发了安全策略：${cleanResult(res.data.predictions[0].raiFilteredReason!)}`);
      }
    } catch (error) {
      console.error(error);
      const errorString = error instanceof Error ? error.toString() : "";
      if (errorString.includes("safety settings for peopleface generation") || errorString.includes("All images were filtered out because they violated Vertex AI's usage guidelines")) {
        return { error: `图片编辑失败，因为内容触发了安全策略：${errorString.replace("Error: ", "")}` };
      }
      const myError = error as Error & { errors: any[] };
      const googleApiErrorMessage = myError.errors?.[0]?.message;
      if (googleApiErrorMessage) {
        return { error: googleApiErrorMessage.replace("Image editing failed with the following error: ", "") };
      }
      return { error: "图片编辑失败，请检查您的输入或稍后重试。" };
    }

    const resultImages: ImagenModelResultI[] = res.data.predictions as ImagenModelResultI[];
    const isResultBase64Images: boolean = resultImages.every((image) => "bytesBase64Encoded" in image);

    let enhancedImageList;
    if (isResultBase64Images)
      enhancedImageList = await buildImageListFromBase64({ imagesBase64: resultImages, targetGcsURI: editGcsURI, aspectRatio: formData["ratio"], width: formData["width"], height: formData["height"], usedPrompt: opts.data.instances[0].prompt, userID: appContext?.userID ? appContext?.userID : "", modelVersion: modelVersion, mode: "Generated", idToken });
    else
      enhancedImageList = await buildImageListFromURI({ imagesInGCS: resultImages, aspectRatio: formData["ratio"], width: formData["width"], height: formData["height"], usedPrompt: opts.data.instances[0].prompt, userID: appContext?.userID ? appContext?.userID : "", modelVersion: modelVersion, mode: "Edited", idToken });

    const hasSuccessfulImages = enhancedImageList.some((img: ImageI) => !img.warning && !img.error);
    if (hasSuccessfulImages) {
      await deductQuota(uid, "imagen");
    }

    return enhancedImageList;

  } catch (error: any) {
    console.error("在 editImage 中出错:", error);
    const errorMessage = error instanceof Error ? error.message : "图片编辑过程中发生意外错误。";
    return { error: errorMessage };
  }
}


export async function upscaleImage(
  source: { uri: string } | { base64: string },
  upscaleFactor: string,
  appContext: appContextDataI | null,
  idToken: string
) {
  let uid: string;
  try {
    const result = await verifyTokenAndCheckQuota("imagen", idToken);
    uid = result.uid;
  } catch (error: any) {
    console.error("upscaleImage 的认证或配额检查失败:", error.message);
    return { error: error.message };
  }

  let client: AuthClient;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
    client = await auth.getClient();
  } catch (error) {
    console.error(error);
    return {
      error: "无法验证您的账户以访问图片放大服务。",
    };
  }

  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION;
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@002:predict`;
  let base64Image;
  if ("uri" in source) {
    let res;
    try {
      res = await downloadMediaFromGcs(source.uri, idToken);
      if (typeof res === "object" && res["error"]) {
        throw new Error(res["error"].replaceAll("Error: ", ""));
      }
    } catch (error: any) {
      throw new Error(error);
    }
    const { data } = res;
    base64Image = data;
  } else {
    base64Image = source.base64;
  }
  let targetGCSuri = "";
  if (appContext === undefined || appContext === null || appContext.gcsURI === undefined || appContext.userID === undefined)
    throw Error("未提供应用上下文。");
  else {
    targetGCSuri = `${appContext.gcsURI}/${appContext.userID}/upscaled-images`;
  }
  const base64ImageEncoded = base64Image && base64Image.startsWith("data:") ? base64Image.split(",")[1] : base64Image;
  const reqData = {
    instances: [{ prompt: "", image: { bytesBase64Encoded: base64ImageEncoded } }],
    parameters: { sampleCount: 1, mode: "upscale", upscaleConfig: { upscaleFactor: upscaleFactor }, storageUri: targetGCSuri },
  };

  const opts: GaxiosOptions = { url: imagenAPIurl, method: "POST", data: reqData };
  try {
    const timeout = 60000;

    const res = await Promise.race([
      client.request(opts),
      new Promise((_, reject) => setTimeout(() => reject(new Error("放大操作超时")), timeout)),
    ]) as GaxiosResponse<VertexAIResponse>;

    if (res.data.predictions === undefined) {
      throw new Error("出现问题，图片无法被放大。");
    }

    await deductQuota(uid, "imagen");
    return { newGcsUri: res.data.predictions[0].gcsUri, mimeType: res.data.predictions[0].mimeType };
  } catch (error) {
    console.error(error);
    if ((error as Error).message.includes("Response size too large."))
      return {
        error: "图片大小超出限制。生成的图片过大，请尝试较小的分辨率或不同的图片。",
      };
    return {
      error: "放大图片时出错。",
    };
  }
}
