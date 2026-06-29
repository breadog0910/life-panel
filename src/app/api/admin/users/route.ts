import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ADMIN_EMAIL } from "@/lib/admin";
import type { AdminUserRow } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 校验请求来自管理员，返回 service-role 客户端；失败返回错误响应
async function requireAdmin(
  req: Request
): Promise<{ supabase: SupabaseClient } | { error: NextResponse }> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return { error: NextResponse.json({ error: "未授权" }, { status: 401 }) };
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData.user) {
    return { error: NextResponse.json({ error: "用户验证失败" }, { status: 401 }) };
  }
  if (userData.user.email !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: "仅管理员可操作" }, { status: 403 }) };
  }
  return { supabase };
}

// 枚举全部注册用户（分页拉取）
async function listAllUsers(supabase: SupabaseClient): Promise<User[]> {
  const all: User[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users ?? [];
    all.push(...users);
    if (users.length < 200) break;
  }
  return all;
}

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
