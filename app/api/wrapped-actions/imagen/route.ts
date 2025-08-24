// app/api/wrapped-actions/imagen/route.ts
import { NextResponse } from "next/server";
import { generateImage, editImage, upscaleImage } from "../../../api/imagen/action"; // 导入您现有的 Server Actions
import { appContextDataI } from "../../../context/app-context"; // 导入所需的类型

/**
 * 这个 POST 函数将作为我们新的 API 端点，用于处理所有与 Imagen 相关的操作。
 * 它会根据请求体中的 'action' 字段来决定调用哪个 Server Action。
 */
export async function POST(request: Request) {
  try {
    // 从请求体中解析出前端传来的数据
    const body = await request.json();
    const { action, payload } = body;

    // 检查 action 字段是否存在
    if (!action) {
      return NextResponse.json({ error: "Action type is missing in the request body." }, { status: 400 });
    }

    let result;

    // 根据 action 的值，调用相应的 Server Action
    switch (action) {
      case "generateImage":
        // 确保 payload 包含 generateImage 所需的参数
        const { formData, areAllRefValid, isGeminiRewrite, appContext } = payload;
        result = await generateImage(formData, areAllRefValid, isGeminiRewrite, appContext);
        break;

      case "editImage":
        // 确保 payload 包含 editImage 所需的参数
        const { formData: editFormData, appContext: editAppContext } = payload;
        result = await editImage(editFormData, editAppContext);
        break;

      case "upscaleImage":
        // 确保 payload 包含 upscaleImage 所需的参数
        const { source, upscaleFactor, appContext: upscaleAppContext } = payload;
        result = await upscaleImage(source, upscaleFactor, upscaleAppContext);
        break;

      default:
        // 如果 action 类型不匹配，返回错误
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // 将 Server Action 的执行结果作为 JSON 返回给前端
    return NextResponse.json(result);

  } catch (error: any) {
    // 如果在处理过程中发生任何未捕获的错误，返回一个标准的 500 错误响应
    console.error(`Error in /api/wrapped-actions/imagen:`, error);
    return NextResponse.json({ error: error.message || "An internal server error occurred." }, { status: 500 });
  }
}
