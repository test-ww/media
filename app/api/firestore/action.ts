"use server";

import { verifyTokenOnly } from "../auth-and-quota";
// <-- 【核心修复】: 使用静态、顶层的 import
import { Firestore, FieldValue, Timestamp } from "@google-cloud/firestore";
import { ExportMediaFormI, MediaMetadataI, ExportMediaFormFieldsI } from "../export-utils";
import { deleteMedia } from "../cloud-storage/action";

// <-- 【核心修复】: 创建一个单一、共享的 Firestore 客户端实例 (Singleton Pattern)
// 这解决了 "A is not a constructor" 的生产环境构建错误，并且性能更高。
const db = new Firestore({
  ignoreUndefinedProperties: true,
});


/**
 * Adds a new entry to the Firestore database.
 * (您的 idToken 逻辑是正确的)
 */
export async function addNewFirestoreEntry(
  entryID: string,
  data: ExportMediaFormI,
  ExportImageFormFields: ExportMediaFormFieldsI,
  idToken: string // <-- 您的修改是正确的
) {
  try {
    const { uid } = await verifyTokenOnly(idToken); // <-- 您的修改是正确的

    const document = db.collection("metadata").doc(entryID); // <-- 【核心修复】: 直接使用共享的 db 实例

    let cleanData: Partial<MediaMetadataI> = {};
    const combinedData = { ...data.mediaToExport, ...data };
    let combinedFilters: string[] = [];

    if (ExportImageFormFields) {
      Object.entries(ExportImageFormFields).forEach(([name, field]) => {
        const sourceProp = field.prop || name;
        const valueFromData = combinedData[sourceProp as keyof typeof combinedData];
        let transformedValue: any = valueFromData;

        if (Array.isArray(valueFromData) && valueFromData.every((item) => typeof item === "string")) {
          transformedValue = valueFromData.length > 0 ? Object.fromEntries(valueFromData.map((str) => [str, true])) : null;
          valueFromData.forEach((item) => combinedFilters.push(`${name}_${item}`));
        }

        (cleanData as any)[name] = transformedValue ?? null;
      });
    }

    const dataToSet = {
      ...cleanData,
      userId: uid,
      timestamp: FieldValue.serverTimestamp(), // <-- 【核心修复】: FieldValue 现在来自顶层 import
      combinedFilters: combinedFilters,
    };

    const res = await document.set(dataToSet);
    return res.writeTime.seconds;
  } catch (error: any) {
    console.error("Error in addNewFirestoreEntry:", error);
    throw new Error(error.message || "Error while setting new metadata entry to database.");
  }
}

/**
 * Fetches documents in batches from Firestore.
 * (您的 idToken 逻辑是正确的)
 */
