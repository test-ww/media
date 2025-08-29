'use client';

// 【终极解决方案】: 强制此页面为动态渲染，禁用静态生成
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Paper, Grid } from '@mui/material';

// 直接导入组件，因为整个页面已经是动态的了
import VirtualTryOnForm from '../../../ui/try-on-components/VirtualTryOnForm';
import TryOnResultDisplay from '../../../ui/try-on-components/TryOnResultDisplay';
import { virtualTryOnFields } from '../../../api/virtual-try-on-utils';
import { ImageI } from '../../../api/generate-image-utils';

export default function TryOnPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedImage, setGeneratedImage] = useState<ImageI | null>(null);

  const handleRequestSent = (loading: boolean) => {
    setIsLoading(loading);
    setErrorMsg('');
    if (loading) {
      setGeneratedImage(null);
    }
  };

  const handleNewErrorMsg = (newError: string) => {
    setErrorMsg(newError);
    setIsLoading(false);
  };

  const handleImageGeneration = (newImage: ImageI) => {
    setGeneratedImage(newImage);
    setIsLoading(false);
    setErrorMsg('');
  };

  return (
    <Grid container spacing={{ xs: 2, md: 3 }} sx={{ height: '100%' }}>
      {/* 左侧：表单区域 */}
      <Grid item xs={12} md={5} lg={4} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Paper sx={{ p: 3, borderRadius: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <VirtualTryOnForm
            isLoading={isLoading}
            errorMsg={errorMsg}
            generationFields={virtualTryOnFields}
            onRequestSent={handleRequestSent}
            onNewErrorMsg={handleNewErrorMsg}
            onImageGeneration={handleImageGeneration}
          />
        </Paper>
      </Grid>

      {/* 右侧：结果展示区域 */}
      <Grid item xs={12} md={7} lg={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Paper sx={{ p: 3, borderRadius: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <TryOnResultDisplay
            isLoading={isLoading}
            errorMsg={errorMsg}
            generatedImage={generatedImage}
          />
        </Paper>
      </Grid>
    </Grid>
  );
}
