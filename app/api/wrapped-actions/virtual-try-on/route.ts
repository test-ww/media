// app/api/wrapped-actions/virtual-try-on/route.ts
import { NextResponse } from "next/server";
import { generateVtoImage } from "../../../api/virtual-try-on/action"; // 导入您现有的 Server Action

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 从请求体中直接解构出需要的参数
    const { formData, appContext } = body;

    // 检查必要的参数是否存在
    if (!formData || !appContext) {
      return NextResponse.json({ error: "Missing 'formData' or 'appContext' in request body." }, { status: 400 });
    }

    // 调用原始的 Server Action
    const result = await generateVtoImage(formData, appContext);

    // 返回结果
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error in /api/wrapped-actions/virtual-try-on:`, error);
    return NextResponse.json({ error: error.message || "An internal server error occurred." }, { status: 500 });
  }
}
