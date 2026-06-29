import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveAIConfig, generateFlashcardsJSON, type FlashcardMode } from "@/lib/ai-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const clampCount = (n: unknown) => {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 1) return 20;
  return Math.min(v, 100);
};

const normalizeMode = (m: unknown): FlashcardMode =>
  m === "word" || m === "sentence" ? m : "auto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content: string = body?.content || "";
    const count = clampCount(body?.count);
    const mode = normalizeMode(body?.mode);

    if (!content.trim()) {
      return NextResponse.json({ success: false, error: "请先粘贴文字或上传文档" }, { status: 400 });
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ success: false, error: "用户验证失败" }, { status: 401 });
    }

    const config = await resolveAIConfig(supabase, userData.user.id);
    if (!config) {
      return NextResponse.json(
        { success: false, error: "请先在「AI 智能设置」配置 API Key，或等待管理员开放内测共享" },
        { status: 400 }
      );
    }

    const cards = await generateFlashcardsJSON(config, content, count, mode);

    return NextResponse.json({ success: true, cards, usedAdmin: config.usedAdmin });
  } catch (error: any) {
    console.error("生成闪卡失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "生成闪卡失败" },
      { status: 500 }
    );
  }
}
