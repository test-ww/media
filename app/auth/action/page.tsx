'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, applyActionCode } from 'firebase/auth';
import { getFirebaseInstances } from '@/app/lib/firebase/client';

function ActionHandler() {
  const router = useRouter();
  const [message, setMessage] = useState('正在验证您的邮箱，请稍候...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAction = async () => {
      const { auth } = getFirebaseInstances();
      // 从 URL 中获取 action code
      const actionCode = new URL(window.location.href).searchParams.get('oobCode');

      if (!actionCode) {
        setError("链接无效或已损坏。");
        return;
      }

      try {
        // 【核心】: 使用 Firebase Client SDK 应用 action code
        // 这会确认邮箱验证，并将用户的 emailVerified 状态更新为 true
        await applyActionCode(auth, actionCode);

        setMessage("邮箱验证成功！3秒后将自动跳转到首页，您现在可以登录了。");
        setTimeout(() => router.push('/'), 3000); // 跳转到首页

      } catch (err: any) {
        console.error("Email verification failed:", err);
        setError(`验证失败：${err.message}`);
      }
    };

    handleAction();
  }, [router]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', color: 'white', backgroundColor: '#121212', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1>邮箱验证</h1>
      {error ? (
        <p style={{ color: '#f44336', fontWeight: 'bold' }}>{error}</p>
      ) : (
        <p style={{ color: '#4caf50', fontWeight: 'bold' }}>{message}</p>
      )}
      <p>您可以关闭此页面。</p>
    </div>
  );
}

export default function ActionHandlerPage() {
    return (
        <Suspense fallback={<div style={{color: 'white', textAlign: 'center', paddingTop: '50px'}}>Loading...</div>}>
            <ActionHandler />
        </Suspense>
    );
}
