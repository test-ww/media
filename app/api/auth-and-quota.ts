"use server";

import * as admin from "firebase-admin";
import { headers } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

export type ServiceName = "gemini" | "imagen" | "veo";

export async function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };
    if (!serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error("Firebase Admin 凭证未在环境中设置。");
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}

/**
 * 【核心修改 - 新增函数】: 验证Token并检查配额（不扣减）
 * 这个函数只检查用户是否有权限和足够的配额来执行操作。
 * @returns 返回用户的 UID，如果检查失败则抛出错误。
 */
export async function verifyTokenAndCheckQuota(
  serviceName: ServiceName,
  idToken?: string
): Promise<{ uid: string }> {
  const admin = await getFirebaseAdmin();
  const db = admin.firestore();
  const token = idToken || headers().get("Authorization")?.split("Bearer ")[1];

  if (!token) {
    throw new Error("身份验证令牌缺失。");
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("验证 Firebase ID token 时出错:", error);
    throw new Error("身份验证令牌无效或已过期，请重新登录。");
  }

  if (!decodedToken.email_verified) {
    throw new Error("邮箱未验证。请检查您的收件箱并验证您的邮箱地址以使用此功能。");
  }

  const { uid } = decodedToken;
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("未找到用户个人资料。");
  }

  const userData = userDoc.data();
  const currentQuota = userData?.quotas?.[serviceName] ?? 0;

  if (currentQuota <= 0) {
    throw new Error(`您用于 '${serviceName}' 服务的配额已用尽。`);
  }

  console.log(`配额检查通过，用户 ${uid} 的服务 ${serviceName} 尚有 ${currentQuota} 次。`);
  return { uid };
}

/**
 * 【核心修改 - 新增函数】: 扣减指定服务的配额
 * 这个函数应该在核心API操作成功后调用。
 * @param uid 用户的UID
 * @param serviceName 要扣减配额的服务名称
 */
export async function deductQuota(
  uid: string,
  serviceName: ServiceName
): Promise<void> {
  const admin = await getFirebaseAdmin();
  const db = admin.firestore();
  const userRef = db.collection("users").doc(uid);

  try {
    await userRef.update({
      [`quotas.${serviceName}`]: FieldValue.increment(-1),
      [`usage.${serviceName}`]: FieldValue.increment(1),
    });
    console.log(`成功为用户 ${uid} 的服务 ${serviceName} 扣除1次配额。`);
  } catch (error: any) {
    console.error(`为用户 ${uid} 扣减配额失败:`, error);
    // 注意：即使这里失败，我们也不向上抛出错误，因为主流程已经成功。
    // 记录错误供后续审计即可。
  }
}


/**
 * 【保留函数，但不再是主要流程】
 * 这个函数现在可以被视为一个“一站式”操作，但在我们的新流程中不再使用。
 * 保留它以防其他地方有依赖，或者可以安全地删除它。
 */
export async function verifyTokenAndManageQuota(
  serviceName: ServiceName,
  idToken?: string
): Promise<{ uid: string }> {
  console.warn("DEPRECATED: verifyTokenAndManageQuota is called. Please refactor to use verifyTokenAndCheckQuota and deductQuota separately.");
  const { uid } = await verifyTokenAndCheckQuota(serviceName, idToken);
  await deductQuota(uid, serviceName);
  return { uid };
}


export async function verifyTokenOnly(idToken?: string): Promise<{ uid: string }> {
  const admin = await getFirebaseAdmin();
  const token = idToken || headers().get("Authorization")?.split("Bearer ")[1];

  if (!token) {
    throw new Error("身份验证令牌缺失。");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    if (!decodedToken.email_verified) {
      throw new Error("邮箱未验证。请检查您的收件箱并验证您的邮箱地址。");
    }

    const { uid } = decodedToken;
    console.log(`Token verified for user ${uid}.`);
    return { uid };
  } catch (error: any) {
    console.error("验证 Firebase ID token 时出错:", error);
    throw new Error(error.message || "身份验证令牌无效或已过期，请重新登录。");
  }
}
