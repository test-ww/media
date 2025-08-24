"use client";

import { useState } from "react";
import { Modal, Box, TextField, Button, Tabs, Tab, Alert, CircularProgress } from "@mui/material";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseInstances } from "../../lib/firebase/client";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
  };

  const handleAuthAction = async () => {
    setError(null);
    setIsLoading(true);
    const { auth } = getFirebaseInstances();

    try {
      if (tabValue === 0) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      let errorMessage = "An unknown error occurred.";
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-email':
            errorMessage = '无效的邮箱地址格式。';
            break;
          case 'auth/user-not-found':
            errorMessage = '找不到该用户。';
            break;
          case 'auth/wrong-password':
            errorMessage = '密码错误。';
            break;
          case 'auth/email-already-in-use':
            errorMessage = '该邮箱地址已被注册。';
            break;
          case 'auth/weak-password':
            errorMessage = '密码太弱，至少需要6个字符。';
            break;
          default:
            errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="登录" />
          <Tab label="注册" />
        </Tabs>
        <Box component="form" sx={{ mt: 2 }} onSubmit={(e) => { e.preventDefault(); handleAuthAction(); }}>
          <TextField margin="normal" required fullWidth id="email" label="邮箱地址" name="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
          <TextField margin="normal" required fullWidth name="password" label="密码" type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
          {error && (<Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>)}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : (tabValue === 0 ? "登录" : "注册")}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
