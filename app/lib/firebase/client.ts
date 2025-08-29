import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions"; // 1. 导入 getFunctions

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 将所有实例声明在函数外部，以便缓存
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions; // 2. 声明 functions 变量

export function getFirebaseInstances() {
  // 只有在第一次调用时才执行初始化
  if (!app) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    // 3. 初始化 Cloud Functions 实例，并指定区域
    functions = getFunctions(app, 'us-central1');
  }

  // 4. 在返回的对象中包含 functions
  return { app, auth, db, functions };
}
