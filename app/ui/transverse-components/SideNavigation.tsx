"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation"; // 1. 导入 useSearchParams
import { Drawer, List, ListItem, Typography, ListItemButton, Box, Collapse } from "@mui/material";
import Image from "next/image";
import { getNavConfig, NavItem, NavLink } from "../../nav-config";
import { AuthTrigger } from "../ux-components/AuthTrigger";
import { useAppContext } from "../../context/app-context";

// 导入图标
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const drawerWidth = 265;

// 这是一个独立的、可复用的导航链接组件，保留您所有的样式
const NavLinkItem = ({ link, isSelected, isChild = false }: { link: NavLink, isSelected: boolean, isChild?: boolean }) => {
  const router = useRouter();
  return (
    <ListItemButton
      key={link.id}
      selected={isSelected}
      onClick={() => router.push(link.href)}
      sx={{
        py: 1.5, px: 3, mb: 1, mx: 2, borderRadius: 2,
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        pl: isChild ? 4 : 3, // 子项增加缩进
        "&.Mui-selected": { backgroundColor: "primary.main", color: "white", "& .MuiTypography-root": { color: "white" } },
        "&.Mui-selected:hover": { backgroundColor: "primary.dark" },
      }}
    >
      <Typography variant="body1" fontWeight={600} color={isSelected ? "white" : "text.primary"}>
        {link.name}
      </Typography>
      <Typography variant="body2" color={isSelected ? "rgba(255,255,255,0.8)" : "text.secondary"} sx={{ fontSize: "0.8rem" }}>
        {link.description}
      </Typography>
    </ListItemButton>
  );
};

export default function SideNav() {
  const router = useRouter(); // 保留 router
  const pathname = usePathname();
  const searchParams = useSearchParams(); // 2. 获取 searchParams 实例
  const { appContext } = useAppContext();
  const navConfig = getNavConfig();

  // 3. 【核心修复】: 重建完整的当前路径，用于精确匹配
  const currentQueryString = searchParams.toString();
  const currentPath = currentQueryString ? `${pathname}?${currentQueryString}` : pathname;

  const [isStudioOpen, setStudioOpen] = useState(true);
  const handleStudioClick = () => {
    setStudioOpen(!isStudioOpen);
  };

  const CustomizedDrawer = {
    width: drawerWidth,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
      width: drawerWidth,
      boxSizing: "border-box",
      bgcolor: "background.paper",
      borderRight: "1px solid rgba(255, 255, 255, 0.12)",
      display: 'flex',
      flexDirection: 'column',
    },
  };

  return (
    <Drawer variant="permanent" anchor="left" sx={CustomizedDrawer}>
      <List sx={{ p: 0, flexGrow: 1 }}>
        <ListItem sx={{ height: 80, display: "flex", alignItems: "center", px: 2 }}>
          <Image
            priority
            src="/CloudPuppy.svg"
            width={180}
            height={50}
            alt="CloudPuppy 标志"
          />
        </ListItem>

        {navConfig.map((item: NavItem) => {
          // 如果是可折叠的组
          if (item.type === 'group') {
            return (
              <div key={item.id}>
                <ListItemButton onClick={handleStudioClick} sx={{ py: 1.5, px: 3, mb: 1, mx: 2, borderRadius: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={700}>{item.name}</Typography>
                  </Box>
                  {isStudioOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={isStudioOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) =>
                      child.status === 'true' ? (
                        <NavLinkItem
                          key={child.id}
                          link={child}
                          // 4. 【核心修复】: 使用完整的 currentPath 进行精确比较
                          isSelected={currentPath === child.href}
                          isChild={true}
                        />
                      ) : null
                    )}
                  </List>
                </Collapse>
              </div>
            );
          }

          // 如果是直接链接
          if (item.type === 'link') {
            return item.status === 'true' ? (
              <NavLinkItem
                key={item.id}
                link={item}
                // 4. 【核心修复】: 使用完整的 currentPath 进行精确比较
                isSelected={currentPath === item.href}
              />
            ) : null;
          }

          return null;
        })}
      </List>

      {/* 保留您原始的底部结构 */}
      <Box sx={{ p: 2 }}>
        <AuthTrigger />
      </Box>

      <Box sx={{ pb: 2, px: 3, width: "100%" }}>
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
