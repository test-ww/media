// 文件路径: app/ui/transverse-components/VeoOutputVideosDisplay.tsx

'use client';

import * as React from 'react';
import { useRef, useState } from 'react';
import Image from 'next/image';
// ==================== 新增导入 ====================
import {
  CreateNewFolderRounded, Download, PlayArrowRounded, ChevronLeft,
  ChevronRight, ContentCopy, InfoOutlined as InfoOutlinedIcon
} from '@mui/icons-material';
// =================================================

import {
  Box, IconButton, Modal, Skeleton, ImageListItem, ImageList,
  ImageListItemBar, Stack, CircularProgress, Typography, Paper, Tooltip, Snackbar, Alert, Grid
} from '@mui/material';
import { VideoI } from '../../api/generate-video-utils';
import ExportStepper, { downloadBase64Media } from './ExportDialog';
import { downloadMediaFromGcs } from '@/app/api/cloud-storage/action';
import { CustomDarkTooltip } from '../ux-components/Tooltip';

interface ExampleVideo { thumbnail: string; videoSrc: string; prompt: string; }

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

// ==================== 修改 EmptyState 组件 ====================
const EmptyState = () => {
  const [videoFullScreen, setVideoFullScreen] = useState<ExampleVideo | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 新增状态：用于追踪哪个提示词是激活状态
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const exampleVideos: ExampleVideo[] = [
    { thumbnail: '/examples/4.jpg', videoSrc: '/examples/4.mp4', prompt: "A cinematic of here is a new prompt based on the provided image and instructions: subject: a young woman with long, braided hair, dressed in earthy tones, standing in quiet contemplation context: a mystical, ancient landscape at dawn, featuring a serene lake reflecting the sky, towering rock formations, and a colossal, ethereal head floating above the water, adorned with intricate patterns and natural elements like branches and horns. Ancient stone ruins stand on the right, and a giant tree-topped mesa rises in the distant mist. Butterflies gently flutter in the golden light. action: the woman stands at the edge of the lake, gazing up in awe and wonder at the majestic floating head, a sense of quiet reverence in her posture. style: ethereal fantasy, naturalistic lighting, painterly realism, dreamlike atmosphere camera: wide establishing shot, slowly panning across the vast landscape to reveal the floating head, then a gentle push-in towards the woman, capturing her expression and the scale of the scene. composition: establishing shot with the woman in the foreground, the floating head as a central focal point, and the ancient landscape providing depth and scale. ambiance: soft golden hour light, gentle mist rising from the water, serene and mystical atmosphere. audio: subtle, ethereal hum, distant calls of mythical birds, gentle lapping of water, soft rustling of leaves, and a faint, deep, resonant sound emanating from the floating head. negative prompt: unrealistic cgi, cartoonish, blurry, low resolution, distorted, unnatural colors, poor lighting, artificial textures, modern elements, urban sounds, loud noises, jump cuts." },
    { thumbnail: '/examples/5.jpg', videoSrc: '/examples/5.mp4', prompt: "A cinematic of subject: a dark-colored porsche 911 carrera s sports car, seen from the rear, with illuminated taillights. context: a wide, wet city street in paris at dusk or early evening, with the iconic eiffel tower prominently visible in the distance. Classic parisian buildings line both sides of the street, illuminated by warm lights. Other vehicles and distant pedestrians are present. action: the porsche drives smoothly forward, away from the camera, down the reflective, wet street towards the eiffel tower. style: cinematic, realistic, high-fidelity, moody, and atmospheric, resembling a high-end video game or car commercial. Strong reflections and ambient lighting. camera: a smooth, steady, low-angle tracking shot following the car from directly behind. Slight motion blur on the sides to convey movement. composition: the porsche is centered in the foreground, leading the eye towards the centrally framed eiffel tower in the background. The street and buildings create a strong vanishing point perspective. A subtle, integrated heads-up display (hud) is visible in the bottom left corner. ambiance: dusk/early evening with soft, ambient light from the sky mixed with warm glows from streetlights and building windows. The wet road enhances reflections, creating a shimmering, atmospheric effect. Serene and slightly melancholic mood. audio: sounds of a luxury sports car engine, tires on wet pavement, distant city traffic, and subtle ambient city sounds. negative prompt: cartoon, animation, low resolution, blurry, poor lighting, unrealistic, daytime, dry road, distorted, bad reflections, no eiffel tower, wrong car model, low quality hud." },
    { thumbnail: '/examples/video_1.jpg', videoSrc: '/examples/1.mp4', prompt: "A cinematic of a latest model of sennheiser noise-canceling headphones, matte black with a brushed metal finish., statically placed at an angle that best showcases its design., on a flawless, pure white seamless background.. Cinematography: professional product photography, commercial-grade, with a macro lens capturing the texture of the leather earcups and metal.. Lighting and vfx: bright, clean commercial studio lighting with soft shadows to emphasize three-dimensionality. No stray light. Hyper-realistic with colors true to the actual product.. Audio: no audio needed.." },
    { thumbnail: '/examples/video_2.jpg', videoSrc: '/examples/2.mp4', prompt: "subject: a seasoned elf ranger dressed in forest camouflage leather armor, holding a shimmering rune longbow. scenario: on the top of an ancient, moss covered megalithic relic, the background is the dusk sky before a storm approaches. action: she leaped and jumped towards another stone pillar, drawing a bow and casting arrows in the air, with wind elemental energy condensed on the arrows. photography style: the highly dynamic low angle tracking lens captures her jumping from bottom to top, combined with bullet time like slow motion effects, with a strong dynamic blur in the background. lighting atmosphere: the jesus light at dusk penetrates through the clouds, illuminating her contours to form edge lights, and lightning in the distance instantly illuminates the entire scene. special effects and post production: there are clear and visible blue wind magic particles on the arrows, and raindrops are captured by the camera in slow motion. The overall color scheme is movie grade with cool tones. audio: a majestic symphony, the creaking sound of bowstring tension, the wind, and distant thunder." },
    { thumbnail: '/examples/video_3.jpg', videoSrc: '/examples/3.mp4', prompt: "subject: a bottle of 'fountain of life' potion in a delicate crystal bottle, with a bright emerald green liquid and slowly rotating golden light spots inside. scenario: on a seamless black background. action: the entire bottle body is slowly and uniformly rotating around the vertical axis. photography style: game asset display style, orthogonal projection, 45 degree top-down view, all details are clearly visible. lighting atmosphere: soft and uniform studio lighting clearly outlines the edges of the crystal bottle and the transparency of the liquid. special effects and post production: the potion itself emits a soft internal light, without any other environmental effects, requiring ultra-high resolution and sharp details. photography style: the highly dynamic low angle tracking lens captures her jumping from bottom to top, combined with bullet time like slow motion effects, with a strong dynamic blur in the background. lighting atmosphere: the jesus light at dusk penetrates through the clouds, illuminating her contours to form edge lights, and lightning in the distance instantly illuminates the entire scene. special effects and post production: there are clear and visible blue wind magic particles on the arrows, and raindrops are captured by the camera in slow motion. The overall color scheme is movie grade with cool tones. audio: a majestic symphony, the creaking sound of bowstring tension, the wind, and distant thunder." },
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  // 新增点击处理函数：用于切换提示词的显示/隐藏
  const handleTogglePrompt = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // 关键：阻止事件冒泡
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
              {exampleVideos.map((ex, index) => (
                <Grid item key={index} sx={{ minWidth: 200, display: 'flex' }}>
                  <Stack direction="column" spacing={1}>
                    <Paper 
                      elevation={3} 
                      onClick={() => setVideoFullScreen(ex)} 
                      sx={{ 
                        width: 200, height: 200, overflow: 'hidden', position: 'relative', 
                        cursor: 'pointer', borderRadius: 3, transition: 'transform 0.2s ease-in-out', 
                        flexShrink: 0, '&:hover': { transform: 'scale(1.05)' } 
                      }}
                    >
                      <Image src={ex.thumbnail} alt={`Example ${index + 1}`} layout="fill" objectFit="cover" />
                      <PlayArrowRounded sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '4rem', color: 'rgba(255, 255, 255, 0.9)', pointerEvents: 'none' }} />
                      {/* 新增的信息图标按钮 */}
                      <Tooltip title="显示/隐藏提示词">
                        <IconButton
                          onClick={(e) => handleTogglePrompt(e, index)}
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            color: 'white',
                            backgroundColor: activeIndex === index ? 'primary.main' : 'rgba(0, 0, 0, 0.5)',
                            '&:hover': { backgroundColor: activeIndex === index ? 'primary.dark' : 'rgba(0, 0, 0, 0.8)' }
                          }}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                    {/* 条件渲染提示词，并用Box占位防止布局跳动 */}
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
      {videoFullScreen && (<Modal open={!!videoFullScreen} onClose={() => setVideoFullScreen(null)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Box sx={{ maxWidth: '80vw', maxHeight: '80vh', bgcolor: 'black' }}><video src={videoFullScreen.videoSrc} controls autoPlay style={{ width: '100%', height: '100%', maxHeight: '80vh' }} /></Box></Modal>)}
      <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>提示词已复制!</Alert>
      </Snackbar>
    </>
  );
};
// ============================================================

