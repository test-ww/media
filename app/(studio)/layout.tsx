'use client';

import SideNav from '../ui/transverse-components/SideNavigation';
import Box from '@mui/material/Box';
import { Suspense } from 'react';
import { CircularProgress, Drawer } from '@mui/material';

const drawerWidth = 265;

const SideNavFallback = () => {
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          border: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <CircularProgress color="primary" />
    </Drawer>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // [修改建议] 移除 overflowX: 'auto'。我们的目标是让内部内容自适应，而不是让整个页面出现横向滚动条。
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Suspense fallback={<SideNavFallback />}>
        <SideNav />
      </Suspense>
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.default',
          p: 3,
          // [修改建议] 允许主内容区在内容过长时垂直滚动。
          // 这将滚动限制在主内容区，而不是整个浏览器窗口。
          overflow: 'auto', 
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
