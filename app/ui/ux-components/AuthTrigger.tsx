"use client";

import { useState } from "react";
import { Button, Box, Typography, CircularProgress } from "@mui/material";
import { signOut } from "firebase/auth";
import { getFirebaseInstances } from "../../lib/firebase/client";
import { useAppContext } from "../../context/app-context";
import { AuthModal } from "./AuthModal";

export function AuthTrigger() {
  const { appContext } = useAppContext();
  const [isModalOpen, setModalOpen] = useState(false);

  const handleLogout = async () => {
    const { auth } = getFirebaseInstances();
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (appContext?.isLoading) {
    return <CircularProgress size={24} />;
  }

  return (
    <div>
      {appContext?.user ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2">{appContext.user.email}</Typography>
          <Button variant="outlined" onClick={handleLogout}>
            登出
          </Button>
        </Box>
      ) : (
        <Button variant="contained" onClick={() => setModalOpen(true)}>
          登录 / 注册
        </Button>
      )}
      <AuthModal open={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
