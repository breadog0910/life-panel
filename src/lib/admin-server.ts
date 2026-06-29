import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ADMIN_EMAIL } from "@/lib/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 校验请求来自管理员，返回 service-role 客户端；失败返回错误响应
export async function requireAdmin(
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
export async function listAllUsers(supabase: SupabaseClient): Promise<User[]> {
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
