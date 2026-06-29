import { NextResponse } from "next/server";
import { requireAdmin, listAllUsers } from "@/lib/admin-server";
import type { AdminFeedbackRow } from "@/types/database";

// GET /api/admin/feedback —— 列出所有反馈（含提交者邮箱）
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;
    const { supabase } = auth;

    const { data: rows, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const users = await listAllUsers(supabase);
    const emailMap = new Map(users.map((u) => [u.id, u.email ?? null]));

    const list: AdminFeedbackRow[] = (rows ?? []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      content: r.content,
      reply: r.reply ?? null,
      replied_at: r.replied_at ?? null,
      created_at: r.created_at,
      email: emailMap.get(r.user_id) ?? null,
    }));

    return NextResponse.json({ feedback: list });
  } catch (error: any) {
    console.error("列出反馈失败:", error);
    return NextResponse.json({ error: error.message || "列出反馈失败" }, { status: 500 });
  }
}

// POST /api/admin/feedback —— 管理员回复某条反馈
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;
    const { supabase } = auth;

    const body = await req.json().catch(() => ({}));
    const feedbackId: string = body?.feedbackId || "";
    const reply: string = typeof body?.reply === "string" ? body.reply.trim() : "";
    if (!feedbackId) {
      return NextResponse.json({ error: "缺少 feedbackId" }, { status: 400 });
    }
    if (!reply) {
      return NextResponse.json({ error: "回复内容不能为空" }, { status: 400 });
    }

    const { error } = await supabase
      .from("feedback")
      .update({ reply, replied_at: new Date().toISOString() })
      .eq("id", feedbackId);
    if (error) throw error;

    return NextResponse.json({ success: true, feedbackId });
  } catch (error: any) {
    console.error("回复反馈失败:", error);
    return NextResponse.json({ error: error.message || "回复失败" }, { status: 500 });
  }
}
