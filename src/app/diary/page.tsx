"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Plus, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Diary } from "@/types/database";

const moods = [
  { emoji: "😊", label: "开心" },
  { emoji: "😐", label: "平常" },
  { emoji: "😢", label: "低落" },
  { emoji: "😡", label: "生气" },
];

const weathers = ["☀️", "⛅", "☁️", "🌧️", "⛈️", "🌨️", "🌈"];

export default function DiaryPage() {
  const { user } = useAuth();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // 新建/编辑状态
  const [editing, setEditing] = useState(false);
  const [editDiary, setEditDiary] = useState<Partial<Diary>>({});
  const [saving, setSaving] = useState(false);

  // 加载日记列表
  const loadDiaries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("diaries")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .limit(30);
    if (data) setDiaries(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadDiaries();
  }, [loadDiaries]);

  // 选中日期的日记
  const diaryForDate = diaries.find((d) => d.date === selectedDate);

  // 新建
  const startNew = () => {
    setEditDiary({ date: selectedDate, content: "", mood: "😊", weather: "", tags: [] });
    setEditing(true);
  };

  // 编辑
  const startEdit = (diary: Diary) => {
    setEditDiary(diary);
    setEditing(true);
  };

  // 保存
  const handleSave = async () => {
    if (!user || !editDiary.content?.trim()) return;
    setSaving(true);

    if (editDiary.id) {
      await supabase
        .from("diaries")
        .update({
          content: editDiary.content,
          mood: editDiary.mood,
          weather: editDiary.weather,
          tags: editDiary.tags,
        })
        .eq("id", editDiary.id);
    } else {
      await supabase.from("diaries").insert({
        user_id: user.id,
        date: selectedDate,
        content: editDiary.content,
        mood: editDiary.mood || "😊",
        weather: editDiary.weather || "",
        tags: editDiary.tags || [],
      });
    }

    setSaving(false);
    setEditing(false);
    setEditDiary({});
    loadDiaries();
  };

  // 删除
  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这篇日记吗？")) return;
    await supabase
      .from("diaries")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    loadDiaries();
  };

  // 标签输入
  const [tagInput, setTagInput] = useState("");
  const addTag = () => {
    if (!tagInput.trim()) return;
    const current = editDiary.tags || [];
    if (current.includes(tagInput.trim())) {
      setTagInput("");
      return;
    }
    setEditDiary({ ...editDiary, tags: [...current, tagInput.trim()] });
    setTagInput("");
  };
  const removeTag = (tag: string) => {
    setEditDiary({
      ...editDiary,
      tags: (editDiary.tags || []).filter((t) => t !== tag),
    });
  };

  // 日期导航
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#90a4ae] text-sm">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <BookOpen className="size-5" /> 📝 日记
        </h2>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
        >
          <Plus className="size-4" /> 写日记
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 日期列表 */}
        <div className="bg-white rounded-card border border-[#e3f2fd] p-4 max-h-[500px] overflow-y-auto">
          {/* 日期选择器 */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => shiftDate(-1)} className="text-[#42a5f5] hover:text-[#1e88e5] text-lg">
              ◀
            </button>
            <span className="text-sm font-medium text-[#1a3a5c]">
              {formatDate(selectedDate)}
            </span>
            <button onClick={() => shiftDate(1)} className="text-[#42a5f5] hover:text-[#1e88e5] text-lg">
              ▶
            </button>
          </div>

          <div className="space-y-1">
            {diaries.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDate(d.date)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  d.date === selectedDate
                    ? "bg-[#e3f2fd] text-[#1565c0] font-medium"
                    : "hover:bg-[#f5f9ff] text-[#5c8dc9]"
                }`}
              >
                <span>{d.mood}</span>
                <span className="flex-1 truncate">
                  {d.content?.slice(0, 20) || "(无内容)"}
                </span>
                {d.weather && <span className="text-xs">{d.weather}</span>}
              </button>
            ))}
            {diaries.length === 0 && (
              <div className="text-center py-8 text-sm text-[#90a4ae]">
                ✨ 还没有日记，点击右上角写一篇吧
              </div>
            )}
          </div>
        </div>

        {/* 日记内容区 */}
        <div className="md:col-span-2">
          {editing ? (
            // 编辑模式
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5c8dc9]">{formatDate(selectedDate)}</span>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditDiary({});
                  }}
                  className="text-[#90a4ae] hover:text-[#666]"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* 心情选择 */}
              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">心情</label>
                <div className="flex gap-2">
                  {moods.map((m) => (
                    <button
                      key={m.emoji}
                      onClick={() => setEditDiary({ ...editDiary, mood: m.emoji as Diary["mood"] })}
                      className={`text-2xl px-2 py-1 rounded-lg transition-all ${
                        editDiary.mood === m.emoji
                          ? "bg-[#e3f2fd] scale-110"
                          : "opacity-50 hover:opacity-80"
                      }`}
                      title={m.label}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* 天气选择 */}
              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">天气</label>
                <div className="flex gap-1 flex-wrap">
                  {weathers.map((w) => (
                    <button
                      key={w}
                      onClick={() => setEditDiary({ ...editDiary, weather: w })}
                      className={`text-xl px-1.5 py-0.5 rounded-lg transition-all ${
                        editDiary.weather === w
                          ? "bg-[#e3f2fd] scale-110"
                          : "opacity-50 hover:opacity-80"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* 标签 */}
              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">标签</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(editDiary.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e3f2fd] text-[#1565c0] text-xs"
                    >
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="输入标签..."
                    className="flex-1 border border-[#e3f2fd] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-1.5 rounded-lg bg-[#e3f2fd] text-[#42a5f5] text-xs hover:bg-[#bbdefb]"
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* 内容 */}
              <textarea
                value={editDiary.content || ""}
                onChange={(e) => setEditDiary({ ...editDiary, content: e.target.value })}
                placeholder="今天发生了什么，有什么感受..."
                className="w-full border border-[#e3f2fd] rounded-lg p-4 text-sm resize-none h-40 focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 focus:border-[#42a5f5]"
                autoFocus
              />

              <div className="flex gap-2 justify-end">
                {editDiary.id && (
                  <button
                    onClick={() => handleDelete(editDiary.id!)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="size-3.5" /> 删除
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!editDiary.content?.trim() || saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
                >
                  <Save className="size-3.5" />
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          ) : diaryForDate ? (
            // 查看模式
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{diaryForDate.mood}</span>
                  <div>
                    <div className="text-sm font-medium text-[#1a3a5c]">
                      {formatDate(selectedDate)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {diaryForDate.weather && <span>{diaryForDate.weather}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(diaryForDate)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-[#e3f2fd] text-[#42a5f5] hover:bg-[#bbdefb] transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(diaryForDate.id)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>

              {(diaryForDate.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {diaryForDate.tags!.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-[#e3f2fd] text-[#1565c0] text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm text-[#1a3a5c] leading-relaxed whitespace-pre-wrap">
                {diaryForDate.content}
              </div>
            </div>
          ) : (
            // 空白状态
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-sm text-[#90a4ae] mb-4">
                  {formatDate(selectedDate)} · 还没有日记
                </p>
                <button
                  onClick={startNew}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
                >
                  <Plus className="size-4" /> 写一篇
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
