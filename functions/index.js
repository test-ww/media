// functions/index.js
const {beforeUserCreated} = require("firebase-functions/v2/identity");
const {setGlobalOptions} = require("firebase-functions/v2");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

// 初始化服务
initializeApp();
setGlobalOptions({region: "us-central1"});
const db = getFirestore();

/**
 * Cloud Function: 在新用户创建时自动初始化其在 Firestore 中的配额
 * 这是此文件唯一的函数。
 */
exports.initializeNewUser = beforeUserCreated(async (event) => {
  const user = event.data;
  const {uid, email} = user;
  console.log(`Initializing quotas for new user: ${uid}`);

  const userRef = db.collection("users").doc(uid);

  const initialUserData = {
    email: email,
    createdAt: FieldValue.serverTimestamp(),
    role: "user",
    quotas: {
      gemini: 30,
      imagen: 20, // 供 Imagen 和 Virtual Try-On 共享
      veo: 5,
    },
    usage: {
      gemini: 0,
      imagen: 0,
      veo: 0,
    },
  };

  await userRef.set(initialUserData);
  console.log(`Successfully initialized document for user: ${uid}`);
});
