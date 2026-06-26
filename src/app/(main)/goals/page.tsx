"use client";

import { useEffect, useState, useCallback } from "react";
import { Target, Plus, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Goal } from "@/types/database";

const STATUS_LABELS: Record<Goal["status"], { label: string; color: string }> = {
  active: { label: "进行中", color: "bg-[#e3f2fd] text-[#1565c0]" },
  completed: { label: "已完成", color: "bg-[#e8f5e9] text-[#2e7d32]" },
  abandoned: { label: "已放弃", color: "bg-[#f5f5f5] text-[#90a4ae]" },
};

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Goal["status"] | "all">("all");

  // Form state
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<Goal["status"]>("active");
  const [saving, setSaving] = useState(false);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    if (data) setGoals(data as Goal[]);
    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setProgress(0);
    setDeadline("");
    setStatus("active");
    setEditId(null);
    setEditing(false);
  };

  const handleEdit = (g: Goal) => {
    setEditId(g.id);
    setTitle(g.title);
    setDescription(g.description || "");
    setProgress(g.progress);
    setDeadline(g.deadline || "");
    setStatus(g.status);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      progress,
      deadline: deadline || undefined,
      status,
    };
    if (editId) {
      await supabase.from("goals").update(payload).eq("id", editId);
    } else {
      await supabase.from("goals").insert({ user_id: user.id, ...payload });
    }
    setSaving(false);
    resetForm();
    loadGoals();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这个目标吗？")) return;
    await supabase.from("goals").delete().eq("id", id);
    loadGoals();
  };

  const handleStatusChange = async (id: string, newStatus: Goal["status"]) => {
    await supabase.from("goals").update({ status: newStatus }).eq("id", id);
    loadGoals();
  };

  const formatDeadline = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d; // Return raw value if invalid
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}${diff < 0 ? " (已逾期)" : diff === 0 ? " (今天)" : ` (剩余${diff}天)`}`;
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
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <Target className="size-5" /> 🎯 目标规划
        </h2>
        <button
          onClick={() => {
            resetForm();
            setEditing(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
        >
          <Plus className="size-4" /> 新建目标
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "全部" },
          { key: "active", label: "进行中" },
          { key: "completed", label: "已完成" },
          { key: "abandoned", label: "已放弃" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as Goal["status"] | "all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-[#e3f2fd] text-[#1565c0]"
                : "bg-[#f5f9ff] text-[#5c8dc9] hover:bg-[#e3f2fd]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Goals grid + Edit panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Goals list */}
        <div className="md:col-span-2">
          {goals.length === 0 ? (
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
              <div className="text-center py-12 text-sm text-[#90a4ae]">
                🎯 还没有目标
                <br />
                <span className="text-xs">点击「新建目标」开始规划</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => {
                const st = STATUS_LABELS[g.status];
                return (
                  <div
                    key={g.id}
                    className="bg-white rounded-card border border-[#e3f2fd] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[#1a3a5c]">{g.title}</h3>
                        {g.description && (
                          <p className="text-xs text-[#90a4ae] mt-0.5 line-clamp-2">{g.description}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${st.color}`}>
                        {st.label}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#5c8dc9]">进度</span>
                        <span className="text-xs font-medium text-[#1565c0]">{g.progress}%</span>
                      </div>
                      <div className="h-2 bg-[#e3f2fd] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#42a5f5] rounded-full transition-all duration-500"
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta + actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {g.deadline && (
                          <span className="text-xs text-[#90a4ae]">{formatDeadline(g.deadline)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(g)}
                          className="text-xs text-[#42a5f5] hover:bg-[#e3f2fd] px-2 py-1 rounded transition-colors"
                        >
                          编辑
                        </button>
                        {g.status === "active" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(g.id, "completed")}
                              className="text-xs text-[#43a047] hover:bg-[#e8f5e9] px-2 py-1 rounded transition-colors"
                            >
                              完成
                            </button>
                            <button
                              onClick={() => handleStatusChange(g.id, "abandoned")}
                              className="text-xs text-[#90a4ae] hover:bg-[#f5f5f5] px-2 py-1 rounded transition-colors"
                            >
                              放弃
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="text-xs text-red-400 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit panel */}
        <div>
          {editing ? (
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1565c0] text-sm">
                  {editId ? "编辑目标" : "新建目标"}
                </h3>
                <button onClick={resetForm} className="text-[#90a4ae] hover:text-[#666]">
                  <X className="size-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">目标名称</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：读完10本书"
                  className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                />
              </div>

              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">描述（可选）</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="具体计划..."
                  className="w-full border border-[#e3f2fd] rounded-lg p-3 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                />
              </div>

              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">
                  进度: {progress}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-[#42a5f5]"
                />
                <div className="flex justify-between text-xs text-[#90a4ae]">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">截止日期（可选）</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                />
              </div>

              {editId && (
                <div>
                  <label className="text-xs text-[#90a4ae] mb-1.5 block">状态</label>
                  <div className="flex gap-2">
                    {(["active", "completed", "abandoned"] as Goal["status"][]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          status === s
                            ? `${STATUS_LABELS[s].color} border border-current/20`
                            : "bg-[#f5f9ff] text-[#90a4ae]"
                        }`}
                      >
                        {STATUS_LABELS[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
              >
                <Save className="size-3.5" />
                {saving ? "保存中..." : "保存"}
              </button>

              {editId && (
                <button
                  onClick={() => handleDelete(editId)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="size-3.5" /> 删除目标
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5 text-center">
              <div className="py-8 text-sm text-[#90a4ae]">
                点击「新建目标」按钮<br />添加你的年度或月度目标
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
