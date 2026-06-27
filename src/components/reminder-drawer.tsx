"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Plus, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Reminder } from "@/types/database";

const REPEAT_LABELS: Record<Reminder["repeat_rule"], { label: string; icon: string }> = {
  daily: { label: "每天", icon: "🔄" },
  weekly: { label: "每周", icon: "📅" },
  none: { label: "单次", icon: "1️⃣" },
};

export default function ReminderDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [triggerTime, setTriggerTime] = useState("09:00");
  const [repeatRule, setRepeatRule] = useState<Reminder["repeat_rule"]>("daily");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadReminders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("trigger_time", { ascending: true });
    if (data) setReminders(data as Reminder[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open) loadReminders();
  }, [open, loadReminders]);

  const resetForm = () => {
    setTitle("");
    setTriggerTime("09:00");
    setRepeatRule("daily");
    setEnabled(true);
    setEditId(null);
    setEditing(false);
  };

  const handleEdit = (r: Reminder) => {
    setEditId(r.id);
    setTitle(r.title);
    setTriggerTime(r.trigger_time);
    setRepeatRule(r.repeat_rule);
    setEnabled(r.enabled);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);
    const payload = { title: title.trim(), trigger_time: triggerTime, repeat_rule: repeatRule, enabled };
    if (editId) {
      await supabase.from("reminders").update(payload).eq("id", editId);
    } else {
      await supabase.from("reminders").insert({ user_id: user.id, ...payload });
    }
    setSaving(false);
    resetForm();
    loadReminders();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这个提醒吗？")) return;
    await supabase.from("reminders").delete().eq("id", id);
    loadReminders();
  };

  const handleToggle = async (r: Reminder) => {
    await supabase.from("reminders").update({ enabled: !r.enabled }).eq("id", r.id);
    loadReminders();
  };

  if (!open) return null;

  return (
    <>
      {/* 遮罩 */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* 抽屉 */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#e3f2fd]">
          <h3 className="font-bold text-[#1565c0] flex items-center gap-2">
            <Bell className="size-4" /> 🔔 提醒 / 备忘
          </h3>
          <button onClick={onClose} className="text-[#90a4ae] hover:text-[#666]">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* 新建按钮 */}
          {!editing && (
            <button
              onClick={() => {
                resetForm();
                setEditing(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
            >
              <Plus className="size-4" /> 新建提醒
            </button>
          )}

          {/* 编辑表单 */}
          {editing && (
            <div className="bg-[#f5f9ff] rounded-lg p-3 space-y-3 border border-[#e3f2fd]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1565c0]">
                  {editId ? "编辑提醒" : "新建提醒"}
                </span>
                <button onClick={resetForm} className="text-[#90a4ae] hover:text-[#666]">
                  <X className="size-4" />
                </button>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：每日复盘"
                className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
              />
              <div>
                <label className="text-xs text-[#90a4ae] mb-1 block">提醒时间</label>
                <input
                  type="time"
                  value={triggerTime}
                  onChange={(e) => setTriggerTime(e.target.value)}
                  className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                />
              </div>
              <div>
                <label className="text-xs text-[#90a4ae] mb-1 block">重复</label>
                <div className="flex gap-1">
                  {(["daily", "weekly", "none"] as Reminder["repeat_rule"][]).map((rule) => (
                    <button
                      key={rule}
                      onClick={() => setRepeatRule(rule)}
                      className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${
                        repeatRule === rule
                          ? "bg-[#e3f2fd] text-[#1565c0] font-medium"
                          : "bg-white text-[#5c8dc9]"
                      }`}
                    >
                      {REPEAT_LABELS[rule].icon} {REPEAT_LABELS[rule].label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
              >
                <Save className="size-3.5" /> {saving ? "保存中..." : "保存"}
              </button>
            </div>
          )}

          {/* 列表 */}
          {loading ? (
            <div className="text-center py-8 text-sm text-[#90a4ae]">加载中...</div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#90a4ae]">🔔 还没有提醒</div>
          ) : (
            <div className="space-y-2">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className={`bg-white rounded-lg border p-3 flex items-center gap-2 transition-all ${
                    r.enabled ? "border-[#e3f2fd]" : "border-[#e3f2fd]/50 opacity-60"
                  }`}
                >
                  <button
                    onClick={() => handleToggle(r)}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                      r.enabled ? "bg-[#42a5f5]" : "bg-[#cfd8dc]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        r.enabled ? "translate-x-[18px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#1a3a5c] truncate">{r.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#90a4ae]">🕐 {r.trigger_time}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#e3f2fd] text-[#1565c0]">
                        {REPEAT_LABELS[r.repeat_rule].icon} {REPEAT_LABELS[r.repeat_rule].label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(r)}
                      className="text-xs text-[#42a5f5] hover:bg-[#e3f2fd] px-2 py-1 rounded transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-red-400 hover:bg-red-50 px-1.5 py-1 rounded transition-colors"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
