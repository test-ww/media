// 文件路径: app/api/upload/route.ts (最终无误版)
import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// 【核心修复 1】: 删除所有在顶层作用域的 Storage 和 bucket 初始化代码

export async function POST(req: NextRequest) {
  try {
    // 【核心修复 2】: 将所有依赖环境变量的初始化逻辑，移动到函数内部
    const gcsBucketName = process.env.NEXT_PUBLIC_GCS_UPLOAD_BUCKET;
    if (!gcsBucketName) {
      // 在运行时抛出错误，这会给前端返回一个清晰的 500 错误
      throw new Error("FATAL ERROR: NEXT_PUBLIC_GCS_UPLOAD_BUCKET environment variable is not set on the server.");
    }

    const storage = new Storage();
    const bucket = storage.bucket(gcsBucketName);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const gcsFile = bucket.file(`video-uploads/${fileName}`);

    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    const gcsUri = `gs://${gcsBucketName}/video-uploads/${fileName}`;

    console.log(`File ${file.name} uploaded to ${gcsUri}`);

    return NextResponse.json({ success: true, gcsUri: gcsUri });

  } catch (error: any) {
    console.error('Error uploading file to GCS:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file to the server.' }, { status: 500 });
  }
}
