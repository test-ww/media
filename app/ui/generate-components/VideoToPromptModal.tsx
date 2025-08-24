// 文件路径: app/ui/generate-components/VideoToPromptModal.tsx (最终完整版)

'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Box, Button, Dialog, DialogContent, DialogTitle, IconButton,
  Slide, Stack, TextField, Typography, LinearProgress, Alert
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Check, Close, Replay, Send, Movie as MovieIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { getPromptFromVideoFromGemini } from '@/app/api/gemini/action';
import { CustomizedSendButton } from '../ux-components/Button-SX';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function VideoDropzone({ onVideoSelect, onUploadError }: { onVideoSelect: (file: File) => void, onUploadError: (msg: string) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onVideoSelect(acceptedFiles[0]);
    },
    accept: { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'] },
    maxSize: 100 * 1024 * 1024, // 100 MB limit
    onDropRejected: (fileRejections) => {
      onUploadError(`文件被拒绝: ${fileRejections[0].errors[0].message}`);
    },
    multiple: false,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        width: 280, height: 280, border: `2px dashed`, borderColor: 'divider', borderRadius: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', cursor: 'pointer', bgcolor: isDragActive ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s ease-in-out', p: 2
      }}
    >
      <input {...getInputProps()} />
      <MovieIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
      <Typography sx={{ mt: 2, color: 'text.secondary' }}>
        {isDragActive ? '在此处放下视频...' : '将视频拖放到此处，或点击选择 (.mp4, .mov, 最大 100MB)'}
      </Typography>
    </Box>
  );
}

export default function VideoToPromptModal({ open, setNewPrompt, setVideoToPromptOpen }: { open: boolean; setNewPrompt: (newPrompt: string) => void; setVideoToPromptOpen: (state: boolean) => void; }) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
    setErrorMsg('');
  };

  const handleGeneratePrompt = async () => {
    if (!videoFile) {
      setErrorMsg('请先选择一个视频文件。');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setPrompt('');
    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || '视频上传失败。');
      }
      const { gcsUri } = await uploadResponse.json();
      if (!gcsUri) throw new Error('服务器未返回 GCS URI。');
      const geminiReturnedPrompt = await getPromptFromVideoFromGemini(gcsUri);
      if (typeof geminiReturnedPrompt === 'object' && 'error' in geminiReturnedPrompt) {
        setErrorMsg(geminiReturnedPrompt.error);
      } else {
        setPrompt(geminiReturnedPrompt as string);
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || '发生未知错误。');
    } finally {
      setIsLoading(false);
    }
  };

  const onValidate = () => {
    if (prompt) setNewPrompt(prompt);
    onClose();
  };

  const onReset = () => {
    setErrorMsg('');
    setIsLoading(false);
    setVideoFile(null);
    setPrompt('');
  };

  const onClose = () => {
    setVideoToPromptOpen(false);
    onReset();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          p: 1, maxWidth: '70%', width: '60%', borderRadius: 1,
          bgcolor: 'background.paper', display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start', height: 'auto', minHeight: '63%',
        }
      }}
    >
      <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}>
        <Close sx={{ fontSize: '1.5rem', '&:hover': { color: 'primary.main' } }} />
      </IconButton>
      <DialogContent sx={{ m: 1 }}>
        <DialogTitle sx={{ p: 0, pb: 3 }}>
          <Typography sx={{ fontSize: '1.7rem', color: 'text.primary', fontWeight: 400 }}>
            视频转提示词生成器
          </Typography>
        </DialogTitle>
        <Stack direction="row" spacing={2.5} sx={{ pt: 2, px: 1 }}>
          <VideoDropzone onVideoSelect={handleVideoSelect} onUploadError={setErrorMsg} />
          <Stack direction="column" spacing={2} justifyContent="space-between" sx={{ width: '100%' }}>
            {videoFile && <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>已选择: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</Typography>}
            {isLoading && <LinearProgress sx={{ width: '98%' }} />}
            <TextField
              label="生成的 Veo 提示词"
              disabled
              value={isLoading ? '正在上传和分析视频...' : prompt}
              multiline
              rows={8}
              sx={{ width: '98%' }}
            />
            {errorMsg && <Alert severity="error" sx={{ width: '98%' }}>{errorMsg}</Alert>}
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: '100%' }}>
              <Button onClick={handleGeneratePrompt} variant="contained" disabled={!videoFile || isLoading} endIcon={<Send />} sx={CustomizedSendButton}>生成</Button>
              <Button onClick={onReset} variant="outlined" disabled={isLoading} endIcon={<Replay />}>重置</Button>
              <Button onClick={onValidate} variant="contained" disabled={!prompt || isLoading} endIcon={<Check />} sx={CustomizedSendButton}>使用提示词</Button>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
