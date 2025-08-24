"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { Box, Stack, Button, Alert, IconButton, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import { Send as SendIcon, WatchLater as WatchLaterIcon, Autorenew, ArrowDownward as ArrowDownwardIcon, Close as CloseIcon } from "@mui/icons-material";
import { useAppContext } from "../../context/app-context";
import { ImageI } from "../../api/generate-image-utils";
import { VirtualTryOnFormI, virtualTryOnFields } from "../../api/virtual-try-on-utils";
import { useAuthFetch } from "../../lib/useAuthFetch";
import ImageDropzone from "./ImageDropzone";
import FormInputChipGroup from "../ux-components/InputChipGroup";
import FormInputDropdown from "../ux-components/InputDropdown";
import { FormInputNumberSmall } from "../ux-components/FormInputNumberSmall";
import { CustomizedSendButton } from "../ux-components/Button-SX";
import theme from "../../theme";
import { getFirebaseInstances } from "../../lib/firebase/client";

const { palette } = theme;

interface VirtualTryOnFormProps {
  isLoading: boolean;
  errorMsg: string;
  generationFields: typeof virtualTryOnFields;
  onRequestSent: (loading: boolean) => void;
  onNewErrorMsg: (newError: string) => void;
  onImageGeneration: (newImage: ImageI) => void;
}

export default function VirtualTryOnForm({
  isLoading, errorMsg, generationFields, onRequestSent, onNewErrorMsg, onImageGeneration
}: VirtualTryOnFormProps) {
  const { appContext } = useAppContext();
  const { handleSubmit, control, setValue, reset } = useForm<VirtualTryOnFormI>({
    defaultValues: generationFields.defaultValues,
  });
  const authFetch = useAuthFetch();

  const onReset = () => {
    reset(generationFields.defaultValues);
    onNewErrorMsg("");
  };

  const onSubmit: SubmitHandler<VirtualTryOnFormI> = async (formData) => {
    if (!appContext) {
      onNewErrorMsg("应用程序上下文不可用。请尝试刷新页面。");
      return;
    }
    if (!formData.humanImage.base64Image) {
      onNewErrorMsg("请上传模特图片。");
      return;
    }
    if (!formData.garmentImages[0].base64Image) {
      onNewErrorMsg("请上传服装图片。");
      return;
    }

    onRequestSent(true);
    try {
      const { auth } = getFirebaseInstances();
      const user = auth.currentUser;
      if (!user) throw new Error("用户未登录。");

      const result = await authFetch("/api/wrapped-actions/virtual-try-on", {
        method: "POST",
        body: JSON.stringify({ formData, appContext }),
      });

      if (result && typeof result === 'object' && "error" in result) {
        throw new Error((result as { error: string }).error);
      }
      onImageGeneration(result as ImageI);
    } catch (error: any) {
      onNewErrorMsg(error.message || "发生未知错误。");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} justifyContent="flex-start" alignItems="center">
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 600 }}>使用</Typography>
          <FormInputDropdown name="modelVersion" control={control} label="" field={generationFields.fields.modelVersion} styleSize="big" width="" required={true} />
        </Stack>

        {errorMsg && (<Alert severity="error" action={<IconButton size="small" onClick={() => onNewErrorMsg("")}><CloseIcon fontSize="inherit" /></IconButton>}>{errorMsg}</Alert>)}

        <Stack direction="row" spacing={2}>
          <Box sx={{ flex: 1 }}>
            {/* @ts-ignore */}
            <ImageDropzone name="humanImage" label="模特图片" control={control} setValue={setValue} onNewErrorMsg={onNewErrorMsg} />
          </Box>
          <Box sx={{ flex: 1 }}>
            {/* @ts-ignore */}
            <ImageDropzone name={`garmentImages.0`} label="服装图片" control={control} setValue={setValue} onNewErrorMsg={onNewErrorMsg} />
          </Box>
        </Stack>

        <Accordion sx={{ backgroundColor: "transparent", boxShadow: "none", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ArrowDownwardIcon sx={{ color: palette.primary.main }} />} sx={{ bgcolor: "background.paper", borderRadius: 2, minHeight: "48px", "& .MuiAccordionSummary-content": { margin: "12px 0" } }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>高级设置</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: "transparent", p: 2 }}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormInputChipGroup name="sampleCount" control={control} setValue={setValue} label={generationFields.fields.sampleCount.label} field={generationFields.fields.sampleCount} width="100%" required={false} />
              <FormInputDropdown name="personGeneration" control={control} label={generationFields.fields.personGeneration.label ?? ""} field={generationFields.fields.personGeneration} styleSize="small" width="100%" required={false} />
              <FormInputDropdown name="safetySetting" control={control} label={generationFields.fields.safetySetting.label ?? ""} field={generationFields.fields.safetySetting} styleSize="small" width="100%" required={false} />
              <FormInputDropdown name="outputFormat" control={control} label={generationFields.fields.outputFormat.label ?? ""} field={generationFields.fields.outputFormat} styleSize="small" width="100%" required={false} />
              <Box>
                <Typography variant="caption" sx={{ color: palette.text.primary, fontSize: "0.75rem", fontWeight: 500, lineHeight: "1.3em", pb: 0.5 }}>{generationFields.fields.seedNumber.label}</Typography>
                <FormInputNumberSmall name="seedNumber" control={control} min={0} max={4294967295} />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="text" onClick={onReset} disabled={isLoading} startIcon={<Autorenew />}>重置</Button>
          <Button type="submit" variant="contained" disabled={isLoading} endIcon={isLoading ? <WatchLaterIcon /> : <SendIcon />} sx={CustomizedSendButton}>生成</Button>
        </Stack>
      </Stack>
    </form>
  );
}
