'use client'

import * as React from 'react'
import { useState } from 'react'

import { Dialog, DialogContent, DialogTitle, IconButton, Slide, Box, Button, Typography, Stack } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { ArrowRight, AutoAwesome, Close, Download, Edit, VideocamRounded } from '@mui/icons-material'
import { useAppContext, appContextDataDefault } from '../../context/app-context'

import theme from '../../theme'
import { MediaMetadataI } from '../../api/export-utils'
import { CustomizedSendButton } from '../ux-components/Button-SX'
import { downloadMediaFromGcs } from '../../api/cloud-storage/action'
import { useRouter } from 'next/navigation'
import { downloadBase64Media } from '../transverse-components/ExportDialog'
const { palette } = theme

const Transition = React.forwardRef(function Transition(
 props: TransitionProps & {
  children: React.ReactElement<any, any>
 },
 ref: React.Ref<unknown>
) {
 return <Slide direction="up" ref={ref} {...props} />
})

export default function ExploreDialog({
 open,
 documentToExplore,
 handleMediaExploreClose,
}: {
 open: boolean
 documentToExplore: MediaMetadataI | undefined
 handleMediaExploreClose: () => void
}) {
 const [downloadStatus, setDownloadStatus] = useState('下载') // [汉化]

 const { setAppContext } = useAppContext()
 const router = useRouter()

 const handleEditClick = (uri: string) => {
  setAppContext((prevContext) => {
   if (prevContext) return { ...prevContext, imageToEdit: uri }
   else return { ...appContextDataDefault, imageToEdit: uri }
  })
  router.push('/edit')
 }
 const handleITVClick = (imageGcsURI: string) => {
  setAppContext((prevContext) => {
   if (prevContext) return { ...prevContext, imageToVideo: imageGcsURI }
   else return { ...appContextDataDefault, imageToVideo: imageGcsURI }
  })
  router.push('/generate')
 }

 const handleRegenerateClick = (prompt: string, format: string) => {
  if (format === 'MP4') {
   setAppContext((prevContext) => {
    if (prevContext) return { ...prevContext, promptToGenerateVideo: prompt, promptToGenerateImage: '' }
    else return { ...appContextDataDefault, promptToGenerateVideo: prompt, promptToGenerateImage: '' }
   })
  } else {
   setAppContext((prevContext) => {
    if (prevContext) return { ...prevContext, promptToGenerateImage: prompt, promptToGenerateVideo: '' }
    else return { ...appContextDataDefault, promptToGenerateImage: prompt, promptToGenerateVideo: '' }
   })
  }

  router.push('/generate')
 }

 const handleDownload = async (documentToExplore: MediaMetadataI) => {
  try {
   setDownloadStatus('正在准备下载...') // [汉化]
   const res = await downloadMediaFromGcs(documentToExplore.gcsURI)
   const mediaName = `${documentToExplore.id}.${documentToExplore.format.toLowerCase()}`
   downloadBase64Media(res.data, mediaName, documentToExplore.format)

   if (typeof res === 'object' && res['error']) {
    throw Error(res['error'].replaceAll('Error: ', ''))
   }
  } catch (error: any) {
   console.error(error)
  } finally {
   setDownloadStatus('下载') // [汉化]
  }
 }

 const { appContext } = useAppContext()
 const exportMetaOptions = appContext ? appContext.exportMetaOptions : appContextDataDefault.exportMetaOptions

 if (exportMetaOptions)
  return (
   <Dialog
    open={open}
    onClose={handleMediaExploreClose}
    aria-describedby="explore media metadata"
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
        // [颜色修复] 使用主题中的 paper 背景色
      background: palette.background.paper,
     },
    }}
   >
    <IconButton
     aria-label="close"
     onClick={handleMediaExploreClose}
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
            {/* [汉化] */}
       {'探索媒体元数据'}
      </Typography>
     </DialogTitle>
     <Box sx={{ pt: 1, pb: 2, width: '90%' }}>
      {documentToExplore &&
       Object.entries(exportMetaOptions).map(([key, fieldConfig]) => {
        const value = documentToExplore[key]
        let displayValue = value ? `${value}` : null

        if (displayValue && typeof value === 'object') {
         displayValue = Object.keys(value)
          .filter((val) => value[val])
          .map((val) => {
           const matchingOption = fieldConfig.options?.find(
            (option: { value: string }) => option.value === val
           )
           return matchingOption ? matchingOption.label : val
          })
          .join(', ')
        }

        const displayLabel = fieldConfig.name || fieldConfig.label

        if (displayValue && displayValue !== '' && fieldConfig.isExploreVisible) {
         return (
          <Box key={key} display="flex" flexDirection="row">
           <ArrowRight sx={{ color: palette.primary.main, fontSize: '1.2rem', p: 0, mt: 0.2 }} />
           <Box sx={{ pb: 1 }}>
            <Typography display="inline" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
             {`${displayLabel}: `}
            </Typography>
            <Typography display="inline" sx={{ fontSize: '0.9rem', color: palette.text.secondary }}>
             {displayValue}
            </Typography>
           </Box>
          </Box>
         )
        } else {
         return null
        }
       })}
     </Box>
     <Stack direction="row" gap={0} pb={3}>
      {documentToExplore && (
       <>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
         <Button
          variant="contained"
          onClick={() => handleDownload(documentToExplore)}
          endIcon={<Download sx={{ mr: 0.2 }} />}
          disabled={downloadStatus === '正在准备下载...'} // [汉化]
          sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
         >
          {downloadStatus}
         </Button>
        </Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
         <Button
          variant="contained"
          onClick={() =>
           handleRegenerateClick(documentToExplore ? documentToExplore.prompt : '', documentToExplore.format)
          }
          endIcon={<AutoAwesome sx={{ mr: 0.4 }} />}
          sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
         >
              {/* [汉化] */}
          {'复用提示词'}
         </Button>
        </Box>
        {process.env.NEXT_PUBLIC_EDIT_ENABLED === 'true' && documentToExplore.format !== 'MP4' && (
         <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
           variant="contained"
           onClick={() => handleEditClick(documentToExplore ? documentToExplore.gcsURI : '')}
           endIcon={<Edit />}
           sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
          >
                {/* [汉化] */}
           {'编辑'}
          </Button>
         </Box>
        )}
        {process.env.NEXT_PUBLIC_VEO_ENABLED === 'true' &&
         process.env.NEXT_PUBLIC_VEO_ITV_ENABLED === 'true' &&
         documentToExplore.format !== 'MP4' && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
           <Button
            variant="contained"
            onClick={() => handleITVClick(documentToExplore ? documentToExplore.gcsURI : '')}
            endIcon={<VideocamRounded />}
            sx={{ ...CustomizedSendButton, ...{ fontSize: '0.8rem' } }}
           >
                  {/* [汉化] */}
            {'图生视频'}
           </Button>
          </Box>
         )}
       </>
      )}
     </Stack>
    </DialogContent>
   </Dialog>
  )
}
