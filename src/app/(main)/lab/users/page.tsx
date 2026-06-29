"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, ArrowLeft, RefreshCw, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import type { AdminUserRow } from "@/types/database";

function fmt(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type PermField = "lab_access" | "share_api";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.email);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState("");
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // 全局共享 API 主开关（合并自原「内测设置」页）
  const [shareGlobal, setShareGlobal] = useState(false);
  const [shareSaving, setShareSaving] = useState(false);
  const [shareSaved, setShareSaved] = useState(false);

  const load = useCallback(async () => {
    if (!admin) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("请先登录");
        setLoading(false);
        return;
      }
      // 用户列表（service-role）
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "加载失败");
      setRows(data.users || []);

      // 全局共享开关
      if (user) {
        const { data: cfg } = await supabase
          .from("beta_config")
          .select("share_api_enabled")
          .eq("admin_user_id", user.id)
          .maybeSingle();
        setShareGlobal(!!cfg?.share_api_enabled);
      }
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [admin, user]);

  useEffect(() => {
    load();
  }, [load]);

  // 全局共享 API 主开关
  const toggleShareGlobal = async (next: boolean) => {
    if (!user) return;
    setShareGlobal(next);
    setShareSaving(true);
    setShareSaved(false);
    await supabase.from("beta_config").upsert(
      {
        admin_user_id: user.id,
        share_api_enabled: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "admin_user_id" }
    );
    setShareSaving(false);
    setShareSaved(true);
    setTimeout(() => setShareSaved(false), 2000);
  };

  // 切换某用户某一项权限
  const toggleField = async (row: AdminUserRow, field: PermField) => {
    const key = `${row.id}:${field}`;
    const current = field === "lab_access" ? row.labAccess : row.shareApi;
    const next = !current;
    setTogglingKey(key);
    // 乐观更新
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, ...(field === "lab_access" ? { labAccess: next } : { shareApi: next }) }
          : r
      )
    );
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: row.id, field, enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "操作失败");
    } catch (e: any) {
      // 回滚
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, ...(field === "lab_access" ? { labAccess: current } : { shareApi: current }) }
            : r
        )
      );
      setError(e.message || "操作失败");
    } finally {
      setTogglingKey(null);
    }
  };

  if (!admin) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <Users className="size-5" /> 用户管理
        </h2>
        <div className="bg-white rounded-card border border-[#e3f2fd] p-8 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-sm text-[#90a4ae]">仅管理员可见</p>
          <Link
            href="/lab"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
          >
            <ArrowLeft className="size-4" /> 返回实验室
          </Link>
        </div>
      </div>
    );
  }

  const labCount = rows.filter((r) => r.labAccess).length;
  const apiCount = rows.filter((r) => r.shareApi).length;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <Users className="size-5" /> 用户管理
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-[#42a5f5] hover:text-[#1e88e5] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> 刷新
          </button>
          <Link
            href="/lab"
            className="flex items-center gap-1.5 text-sm text-[#42a5f5] hover:text-[#1e88e5] transition-colors"
          >
            <ArrowLeft className="size-4" /> 返回
          </Link>
        </div>
      </div>

      {/* 全局共享 API 主开关（合并自内测设置） */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="pr-4">
            <div className="text-sm font-medium text-[#1a3a5c]">把我的 API 借给大家用（总开关）</div>
            <div className="text-xs text-[#90a4ae] mt-0.5">
              关闭时，所有人都用不了共享 Key；开启后，下面单独勾选了「共享 API」的用户才能用你的 Key 调实验室 AI。
            </div>
          </div>
          <input
            type="checkbox"
            checked={shareGlobal}
            disabled={shareSaving}
            onChange={(e) => toggleShareGlobal(e.target.checked)}
            className="size-5 accent-[#42a5f5] shrink-0"
          />
        </label>
        {shareSaved && (
          <div className="flex items-center gap-1.5 text-xs text-[#2e7d32]">
            <Check className="size-3.5" /> 已保存
          </div>
        )}
        {!shareGlobal && (
          <div className="flex items-start gap-2 text-xs text-[#f9a825] bg-[#fff9c4]/30 border border-[#fff176] rounded-lg p-2.5">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>总开关已关闭：即使给某个用户勾了「共享 API」，他暂时也用不了你的 Key。</span>
          </div>
        )}
      </div>

      <p className="text-sm text-[#90a4ae]">
        共 {rows.length} 位注册用户 · {labCount} 位可进实验室 · {apiCount} 位可用共享 API。
        「内测」控制能否访问实验室，「共享 API」控制能否借用你的 Key，两者可分别开关。
      </p>

      {error && (
        <div className="bg-[#ffebee] border border-[#ffcdd2] rounded-lg px-4 py-2.5 text-sm text-[#c62828]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-[#90a4ae] text-sm">加载中...</div>
      ) : (
        <div className="bg-white rounded-card border border-[#e3f2fd] divide-y divide-[#f0f7ff]">
          {rows.length === 0 && (
            <div className="p-6 text-center text-sm text-[#90a4ae]">暂无用户</div>
          )}
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[#1a3a5c] truncate">
                  {row.email || "（无邮箱）"}
                  {isAdmin(row.email) && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[#e3f2fd] text-[#1565c0]">
                      管理员
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#90a4ae] mt-0.5">
                  注册 {fmt(row.created_at)} · 最近登录 {fmt(row.last_sign_in_at)}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span className="text-xs text-[#90a4ae]">内测</span>
                  <input
                    type="checkbox"
                    checked={row.labAccess}
                    disabled={togglingKey === `${row.id}:lab_access`}
                    onChange={() => toggleField(row, "lab_access")}
                    className="size-5 accent-[#42a5f5]"
                  />
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span className="text-xs text-[#90a4ae]">共享 API</span>
                  <input
                    type="checkbox"
                    checked={row.shareApi}
                    disabled={togglingKey === `${row.id}:share_api`}
                    onChange={() => toggleField(row, "share_api")}
                    className="size-5 accent-[#66bb6a]"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
