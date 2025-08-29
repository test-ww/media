"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Typography, Button, Box, IconButton, Stack, Alert, Avatar, Icon } from "@mui/material";
import { Send as SendIcon, WatchLater as WatchLaterIcon, Close as CloseIcon, Autorenew } from "@mui/icons-material";
import { FormInputText } from "../ux-components/InputText";
import FormInputDropdown from "../ux-components/InputDropdown";
import { ImageI } from "../../api/generate-image-utils";
import theme from "../../theme";
import { buildImageListFromURI } from "../../api/imagen/action";
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from "../ux-components/Button-SX";
import CustomTooltip from "../ux-components/Tooltip";
import { appContextDataDefault, useAppContext } from "../../context/app-context";
import EditImageDropzone from "./EditImageDropzone";
import { EditImageFormFields, EditImageFormI, editSettingsFields, formDataEditDefaults, maskTypes } from "../../api/edit-utils";
import FormInputEditSettings from "./EditSettings";
import EditModeMenu from "./EditModeMenu";
import SetMaskDialog from "./SetMaskDialog";
import { downloadMediaFromGcs } from "../../api/cloud-storage/action";
import UpscaleDialog from "./UpscaleDialog";
import { useAuthFetch } from "../../lib/useAuthFetch";
import { getFirebaseInstances } from "../../lib/firebase/client";
import { getAuth } from "firebase/auth"; // <-- 【核心修改】导入 getAuth

const { palette } = theme;
const editModeField = EditImageFormFields.editMode;
const editModeOptions = editModeField.options;

