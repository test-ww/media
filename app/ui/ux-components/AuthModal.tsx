"use client";

import { useState, useEffect } from "react";
import { Modal, Box, TextField, Button, Tabs, Tab, Alert, CircularProgress } from "@mui/material";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
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
  borderRadius: 2,
};

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 【新增】: 控制“重新发送”按钮的显示和状态
  const [showResendButton, setShowResendButton] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccessMessage(null);
    setShowResendButton(false); // 切换标签时隐藏按钮
  };

  // 【新增】: 处理重新发送邮件的逻辑
  const handleResendVerification = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsResending(true);
    const { auth } = getFirebaseInstances();

    try {
      // 需要重新登录一次来获取 user 对象，然后才能发送邮件
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        setSuccessMessage("新的验证邮件已成功发送！");
      }
      // 发送后立即登出
      await signOut(auth);
    } catch (err: any) {
      setError("操作失败，请确认您的邮箱和密码是否正确。");
    } finally {
      setIsResending(false);
      setShowResendButton(false); // 发送后隐藏按钮，防止滥用
    }
  };

  const handleAuthAction = async () => {
    setError(null);
    setSuccessMessage(null);
    setShowResendButton(false); // 每次操作前都重置
    setIsLoading(true);
    const { auth } = getFirebaseInstances();

    try {
      if (tabValue === 0) { // 登录逻辑
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        if (!userCredential.user.emailVerified) {
          await signOut(auth); // 登出
          // 【核心修改】: 抛出特定错误，并准备显示“重新发送”按钮
          const err = new Error("您的邮箱尚未验证。");
          err.name = "EmailNotVerified"; // 自定义错误名称
          throw err;
        }

        onClose();

      } else { // 注册逻辑
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        setSuccessMessage("注册成功！一封验证邮件已发送到您的邮箱，请点击链接完成验证后再登录。");
      }
    } catch (err: any) {
      // 【核心修改】: 捕获我们自定义的错误
      if (err.name === "EmailNotVerified") {
        setError(err.message);
        setShowResendButton(true); // 显示“重新发送”按钮
        return; // 提前返回，不进入 finally 的 setIsLoading(false)
      }

      let errorMessage = "发生未知错误，请稍后再试。";
      // ... (其余错误处理逻辑保持不变)
      setError(errorMessage);
    } finally {
      // 只有在非“邮箱未验证”错误时才设置 loading 为 false
      if (!showResendButton) {
        setIsLoading(false);
      }
    }
  };

  const handleModalClose = (event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    if (isLoading || isResending) return;
    onClose();
  };

  useEffect(() => {
    if (!open) {
        const timer = setTimeout(() => {
            setTabValue(0);
            setEmail("");
            setPassword("");
            setError(null);
            setSuccessMessage(null);
            setIsLoading(false);
            setShowResendButton(false);
            setIsResending(false);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Modal open={open} onClose={handleModalClose}>
      <Box sx={style}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="登录" />
          <Tab label="注册" />
        </Tabs>
        <Box component="form" sx={{ mt: 2 }} onSubmit={(e) => { e.preventDefault(); handleAuthAction(); }}>
          <TextField margin="normal" required fullWidth label="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading || isResending} />
          <TextField margin="normal" required fullWidth label="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading || isResending} />

          {error && (<Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>)}
          {successMessage && (<Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>)}

          {/* 【新增】: 条件渲染“重新发送”按钮 */}
          {showResendButton && (
            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={handleResendVerification}
              disabled={isResending}
            >
              {isResending ? <CircularProgress size={24} /> : '重新发送验证邮件'}
            </Button>
          )}

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading || isResending}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : (tabValue === 0 ? "登录" : "注册")}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
