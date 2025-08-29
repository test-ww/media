import * as React from 'react'
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'; // <-- 【核心修改】导入 getAuth

import {
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  RadioGroup,
  Slide,
  StepIconProps,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { ImageI } from '../../api/generate-image-utils'
import { TransitionProps } from '@mui/material/transitions'
import { CustomizedSendButton } from '../ux-components/Button-SX'
import {
  ArrowForwardIos,
  ArrowRight,
  Close,
  DownloadForOfflineRounded,
  RadioButtonUncheckedRounded,
  Send,
  WatchLater,
} from '@mui/icons-material'
import { CustomRadio } from '../ux-components/InputRadioButton'

import { ExportMediaFormFieldsI, ExportMediaFormI } from '../../api/export-utils'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import FormInputChipGroupMultiple from '../ux-components/InputChipGroupMultiple'
import { CloseWithoutSubmitWarning, ExportAlerts } from '../transverse-components/ExportAlerts'

import theme from '../../theme'
import {
  copyImageToTeamBucket,
  downloadMediaFromGcs,
  getVideoThumbnailBase64,
  uploadBase64Image,
} from '../../api/cloud-storage/action'
import { upscaleImage } from '../../api/imagen/action'
import { saveMediaToLibrary } from '../../api/export/action'
import { useAppContext, appContextDataDefault } from '../../context/app-context'
import { VideoI } from '@/app/api/generate-video-utils'

const { palette } = theme

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

export const downloadBase64Media = (base64Data: any, filename: string, format: string) => {
  const link = document.createElement('a')
  link.href = `data:${format};base64,${base64Data}`
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 【注意】: 您之前提供的代码中，组件名为 ExportStepper，我将沿用此名。
// 如果您的文件名是 ExportDialog.tsx，请将下面的函数名也改为 ExportDialog
export default function ExportStepper({
  open,
  upscaleAvailable,
  mediaToExport,
  handleMediaExportClose,
}: {
  open: boolean
  upscaleAvailable: boolean
  mediaToExport: ImageI | VideoI | undefined
  handleMediaExportClose: () => void
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [isCloseWithoutSubmit, setIsCloseWithoutSubmit] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isDownload, setIsDownload] = useState(false)
  const {
    handleSubmit,
    resetField,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ExportMediaFormI>({
    defaultValues: { upscaleFactor: 'no' },
  })

  useEffect(() => {
    if (mediaToExport) setValue('mediaToExport', mediaToExport)
  }, [mediaToExport, setValue])

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
    setIsCloseWithoutSubmit(false)
  }
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
    setIsCloseWithoutSubmit(false)
  }

  const handleCheckDownload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsDownload(event.target.checked)
  }

  const { appContext } = useAppContext()
  const exportMediaFormFields = appContext ? appContext.exportMetaOptions : appContextDataDefault.exportMetaOptions

  let metadataReviewFields: any
  var infoToReview: { label: string; value: string }[] = []
  let temp: { [key: string]: ExportMediaFormFieldsI[keyof ExportMediaFormFieldsI] }[] = []
  if (exportMediaFormFields) {
    const exportMediaFieldList: (keyof ExportMediaFormFieldsI)[] = Object.keys(exportMediaFormFields).map(
      (key) => key as keyof ExportMediaFormFieldsI
    )

    metadataReviewFields = exportMediaFieldList.filter(
      (field) =>
        exportMediaFormFields[field].type === 'text-info' &&
        exportMediaFormFields[field].isExportVisible &&
        !exportMediaFormFields[field].isUpdatable
    )
    mediaToExport &&
      metadataReviewFields.forEach((field: any) => {
        const prop = exportMediaFormFields[field].prop
        const value = mediaToExport[prop as keyof (ImageI | VideoI)]
        if (prop && value)
          infoToReview.push({
            label: exportMediaFormFields[field].label,
            value: value.toString(),
          })
      })

    Object.entries(exportMediaFormFields).forEach(([name, field]) => {
      if (field.isUpdatable && field.isExportVisible) temp.push({ [name]: field })
    })
  }
  const MetadataImproveFields = temp

  const onClose = React.useCallback(() => {
    setIsCloseWithoutSubmit(false);
    setActiveStep(0);
    handleMediaExportClose();
    setErrorMsg('');
    setIsExporting(false);
    setExportStatus('');
    setIsDownload(false);
    resetField('mediaToExport');
  }, [handleMediaExportClose, resetField]);

  const handleImageExportSubmit: SubmitHandler<ExportMediaFormI> = React.useCallback(
    async (formData: ExportMediaFormI) => {
      // ======================= 【核心修改】: 获取用户和 Token =======================
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
          setErrorMsg("用户未登录，无法执行操作。请刷新页面或重新登录。");
          setIsExporting(false);
          return;
      }
      // ========================================================================

      setIsExporting(true);
      setExportStatus('正在开始...');

      const media = formData.mediaToExport ? { ...formData.mediaToExport } : undefined;

      if (!media) {
          setErrorMsg("要导出的媒体不存在。");
          setIsExporting(false);
          return;
      }

      try {
        // ======================= 【核心修改】: 获取并准备 Token =======================
        const idToken = await user.getIdToken(true);
        // ========================================================================

        // 1. Upscale if needed
        if (formData.upscaleFactor === 'x2' || formData.upscaleFactor === 'x4') {
          setExportStatus('正在放大...');
          // 【核心修改】: 为 upscaleImage 传递 idToken
          const res = await upscaleImage({ uri: media.gcsUri }, formData.upscaleFactor, appContext, idToken);
          if (typeof res === 'object' && res.error) throw new Error(res.error.replaceAll('Error: ', ''));
          if (res.newGcsUri && typeof res.newGcsUri === 'string') {
            media.gcsUri = res.newGcsUri;
            media.width = media.width * parseInt(formData.upscaleFactor.replace(/[^0-9]/g, ''));
            media.height = media.height * parseInt(formData.upscaleFactor.replace(/[^0-9]/g, ''));
          } else {
            throw new Error("Upscaling completed, but did not return a new image URI.");
          }
        }

        // 2. Copy media to team library
        setExportStatus('正在导出...');
        const currentGcsUri = media.gcsUri;
        const id = media.key;
        // 【核心修改】: 为 Cloud Storage 操作传递 idToken
        const newGcsUri = await copyImageToTeamBucket(currentGcsUri, id, idToken);
        media.gcsUri = newGcsUri;

        // 2.5. If media is a video, upload its thumbnail
        if ('duration' in media && media.format === 'MP4') {
          setExportStatus('正在生成缩略图...');
          // 【核心修改】: 为 Cloud Storage 操作传递 idToken
          const result = await getVideoThumbnailBase64(media.gcsUri, media.ratio, idToken);
          if (!result.thumbnailBase64Data) console.error('Failed to generate thumbnail:', result.error);
          const thumbnailBase64Data = result.thumbnailBase64Data;
          if (thumbnailBase64Data && process.env.NEXT_PUBLIC_TEAM_BUCKET) {
            // 【核心修改】: 为 Cloud Storage 操作传递 idToken
            const uploadResult = await uploadBase64Image(thumbnailBase64Data, process.env.NEXT_PUBLIC_TEAM_BUCKET, `${id}_thumbnail.png`, 'image/png', idToken);
            if (uploadResult.success && uploadResult.fileUrl) {
              formData.videoThumbnailGcsUri = uploadResult.fileUrl;
            } else {
              formData.videoThumbnailGcsUri = '';
              console.warn('Video thumbnail upload failed:', uploadResult.error);
            }
          } else {
            console.warn(`Video ${id} is a video format but has no thumbnailBase64Data. Skipping thumbnail upload.`);
          }
        }

        // 3. Upload metadata to firestore
        setExportStatus('正在保存数据...');
        if (exportMediaFormFields) {
          formData.mediaToExport = media;
          // 【核心修改】: 将 idToken 传递给 saveMediaToLibrary
          const res = await saveMediaToLibrary(id, formData, exportMediaFormFields, idToken);
          if (typeof res === 'object' && res.error) {
            throw new Error(res.error.replaceAll('Error: ', ''));
          }
        } else {
          throw new Error("找不到 exportMediaFormFields");
        }

        // 4. DL locally if asked to
        if (isDownload) {
          setExportStatus('正在准备下载...');
          // 【核心修改】: 为 Cloud Storage 操作传递 idToken
          const downloadResponse = await downloadMediaFromGcs(media.gcsUri, idToken);
          if (typeof downloadResponse === 'object' && downloadResponse.error) throw new Error(downloadResponse.error.replaceAll('Error: ', ''));
          if (!downloadResponse.data) throw new Error("Downloaded media data is empty.");
          const name = `${media.key}.${media.format.toLowerCase()}`;
          downloadBase64Media(downloadResponse.data, name, media.format);
        }

        setExportStatus('');
        setIsExporting(false);
        onClose();
      } catch (error: any) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : '导出过程中发生未知错误。';
        setErrorMsg(errorMessage);
        setIsExporting(false);
        setExportStatus('');
      }
    },
    [isDownload, appContext, exportMediaFormFields, onClose]
  );

  const onCloseTry: DialogProps['onClose'] = React.useCallback((
    event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
    reason: string
  ) => {
    if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      event?.stopPropagation();
      setIsCloseWithoutSubmit(true);
    } else {
      onClose();
    }
  }, [onClose]);

  function CustomStepIcon(props: StepIconProps) {
    const { active, completed, icon } = props

    return (
      <Typography
        variant="h3"
        component="span"
        sx={{
          color: active ? palette.primary.main : completed ? palette.text.secondary : palette.text.secondary,
          fontWeight: active ? 500 : 'normal',
          fontSize: active ? '1.5rem' : '1.2rem',
        }}
      >
        {icon}
      </Typography>
    )
  }

  function CustomStepLabel({ text, step }: { text: string; step: number }) {
    return (
      <Typography
        color={activeStep === step ? palette.primary.main : palette.secondary.main}
        sx={{ fontWeight: activeStep === step ? 500 : 400, fontSize: activeStep === step ? '1.3rem' : '1.1rem' }}
      >
        {text}
      </Typography>
    )
  }

  const ReviewStep = () => {
    return (
      <Box sx={{ pt: 1, pb: 2, width: '90%' }}>
        {infoToReview.map(({ label, value }) => (
          <Box key={label} display="flex" flexDirection="row">
            <ArrowRight sx={{ color: palette.primary.main, fontSize: '1.2rem', p: 0, mt: 0.2 }} />
            <Box sx={{ pb: 1 }}>
              <Typography display="inline" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{`${label}: `}</Typography>
              <Typography
                display="inline"
                sx={{ fontSize: '0.9rem', color: palette.text.secondary }}
              >{`${value}`}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  const TagStep = () => {
    return (
      <>
        <Typography variant="subtitle1" color={palette.secondary.main} sx={{ pl: 1, width: '85%' }}>
          {'设置元数据以确保在共享库中的可发现性。'}
        </Typography>

        <Box sx={{ py: 2, width: '90%', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          {MetadataImproveFields.map((fieldObject) => {
            const param = Object.keys(fieldObject)[0]
            const field = fieldObject[param]

            return (
              <Box key={param} py={1} pl={3} width="100%">
                <FormInputChipGroupMultiple
                  name={param}
                  label={field.label}
                  key={param}
                  control={control}
                  setValue={setValue}
                  width="400"
                  options={field.options}
                  required={field.isMandatory ? field.isMandatory : false}
                />
              </Box>
            )
          })}
        </Box>
      </>
    )
  }

  const isTooLarge = (width: number, height: number) => width > 5000 || height > 5000
  const UpscaleStep = () => {
    return (
      <>
        <Typography variant="subtitle1" color={palette.secondary.main} sx={{ pl: 1, width: '70%' }}>
          {'提升分辨率以获得更清晰锐利的外观。'}
        </Typography>
        <Controller
          name="upscaleFactor"
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} sx={{ p: 2, pl: 3 }}>
              <CustomRadio
                label="不放大"
                subLabel={mediaToExport ? `${mediaToExport.width} x ${mediaToExport.height} px` : ''}
                value="no"
                currentSelectedValue={field.value}
                enabled={true}
              />
              <CustomRadio
                label="放大 x2"
                subLabel={
                  mediaToExport && isTooLarge(mediaToExport.width * 2, mediaToExport.height * 2)
                    ? '不可用，图片尺寸过大'
                    : `${mediaToExport && mediaToExport.width * 2} x ${mediaToExport && mediaToExport.height * 2} px`
                }
                value="x2"
                currentSelectedValue={field.value}
                enabled={mediaToExport ? !isTooLarge(mediaToExport.width * 2, mediaToExport.height * 2) : true}
              />
              <CustomRadio
                label="放大 x4"
                subLabel={
                  mediaToExport && isTooLarge(mediaToExport.width * 4, mediaToExport.height * 4)
                    ? '不可用，图片尺寸过大'
                    : `${mediaToExport && mediaToExport.width * 4} x ${mediaToExport && mediaToExport.height * 4} px`
                }
                value="x4"
                currentSelectedValue={field.value}
                enabled={mediaToExport ? !isTooLarge(mediaToExport.width * 4, mediaToExport.height * 4) : true}
              />
            </RadioGroup>
          )}
        />
      </>
    )
  }

  function NextBackBox({ backAvailable }: { backAvailable: boolean }) {
    return (
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          onClick={handleNext}
          endIcon={<ArrowForwardIos />}
          sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
        >
          {'下一步'}
        </Button>
        {backAvailable && (
          <Button onClick={handleBack} sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}>
            {'返回'}
          </Button>
        )}
      </Box>
    )
  }

  const SubmitBox = () => {
    return (
      <>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={isDownload}
              onChange={handleCheckDownload}
              disabled={isExporting}
              icon={<RadioButtonUncheckedRounded sx={{ fontSize: '1.2rem' }} />}
              checkedIcon={<DownloadForOfflineRounded sx={{ fontSize: '1.2rem' }} />}
              sx={{
                '&:hover': { backgroundColor: 'transparent' },
                '&.MuiCheckbox-root:hover': { color: palette.primary.main },
              }}
            />
          }
          label="导出时同时在本地下载此媒体"
          disableTypography
          sx={{
            px: 1.5,
            pt: 3,
            '&.MuiFormControlLabel-root': {
              fontSize: '1.1rem',
              alignContent: 'center',
              color: isExporting ? palette.secondary.main : isDownload ? palette.primary.main : palette.text.secondary,
              fontStyle: isExporting ? 'italic' : 'normal',
            },
          }}
        />

        <Box sx={{ m: 0, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isExporting}
            endIcon={isExporting ? <WatchLater /> : <Send />}
            sx={CustomizedSendButton}
          >
            {exportStatus ? exportStatus : '导出'}
          </Button>

          <Button
            disabled={isExporting}
            onClick={handleBack}
            sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
          >
            {'返回'}
          </Button>
        </Box>
      </>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onCloseTry}
      aria-describedby="parameter the export of the media"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'left',
          p: 1,
          cursor: 'pointer',
          height: '90%',
          maxWidth: '70%',
          width: '40%',
          borderRadius: 1,
          background: palette.background.paper,
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={() => setIsCloseWithoutSubmit(true)}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: palette.secondary.dark,
        }}
      >
        <Close sx={{ fontSize: '1.5rem', '&:hover': { color: palette.primary.main } }} />
      </IconButton>
      <DialogContent sx={{ m: 1 }}>
        <DialogTitle sx={{ p: 0, pb: 3 }}>
          <Typography
            sx={{
              fontSize: '1.7rem',
              color: palette.text.primary,
              fontWeight: 400,
              display: 'flex',
              alignContent: 'center',
            }}
          >
            {'导出到内部媒体库'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit(handleImageExportSubmit)}>
          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            sx={{
              backgroundColor: 'transparent',
              '& .MuiStepConnector-line': { minHeight: 0 },
            }}
          >
            <Step key="review">
              <StepLabel StepIconComponent={CustomStepIcon}>
                <CustomStepLabel text="审查元数据" step={0} />
              </StepLabel>
              <StepContent sx={{ px: 0, '&.MuiStepContent-root': { borderColor: 'transparent' } }}>
                <ReviewStep />
                <NextBackBox backAvailable={false} />
              </StepContent>
            </Step>

            <Step key="tag">
              <StepLabel StepIconComponent={CustomStepIcon}>
                <CustomStepLabel text="提升可发现性" step={1} />
              </StepLabel>
              <StepContent sx={{ px: 0, '&.MuiStepContent-root': { borderColor: 'transparent' } }}>
                <TagStep />
                {upscaleAvailable && <NextBackBox backAvailable={true} />}
                {!upscaleAvailable && <SubmitBox />}
              </StepContent>
            </Step>

            {upscaleAvailable && (
              <Step key="upscale">
                <StepLabel StepIconComponent={CustomStepIcon}>
                  <CustomStepLabel text="提升分辨率" step={2} />
                </StepLabel>
                <StepContent sx={{ px: 0, '&.MuiStepContent-root': { borderColor: 'transparent' } }}>
                  <UpscaleStep />
                  <SubmitBox />
                </StepContent>
              </Step>
            )}
          </Stepper>
        </form>
      </DialogContent>

      {isCloseWithoutSubmit && (
        <CloseWithoutSubmitWarning onClose={onClose} onKeepOpen={() => setIsCloseWithoutSubmit(false)} />
      )}

      {errorMsg !== '' && (
        <ExportAlerts
          message={errorMsg}
          style="error"
          onClose={() => {
            setIsExporting(false)
            setErrorMsg('')
            setExportStatus('')
          }}
        />
      )}
    </Dialog>
  )
}