export default function OutputVideosDisplay({ isLoading, generatedVideosInGCS, generatedCount }: { isLoading: boolean; generatedVideosInGCS: VideoI[]; generatedCount: number; }) {
  const [videoFullScreen, setVideoFullScreen] = useState<VideoI | undefined>();
  const fullScreenVideoRef = useRef<HTMLVideoElement>(null);
  const [videoToExport, setVideoToExport] = useState<VideoI | undefined>();
  const [isDLloading, setIsDLloading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCloseVideoFullScreen = () => { if (fullScreenVideoRef.current) { fullScreenVideoRef.current.pause(); fullScreenVideoRef.current.currentTime = 0; } setVideoFullScreen(undefined); };
  const handleVideoExportClose = () => setVideoToExport(undefined);
  const handleDLvideo = async (video: VideoI) => { setIsDLloading(true); try { const res = await downloadMediaFromGcs(video.gcsUri); downloadBase64Media(res.data, `${video.key}.${video.format.toLowerCase()}`, video.format); if (typeof res === 'object' && res.error) throw Error(res.error.replaceAll('Error: ', '')); } catch (error: any) { console.error(error); } finally { setIsDLloading(false); } };

  if (isLoading) {
    return (
      <ImageList cols={generatedCount > 1 ? 2 : 1} gap={16}>
        {Array.from(new Array(generatedCount > 1 ? generatedCount : 1)).map((_, index) => (
          <ImageListItem key={index}><Skeleton variant="rounded" sx={{ width: '100%', paddingTop: '56.25%', height: 0, borderRadius: 3 }} /></ImageListItem>
        ))}
      </ImageList>
    );
  }

  if (!isLoading && generatedVideosInGCS.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ImageList cols={generatedCount > 1 ? 2 : 1} gap={16} sx={{ m: 0, flexGrow: 1, overflowY: 'auto' }}>
          {generatedVideosInGCS.map((video) => video.src ? (
            <Paper key={video.key} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ImageListItem
                onClick={() => setVideoFullScreen(video)}
                sx={{
                  '&:hover .actions-bar': { opacity: 1 },
                  overflow: 'visible',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <video src={video.src} width={video.width} height={video.height} style={{ width: '100%', height: 'auto', display: 'block' }} playsInline muted preload="metadata" />
                <ImageListItemBar
                  className="actions-bar"
                  sx={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', opacity: 0, transition: 'opacity 0.3s ease' }}
                  position="bottom"
                  actionIcon={
                    <Stack direction="row" justifyContent="flex-end" gap={0.5} sx={{ p: 1, width: '100%' }}>
                      <CustomDarkTooltip title="导出到媒体库">
                        <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); setVideoToExport(video); }}><CreateNewFolderRounded /></IconButton>
                      </CustomDarkTooltip>
                      <CustomDarkTooltip title="下载">
                        <IconButton size="small" sx={{ color: 'white' }} onClick={(e) => { e.stopPropagation(); handleDLvideo(video); }}>
                          {isDLloading ? <CircularProgress size={20} color="inherit" /> : <Download />}
                        </IconButton>
                      </CustomDarkTooltip>
                    </Stack>
                  }
                />
                <PlayArrowRounded sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '4rem', color: 'rgba(255, 255, 255, 0.9)', pointerEvents: 'none' }} />
              </ImageListItem>
            </Paper>
          ) : null)}
        </ImageList>
      </Box>
      {videoFullScreen && (<Modal open={!!videoFullScreen} onClose={handleCloseVideoFullScreen} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Box sx={{ maxWidth: '80vw', maxHeight: '80vh', bgcolor: 'black' }}><video ref={fullScreenVideoRef} src={videoFullScreen.src} controls autoPlay style={{ width: '100%', height: '100%', maxHeight: '80vh' }} /></Box></Modal>)}
      <ExportStepper open={!!videoToExport} upscaleAvailable={false} mediaToExport={videoToExport} handleMediaExportClose={handleVideoExportClose} />
      <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>提示词已复制!</Alert>
      </Snackbar>
    </>
  );
}
