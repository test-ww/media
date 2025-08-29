
const {beforeUserCreated} = require("firebase-functions/v2/identity");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
// const admin = require("firebase-admin");

// 初始化服务
initializeApp();
setGlobalOptions({region: "us-central1"});
const db = getFirestore();

/**
 * 【核心修改】: 新用户创建时，给予零配额并标记为待验证状态
 */
exports.initializeNewUser = beforeUserCreated(async (event) => {
  const user = event.data;
  const {uid, email} = user;
  console.log(`Initializing ZERO QUOTA document for new user: ${uid}`);

  const userRef = db.collection("users").doc(uid);

  const initialUserData = {
    email: email,
    createdAt: FieldValue.serverTimestamp(),
    role: "user",
    status: "pending_verification", // 新增状态字段
    quotas: { // 【关键】所有配额都为 0
      gemini: 0,
      imagen: 0,
      veo: 0,
    },
    usage: {
      gemini: 0,
      imagen: 0,
      veo: 0,
    },
  };

  await userRef.set(initialUserData);
  console.log(`Successfully initialized ZERO QUOTA document for user: ${uid}`);
});

/**
 * 【新增】: 用于在首次验证登录后，为用户授予初始配额
 */
exports.grantInitialQuotas = onCall(async (request) => {
  // 验证调用者身份
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "用户未经身份验证。");
  }
  const uid = request.auth.uid;
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new HttpsError("not-found", "未找到用户文档。");
  }

  // 只有在用户是 'pending_verification' 状态时才执行，防止重复授予
  if (userDoc.data().status === "pending_verification") {
    console.log(`Granting initial quotas for user: ${uid}`);
    await userRef.update({
      "status": "active",
      "quotas.gemini": 30,
      "quotas.imagen": 20,
      "quotas.veo": 5,
    });
    return {success: true, message: "配额已成功授予！"};
  }

  return {success: false, message: "账户已激活，无需重复操作。"};
});
