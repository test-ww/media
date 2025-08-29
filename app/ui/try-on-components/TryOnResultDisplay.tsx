'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Box, Modal, ImageListItem, ImageListItemBar, Stack, Typography, IconButton, Avatar, Alert, CircularProgress } from '@mui/material';
import { Edit, CreateNewFolderRounded, Download, VideocamRounded } from '@mui/icons-material';
import { getAuth } from 'firebase/auth'; // <-- 【核心修改】导入 getAuth

import { ImageI } from '../../api/generate-image-utils';
import ExportStepper, { downloadBase64Media } from '../transverse-components/ExportDialog';
import DownloadDialog from '../transverse-components/DownloadDialog';
import { appContextDataDefault, useAppContext } from '../../context/app-context';
import { downloadMediaFromGcs } from '@/app/api/cloud-storage/action';
import { blurDataURL } from '../ux-components/BlurImage';
import { CustomDarkTooltip } from '../ux-components/Tooltip';
import { CustomizedAvatarButton, CustomizedIconButton } from '../ux-components/Button-SX';
import TryOnCreativeCanvas from './TryOnCreativeCanvas';

interface TryOnResultDisplayProps {
  isLoading: boolean;
  errorMsg: string;
  generatedImage: ImageI | null;
}

const containerStyles = {
  width: '100%',
  height: '100%',
  borderRadius: 2,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
};

export default function TryOnResultDisplay({ isLoading, errorMsg, generatedImage }: TryOnResultDisplayProps) {
  const [imageFullScreen, setImageFullScreen] = useState<ImageI | undefined>();
  const [imageToExport, setImageToExport] = useState<ImageI | undefined>();
  const [imageToDL, setImageToDL] = useState<ImageI | undefined>();
  const [downloadError, setDownloadError] = useState(''); // State for download-specific errors

  const { setAppContext } = useAppContext();
  const router = useRouter();

  const handleEditClick = (imageGcsURI: string) => {
    if (!imageGcsURI) {
      alert("无法编辑：图片未保存到 Cloud Storage。");
      return;
    }
    setAppContext((prevContext) => ({ ...(prevContext || appContextDataDefault), imageToEdit: imageGcsURI }));
    router.push('/edit');
  };

  const handleITVClick = (imageGcsURI: string) => {
    if (!imageGcsURI) {
      alert("无法转换为视频：图片未保存到 Cloud Storage。");
      return;
    }
    setAppContext((prevContext) => ({ ...(prevContext || appContextDataDefault), imageToVideo: imageGcsURI }));
    router.push('/generate?mode=video');
  };

  const handleDLimage = async (image: ImageI) => {
    setDownloadError(''); // Reset previous errors
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
      const res = await downloadMediaFromGcs(image.gcsUri, idToken);

      if (typeof res === 'object' && res.error) {
        throw new Error(res.error.replaceAll('Error: ', ''));
      }
      if (!res.data) {
        throw new Error("下载成功，但未返回任何数据。");
      }

      const name = `${image.key}.${image.format.toLowerCase()}`;
      downloadBase64Media(res.data, name, image.format);

    } catch (error: any) {
      console.error("Download failed:", error);
      setDownloadError(error.message || "下载过程中发生未知错误。");
      // Optionally, show an alert to the user
      alert(`下载失败: ${error.message || "未知错误"}`);
    }
  };

  return (
    <>
      <Box sx={containerStyles}>
        {isLoading && <CircularProgress color="primary" />}

        {!isLoading && errorMsg && (
          <Alert severity="error" sx={{ m: 2, width: '90%' }}>{errorMsg}</Alert>
        )}

        {!isLoading && !errorMsg && !generatedImage && (
          <TryOnCreativeCanvas />
        )}

        {!isLoading && generatedImage && (
          <ImageListItem
            key={generatedImage.key}
            sx={{
              width: '100%', height: '100%', display: 'flex',
              justifyContent: 'center', alignItems: 'center',
              '&:hover .actions-bar': { opacity: 1 },
            }}
          >
            <Image
              src={generatedImage.src}
              alt={generatedImage.altText}
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              width={1024}
              height={1024}
              placeholder="blur"
              blurDataURL={blurDataURL}
              quality={90}
            />
            <Box
              sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white', opacity: 0, transition: 'opacity 0.3s ease', '&:hover': { opacity: 1 }, cursor: 'pointer' }}
              onClick={() => setImageFullScreen(generatedImage)}
            >
              <Typography variant="body1" sx={{ textAlign: 'center' }}>点击查看全屏</Typography>
            </Box>
            <ImageListItemBar
              className="actions-bar"
              sx={{
                backgroundColor: 'transparent',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              }}
              position="top"
              actionIcon={
                <Stack direction="row" gap={0} pb={3}>
                  {process.env.NEXT_PUBLIC_EDIT_ENABLED === 'true' && (
                    <CustomDarkTooltip title="编辑此图">
                      <IconButton onClick={(e) => { e.stopPropagation(); handleEditClick(generatedImage.gcsUri); }} sx={{ px: 0.2, zIndex: 10 }} disableRipple>
                        <Avatar sx={CustomizedAvatarButton}><Edit sx={CustomizedIconButton} /></Avatar>
                      </IconButton>
                    </CustomDarkTooltip>
                  )}
                  {process.env.NEXT_PUBLIC_VEO_ENABLED === 'true' && process.env.NEXT_PUBLIC_VEO_ITV_ENABLED === 'true' && (
                    <CustomDarkTooltip title="图生视频">
                      <IconButton onClick={(e) => { e.stopPropagation(); handleITVClick(generatedImage.gcsUri); }} sx={{ px: 0.2, zIndex: 10 }} disableRipple>
                        <Avatar sx={CustomizedAvatarButton}><VideocamRounded sx={CustomizedIconButton} /></Avatar>
                      </IconButton>
                    </CustomDarkTooltip>
                  )}
                  <CustomDarkTooltip title="导出到媒体库">
                    <IconButton onClick={(e) => { e.stopPropagation(); setImageToExport(generatedImage); }} sx={{ px: 0.2, zIndex: 10 }} disableRipple>
                      <Avatar sx={CustomizedAvatarButton}><CreateNewFolderRounded sx={CustomizedIconButton} /></Avatar>
                    </IconButton>
                  </CustomDarkTooltip>
                  <CustomDarkTooltip title="本地下载">
                    <IconButton onClick={(e) => { e.stopPropagation(); handleDLimage(generatedImage); }} sx={{ pr: 1, pl: 0.2, zIndex: 10 }} disableRipple>
                      <Avatar sx={CustomizedAvatarButton}><Download sx={CustomizedIconButton} /></Avatar>
                    </IconButton>
                  </CustomDarkTooltip>
                </Stack>
              }
            />
          </ImageListItem>
        )}
      </Box>

      {imageFullScreen && (
        <Modal open={true} onClose={() => setImageFullScreen(undefined)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ maxHeight: '90vh', maxWidth: '90vw' }}>
            <Image
              src={imageFullScreen.src}
              alt={imageFullScreen.altText}
              width={1024}
              height={1024}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
        </Modal>
      )}
      <ExportStepper
        open={imageToExport !== undefined}
        upscaleAvailable={false}
        mediaToExport={imageToExport}
        handleMediaExportClose={() => setImageToExport(undefined)}
      />
      <DownloadDialog
        open={imageToDL !== undefined}
        mediaToDL={imageToDL}
        handleMediaDLClose={() => setImageToDL(undefined)}
      />
    </>
  );
}
