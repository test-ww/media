// app/ui/transverse-components/SideNavigation.tsx (最终正确版)
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Drawer, List, ListItem, Typography, ListItemButton, Box, Divider } from "@mui/material";
import Image from "next/image";
import { pages } from "../../routes"; // 确保路径正确
import { useAppContext } from "../../context/app-context"; // 确保路径正确


const drawerWidth = 265;

export default function SideNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("mode");
  const fullPath = currentQuery ? `${pathname}?mode=${currentQuery}` : pathname;

  const { appContext } = useAppContext();
  const isUserLoggedIn = !appContext?.isLoading && !!appContext?.user;

  const CustomizedDrawer = {
    width: drawerWidth,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
      width: drawerWidth,
      boxSizing: "border-box",
      bgcolor: "background.paper",
      borderRight: "1px solid rgba(255, 255, 255, 0.12)",
    },
  };

  return (
    <Drawer variant="permanent" anchor="left" sx={CustomizedDrawer}>
      <List sx={{ p: 0 }}>
        <ListItem sx={{ height: 80, display: "flex", alignItems: "center", px: 2 }}>
          <Image
            priority
            src="/CloudPuppy.svg"
            width={180}
            height={50}
            alt="CloudPuppy 标志"
          />
        </ListItem>

        {Object.values(pages).map(({ name, description, href, status }) => {
          const isSelected = fullPath === href;
          return (
            <ListItemButton
              key={name}
              selected={isSelected}
              disabled={status === "false"}
              onClick={() => router.push(href)}
              sx={{
                py: 1.5,
                px: 3,
                mb: 1,
                mx: 2,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "white",
                  "& .MuiTypography-root": {
                    color: "white",
                  },
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "primary.dark",
                },
              }}
            >
              <Typography variant="body1" fontWeight={600} color={isSelected ? "white" : "text.primary"}>
                {name}
              </Typography>
              <Typography variant="body2" color={isSelected ? "rgba(255,255,255,0.8)" : "text.secondary"} sx={{ fontSize: "0.8rem" }}>
                {description}
              </Typography>
            </ListItemButton>
          );
        })}

        {isUserLoggedIn && (
          <>
            <Divider sx={{ my: 1, mx: 2, borderColor: "rgba(255, 255, 255, 0.12)" }} />
            <ListItemButton
              key="manual-link"
              selected={pathname === "/manual"}
              onClick={() => router.push("/manual")}
              sx={{
                py: 1.5,
                px: 3,
                mb: 1,
                mx: 2,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "white",
                  "& .MuiTypography-root": { color: "white" },
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "primary.dark",
                },
              }}
            >
              <Typography variant="body1" fontWeight={600} color={pathname === "/manual" ? "white" : "text.primary"}>
                使用手册
              </Typography>
              <Typography variant="body2" color={pathname === "/manual" ? "rgba(255,255,255,0.8)" : "text.secondary"} sx={{ fontSize: "0.8rem" }}>
                快速上手指南
              </Typography>
            </ListItemButton>
          </>
        )}
      </List>

      {/* --- 核心修改：只保留版权信息，移除 AuthTrigger --- */}
      <Box sx={{ position: "absolute", bottom: 15, left: 24, width: "calc(100% - 48px)" }}>
        <Typography
          variant="caption"
          sx={{ color: "#5865F2", textAlign: "center", display: "block" }}
        >
          / 欢迎合作 <span style={{ margin: 1 }}>❤</span>{" "}
          <a href="https://cloudpuppy.ai/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}>
            @CloudPuppy
          </a>
        </Typography>
      </Box>
    </Drawer>
  );
}
