'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Box, IconButton, Modal, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface ExampleImage {
  image: string;
  description: string;
}

// --- 注意：请将下面的图片路径替换为您项目中 `public` 目录下的实际图片路径 ---
const exampleTryOn: ExampleImage[] = [
  { image: '/examples/try-on-sample-1.png', description: '模特穿着彩色针织衫的虚拟试穿效果' },
  { image: '/examples/try-on-sample-2.png', description: '模特穿着休闲T恤的虚拟试穿效果' },
];

export default function TryOnCreativeCanvas() {
  const [imageFullScreen, setImageFullScreen] = useState<ExampleImage | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', p: 3 }}>
        <Image src="/cloudpuppy-illustration.svg" alt="CloudPuppy 插画" width={150} height={150} />
        <Typography variant="h5" component="h2" sx={{ mt: 3, fontWeight: 'bold' }}>您的创意画廊</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 4, maxWidth: '450px' }}>生成的作品将会出现在这里。看看这些例子获取灵感吧！</Typography>
        <Box sx={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => handleScroll('left')} sx={{ position: 'absolute', left: -10, zIndex: 2, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}><ChevronLeft /></IconButton>
          <Box ref={scrollContainerRef} sx={{ width: '100%', overflowX: 'auto', pb: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            <Stack direction="row" spacing={2} justifyContent="flex-start" sx={{ display: 'inline-flex', p: 1 }}>
              {exampleTryOn.map((ex, index) => (
                <Tooltip title={ex.description} placement="top" arrow key={index}>
                  <Paper elevation={3} onClick={() => setImageFullScreen(ex)} sx={{ width: 200, height: 200, overflow: 'hidden', position: 'relative', cursor: 'pointer', borderRadius: 3, transition: 'transform 0.2s ease-in-out', flexShrink: 0, '&:hover': { transform: 'scale(1.05)' } }}>
                    <Image src={ex.image} alt={ex.description} layout="fill" objectFit="cover" />
                  </Paper>
                </Tooltip>
              ))}
            </Stack>
          </Box>
          <IconButton onClick={() => handleScroll('right')} sx={{ position: 'absolute', right: -10, zIndex: 2, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}><ChevronRight /></IconButton>
        </Box>
      </Box>
      {imageFullScreen && (
        <Modal open={!!imageFullScreen} onClose={() => setImageFullScreen(null)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ maxHeight: '90vh', maxWidth: '90vw' }}>
            <Image src={imageFullScreen.image} alt={imageFullScreen.description} width={800} height={800} style={{ width: 'auto', height: 'auto', maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} />
          </Box>
        </Modal>
      )}
    </>
  );
}
