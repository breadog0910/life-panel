"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";

export default function BetaSettingsPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.email);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || !admin) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("beta_config")
        .select("share_api_enabled")
        .eq("admin_user_id", user.id)
        .maybeSingle();
      setEnabled(!!data?.share_api_enabled);
      setLoading(false);
    })();
  }, [user, admin]);

  const toggle = async (next: boolean) => {
    if (!user) return;
    setEnabled(next);
    setSaving(true);
    setSaved(false);
    await supabase.from("beta_config").upsert(
      {
        admin_user_id: user.id,
        share_api_enabled: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "admin_user_id" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#90a4ae] text-sm">加载中...</div>
    );
  }

  if (!admin) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <Settings className="size-5" /> 内测设置
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

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <Settings className="size-5" /> 内测设置
        </h2>
        <Link
          href="/lab"
          className="flex items-center gap-1.5 text-sm text-[#42a5f5] hover:text-[#1e88e5] transition-colors"
        >
          <ArrowLeft className="size-4" /> 返回
        </Link>
      </div>

      <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="pr-4">
            <div className="text-sm font-medium text-[#1a3a5c]">把我的 API 借给大家用</div>
            <div className="text-xs text-[#90a4ae] mt-0.5">
              开启后，没有配置自己 API Key 的内测用户会用你的 Key 调用实验室 AI 功能
            </div>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            disabled={saving}
            onChange={(e) => toggle(e.target.checked)}
            className="size-5 accent-[#42a5f5] shrink-0"
          />
        </label>
        {saved && (
          <div className="flex items-center gap-1.5 text-xs text-[#2e7d32]">
            <Check className="size-3.5" /> 已保存
          </div>
        )}
      </div>

      <div className="bg-[#fff9c4]/30 border border-[#fff176] rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="size-5 text-[#f9a825] shrink-0 mt-0.5" />
        <div className="text-xs text-[#f9a825]">
          <p className="font-medium mb-1">说明</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>你的 Key 不会暴露给任何人，仅在服务端使用</li>
            <li>共享调用产生的费用由你的 Key 承担</li>
            <li>用户配置了自己的 Key 时，优先使用他们自己的</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