export async function fetchDocumentsInBatches(
  idToken: string, // <-- 您的修改是正确的
  lastVisibleDocument?: any,
  filters?: any
) {
  try {
    const { uid } = await verifyTokenOnly(idToken); // <-- 您的修改是正确的

    const batchSize = 24;
    const collection = db.collection("metadata"); // <-- 【核心修复】: 直接使用共享的 db 实例
    let thisBatchDocuments: MediaMetadataI[] = [];

    let query = collection.where("userId", "==", uid);

    // ... (其余的查询逻辑保持不变)
    if (filters) {
      const filterEntries = Object.entries(filters).filter(([, values]) => Array.isArray(values) && values.length > 0);
      if (filterEntries.length > 0) {
        const combinedFilterEntries = filterEntries.flatMap(([filterKey, filterValues]) =>
          (filterValues as string[]).map((filterValue) => `${filterKey}_${filterValue}`)
        );
        if (combinedFilterEntries.length > 0)
          query = query.where("combinedFilters", "array-contains-any", combinedFilterEntries);
      }
    }
    query = query.orderBy("timestamp", "desc").limit(batchSize);
    if (lastVisibleDocument) {
      query = query.startAfter(
        new Timestamp(
          Math.floor(lastVisibleDocument.timestamp / 1000),
          (lastVisibleDocument.timestamp % 1000) * 1000000
        )
      );
    }
    const snapshot = await query.get();
    // ... (其余的快照处理逻辑保持不变)
    if (snapshot.empty) {
      return { thisBatchDocuments: null, lastVisibleDocument: null, isMorePageToLoad: false };
    }
    thisBatchDocuments = snapshot.docs.map((doc) => {
      const data = doc.data();
      // 从返回给客户端的数据中删除敏感或不必要的字段
      delete data.timestamp;
      delete data.combinedFilters;
      return data as MediaMetadataI;
    });
    const newLastVisibleDocument = {
      id: snapshot.docs[snapshot.docs.length - 1].id,
      timestamp:
        snapshot.docs[snapshot.docs.length - 1].data().timestamp.seconds * 1000 +
        snapshot.docs[snapshot.docs.length - 1].data().timestamp.nanoseconds / 1000000,
    };
    // ... (其余的分页逻辑保持不变)
    let nextPageQuery = collection.where("userId", "==", uid);
    if (filters) {
      const filterEntries = Object.entries(filters).filter(([, values]) => Array.isArray(values) && values.length > 0);
      if (filterEntries.length > 0) {
        const combinedFilterEntries = filterEntries.flatMap(([filterKey, filterValues]) =>
          (filterValues as string[]).map((filterValue) => `${filterKey}_${filterValue}`)
        );
        if (combinedFilterEntries.length > 0)
          nextPageQuery = nextPageQuery.where("combinedFilters", "array-contains-any", combinedFilterEntries);
      }
    }
    nextPageQuery = nextPageQuery
      .orderBy("timestamp", "desc")
      .limit(1)
      .startAfter(
        new Timestamp(
          Math.floor(newLastVisibleDocument.timestamp / 1000),
          (newLastVisibleDocument.timestamp % 1000) * 1000000
        )
      );
    const nextPageSnapshot = await nextPageQuery.get();
    const isMorePageToLoad = !nextPageSnapshot.empty;

    return {
      thisBatchDocuments: thisBatchDocuments,
      lastVisibleDocument: newLastVisibleDocument,
      isMorePageToLoad: isMorePageToLoad,
    };

  } catch (error: any) {
    console.error("Error in fetchDocumentsInBatches:", error);
    return { error: error.message || "Error while fetching metadata" };
  }
}

/**
 * Deletes a batch of documents from Firestore and their corresponding GCS files.
 * (您的 idToken 逻辑是正确的)
 */
export async function firestoreDeleteBatch(
  idsToDelete: string[],
  currentMedias: MediaMetadataI[],
  idToken: string // <-- 您的修改是正确的
): Promise<boolean | { error: string }> {
  try {
    const { uid } = await verifyTokenOnly(idToken); // <-- 您的修改是正确的

    const collection = db.collection("metadata"); // <-- 【核心修复】: 直接使用共享的 db 实例
    const batch = db.batch(); // <-- 【核心修复】: 直接使用共享的 db 实例

    const gcsDeletionPromises: Promise<void>[] = [];

    if (!idsToDelete || idsToDelete.length === 0) {
      return true;
    }

    for (const id of idsToDelete) {
      const mediaItem = currentMedias.find((media) => media.id === id);

      if (mediaItem && mediaItem.userId !== uid) {
        console.warn(`Security Alert: User '${uid}' attempted to delete media '${id}' owned by '${mediaItem.userId}'. Operation blocked.`);
        continue;
      }

      if (mediaItem && mediaItem.gcsURI)
        gcsDeletionPromises.push(
          // 您的修改是正确的: 为 deleteMedia 也传递 idToken
          deleteMedia(mediaItem.gcsURI, idToken)
            .then(() => {
              console.log(`Successfully deleted GCS file: ${mediaItem.gcsURI} for document ID: ${id}`);
            })
            .catch((error: any) => {
              console.error(`Failed to delete GCS file ${mediaItem.gcsURI} for document ID: ${id}. Error:`, error);
            })
        );

      const docRef = collection.doc(id);
      batch.delete(docRef);
    }

    if (gcsDeletionPromises.length > 0) await Promise.all(gcsDeletionPromises);

    await batch.commit();
    return true;
  } catch (error: any) {
    console.error("Firestore batch commit failed:", error);
    return { error: error.message || `Firestore batch deletion failed.` };
  }
}
