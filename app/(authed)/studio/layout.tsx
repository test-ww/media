"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";

// 【核心第二步】: 导入我们唯一的 useAppContext
import { useAppContext } from "../../context/app-context";

// 导入您的侧边栏导航
import SideNav from "../../ui/transverse-components/SideNavigation"; // 请确保路径正确

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { appContext } = useAppContext();
  const user = appContext?.user;
  const isLoading = appContext?.isLoading;

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>正在验证您的身份...</Typography>
      </Box>
    );
  }

  if (user) {
    return (
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <SideNav />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            p: 3,
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  return null;
}

