"use client";

/**
 * 将 File 对象转换为 Base64 编码的 Data URL 字符串。
 * @param file - 要转换的 File 对象。
 * @returns 返回一个包含 Base64 Data URL 的 Promise (e.g., "data:image/png;base64,iVBORw...").
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as a string."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}
