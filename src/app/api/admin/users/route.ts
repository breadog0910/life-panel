import { NextResponse } from "next/server";
import { requireAdmin, listAllUsers } from "@/lib/admin-server";
import type { AdminUserRow } from "@/types/database";

// GET /api/admin/users —— 列出所有用户及两项内测权限状态
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;
    const { supabase } = auth;

    const users = await listAllUsers(supabase);

    const { data: betaRows } = await supabase
      .from("beta_users")
      .select("user_id, lab_access, share_api");
    const betaMap = new Map(
      (betaRows ?? []).map((r) => [
        r.user_id as string,
        { labAccess: !!r.lab_access, shareApi: !!r.share_api },
      ])
    );

    const rows: AdminUserRow[] = users
      .map((u) => {
        const perm = betaMap.get(u.id);
        return {
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          labAccess: perm?.labAccess ?? false,
          shareApi: perm?.shareApi ?? false,
        };
      })
      .sort((a, b) => {
        const ta = a.last_sign_in_at ? Date.parse(a.last_sign_in_at) : 0;
        const tb = b.last_sign_in_at ? Date.parse(b.last_sign_in_at) : 0;
        return tb - ta;
      });

    return NextResponse.json({ users: rows });
  } catch (error: any) {
    console.error("列出用户失败:", error);
    return NextResponse.json({ error: error.message || "列出用户失败" }, { status: 500 });
  }
}

// POST /api/admin/users —— 切换某用户的单项内测权限（lab_access 或 share_api）
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;
    const { supabase } = auth;

    const body = await req.json().catch(() => ({}));
    const userId: string = body?.userId || "";
    const field: string = body?.field || "";
    const enabled: boolean = !!body?.enabled;
    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }
    if (field !== "lab_access" && field !== "share_api") {
      return NextResponse.json({ error: "无效的权限字段" }, { status: 400 });
    }

    // upsert 只更新提供的列：新行另一列取默认值 false，已存在行另一列保留原值。
    const { error } = await supabase
      .from("beta_users")
      .upsert({ user_id: userId, [field]: enabled }, { onConflict: "user_id" });
    if (error) throw error;

    return NextResponse.json({ success: true, userId, field, enabled });
  } catch (error: any) {
    console.error("切换内测权限失败:", error);
    return NextResponse.json({ error: error.message || "操作失败" }, { status: 500 });
  }
}

// PATCH /api/admin/users —— 管理员替某用户重置登录密码
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;
    const { supabase } = auth;

    const body = await req.json().catch(() => ({}));
    const userId: string = body?.userId || "";
    const password: string = typeof body?.password === "string" ? body.password : "";
    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, { password });
    if (error) throw error;

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error("重置密码失败:", error);
    return NextResponse.json({ error: error.message || "重置失败" }, { status: 500 });
  }
}
