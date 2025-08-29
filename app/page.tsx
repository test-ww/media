"use client";

import * as React from "react";
import { useEffect } from "react"; // 1. 导入 useEffect Hook
import { useRouter } from "next/navigation"; // 1. 导入 useRouter Hook
import Box from "@mui/material/Box";
import Link from "next/link";
import Image from "next/image";
import { AuthTrigger } from "./ui/ux-components/AuthTrigger";
import { useAppContext } from "./context/app-context"; // 1. 导入 useAppContext

// 简化后的新主页导航栏，只包含 Logo 和登录/注册按钮
const HomePageHeader = () => {
  return (
    <Box
      component="header"
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        p: "20px 50px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <Link href="/" passHref>
        <Image
          src="/cloudpuppy-logo.png"
          alt="CloudPuppy Logo"
          width={220}
          height={60}
        />
      </Link>
      <AuthTrigger />
    </Box>
  );
};

export default function Page() {
  // 2. 获取用户状态和路由实例
  const { appContext } = useAppContext();
  const user = appContext?.user;
  const isLoading = appContext?.isLoading;
  const router = useRouter();

  // 3. 添加智能重定向的副作用钩子
  useEffect(() => {
    // 如果还在加载用户状态，则什么都不做
    if (isLoading) {
      return;
    }
    // 如果用户存在（已登录），则立即重定向到工作室
    if (user) {
      router.push('/studio/generate?mode=image');
    }
  }, [user, isLoading, router]);

  // 4. 如果用户未登录或正在重定向中，则显示公开首页内容
  // 这确保了未登录用户能看到此页面，而已登录用户在重定向前有内容可显示
  return (
    <Box
      component="main"
      sx={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        bgcolor: "black",
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "translate(-50%, -50%)",
          zIndex: 1,
        }}
      >
        <source src="/background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <HomePageHeader />

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <Box component="h1" sx={{ typography: "h1", fontWeight: "bold", fontSize: { xs: "3rem", md: "4.5rem" }, mb: 2 }}>
          创意，从此有了最佳拍档
        </Box>
        <Box component="h2" sx={{ typography: "h3", fontWeight: "bold", fontSize: { xs: "1.8rem", md: "2.8rem" }, mb: 3, letterSpacing: "1px" }}>
          用简单的指令，获取非凡的视觉内容
        </Box>
        <Box component="p" sx={{ typography: "h6", maxWidth: "650px", mb: 5, px: 2, lineHeight: 1.7 }}>
          无论是生成全新概念、编辑现有图像还是制作营销视频，CloudPuppy 都是您忠实的创意助手，助您更智能、更高效地完成工作。
        </Box>

        {/* 2. 将“开启创作之旅”按钮链接到工作室的默认页面 */}
        <Link href="/studio/generate?mode=image" passHref>
          <Box
            component="button"
            sx={{
              padding: "18px 70px",
              fontSize: "1.5rem",
              color: "white",
              background: "linear-gradient(90deg, #00c6ff, #0072ff)",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 20px rgba(0, 198, 255, 0.5)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 6px 25px rgba(0, 198, 255, 0.7)",
              },
            }}
          >
            开启创作之旅
          </Box>
        </Link>
      </Box>
    </Box>
  );
}
