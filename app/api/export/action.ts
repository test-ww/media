"use server";

import { addNewFirestoreEntry } from "../firestore/action";
import { ExportMediaFormI, ExportMediaFormFieldsI } from "../export-utils";

/**
 * Server action to save media metadata to the library.
 * It receives an idToken and passes it down to the Firestore action.
 */
export async function saveMediaToLibrary(
  entryID: string,
  data: ExportMediaFormI,
  exportImageFormFields: ExportMediaFormFieldsI,
  idToken: string // <-- 正确地接收 idToken
) {
  try {
    // 将接收到的所有参数（包括 idToken）传递给底层的 Firestore 操作
    const result = await addNewFirestoreEntry(
      entryID,
      data,
      exportImageFormFields,
      idToken // <-- 正确地传递 idToken
    );

    // 注意：addNewFirestoreEntry 成功时返回 timestamp，失败时会抛出错误
    return { success: true, timestamp: result };

  } catch (error) {
    console.error("Failed to save to library:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    // 将详细的错误信息返回给前端，以便调试
    return { error: `Failed to save media to the library. Details: ${errorMessage}` };
  }
}
