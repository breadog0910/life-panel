"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Clock, Play, Check, Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { TimeEntry } from "@/types/database";

const isPlanned = (e: TimeEntry) => e.status === "planned";
const isDone = (e: TimeEntry) => e.status !== "planned" && e.status !== "cancelled";

export default function ScheduleCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    const { data } = await supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd)
      .order("created_at", { ascending: true });
    if (data) setItems(data as TimeEntry[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDuration = (minutes?: number): string => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes}分钟`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}小时${m}分` : `${h}小时`;
  };

  const formatTime = (ts: string): string =>
    new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

  const goFocus = (item: TimeEntry) => {
    const params = new URLSearchParams({ focusPlan: item.id, t: item.title });
    if (item.node_id) params.set("n", item.node_id);
    router.push(`/plan?${params.toString()}`);
  };

  const completePlan = async (item: TimeEntry) => {
    await supabase.from("time_entries").update({ status: "done" }).eq("id", item.id);
    load();
  };

  const cancelPlan = async (item: TimeEntry) => {
    await supabase.from("time_entries").update({ status: "cancelled" }).eq("id", item.id);
    load();
  };

  const planned = items.filter(isPlanned);
  const done = items.filter(isDone);

  // 只有安排了日程规划（存在待完成的计划）时才在今日概览显示
  if (loading || planned.length === 0) return null;

  const colorMap = [
    "bg-[#e3f2fd] text-[#1565c0]",
    "bg-[#e8f5e9] text-[#2e7d32]",
    "bg-[#fff3e0] text-[#e65100]",
    "bg-[#f3e5f5] text-[#7b1fa2]",
    "bg-[#e0f7fa] text-[#00695c]",
  ];

  return (
    <div className="bg-white rounded-card p-5 border border-[#e3f2fd]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#1565c0] text-sm">📅 今日日程</h3>
        <button
          onClick={() => router.push("/plan")}
          className="text-xs text-[#42a5f5] hover:text-[#1e88e5] flex items-center gap-1 transition-colors"
        >
          <Plus className="size-3" /> 添加
        </button>
      </div>

      <div className="space-y-3">
        {/* 待完成的日程规划 */}
        <div className="space-y-2">
          {planned.map((item) => (
            <div key={item.id} className="p-2.5 rounded-lg bg-[#fff8e1] border border-[#ffe0b2]">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#ffe0b2] text-[#e65100] shrink-0">
                  <Clock className="size-3" />
                  {formatTime(item.created_at)}
                </span>
                <span className="text-sm text-[#1a3a5c] flex-1 truncate">{item.title}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  onClick={() => goFocus(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
                >
                  <Play className="size-3" /> 去专注
                </button>
                <button
                  onClick={() => completePlan(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#66bb6a] text-white hover:bg-[#43a047] transition-colors"
                >
                  <Check className="size-3" /> 完成
                </button>
                <button
                  onClick={() => cancelPlan(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-[#90a4ae] bg-white border border-[#e0e0e0] hover:bg-[#f5f5f5] transition-colors"
                >
                  <Ban className="size-3" /> 划去
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 已完成的记录 */}
        {done.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] text-[#90a4ae]">已完成</div>
            {done.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e3f2fd]/50 hover:bg-[#f5f9ff] transition-colors"
              >
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${colorMap[idx % colorMap.length]}`}
                >
                  <Clock className="size-3" />
                  {formatTime(item.created_at)}
                </div>
                <span className="text-sm text-[#1a3a5c] flex-1 truncate">{item.title}</span>
                {!!item.duration_minutes && (
                  <span className="text-xs text-[#90a4ae] shrink-0">{formatDuration(item.duration_minutes)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
