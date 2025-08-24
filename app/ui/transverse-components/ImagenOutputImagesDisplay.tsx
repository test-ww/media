// 文件路径: app/ui/transverse-components/ImagenOutputImagesDisplay.tsx

'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import {
  CreateNewFolderRounded, Download, Edit, Favorite, VideocamRounded,
  ChevronLeft, ChevronRight, ContentCopy, InfoOutlined as InfoOutlinedIcon
} from '@mui/icons-material';
import Image from 'next/image';
import {
  Box, IconButton, Modal, Skeleton, ImageListItem, ImageList,
  ImageListItemBar, Typography, Stack, Paper, Tooltip, Snackbar, Alert, Grid
} from '@mui/material';
import { ImageI } from '../../api/generate-image-utils';
import ExportStepper, { downloadBase64Media } from './ExportDialog';
import DownloadDialog from './DownloadDialog';
import { blurDataURL } from '../ux-components/BlurImage';
import { appContextDataDefault, useAppContext } from '../../context/app-context';
import { useRouter } from 'next/navigation';
import { downloadMediaFromGcs } from '@/app/api/cloud-storage/action';
import { CustomDarkTooltip } from '../ux-components/Tooltip';

interface ExampleImage { image: string; prompt: string; }

const PromptDisplay = ({ prompt, onCopy }: { prompt: string, onCopy: () => void }) => {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt);
    onCopy();
  };

  return (
    <Paper variant="outlined" sx={{ p: 1, mt: 1, display: 'flex', alignItems: 'center', gap: 1, borderColor: 'grey.800', backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
      <Typography variant="caption" sx={{ flexGrow: 1, wordBreak: 'break-word', maxHeight: '120px', overflowY: 'auto', color: 'text.primary' }}>
        {prompt}
      </Typography>
      <Tooltip title="复制提示词">
        <IconButton size="small" onClick={handleCopy}>
          <ContentCopy fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};

const EmptyState = () => {
  const [imageFullScreen, setImageFullScreen] = useState<ExampleImage | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const examplePrompts: ExampleImage[] = [
    { image: '/examples/8.png', prompt: 'A photo of fantasy, mysterious character concept art of a guardian, a small, nimble creature with large, expressive eyes, wearing makeshift armor from pottery shards and cloth, in a protective stance in front of a giant, moss-covered stone head of a forgotten god, armed with a sharp obsidian shard, dappled sunlight through the canopy of a dense jungle, atmospheric, detailed, aspect ratio 16:9.' },
    { image: '/examples/5.png', prompt: 'A photo of photorealistic 2d character concept art of a heroic fantasy elf mage, wearing intricate leather armor with glowing runes, holding a staff, dynamic pose, natural lighting with accurate shadows, high fidelity, aspect ratio' },
    { image: '/examples/6.png', prompt: 'A photo of digital painting, concept art, a striking female warrior with light grey skin, dark flowing hair with braids, intricate facial markings, and a futuristic headpiece, wearing detailed metallic armor on her shoulder, her gaze intense and determined, positioned in the foreground. Behind her, a shadowy, spectral male figure with glowing cyan eyes and features, appearing to emerge from or dissolve into darkness, surrounded by crackling white energy and floating debris. Set against a minimalist, gradient grey background. A medium shot with dramatic, high-contrast lighting, bright highlights on the female, and strong internal luminescence from the male figure. A cool, monochromatic color palette dominated by greys, blacks, and vibrant cyan accents, 8k, hyperdetailed, intricate, cinematic quality.' },
    { image: '/examples/7.png', prompt: 'A photo of high-performance photo for a facebook ad, featuring a person joyfully leaping in the air at the start of their workday, holding a coffee cup, with the visual concept of "conquering the morning", with bright, energetic morning sunlight, ample negative space for text overlay, negative prompt: tired, sad, sitting, dark, office, aspect ratio' },
    { image: '/examples/222.png', prompt: 'A close up of a warm and fuzzy colorful Peruvian poncho laying on a top of a chair in a bright day' },
    { image: '/examples/111.png', prompt: 'A winning touchdown, fast shutter speed, movement tracking' },
    { image: '/examples/333.png', prompt: 'Aerial shot of a river flowing up a mystical valley' },
    { image: '/examples/444.png', prompt: 'A photo of a forest canopy with blue skies from below' },
    
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  const handleTogglePrompt = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setActiveIndex(prevIndex => (prevIndex === index ? null : index));
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', p: 3 }}>
        <Image src="/cloudpuppy-illustration.svg" alt="CloudPuppy" width={150} height={150} />
        <Typography variant="h5" component="h2" sx={{ mt: 3, fontWeight: 'bold' }}>您的创意画廊</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 4, maxWidth: '450px' }}>生成的作品将会出现在这里。看看这些例子获取灵感吧！</Typography>
        <Box sx={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => handleScroll('left')} sx={{ position: 'absolute', left: -10, zIndex: 2, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}><ChevronLeft /></IconButton>
          <Box ref={scrollContainerRef} sx={{ width: '100%', overflowX: 'auto', pb: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            <Grid container spacing={2} wrap="nowrap" sx={{ p: 1, display: 'inline-flex' }}>
              {examplePrompts.map((ex, index) => (
                <Grid item key={index} sx={{ minWidth: 200, display: 'flex' }}>
                  <Stack direction="column" spacing={1}>
                    <Paper
                      elevation={3}
                      onClick={() => setImageFullScreen(ex)}
                      sx={{
                        width: 200, height: 200, overflow: 'hidden', position: 'relative',
                        cursor: 'pointer', borderRadius: 3, transition: 'transform 0.2s ease-in-out',
                        flexShrink: 0, '&:hover': { transform: 'scale(1.05)' }
                      }}
                    >
                      <Image src={ex.image} alt={`Example ${index + 1}`} layout="fill" objectFit="cover" />
                      <Tooltip title="显示/隐藏提示词">
                        <IconButton
                          onClick={(e) => handleTogglePrompt(e, index)}
                          sx={{
                            position: 'absolute', bottom: 8, right: 8, color: 'white',
                            backgroundColor: activeIndex === index ? 'primary.main' : 'rgba(0, 0, 0, 0.5)',
                            '&:hover': { backgroundColor: activeIndex === index ? 'primary.dark' : 'rgba(0, 0, 0, 0.8)' }
                          }}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                    <Box sx={{ minHeight: { xs: '140px', md: '120px' } }}>
                      {activeIndex === index && (
                        <PromptDisplay prompt={ex.prompt} onCopy={() => setSnackbarOpen(true)} />
                      )}
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>
          <IconButton onClick={() => handleScroll('right')} sx={{ position: 'absolute', right: -10, zIndex: 2, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}><ChevronRight /></IconButton>
        </Box>
      </Box>
      {imageFullScreen && (<Modal open={!!imageFullScreen} onClose={() => setImageFullScreen(null)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Box sx={{ maxHeight: '90vh', maxWidth: '90vw' }}><Image src={imageFullScreen.image} alt={imageFullScreen.prompt} width={800} height={800} style={{ width: 'auto', height: 'auto', maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} /></Box></Modal>)}
      <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>提示词已复制!</Alert>
      </Snackbar>
    </>
  );
};

export default function OutputImagesDisplay({ isLoading, generatedImagesInGCS, generatedCount, isPromptReplayAvailable, isUpscaledDLAvailable = true }: { isLoading: boolean; generatedImagesInGCS: ImageI[]; generatedCount: number; isPromptReplayAvailable: boolean; isUpscaledDLAvailable?: boolean; }) {
  const [imageFullScreen, setImageFullScreen] = useState<ImageI | undefined>();
  const [imageToExport, setImageToExport] = useState<ImageI | undefined>();
  const [imageToDL, setImageToDL] = useState<ImageI | undefined>();
  const { setAppContext } = useAppContext();
  const router = useRouter();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleMoreLikeThisClick = (prompt: string) => { setAppContext((prev) => ({ ...(prev ?? appContextDataDefault), promptToGenerateImage: prompt, promptToGenerateVideo: '' })); };
  const handleEditClick = (imageGcsURI: string) => { setAppContext((prev) => ({ ...(prev ?? appContextDataDefault), imageToEdit: imageGcsURI })); router.push('/edit'); };
  const handleITVClick = (imageGcsURI: string) => { setAppContext((prev) => ({ ...(prev ?? appContextDataDefault), imageToVideo: imageGcsURI })); router.push('/generate?mode=video'); };
  const handleDLimage = async (image: ImageI) => { try { const res = await downloadMediaFromGcs(image.gcsUri); downloadBase64Media(res.data, `${image.key}.${image.format.toLowerCase()}`, image.format); if (typeof res === 'object' && res.error) throw Error(res.error.replaceAll('Error: ', '')); } catch (error: any) { throw Error(error); } };

  if (isLoading) {
    return (
      <ImageList cols={generatedCount > 1 ? 2 : 1} gap={16}>
        {Array.from(new Array(generatedCount > 1 ? generatedCount : 2)).map((_, index) => (
          <ImageListItem key={index}><Skeleton variant="rounded" sx={{ width: '100%', paddingTop: '100%', height: 0, borderRadius: 3 }} /></ImageListItem>
        ))}
      </ImageList>
    );
  }

  if (!isLoading && generatedImagesInGCS.length === 0) {
    return <EmptyState />;
  }

  // ==================== 这是核心修改区域 ====================
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
        {generatedImagesInGCS.length === 1 ? (
          // --- 1. 单张图片的渲染路径 ---
          (() => {
            const image = generatedImagesInGCS[0];
            return (
              <ImageListItem
                key={image.key}
                onClick={() => setImageFullScreen(image)}
                sx={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover .actions-bar': { opacity: 1 },
                }}
              >
                <Image
                  src={image.src}
                  alt={image.altText}
                  width={image.width}
                  height={image.height}
                  style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', display: 'block', objectFit: 'contain', borderRadius: '12px' }}
                  placeholder="blur"
                  blurDataURL={blurDataURL}
                  quality={90}
                />
                <ImageListItemBar
                  className="actions-bar"
                  sx={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', opacity: 0, transition: 'opacity 0.3s ease', borderRadius: '12px' }}
                  position="bottom"
                  actionIcon={
                    <Stack direction="row" justifyContent="flex-end" gap={0.5} sx={{ p: 1, width: '100%' }}>
                      {isPromptReplayAvailable && !image.prompt.includes('[1]') && (
                        <CustomDarkTooltip title="生成同款！">
                          <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); handleMoreLikeThisClick(image.prompt); }}><Favorite /></IconButton>
                        </CustomDarkTooltip>
                      )}
                      {process.env.NEXT_PUBLIC_EDIT_ENABLED === 'true' && (
                        <CustomDarkTooltip title="编辑此图">
                          <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); handleEditClick(image.gcsUri); }}><Edit /></IconButton>
                        </CustomDarkTooltip>
                      )}
                      {process.env.NEXT_PUBLIC_VEO_ENABLED === 'true' && process.env.NEXT_PUBLIC_VEO_ITV_ENABLED === 'true' && (
                        <CustomDarkTooltip title="图生视频">
                          <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); handleITVClick(image.gcsUri); }}><VideocamRounded /></IconButton>
                        </CustomDarkTooltip>
                      )}
                      <CustomDarkTooltip title="导出到媒体库">
                        <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); setImageToExport(image); }}><CreateNewFolderRounded /></IconButton>
                      </CustomDarkTooltip>
                      <CustomDarkTooltip title="下载">
                        <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); isUpscaledDLAvailable ? setImageToDL(image) : handleDLimage(image); }}><Download /></IconButton>
                      </CustomDarkTooltip>
                    </Stack>
                  }
                />
              </ImageListItem>
            );
          })()
        ) : (
          // --- 2. 多张图片的渲染路径 (保持不变) ---
          <ImageList cols={2} gap={16} sx={{ m: 0, flexGrow: 1, overflowY: 'auto' }}>
            {generatedImagesInGCS.map((image) => (
              <Paper key={image.key} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <ImageListItem
                  onClick={() => setImageFullScreen(image)}
                  sx={{
                    '&:hover .actions-bar': { opacity: 1 },
                    overflow: 'visible',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  <Image src={image.src} alt={image.altText} width={image.width} height={image.height} style={{ width: '100%', height: 'auto', display: 'block' }} placeholder="blur" blurDataURL={blurDataURL} quality={80} />
                  <ImageListItemBar
                    className="actions-bar"
                    sx={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', opacity: 0, transition: 'opacity 0.3s ease' }}
                    position="bottom"
                    actionIcon={
                      <Stack direction="row" justifyContent="flex-end" gap={0.5} sx={{ p: 1, width: '100%' }}>
                        {isPromptReplayAvailable && !image.prompt.includes('[1]') && (
                          <CustomDarkTooltip title="生成同款！">
                            <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); handleMoreLikeThisClick(image.prompt); }}><Favorite /></IconButton>
                          </CustomDarkTooltip>
                        )}
                        {process.env.NEXT_PUBLIC_EDIT_ENABLED === 'true' && (
                          <CustomDarkTooltip title="编辑此图">
                            <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); handleEditClick(image.gcsUri); }}><Edit /></IconButton>
                          </CustomDarkTooltip>
                        )}
                        {process.env.NEXT_PUBLIC_VEO_ENABLED === 'true' && process.env.NEXT_PUBLIC_VEO_ITV_ENABLED === 'true' && (
                          <CustomDarkTooltip title="图生视频">
                            <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); handleITVClick(image.gcsUri); }}><VideocamRounded /></IconButton>
                          </CustomDarkTooltip>
                        )}
                        <CustomDarkTooltip title="导出到媒体库">
                          <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); setImageToExport(image); }}><CreateNewFolderRounded /></IconButton>
                        </CustomDarkTooltip>
                        <CustomDarkTooltip title="下载">
                          <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); isUpscaledDLAvailable ? setImageToDL(image) : handleDLimage(image); }}><Download /></IconButton>
                        </CustomDarkTooltip>
                      </Stack>
                    }
                  />
                </ImageListItem>
              </Paper>
            ))}
          </ImageList>
        )}
      </Box>

      {/* Modals 和 Snackbars 保持在外部，以便所有情况都能调用 */}
      {imageFullScreen && (<Modal open={!!imageFullScreen} onClose={() => setImageFullScreen(undefined)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Box sx={{ maxHeight: '90vh', maxWidth: '90vw' }}><Image src={imageFullScreen.src} alt={'displayed-image'} width={imageFullScreen.width} height={imageFullScreen.height} style={{ width: 'auto', height: 'auto', maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} quality={100} /></Box></Modal>)}
      <ExportStepper open={!!imageToExport} upscaleAvailable={true} mediaToExport={imageToExport} handleMediaExportClose={() => setImageToExport(undefined)} />
      <DownloadDialog open={!!imageToDL} mediaToDL={imageToDL} handleMediaDLClose={() => setImageToDL(undefined)} />
      <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>提示词已复制!</Alert>
      </Snackbar>
    </>
  );
}
