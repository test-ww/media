"use server";

// 导入我们新创建的工具函数
import { verifyTokenAndManageQuota } from "../auth-and-quota";

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
import { getFullReferenceDescription } from "../gemini/action";
import { appContextDataI } from "../../context/app-context";
import { EditImageFormI } from "../edit-utils";

import type { AuthClient } from "google-auth-library/build/src/auth/authclient";
import type { GaxiosResponse, GaxiosOptions } from "gaxios";

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


// ... [文件顶部的所有辅助函数保持不变] ...
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
  fullPrompt = `A ${formData["secondary_style"]} ${formData["style"]} of ` + fullPrompt;
  let parameters = "";
  imageGenerationUtils.fullPromptFields.forEach((additionalField) => {
    if (formData[additionalField] !== "")
      parameters += ` ${formData[additionalField]} ${additionalField.replaceAll("_", " ")}, `;
  });
  if (parameters !== "") fullPrompt = `${fullPrompt}, ${parameters}`;
  let quality_modifiers = "";
  if (formData["use_case"] === "Food, insects, plants (still life)")
    quality_modifiers = quality_modifiers + ", High detail, precise focusing, controlled lighting";
  if (formData["use_case"] === "Sports, wildlife (motion)")
    quality_modifiers = quality_modifiers + ", Fast shutter speed, movement tracking";
  if (formData["use_case"] === "Astronomical, landscape (wide-angle)")
    quality_modifiers = quality_modifiers + ", Long exposure times, sharp focus, long exposure, smooth water or clouds";
  fullPrompt = fullPrompt + quality_modifiers;
  if (references !== undefined && references.length > 0) {
    let reference = "Generate an image ";
    let subjects: string[] = [];
    let subjectsID: number[] = [];
    let styles: string[] = [];
    let stylesID: number[] = [];
    for (const [index, reference] of references.entries()) {
      const params = referenceTypeMatching[reference.referenceType as keyof typeof referenceTypeMatching];
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
  }
  fullPrompt = normalizeSentence(fullPrompt);
  return fullPrompt;
}
export async function buildImageListFromURI({ imagesInGCS, aspectRatio, width, height, usedPrompt, userID, modelVersion, mode, }: { imagesInGCS: ImagenModelResultI[]; aspectRatio: string; width: number; height: number; usedPrompt: string; userID: string; modelVersion: string; mode: string; }) {
  const promises = imagesInGCS.map(async (image) => {
    if ("raiFilteredReason" in image) {
      return { warning: `${image["raiFilteredReason"]}` };
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
          return { src: signedURL, gcsUri: image.gcsUri, format: format, prompt: image.prompt && image.prompt != "" ? image.prompt : usedPrompt, altText: `Generated image ${fileName}`, key: ID, width: width, height: height, ratio: aspectRatio, date: formattedDate, author: userID, modelVersion: modelVersion, mode: mode };
        }
      } catch (error) {
        console.error(error);
        return { error: "Error while getting secured access to content." };
      }
    }
  });
  const generatedImagesToDisplay = (await Promise.all(promises)).filter((image) => image !== null) as unknown as ImageI[];
  return generatedImagesToDisplay;
}
export async function buildImageListFromBase64({ imagesBase64, targetGcsURI, aspectRatio, width, height, usedPrompt, userID, modelVersion, mode, }: { imagesBase64: ImagenModelResultI[]; targetGcsURI: string; aspectRatio: string; width: number; height: number; usedPrompt: string; userID: string; modelVersion: string; mode: string; }) {
  const bucketName = targetGcsURI.replace("gs://", "").split("/")[0];
  let uniqueFolderId = generateUniqueFolderId();
  const folderName = targetGcsURI.split(bucketName + "/")[1] + "/" + uniqueFolderId;
  const promises = imagesBase64.map(async (image) => {
    if ("raiFilteredReason" in image) {
      return { warning: `${image["raiFilteredReason"]}` };
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
        await uploadBase64Image(image.bytesBase64Encoded ?? "", bucketName, fullOjectName).then((result) => {
          if (!result.success) throw Error(cleanResult(result.error ?? "Could not upload image to GCS"));
          imageGcsUri = result.fileUrl ?? "";
        });
        const signedURL: string | { error: string } = await getSignedURL(imageGcsUri);
        if (typeof signedURL === "object" && "error" in signedURL) {
          throw Error(cleanResult(signedURL["error"]));
        } else {
          return { src: signedURL, gcsUri: imageGcsUri, format: format, prompt: image.prompt && image.prompt != "" ? image.prompt : usedPrompt, altText: `Generated image ${fileName}`, key: ID, width: width, height: height, ratio: aspectRatio, date: formattedDate, author: userID, modelVersion: modelVersion, mode: mode };
        }
      } catch (error) {
        console.error(error);
        return { error: "Error while getting secured access to content." };
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
  appContext: appContextDataI | null
) {
  try {
    await verifyTokenAndManageQuota("imagen");
  } catch (error: any) {
    console.error("Authentication or quota check failed:", error.message);
    return { error: error.message };
  }

  let client: AuthClient;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
    client = await auth.getClient();
  } catch (error) {
    console.error(error);
    return { error: "Unable to authenticate your account to access images" };
  }

  let references = formData["referenceObjects"];
  if (!areAllRefValid) references = [];
  const modelVersion = formData["modelVersion"];
  const location = modelVersion.includes("imagen-4.0") ? "us-central1" : process.env.NEXT_PUBLIC_VERTEX_API_LOCATION;
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`;
  let fullPrompt;
  try {
    fullPrompt = generatePrompt(formData, references);
    if (typeof fullPrompt === "object" && "error" in fullPrompt) {
      throw Error(fullPrompt.error);
    }
  } catch (error) {
    console.error(error);
    return { error: "An error occurred while generating the prompt." };
  }
  if (appContext === undefined) throw Error("No provided app context");
  let generationGcsURI = "";
  if (appContext === undefined || appContext === null || appContext.gcsURI === undefined || appContext.userID === undefined)
    throw Error("No provided app context");
  else {
    generationGcsURI = `${appContext.gcsURI}/${appContext.userID}/generated-images`;
  }
  let reqData: any = {
    instances: [{ prompt: fullPrompt as string }],
    parameters: { sampleCount: parseInt(formData["sampleCount"]), negativePrompt: formData["negativePrompt"], aspectRatio: formData["aspectRatio"], outputOptions: { mimeType: formData["outputOptions"] }, includeRaiReason: true, personGeneration: formData["personGeneration"], storageUri: generationGcsURI, enhancePrompt: isGeminiRewrite },
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
      const params = referenceTypeMatching[reference.referenceType as keyof typeof referenceTypeMatching];
      let newReference: any = {
        referenceType: params.referenceType,
        referenceId: reference.refId,
        referenceImage: { bytesBase64Encoded: reference.base64Image.startsWith("data:") ? reference.base64Image.split(",")[1] : reference.base64Image },
      };
      if (params.referenceType === "REFERENCE_TYPE_SUBJECT")
        newReference = { ...newReference, subjectImageConfig: { subjectDescription: reference.description, subjectType: params.subjectType } };
      if (params.referenceType === "REFERENCE_TYPE_STYLE")
        newReference = { ...newReference, styleImageConfig: { styleDescription: reference.description } };
      reqData.instances[0].referenceImages[index] = newReference;
      if (!fullRefDescriptionDone.includes(reference.refId)) {
        fullRefDescriptionDone.push(reference.refId);
        const fullAIrefDescription = await getFullReferenceDescription(reference.base64Image, reference.referenceType);
        reqData.instances[0].prompt = reqData.instances[0].prompt + `\n\n[${reference.refId}] ` + fullAIrefDescription;
      }
    }
  }

  const opts: GaxiosOptions = { url: imagenAPIurl, method: "POST", data: reqData };
  try {
    const res: GaxiosResponse<VertexAIResponse> = await client.request(opts);

    if (res.data.predictions === undefined) throw Error("There were an issue, no images were generated");
    if ("raiFilteredReason" in res.data.predictions[0])
      throw Error(cleanResult(res.data.predictions[0].raiFilteredReason!));

    const usedRatio = RatioToPixel.find((item) => item.ratio === opts.data.parameters.aspectRatio);
    const resultImages: ImagenModelResultI[] = res.data.predictions as ImagenModelResultI[];
    const isResultBase64Images: boolean = resultImages.every((image) => "bytesBase64Encoded" in image);

    let enhancedImageList;
    if (isResultBase64Images)
      enhancedImageList = await buildImageListFromBase64({ imagesBase64: resultImages, targetGcsURI: generationGcsURI, aspectRatio: opts.data.parameters.aspectRatio, width: usedRatio?.width ?? 0, height: usedRatio?.height ?? 0, usedPrompt: opts.data.instances[0].prompt, userID: appContext?.userID ? appContext?.userID : "", modelVersion: modelVersion, mode: "Generated" });
    else
      enhancedImageList = await buildImageListFromURI({ imagesInGCS: resultImages, aspectRatio: opts.data.parameters.aspectRatio, width: usedRatio?.width ?? 0, height: usedRatio?.height ?? 0, usedPrompt: opts.data.instances[0].prompt, userID: appContext?.userID ? appContext?.userID : "", modelVersion: modelVersion, mode: "Generated" });
    return enhancedImageList;
  } catch (error) {
    const errorString = error instanceof Error ? error.toString() : String(error);
    console.error(errorString);
    if (errorString.includes("safety settings for peopleface generation") || errorString.includes("All images were filtered out because they violated Vertex AI's usage guidelines") || errorString.includes("Person Generation"))
      return { error: errorString.replace(/^Error: /i, "") };
    const myError = error as Error & { errors: any[] };
    let myErrorMsg = "";
    if (myError.errors && myError.errors[0] && myError.errors[0].message)
      myErrorMsg = myError.errors[0].message.replace("Image generation failed with the following error: ", "");
    return { error: myErrorMsg || "An unexpected error occurred." };
  }
}

export async function editImage(formData: EditImageFormI, appContext: appContextDataI | null) {
  try {
    await verifyTokenAndManageQuota("imagen");
  } catch (error: any) {
    console.error("Authentication or quota check failed for editImage:", error.message);
    return {
      error: error.message,
    };
  }

  let client: AuthClient;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
    client = await auth.getClient();
  } catch (error) {
    console.error(error);
    return {
      error: "Unable to authenticate your account to access images",
    };
  }

  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION;
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const modelVersion = formData["modelVersion"];
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predict`;
  if (appContext === undefined) throw Error("No provided app context");
  let editGcsURI = "";
  if (appContext === undefined || appContext === null || appContext.gcsURI === undefined || appContext.userID === undefined)
    throw Error("No provided app context");
  else {
    editGcsURI = `${appContext.gcsURI}/${appContext.userID}/edited-images`;
  }
  const refInputImage = formData["inputImage"].startsWith("data:") ? formData["inputImage"].split(",")[1] : formData["inputImage"];
  const refInputMask = formData["inputMask"].startsWith("data:") ? formData["inputMask"].split(",")[1] : formData["inputMask"];
  const editMode = formData["editMode"];
  const reqData = {
    instances: [{
      prompt: formData.prompt as string,
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
      throw Error("There were an issue, no images were generated");
    }
    if ("raiFilteredReason" in res.data.predictions[0]) {
      throw Error(cleanResult(res.data.predictions[0].raiFilteredReason!));
    }
  } catch (error) {
    console.error(error);
    const errorString = error instanceof Error ? error.toString() : "";
    if (errorString.includes("safety settings for peopleface generation") || errorString.includes("All images were filtered out because they violated Vertex AI's usage guidelines")) {
      return { error: errorString.replace("Error: ", "") };
    }
    const myError = error as Error & { errors: any[] };
    const myErrorMsg = myError.errors?.[0]?.message;
    return { error: myErrorMsg };
  }
  try {
    const resultImages: ImagenModelResultI[] = res.data.predictions as ImagenModelResultI[];
    const isResultBase64Images: boolean = resultImages.every((image) => "bytesBase64Encoded" in image);

    let enhancedImageList;
    if (isResultBase64Images)
      enhancedImageList = await buildImageListFromBase64({ imagesBase64: resultImages, targetGcsURI: editGcsURI, aspectRatio: formData["ratio"], width: formData["width"], height: formData["height"], usedPrompt: opts.data.instances[0].prompt, userID: appContext?.userID ? appContext?.userID : "", modelVersion: modelVersion, mode: "Generated" });
    else
      enhancedImageList = await buildImageListFromURI({ imagesInGCS: resultImages, aspectRatio: formData["ratio"], width: formData["width"], height: formData["height"], usedPrompt: opts.data.instances[0].prompt, userID: appContext?.userID ? appContext?.userID : "", modelVersion: modelVersion, mode: "Edited" });
    return enhancedImageList;
  } catch (error) {
    console.error(error);
    return { error: "Issue while editing image." };
  }
}

export async function upscaleImage(
  source: { uri: string } | { base64: string },
  upscaleFactor: string,
  appContext: appContextDataI | null
) {
  let client: AuthClient;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
    client = await auth.getClient();
  } catch (error) {
    console.error(error);
    return {
      error: "Unable to authenticate your account to access images",
    };
  }

  const location = process.env.NEXT_PUBLIC_VERTEX_API_LOCATION;
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const imagenAPIurl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@002:predict`;
  let base64Image;
  if ("uri" in source) {
    let res;
    try {
      res = await downloadMediaFromGcs(source.uri);
      if (typeof res === "object" && res["error"]) {
        throw Error(res["error"].replaceAll("Error: ", ""));
      }
    } catch (error: any) {
      throw Error(error);
    }
    const { data } = res;
    base64Image = data;
  } else {
    base64Image = source.base64;
  }
  let targetGCSuri = "";
  if (appContext === undefined || appContext === null || appContext.gcsURI === undefined || appContext.userID === undefined)
    throw Error("No provided app context");
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

    // 【最终修复】: 使用 'as' 类型断言来处理 Promise.race 的返回类型
    const res = await Promise.race([
      client.request(opts),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Upscaling timed out")), timeout)),
    ]) as GaxiosResponse<VertexAIResponse>;

    if (res.data.predictions === undefined) {
      throw Error("There were an issue, images could not be upscaled");
    }
    return { newGcsUri: res.data.predictions[0].gcsUri, mimeType: res.data.predictions[0].mimeType };
  } catch (error) {
    console.error(error);
    if ((error as Error).message.includes("Response size too large."))
      return {
        error: "Image size limit exceeded. The resulting image is too large. Please try a smaller resolution or a different image.",
      };
    return {
      error: "Error while upscaling images.",
    };
  }
}
