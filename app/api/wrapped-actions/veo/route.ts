// app/api/wrapped-actions/veo/route.ts
import { NextResponse } from "next/server";
import { generateVideo } from "../../../api/veo/action"; // 导入您现有的 Server Action

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action !== "generateVideo") {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { formData, appContext } = payload;
    const result = await generateVideo(formData, appContext);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error in /api/wrapped-actions/veo:`, error);
    return NextResponse.json({ error: error.message || "An internal server error occurred." }, { status: 500 });
  }
}
