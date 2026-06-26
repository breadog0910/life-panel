"use client";

import { useEffect, useState } from "react";
import { Plus, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { TimeEntry } from "@/types/database";

export default function ScheduleCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [schedules, setSchedules] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setSchedules(data as TimeEntry[]);
        setLoading(false);
      });
  }, [user]);

  const formatDuration = (minutes?: number): string => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes}分钟`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}小时${m}分` : `${h}小时`;
  };

  const formatTime = (ts: string): string => {
    return new Date(ts).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          onClick={() => router.push("/time")}
          className="text-xs text-[#42a5f5] hover:text-[#1e88e5] flex items-center gap-1 transition-colors"
        >
          <Plus className="size-3" /> 添加
        </button>
      </div>
      {loading ? (
        <div className="text-center py-6 text-sm text-[#90a4ae]">加载中...</div>
      ) : schedules.length > 0 ? (
        <div className="space-y-2">
          {schedules.map((item, idx) => (
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
              <span className="text-sm text-[#1a3a5c] flex-1 truncate">
                {item.title}
              </span>
              {item.duration_minutes && (
                <span className="text-xs text-[#90a4ae] shrink-0">
                  {formatDuration(item.duration_minutes)}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-[#90a4ae]">
          ✨ 今天还没有安排～
        </div>
      )}
    </div>
  );
}
