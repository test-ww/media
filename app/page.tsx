"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Link from "next/link";
import Image from "next/image";
import { AuthTrigger } from "./ui/ux-components/AuthTrigger";
import { useAppContext } from "./context/app-context";
import { useRouter } from "next/navigation";

// 恢复了导航链接的首页导航栏
const HomePageHeader = () => {
  return (
    <Box
      component="header"
      sx={{
        position: "absolute", top: 0, left: 0, width: "100%",
        p: "20px 50px", display: "flex", justifyContent: "space-between",
        alignItems: "center", zIndex: 10,
      }}
    >
      <Link href="/" passHref>
        <Image src="/cloudpuppy-logo.png" alt="CloudPuppy Logo" width={220} height={60} />
      </Link>

      <Box sx={{ display: "flex", alignItems: "center", gap: "40px" }}>
        <Box component="nav" sx={{ display: "flex", gap: "30px", alignItems: "center" }}>
          {/* 三个主导航链接 */}
          <Link href="/studio/generate?mode=image" style={{ color: "white", textDecoration: "none", fontSize: "1rem" }}>
            创作者工作室
          </Link>
          <Link href="/gemini" style={{ color: "white", textDecoration: "none", fontSize: "1rem" }}>
            Gemini 实验室
          </Link>
          <Link href="/gallery" style={{ color: "white", textDecoration: "none", fontSize: "1rem" }}>
            作品展览馆
          </Link>
        </Box>
        <AuthTrigger />
      </Box>
    </Box>
  );
};

export default function Page() {
  const { appContext } = useAppContext();
  const router = useRouter();

  // 点击“开启创作之旅”按钮的逻辑
  const handleStartJourney = () => {
    if (appContext?.user) {
      // 如果已登录，直接进入工作室
      router.push('/studio/generate?mode=image');
    } else {
      // 如果未登录，触发登录流程 (AuthTrigger 会处理模态框)
      // 我们在这里可以什么都不做，或者显式地触发登录
      // AuthTrigger 已经包含了登录按钮，所以这里的 Link 行为是正确的
    }
  };

  return (
    <Box component="main" sx={{ height: "100vh", width: "100vw", overflow: "hidden", position: "relative", bgcolor: "black" }}>
      <video autoPlay loop muted playsInline style={{ position: "absolute", top: "50%", left: "50%", width: "100%", height: "100%", objectFit: "cover", transform: "translate(-50%, -50%)", zIndex: 1 }}>
        <source src="/background-video.mp4" type="video/mp4" />
      </video>
      <HomePageHeader />
      <Box sx={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", color: "white", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
        <Box component="h1" sx={{ typography: "h1", fontWeight: "bold", fontSize: { xs: "3rem", md: "4.5rem" }, mb: 2 }}>
          创意，从此有了最佳拍档
        </Box>
        <Box component="h2" sx={{ typography: "h3", fontWeight: "bold", fontSize: { xs: "1.8rem", md: "2.8rem" }, mb: 3, letterSpacing: "1px" }}>
          用简单的指令，获取非凡的视觉内容
        </Box>
        <Box component="p" sx={{ typography: "h6", maxWidth: "650px", mb: 5, px: 2, lineHeight: 1.7 }}>
          无论是生成全新概念、编辑现有图像还是制作营销视频，CloudPuppy 都是您忠实的创意助手，助您更智能、更高效地完成工作。
        </Box>
        <Link href="/studio/generate?mode=image" passHref>
          <Box component="button" onClick={handleStartJourney} sx={{ padding: "18px 70px", fontSize: "1.5rem", color: "white", background: "linear-gradient(90deg, #00c6ff, #0072ff)", border: "none", borderRadius: "50px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 20px rgba(0, 198, 255, 0.5)", transition: "transform 0.3s ease, box-shadow 0.3s ease", "&:hover": { transform: "scale(1.05)", boxShadow: "0 6px 25px rgba(0, 198, 255, 0.7)" } }}>
            开启创作之旅
          </Box>
        </Link>
      </Box>
    </Box>
  );
}
