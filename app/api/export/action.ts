// app/api/export/action.ts
"use server";

// 【修改】不再导入旧的 auth-utils
// import { getUserEmail } from '../auth-utils';

// 【修改】导入我们已经改造过的、现在可以独立处理认证的 addNewFirestoreEntry 函数
import { addNewFirestoreEntry } from "../firestore/action";
import { ExportMediaFormI, ExportMediaFormFieldsI } from "../export-utils";

/**
 * Server Action to save media metadata to the Firestore library.
 * It now relies on the downstream `addNewFirestoreEntry` function to handle
 * user authentication and data ownership internally.
 *
 * @param entryID - A unique ID for the media entry.
 * @param data - The form data containing the media to export and other details.
 * @param exportImageFormFields - The definition of the form fields.
 * @returns An object indicating success or an error message.
 */
export async function saveMediaToLibrary(
  entryID: string,
  data: ExportMediaFormI,
  exportImageFormFields: ExportMediaFormFieldsI
) {
  try {
    // 【修改】直接调用 addNewFirestoreEntry。
    // 我们已经修改了 addNewFirestoreEntry，它现在会在自己的函数体内调用 verifyTokenOnly() 来获取用户 UID。
    // 我们不再需要在这里手动获取和传递用户信息。
    const result = await addNewFirestoreEntry(
      entryID,
      data,
      exportImageFormFields
    );

    // 检查 Firestore 操作是否返回了错误
    if (typeof result === "object" && result.error) {
      throw new Error(result.error);
    }

    // 成功，返回包含时间戳的结果
    return { success: true, timestamp: result };
  } catch (error) {
    console.error("Failed to save to library:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    // 返回一个包含错误信息的对象给前端
    return { error: `Failed to save media to the library. Details: ${errorMessage}` };
  }
}
