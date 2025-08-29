// 文件路径: lib/firebase/admin.ts

import * as admin from 'firebase-admin';

// 只有在服务器端才执行这段代码
if (typeof window === 'undefined') {
  // 检查是否已经初始化，防止重复执行
  if (!admin.apps.length) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      // 验证所有环境变量都已成功加载
      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('CRITICAL: One or more required Firebase Admin environment variables are missing! Check Cloud Run service configuration.');
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          // 当使用 Secret Manager 挂载时，私钥是完整的，无需任何 .replace() 操作
          privateKey: privateKey,
        }),
      });

      console.log('SUCCESS: Firebase Admin SDK initialized successfully.');

    } catch (error: any) {
      console.error('FATAL: Firebase Admin SDK initialization failed. See details below:');
      console.error(error.stack);
    }
  }
}

export default admin;
