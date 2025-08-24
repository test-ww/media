// app/api/auth-and-quota.ts
"use server";

import * as admin from "firebase-admin";
import { headers } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

// ========================================================================
//  【核心修改】: 创建一个懒加载初始化函数
// ========================================================================
/**
 * 这个函数确保 Firebase Admin SDK 只被初始化一次。
 * 它会检查是否已有 app 实例，如果没有，则使用环境变量进行初始化。
 * 这种模式避免了在构建时（build-time）执行初始化。
 */
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    // 检查运行时环境变量是否存在
    if (!serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error("Firebase Admin credentials are not set in the environment.");
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  // 返回 admin 命名空间，其中包含 firestore() 和 auth() 等方法
  return admin;
}

type ServiceName = "gemini" | "imagen" | "veo";

// ========================================================================
//  函数 1：验证 Token 并管理配额 (修改后)
// ========================================================================
export async function verifyTokenAndManageQuota(
  serviceName: ServiceName
): Promise<{ uid: string }> {
  const admin = getFirebaseAdmin(); // <-- 在函数开始时调用初始化
  const db = admin.firestore();

  const authorization = headers().get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authorization header is missing or invalid.");
  }
  const token = authorization.split("Bearer ")[1];
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    throw new Error("Invalid or expired authentication token. Please log in again.");
  }
  const { uid } = decodedToken;
  const userRef = db.collection("users").doc(uid);
  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("User profile not found. Please try again in a moment.");
      }
      const userData = userDoc.data();
      const currentQuota = userData?.quotas?.[serviceName] ?? 0;
      if (currentQuota <= 0) {
        throw new Error(`Your quota for the '${serviceName}' service has been exhausted.`);
      }
      transaction.update(userRef, {
        [`quotas.${serviceName}`]: FieldValue.increment(-1),
        [`usage.${serviceName}`]: FieldValue.increment(1),
      });
    });
    console.log(`Quota check passed for user ${uid} on service ${serviceName}.`);
    return { uid };
  } catch (error: any) {
    console.error(`Quota management failed for user ${uid}:`, error);
    throw new Error(error.message || "Failed to process request due to a quota issue.");
  }
}

// ========================================================================
//  函数 2：只验证 Token (修改后)
// ========================================================================
export async function verifyTokenOnly(): Promise<{ uid: string }> {
  const admin = getFirebaseAdmin(); // <-- 在函数开始时调用初始化

  const authorization = headers().get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authorization header is missing or invalid.");
  }
  const token = authorization.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid } = decodedToken;
    console.log(`Token verified for user ${uid}.`);
    return { uid };
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    throw new Error("Invalid or expired authentication token. Please log in again.");
  }
}
