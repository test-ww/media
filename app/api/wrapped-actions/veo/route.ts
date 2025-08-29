import { NextResponse } from "next/server";
import { generateVideo } from "../../../api/veo/action"; // 导入您现有的 Server Action
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

    if (action !== "generateVideo") {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { formData, appContext } = payload;
    // 【核心修改】: 将 idToken 作为第三个参数传递
    const result = await generateVideo(formData, appContext, idToken);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error in /api/wrapped-actions/veo:`, error);
    return NextResponse.json({ error: error.message || "An internal server error occurred." }, { status: 500 });
  }
}
