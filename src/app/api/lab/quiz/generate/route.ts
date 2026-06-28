import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveAIConfig, generateQuizJSON } from "@/lib/ai-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const clamp = (n: unknown) => {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(v, 30);
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content: string = body?.content || "";
    const single = clamp(body?.single);
    const multiple = clamp(body?.multiple);
    const judge = clamp(body?.judge);

    if (!content.trim()) {
      return NextResponse.json({ success: false, error: "请先粘贴文字或上传文档" }, { status: 400 });
    }
    if (single + multiple + judge < 1) {
      return NextResponse.json({ success: false, error: "至少选择出 1 道题" }, { status: 400 });
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

    const questions = await generateQuizJSON(config, content, { single, multiple, judge });

    return NextResponse.json({ success: true, questions, usedAdmin: config.usedAdmin });
  } catch (error: any) {
    console.error("出题失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "出题失败" },
      { status: 500 }
    );
  }
}