export default function EditForm({
  isLoading, onRequestSent, onImageGeneration, errorMsg, onNewErrorMsg,
}: {
  isLoading: boolean;
  onRequestSent: (valid: boolean, count: number, isUpscaledDLAvailable: boolean) => void;
  onImageGeneration: (newImages: ImageI[]) => void;
  errorMsg: string;
  onNewErrorMsg: (newErrorMsg: string) => void;
}) {
  const { handleSubmit, watch, control, setValue, getValues, reset } = useForm<EditImageFormI>({
    defaultValues: formDataEditDefaults,
  });
  const { appContext, setAppContext } = useAppContext();
  const authFetch = useAuthFetch();

  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [maskPreview, setMaskPreview] = useState<string | null>(null);
  const [outpaintedImage, setOutpaintedImage] = useState<string | null>(null);
  const [imageWidth, imageHeight, imageRatio] = watch(["width", "height", "ratio"]);
  const [maskSize, setMaskSize] = useState({ width: 0, height: 0 });
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number | null>(null);
  const [originalHeight, setOriginalHeight] = useState<number | null>(null);
  const defaultEditMode = editModeOptions.find((option) => option.value === editModeField.default);
  const [selectedEditMode, setSelectedEditMode] = useState(defaultEditMode);
  const [openMaskDialog, setOpenMaskDialog] = useState(false);
  const isUpscaleMode = selectedEditMode?.value === "UPSCALE";
  const [upscaleFactor, setUpscaleFactor] = useState<string>("");
  const [openUpscaleDialog, setOpenUpscaleDialog] = useState(false);

  const handleNewEditMode = (value: string) => {
    resetStates();
    setValue("editMode", value);
    const newEditMode = editModeOptions.find((option) => option.value === value);
    setSelectedEditMode(newEditMode);
    const defaultMaskDilation = newEditMode?.defaultMaskDilation.toString();
    const defaultBaseSteps = newEditMode?.defaultBaseSteps.toString();
    if (defaultMaskDilation) setValue("maskDilation", defaultMaskDilation);
    if (defaultBaseSteps) setValue("baseSteps", defaultBaseSteps);
  };

  useEffect(() => {
    if (imageWidth !== maskSize.width || imageHeight !== maskSize.height)
      setMaskSize({ width: imageWidth, height: imageHeight });
  }, [imageWidth, imageHeight, maskSize.width, maskSize.height]);

  useEffect(() => {
    const fetchAndSetImage = async () => {
      if (defaultEditMode?.value) {
        handleNewEditMode(defaultEditMode.value);
      }
      if (appContext && appContext.imageToEdit) {
        try {
          // ======================= 【核心修改】: 获取用户和 Token =======================
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) {
            throw new Error("用户未登录，无法下载媒体文件。");
          }
          const idToken = await user.getIdToken(true);
          // ========================================================================

          // 【核心修改】: 传递 idToken
          const { data, error } = await downloadMediaFromGcs(appContext.imageToEdit, idToken);

          if (error) throw new Error(error);
          if (data) {
            const newImage = `data:image/png;base64,${data}`;
            setImageToEdit(newImage);
            setMaskImage(null);
            setAppContext((prevContext) => {
              if (prevContext) return { ...prevContext, imageToEdit: "" };
              return { ...appContextDataDefault, imageToEdit: "" };
            });
          }
        } catch (error) {
          console.error("Error fetching image:", error);
        }
      }
    };
    fetchAndSetImage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appContext?.imageToEdit]);

  const handleMaskDialogOpen = () => {
    if (selectedEditMode?.value === "EDIT_MODE_OUTPAINT") {
      if (!outpaintedImage) {
        setOriginalImage(getValues("inputImage"));
        setOriginalWidth(getValues("width"));
        setOriginalHeight(getValues("height"));
      } else {
        if (originalImage && originalWidth && originalHeight) {
          setValue("width", originalWidth);
          setValue("height", originalHeight);
          setValue("inputImage", originalImage);
        }
      }
    }
    setMaskSize({ width: imageWidth, height: imageHeight });
    setMaskImage(null);
    setMaskPreview(null);
    setOpenMaskDialog(true);
  };
  const handleMaskDialogClose = () => {
    setOpenMaskDialog(false);
  };

  useEffect(() => {
    if (imageToEdit) setValue("inputImage", imageToEdit);
    if (outpaintedImage) setValue("inputImage", outpaintedImage);
    if (maskImage) setValue("inputMask", maskImage);
  }, [imageToEdit, maskImage, outpaintedImage, setValue]);

  const onSubmit: SubmitHandler<EditImageFormI> = async (formData) => {
    onRequestSent(true, parseInt(formData.sampleCount), true);
    try {
      if (formData["inputImage"] === "" || (selectedEditMode?.mandatoryPrompt && formData["prompt"] === "") || (selectedEditMode?.mandatoryMask && formData["inputMask"] === ""))
        throw new Error("缺少图像、提示或蒙版");

      const { auth } = getFirebaseInstances();
      const user = auth.currentUser;
      if (!user) throw new Error("用户未登录。");

      const newEditedImage = await authFetch("/api/wrapped-actions/imagen", {
        method: "POST",
        body: JSON.stringify({
          action: "editImage",
          payload: { formData, appContext },
        }),
      });

      if (newEditedImage && typeof newEditedImage === "object" && "error" in newEditedImage) {
        throw new Error((newEditedImage as any).error.replaceAll("Error: ", ""));
      }

      (newEditedImage as any[]).forEach((image: any) => { if ("warning" in image) onNewErrorMsg(image["warning"] as string) });
      onImageGeneration(newEditedImage as ImageI[]);

    } catch (error: any) {
      onNewErrorMsg(error.toString());
    }
  };

  const onUpscaleSubmit: SubmitHandler<EditImageFormI> = async (formData) => {
    setOpenUpscaleDialog(false);
    onRequestSent(true, 1, false);
    try {
      if (upscaleFactor) {
        const { auth } = getFirebaseInstances();
        const user = auth.currentUser;
        if (!user) throw new Error("用户未登录。");

        // ======================= 【核心修改】: 获取 Token =======================
        const idToken = await user.getIdToken(true);
        // ========================================================================

        const res = await authFetch("/api/wrapped-actions/imagen", {
          method: "POST",
          body: JSON.stringify({
            action: "upscaleImage",
            payload: {
              source: { base64: formData.inputImage },
              upscaleFactor: upscaleFactor,
              appContext: appContext,
            },
          }),
        });

        if (res && typeof res === "object" && "error" in res) {
          throw new Error((res as any).error.replaceAll("Error: ", ""));
        }

        if (!res.newGcsUri || !res.mimeType) {
            throw new Error("Upscale response is missing necessary data.");
        }

        const upscaledImage = await buildImageListFromURI({
          imagesInGCS: [{ gcsUri: res.newGcsUri, mimeType: res.mimeType }],
          aspectRatio: formData["ratio"],
          width: formData["width"] * parseInt(upscaleFactor.replace("x", ""), 10),
          height: formData["height"] * parseInt(upscaleFactor.replace("x", ""), 10),
          usedPrompt: "",
          userID: appContext?.userID || "",
          modelVersion: formData["modelVersion"],
          mode: "Upscaled",
          idToken: idToken, // <-- 【核心修改】传递 idToken
        });

        onImageGeneration(upscaledImage);
      }
    } catch (error: any) {
      onNewErrorMsg(error.toString());
    }
  };

  const onReset = () => {
    setImageToEdit(null);
    resetStates();
    reset();
  };

  const resetStates = () => {
    setValue("prompt", "");
    setMaskImage(null);
    setMaskPreview(null);
    setOutpaintedImage(null);
    setMaskSize({ width: 0, height: 0 });
    onNewErrorMsg("");
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ pb: 5 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-start" alignItems="center">
            <Typography variant="h1" color={palette.text.secondary} sx={{ fontSize: "1.8rem" }}>{'使用'}</Typography>
            <FormInputDropdown name="modelVersion" label="" control={control} field={EditImageFormFields.modelVersion as any} styleSize="big" width="" required={false} />
          </Stack>
        </Box>
        <>{errorMsg !== "" && (<Alert severity="error" action={<IconButton aria-label="close" color="inherit" size="small" onClick={() => { onNewErrorMsg(""); }} sx={{ pt: 0.2 }}><CloseIcon fontSize="inherit" /></IconButton>} sx={{ height: "auto", mb: 2, fontSize: 16, fontWeight: 500, pt: 1, color: palette.text.secondary }}>{errorMsg}</Alert>)}</>
        <EditModeMenu handleNewEditMode={handleNewEditMode} selectedEditMode={selectedEditMode} />
        <Box sx={{ pb: 4 }}>
          <EditImageDropzone setImageToEdit={setImageToEdit} imageToEdit={imageToEdit} setValue={setValue} setMaskSize={setMaskSize} maskSize={maskSize} setMaskImage={setMaskImage} maskImage={maskImage} maskPreview={maskPreview} isOutpaintingMode={selectedEditMode?.value === "EDIT_MODE_OUTPAINT"} outpaintedImage={outpaintedImage} setErrorMsg={onNewErrorMsg} />
        </Box>
        {selectedEditMode?.promptIndication && (<FormInputText name="prompt" control={control} label={selectedEditMode?.promptIndication ?? ""} required={selectedEditMode?.mandatoryPrompt} rows={3} />)}
        <Stack justifyContent={selectedEditMode?.promptIndication ? "flex-end" : "flex-start"} direction="row" gap={0} pb={3}>
          <CustomTooltip title="重置所有字段" size="small"><IconButton disabled={isLoading} onClick={() => onReset()} aria-label="重置表单" disableRipple sx={{ px: 0.5 }}><Avatar sx={CustomizedAvatarButton}><Autorenew sx={CustomizedIconButton} /></Avatar></IconButton></CustomTooltip>
          {!isUpscaleMode && (<FormInputEditSettings control={control} setValue={setValue} editSettingsFields={editSettingsFields} />)}
          {selectedEditMode?.mandatoryMask && selectedEditMode?.maskType && (<Button variant="contained" onClick={handleMaskDialogOpen} disabled={imageToEdit === null || isLoading} endIcon={isLoading ? <WatchLaterIcon /> : <Icon>{selectedEditMode?.maskButtonIcon}</Icon>} sx={CustomizedSendButton}>{selectedEditMode?.maskButtonLabel}</Button>)}
          <Button type={isUpscaleMode ? "button" : "submit"} onClick={isUpscaleMode ? () => setOpenUpscaleDialog(true) : undefined} variant="contained" disabled={(maskImage === null && selectedEditMode?.mandatoryMask) || imageToEdit === null || isLoading} endIcon={isLoading ? <WatchLaterIcon /> : <SendIcon />} sx={CustomizedSendButton}>
            {isUpscaleMode ? "放大" : "编辑"}
          </Button>
        </Stack>
      </form>
      {selectedEditMode?.maskType && (<SetMaskDialog handleMaskDialogClose={handleMaskDialogClose} availableMaskTypes={maskTypes.filter((maskType) => selectedEditMode?.maskType.includes(maskType.value))} open={openMaskDialog} selectedEditMode={selectedEditMode} maskImage={maskImage} setMaskImage={setMaskImage} maskPreview={maskPreview} setMaskPreview={setMaskPreview} setValue={setValue} imageToEdit={imageToEdit ?? ""} imageSize={{ width: originalWidth ?? imageWidth, height: originalHeight ?? imageHeight, ratio: imageRatio }} maskSize={maskSize} setMaskSize={setMaskSize} setOutpaintedImage={setOutpaintedImage} outpaintedImage={outpaintedImage ?? ""} />)}
      <UpscaleDialog open={openUpscaleDialog} closeUpscaleDialog={() => setOpenUpscaleDialog(false)} onUpscaleSubmit={handleSubmit(onUpscaleSubmit)} upscaleFactor={upscaleFactor} setUpscaleFactor={setUpscaleFactor} imageSize={{ width: originalWidth ?? imageWidth, height: originalHeight ?? imageHeight, ratio: imageRatio }} />
    </>
  );
}
