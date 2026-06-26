"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Plus, Trash2, Play, Pause, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { TimeEntry } from "@/types/database";

export default function TimePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // 表单
  const [title, setTitle] = useState("");
  const [startHour, setStartHour] = useState("09");
  const [startMin, setStartMin] = useState("00");
  const [endHour, setEndHour] = useState("10");
  const [endMin, setEndMin] = useState("00");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 计时器
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerLabel, setTimerLabel] = useState("");

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setEntries(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const stopTimer = async () => {
    if (!user || timerSeconds < 60) {
      setTimerRunning(false);
      setTimerSeconds(0);
      return;
    }
    setTimerRunning(false);
    const minutes = Math.floor(timerSeconds / 60);
    await supabase.from("time_entries").insert({
      user_id: user.id,
      title: timerLabel || "计时记录",
      duration_minutes: minutes,
      pomodoro_count: Math.floor(minutes / 25),
      tags: [],
    });
    setTimerSeconds(0);
    setTimerLabel("");
    loadEntries();
  };

  const resetForm = () => {
    setTitle("");
    setStartHour("09");
    setStartMin("00");
    setEndHour("10");
    setEndMin("00");
    setTags([]);
    setEditingId(null);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    const startTime = `${startHour}:${startMin}`;
    const endTime = `${endHour}:${endMin}`;
    const duration =
      (parseInt(endHour) * 60 + parseInt(endMin)) -
      (parseInt(startHour) * 60 + parseInt(startMin));

    if (editingId) {
      await supabase
        .from("time_entries")
        .update({ title: title.trim(), tags, duration_minutes: duration > 0 ? duration : undefined })
        .eq("id", editingId);
    } else {
      await supabase.from("time_entries").insert({
        user_id: user.id,
        title: title.trim(),
        duration_minutes: duration > 0 ? duration : undefined,
        tags,
        start_time: new Date().toISOString(),
      });
    }
    resetForm();
    loadEntries();
  };

  const handleEdit = (e: TimeEntry) => {
    setEditingId(e.id);
    setTitle(e.title);
    setTags(e.tags || []);
    setEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    await supabase.from("time_entries").delete().eq("id", id);
    loadEntries();
  };

  const addTag = () => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) {
      setTagInput("");
      return;
    }
    setTags([...tags, tagInput.trim()]);
    setTagInput("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#90a4ae] text-sm">加载中...</div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <Clock className="size-5" /> ⏱️ 时间安排
      </h2>

      {/* 番茄钟 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#1565c0] text-sm">🍅 快速计时</h3>
          <span className="text-xs text-[#90a4ae]">
            {timerRunning ? "计时中..." : "输入标签开始计时"}
          </span>
        </div>
        <div className="text-center py-4">
          <div className="text-5xl font-bold text-[#1a3a5c] tabular-nums mb-3">
            {formatTimer(timerSeconds)}
          </div>
          <div className="flex items-center gap-3 justify-center">
            <input
              value={timerLabel}
              onChange={(e) => setTimerLabel(e.target.value)}
              placeholder="在做什么？"
              className="border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
            />
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
            >
              {timerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
              {timerRunning ? "暂停" : "开始"}
            </button>
            {!timerRunning && timerSeconds > 0 && (
              <button
                onClick={stopTimer}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#66bb6a] text-white hover:bg-[#43a047] transition-colors"
              >
                <Save className="size-4" /> 保存
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 日程列表 + 编辑 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 列表 */}
        <div className="bg-white rounded-card border border-[#e3f2fd] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#1565c0] text-sm">📅 今日记录</h3>
            <button
              onClick={() => {
                resetForm();
                setEditing(true);
              }}
              className="text-xs text-[#42a5f5] hover:text-[#1e88e5] flex items-center gap-1"
            >
              <Plus className="size-3" /> 添加
            </button>
          </div>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#90a4ae]">✨ 还没有时间记录</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#f5f9ff] border border-[#e3f2fd]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[#1a3a5c] font-medium truncate">{e.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {e.duration_minutes && (
                        <span className="text-xs text-[#90a4ae]">{e.duration_minutes} 分钟</span>
                      )}
                      {e.pomodoro_count && e.pomodoro_count > 0 && (
                        <span className="text-xs text-[#42a5f5]">🍅×{e.pomodoro_count}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(e)}
                      className="p-1 text-xs text-[#42a5f5] hover:bg-[#e3f2fd] rounded"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-1 text-xs text-red-400 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 编辑面板 */}
        <div>
          {editing ? (
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1565c0] text-sm">
                  {editingId ? "编辑" : "新增"}
                </h3>
                <button onClick={resetForm} className="text-[#90a4ae] hover:text-[#666]">
                  <X className="size-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">事项</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="做什么？"
                  className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-[#90a4ae] mb-1.5 block">开始</label>
                  <div className="flex items-center gap-1">
                    <input
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="w-14 text-center border border-[#e3f2fd] rounded px-2 py-1.5 text-sm"
                    />
                    <span>:</span>
                    <input
                      value={startMin}
                      onChange={(e) => setStartMin(e.target.value)}
                      className="w-14 text-center border border-[#e3f2fd] rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-[#90a4ae] mb-1.5 block">结束</label>
                  <div className="flex items-center gap-1">
                    <input
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="w-14 text-center border border-[#e3f2fd] rounded px-2 py-1.5 text-sm"
                    />
                    <span>:</span>
                    <input
                      value={endMin}
                      onChange={(e) => setEndMin(e.target.value)}
                      className="w-14 text-center border border-[#e3f2fd] rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">标签</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-[#e3f2fd] text-[#1565c0] text-xs">
                      #{t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))} className="ml-1 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="标签..."
                    className="flex-1 border border-[#e3f2fd] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                  />
                  <button onClick={addTag} className="px-3 py-1.5 rounded-lg bg-[#e3f2fd] text-[#42a5f5] text-xs">添加</button>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
              >
                <Save className="size-3.5" /> 保存
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5 text-center">
              <div className="py-8 text-sm text-[#90a4ae]">
                点击左侧「添加」按钮<br />记录新的时间安排
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
