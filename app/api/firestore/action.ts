"use server";

// 导入我们新的认证工具函数
import { verifyTokenOnly } from "../auth-and-quota";

// 【核心修复】: 导入所有需要的类型
import type { Firestore, FieldValue, Timestamp } from "@google-cloud/firestore";
import { ExportMediaFormI, MediaMetadataI, ExportMediaFormFieldsI } from "../export-utils";
import { deleteMedia } from "../cloud-storage/action";

// 【核心修复】: 已移除顶层的 'const { Firestore, FieldValue } = require("@google-cloud/firestore");' 和 new Firestore()

// 【核心修复】: 创建一个辅助函数来按需初始化 Firestore 客户端
async function getFirestoreClient(): Promise<{ firestore: Firestore, FieldValue: typeof FieldValue, Timestamp: typeof Timestamp }> {
    const { Firestore, FieldValue, Timestamp } = await import("@google-cloud/firestore");
    const firestore = new Firestore();
    // 全局设置在这里配置
    firestore.settings({ ignoreUndefinedProperties: true });
    return { firestore, FieldValue, Timestamp };
}

export async function addNewFirestoreEntry(
    entryID: string,
    data: ExportMediaFormI,
    ExportImageFormFields: ExportMediaFormFieldsI
) {
    let authResult;
    try {
        authResult = await verifyTokenOnly();
    } catch (error: any) {
        return { error: error.message };
    }
    const { uid } = authResult;

    try {
        const { firestore, FieldValue } = await getFirestoreClient();
        const document = firestore.collection("metadata").doc(entryID);

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
            timestamp: FieldValue.serverTimestamp(),
            combinedFilters: combinedFilters,
        };

        // 【最终修复】: 移除 set 操作中的 ignoreUndefinedProperties 选项
        const res = await document.set(dataToSet);
        return res.writeTime.seconds;
    } catch (error) {
        console.error(error);
        return {
            error: "Error while setting new metadata entry to database.",
        };
    }
}

export async function fetchDocumentsInBatches(lastVisibleDocument?: any, filters?: any) {
    let authResult;
    try {
        authResult = await verifyTokenOnly();
    } catch (error: any) {
        return { error: error.message };
    }
    const { uid } = authResult;

    try {
        const { firestore, Timestamp } = await getFirestoreClient();
        const batchSize = 24;
        const collection = firestore.collection("metadata");
        let thisBatchDocuments: MediaMetadataI[] = [];

        let query = collection.where("userId", "==", uid);

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

        if (snapshot.empty) {
            return { thisBatchDocuments: null, lastVisibleDocument: null, isMorePageToLoad: false };
        }

        thisBatchDocuments = snapshot.docs.map((doc) => {
            const data = doc.data();
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
    } catch (error) {
        console.error(error);
        return {
            error: "Error while fetching metadata",
        };
    }
}

export async function firestoreDeleteBatch(
    idsToDelete: string[],
    currentMedias: MediaMetadataI[]
): Promise<boolean | { error: string }> {
    let authResult;
    try {
        authResult = await verifyTokenOnly();
    } catch (error: any) {
        return { error: error.message };
    }
    const { uid } = authResult;

    try {
        const { firestore } = await getFirestoreClient();
        const collection = firestore.collection("metadata");
        const batch = firestore.batch();

        const gcsDeletionPromises: Promise<void>[] = [];

        if (!idsToDelete || idsToDelete.length === 0) {
            console.log("No IDs provided for deletion. Exiting.");
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
                    deleteMedia(mediaItem.gcsURI)
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
    } catch (error) {
        console.error("Firestore batch commit failed:", error);
        return { error: `Firestore batch deletion failed.` };
    }
}
