import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processWithAI } from "@/lib/ai-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: "内容不能为空" },
        { status: 400 }
      );
    }

    // 获取当前用户
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "用户验证失败" },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // 获取用户的 AI 设置
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!aiSettings?.api_key) {
      return NextResponse.json(
        { success: false, error: "请先在设置中配置 AI API Key" },
        { status: 400 }
      );
    }

    // 调用 AI
    const result = await processWithAI(content, {
      provider: aiSettings.provider,
      apiKey: aiSettings.api_key,
      apiBase: aiSettings.api_base,
      model: aiSettings.model,
    });

    return NextResponse.json({
      success: true,
      tags: result.tags,
      category: result.category,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error("AI 处理失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "AI 处理失败" },
      { status: 500 }
    );
  }
}
