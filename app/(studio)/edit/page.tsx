'use client'
export const dynamic = 'force-dynamic';
import * as React from 'react'
import Box from '@mui/material/Box'
import { useCallback, useState } from 'react'
import { ImageI } from '../../api/generate-image-utils'
import OutputImagesDisplay from '../../ui/transverse-components/ImagenOutputImagesDisplay'
import { useAppContext } from '../../context/app-context'
import { Paper, Typography } from '@mui/material'
import theme from '../../theme'
import EditForm from '@/app/ui/edit-components/EditForm'
import { redirect } from 'next/navigation'
import { Grid } from '@mui/material'
const { palette } = theme

export default function Page() {
 const [editedImagesInGCS, setEditedImagesInGCS] = useState<ImageI[]>([])
 const [isEditLoading, setIsEditLoading] = useState(false)
 const [editErrorMsg, setEditErrorMsg] = useState('')
 const { appContext, error } = useAppContext()
 const [editedCount, setEditedCount] = useState<number>(0)
 const [isUpscaledDLAvailable, setIsUpscaleDLAvailable] = useState(true)

 const handleImageGeneration = (newImages: ImageI[]) => {
  setEditedImagesInGCS(newImages)
  setIsEditLoading(false)
 }

 const handleRequestSent = (valid: boolean, count: number, isUpscaledDLAvailable: boolean) => {
  setIsUpscaleDLAvailable(isUpscaledDLAvailable)
  editErrorMsg !== '' && valid && setEditErrorMsg('')
  setIsEditLoading(valid)
  setEditedCount(count)
 }
 const handleNewErrorMsg = useCallback((newErrorMsg: string) => {
  setEditErrorMsg(newErrorMsg)
  setIsEditLoading(false)
 }, [])

 if (appContext?.isLoading === true) {
  return (
   <Box p={5}>
    <Typography
     variant="h3"
     sx={{ fontWeight: 400, color: error === null ? palette.primary.main : palette.error.main }}
    >
     {error === null
      ? '正在加载您的个人资料...'
      : '加载个人资料时出错！请重试或联系您的IT管理员。'}
    </Typography>
   </Box>
  )
 } else if (process.env.NEXT_PUBLIC_EDIT_ENABLED === 'false') {
  redirect('/generate')
 } else {
  return (
  <Grid container spacing={{ xs: 2, md: 3 }} sx={{ height: '100%' }}>
    {/* 左侧：表单区域 */}
    <Grid item xs={12} md={5} lg={4} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper sx={{ p: 3, borderRadius: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <EditForm
          isLoading={isEditLoading}
          onRequestSent={handleRequestSent}
          onImageGeneration={handleImageGeneration}
          onNewErrorMsg={handleNewErrorMsg}
          errorMsg={editErrorMsg}
        />
      </Paper>
    </Grid>

    {/* 右侧：结果展示区域 */}
    <Grid item xs={12} md={7} lg={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper sx={{ p: 3, borderRadius: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <OutputImagesDisplay
          isLoading={isEditLoading}
          generatedImagesInGCS={editedImagesInGCS}
          generatedCount={editedCount}
          isPromptReplayAvailable={false}
          isUpscaledDLAvailable={isUpscaledDLAvailable}
        />
      </Paper>
    </Grid>
  </Grid>
)
 }
}
