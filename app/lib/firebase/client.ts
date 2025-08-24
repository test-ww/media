// 文件路径: app/lib/firebase/client.ts (生产环境最终版)
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// 这个配置对象现在将从构建时注入的环境变量中读取值
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 懒加载、单例模式的 Firebase 初始化函数
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

export function getFirebaseInstances() {
  if (!app) {
    // 检查 apiKey 是否存在，如果不存在则说明环境变量未注入，抛出错误
    if (!firebaseConfig.apiKey) {
      throw new Error("Firebase configuration is missing. Check your environment variables.");
    }
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
    }
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db };
}
