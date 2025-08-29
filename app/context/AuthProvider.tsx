'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseInstances } from '@/app/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { auth, db, functions } = getFirebaseInstances();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        // 用户已登录且邮箱已验证
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data().status === 'pending_verification') {
          // 【核心】: 如果用户状态是待验证，说明是首次验证后登录
          console.log("First verified login detected. Granting initial quotas...");
          try {
            const grantInitialQuotas = httpsCallable(functions, 'grantInitialQuotas');
            await grantInitialQuotas();
            console.log("Quotas granted successfully. Reloading to apply changes.");
            // 强制刷新页面，以确保所有组件（如显示配额的Header）都获取到最新的用户信息
            window.location.reload();
          } catch (error) {
            console.error("Failed to grant initial quotas:", error);
          }
        }
      }
    });

    // 在组件卸载时，清理认证状态的监听器
    return () => unsubscribe();
  }, []); // 空依赖数组确保此 effect 只在组件挂载时运行一次

  return <>{children}</>;
}
