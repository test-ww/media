"use server";

import { getFirebaseAdmin } from "../auth-and-quota";
import { getAuth as getClientAuth } from "firebase/auth"; // 导入客户端 Auth
import { signInWithEmailAndPassword } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";

// 这个函数只在服务器端运行，用于验证密码
// 注意：这是一个非常规用法，因为它在服务器端使用了客户端 SDK。
// 这是为了利用 signInWithEmailAndPassword 的密码验证功能，而不影响 Admin SDK。
async function verifyPasswordOnServer(email: string, password: string): Promise<{ success: boolean }> {
  // 创建一个临时的、独立的 Firebase 客户端实例
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  };

  // 确保只初始化一次
  const appName = 'password-verifier';
  let app;
  if (!getApps().find(a => a.name === appName)) {
    app = initializeApp(firebaseConfig, appName);
  } else {
    app = getApps().find(a => a.name === appName)!;
  }

  const tempAuth = getClientAuth(app);

  try {
    await signInWithEmailAndPassword(tempAuth, email, password);
    // 如果成功，说明密码正确
    return { success: true };
  } catch (error) {
    // 如果失败，说明密码错误
    return { success: false };
  }
}


export async function checkUserStatus(email: string, password?: string): Promise<{ exists: boolean; verified: boolean; passwordMatch?: boolean; error?: string }> {
  try {
    const admin = await getFirebaseAdmin();
    const userRecord = await admin.auth().getUserByEmail(email);

    // 如果提供了密码，就进行密码验证
    if (password) {
      const passwordCheck = await verifyPasswordOnServer(email, password);
      return {
        exists: true,
        verified: userRecord.emailVerified,
        passwordMatch: passwordCheck.success,
      };
    }

    return {
      exists: true,
      verified: userRecord.emailVerified,
    };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return { exists: false, verified: false };
    }
    console.error("Error checking user status:", error);
    return { exists: false, verified: false, error: "检查用户状态时发生服务器错误。" };
  }
}
