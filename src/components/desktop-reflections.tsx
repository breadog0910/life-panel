"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface ReflectionItem {
  id: string;
  content: string;
  mood: string;
  source: string;
  created_at: string;
}

export default function DesktopReflections() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<ReflectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 初始加载
    supabase
      .from("reflections")
      .select("id,content,mood,source,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setReflections(data);
        setLoading(false);
      });

    // 实时订阅
    const channel = supabase
      .channel("reflections-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reflections",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setReflections((prev) => [payload.new as ReflectionItem, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    return isToday ? `今天 ${time}` : `${d.getMonth() + 1}/${d.getDate()} ${time}`;
  };

  return (
    <div className="bg-white rounded-card p-5 border border-[#e3f2fd]">
      <h3 className="font-semibold text-[#1565c0] text-sm mb-3 flex items-center gap-2">
        <span>🐱</span> 来自桌面伙伴
      </h3>
      {loading ? (
        <div className="text-center py-6 text-sm text-[#90a4ae]">加载中...</div>
      ) : reflections.length > 0 ? (
        <div className="space-y-2">
          {reflections.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#f5f9ff] border border-[#e3f2fd]"
            >
              <span className="text-lg shrink-0">{r.mood}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1a3a5c] leading-relaxed">「{r.content}」</p>
                <span className="text-xs text-[#90a4ae] mt-0.5 block">
                  {formatTime(r.created_at)}
                  {r.source === "desktop" ? " · 🖥️ 桌面" : " · 🌐 网页"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-[#90a4ae]">
          🐱 桌面伙伴还没有消息～
        </div>
      )}
      <div className="mt-3 text-right">
        <span className="text-xs text-[#90a4ae]">
          {reflections.length} 条记录
        </span>
      </div>
    </div>
  );
}
