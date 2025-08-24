// 文件路径: app/(studio)/generate/page.tsx

import { Suspense } from 'react';
import GeneratePageClient from './GeneratePageClient';
import { Box, CircularProgress } from '@mui/material';

// 这个组件现在是一个 Server Component，它负责加载客户端组件
export default function GeneratePage() {
  return (
    // Suspense 边界是必需的，因为 GeneratePageClient 使用了 useSearchParams
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    }>
      <GeneratePageClient />
    </Suspense>
  );
}
