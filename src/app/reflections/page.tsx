"use client";

import { useEffect, useState, useCallback } from "react";
import { Lightbulb, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface ReflectionItem {
  id: string;
  content: string;
  mood: string;
  source: string;
  created_at: string;
}

export default function ReflectionsPage() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<ReflectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, web: 0, desktop: 0, today: 0 });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("reflections")
      .select("id,content,mood,source,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      setReflections(data);
      const today = new Date().toDateString();
      setStats({
        total: data.length,
        web: data.filter((r) => r.source === "web").length,
        desktop: data.filter((r) => r.source === "desktop").length,
        today: data.filter((r) => new Date(r.created_at).toDateString() === today).length,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // 实时订阅
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("reflections-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reflections", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    await supabase.from("reflections").delete().eq("id", id);
    load();
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#90a4ae] text-sm">加载中...</div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <Lightbulb className="size-5" /> 📊 复盘汇总
      </h2>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "总复盘", value: stats.total, icon: "💡" },
          { label: "今日", value: stats.today, icon: "📅" },
          { label: "网页端", value: stats.web, icon: "🌐" },
          { label: "桌面伙伴", value: stats.desktop, icon: "🐱" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-card p-4 border border-[#e3f2fd] text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-[#1a3a5c]">{s.value}</div>
            <div className="text-xs text-[#90a4ae]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-4">
        {reflections.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#90a4ae]">
            ✨ 还没有复盘记录
          </div>
        ) : (
          <div className="space-y-1">
            {reflections.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#f5f9ff] transition-colors group"
              >
                <span className="text-xl shrink-0 mt-0.5">{r.mood}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1a3a5c] leading-relaxed">{r.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#90a4ae]">
                      {formatDate(r.created_at)} {formatTime(r.created_at)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#e3f2fd] text-[#64b5f6]">
                      {r.source === "desktop" ? "🐱 桌面" : "🌐 网页"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
