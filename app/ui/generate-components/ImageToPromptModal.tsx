"use client";

import * as React from 'react';
import { useState } from 'react';
import {
 Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
 IconButton, Slide, Stack, TextField, Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Check, Close, Replay, Send } from '@mui/icons-material';
import ImageDropzone from './ImageDropzone';
import { getPromptFromImageFromGemini } from '@/app/api/gemini/action';
import { CustomizedSendButton } from '../ux-components/Button-SX';
import { getAuth } from 'firebase/auth'; // <-- 【核心修改】导入 getAuth

const Transition = React.forwardRef(function Transition(
 props: TransitionProps & { children: React.ReactElement<any, any>; },
 ref: React.Ref<unknown>
) {
 return <Slide direction="up" ref={ref} {...props} />;
});

export default function ImageToPromptModal({
 open, setNewPrompt, setImageToPromptOpen, target,
}: {
 open: boolean;
 setNewPrompt: (newPormpt: string) => void;
 setImageToPromptOpen: (state: boolean) => void;
 target: 'Image' | 'Video';
}) {
 const [image, setImage] = useState<string | null>(null);
 const [prompt, setPrompt] = useState('');
 const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
 const [errorMsg, setErrorMsg] = useState('');
 const [userQuery, setUserQuery] = useState('');

 const getPromptFromImage = async () => {
  if (!image) {
   setErrorMsg('请先上传一张图片。');
   return;
  }

  // ======================= 【核心修改】: 获取用户和 Token =======================
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    setErrorMsg("用户未登录，无法执行操作。请刷新页面或重新登录。");
    return;
  }
  // ========================================================================

  setIsGeneratingPrompt(true);
  setErrorMsg('');
  setPrompt('');
  try {
    // ======================= 【核心修改】: 获取并传递 Token =======================
    const idToken = await user.getIdToken(true); // 获取用户的认证令牌 (true 表示强制刷新)
    const geminiReturnedPrompt = await getPromptFromImageFromGemini(
        image as string,
        target,
        userQuery,
        idToken // 将令牌作为最后一个参数传递
    );
    // ========================================================================

   if (typeof geminiReturnedPrompt === 'object' && 'error' in geminiReturnedPrompt) {
    setErrorMsg(geminiReturnedPrompt.error);
   } else {
    setPrompt(geminiReturnedPrompt as string);
   }
  } catch (error: any) {
   console.error(error);
   setErrorMsg(error.toString());
  } finally {
   setIsGeneratingPrompt(false);
  }
 };

 const onValidate = () => {
  if (prompt) setNewPrompt(prompt);
  onClose();
 };

 const onReset = () => {
  setErrorMsg('');
  setIsGeneratingPrompt(false);
  setImage(null);
  setPrompt('');
  setUserQuery('');
 };

 const onClose = () => {
  setImageToPromptOpen(false);
  onReset();
 };

 return (
  <Dialog
   open={open}
   onClose={onClose}
   aria-describedby="parameter the export of an image"
   TransitionComponent={Transition}
   PaperProps={{
    sx: {
     display: 'flex',
     justifyContent: 'center',
     alignItems: 'left',
     p: 1,
     cursor: 'default',
     height: 'auto',
     minHeight: '63%',
     maxWidth: '70%',
     width: '60%',
     borderRadius: 1,
    },
   }}
  >
   <IconButton
    aria-label="close"
    onClick={onClose}
    sx={{
     position: 'absolute',
     right: 8,
     top: 8,
     color: 'text.secondary',
     '&:hover': { color: 'primary.main' }
    }}
   >
    <Close sx={{ fontSize: '1.5rem' }} />
   </IconButton>
   <DialogContent sx={{ m: 1 }}>
    <DialogTitle sx={{ p: 0, pb: 3 }}>
     <Typography
      sx={{
       fontSize: '1.7rem',
       color: 'text.primary',
       fontWeight: 400,
       display: 'flex',
       alignContent: 'center',
      }}
     >
      {'图片转提示词生成器'}
     </Typography>
    </DialogTitle>
    <Stack
     direction="row"
     spacing={2.5}
     justifyContent="flex-start"
     alignItems="flex-start"
     sx={{ pt: 2, px: 1, width: '100%' }}
    >
     <ImageDropzone
      setImage={(base64Image: string) => setImage(base64Image)}
      image={image}
      onNewErrorMsg={setErrorMsg}
      size={{ width: '110vw', height: '110vw' }}
      maxSize={{ width: 280, height: 280 }}
      object={'contain'}
     />
     <Stack
      direction="column"
      spacing={2}
      justifyContent="space-between"
      alignItems="flex-end"
      sx={{ width: '100%', height: 340 }}
     >
      <Box sx={{ position: 'relative', width: '100%' }}>
       {isGeneratingPrompt && (
        <CircularProgress size={30} thickness={6} color="primary" sx={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-15px', marginLeft: '-15px', zIndex: 1 }} />
       )}
       <TextField
        label="生成的提示词"
        disabled
        error={errorMsg !== ''}
        helperText={errorMsg}
        value={isGeneratingPrompt ? '正在生成...' : prompt}
        multiline
        rows={6}
        sx={{ width: '98%', opacity: isGeneratingPrompt ? 0.5 : 1 }}
       />
      </Box>

      <TextField
       label="针对图片提出具体问题 (可选)"
       value={userQuery}
       onChange={(e) => setUserQuery(e.target.value)}
       disabled={isGeneratingPrompt || !image}
       multiline
       rows={2}
       sx={{ width: '98%' }}
       onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); getPromptFromImage(); } }}
      />

      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="flex-end" sx={{ width: '100%' }}>
       <Button onClick={getPromptFromImage} variant="contained" disabled={!image || isGeneratingPrompt} endIcon={<Send />} sx={CustomizedSendButton}>
        {'生成'}
       </Button>
       <Button onClick={onReset} variant="outlined" disabled={isGeneratingPrompt} endIcon={<Replay />}>
        {'重置'}
       </Button>
       <Button onClick={onValidate} variant="contained" disabled={!prompt || isGeneratingPrompt} endIcon={<Check />} sx={CustomizedSendButton}>
        {'使用此提示词'}
       </Button>
      </Stack>
     </Stack>
    </Stack>
   </DialogContent>
  </Dialog>
 );
}
