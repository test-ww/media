import { NextResponse } from "next/server";
import { generateImage, editImage, upscaleImage } from "../../../api/imagen/action";
import { headers } from "next/headers"; // <-- 【核心修改】导入 headers

export async function POST(request: Request) {
  try {
    // ======================= 【核心修改】: 从请求头获取 Token =======================
    const headersList = headers();
    const authorization = headersList.get("Authorization");

    if (!authorization) {
      return NextResponse.json({ error: "Authorization header is missing." }, { status: 401 });
    }

    const idToken = authorization.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json({ error: "Bearer token is missing or malformed." }, { status: 401 });
    }
    // ========================================================================

    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Action type is missing in the request body." }, { status: 400 });
    }

    let result;

    switch (action) {
      case "generateImage":
        const { formData, areAllRefValid, isGeminiRewrite, appContext } = payload;
        // 【核心修改】: 传递 idToken
        result = await generateImage(formData, areAllRefValid, isGeminiRewrite, appContext, idToken);
        break;

      case "editImage":
        const { formData: editFormData, appContext: editAppContext } = payload;
        // 【核心修改】: 传递 idToken
        result = await editImage(editFormData, editAppContext, idToken);
        break;

      case "upscaleImage":
        const { source, upscaleFactor, appContext: upscaleAppContext } = payload;
        // 【核心修改】: 传递 idToken
        result = await upscaleImage(source, upscaleFactor, upscaleAppContext, idToken);
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`Error in /api/wrapped-actions/imagen:`, error);
    return NextResponse.json({ error: error.message || "An internal server error occurred." }, { status: 500 });
  }
}
