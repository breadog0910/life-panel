"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { PlanNode } from "@/types/database";

interface SessionRow {
  id: string;
  title: string;
  duration_minutes: number | null;
  node_id: string | null;
  note: string | null;
  created_at: string;
}

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PlanCalendar() {
  const { user } = useAuth();
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [nodes, setNodes] = useState<PlanNode[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(() => dayKey(new Date()));

  // 当日详情里就地编辑某条专注的复盘收获
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editToNotes, setEditToNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  // 删除某条记录的二次确认（应用内确认，避免依赖浏览器弹窗）
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 在选中日手动补记一笔（干了什么 + 几点到几点，可选）
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addStart, setAddStart] = useState("");
  const [addEnd, setAddEnd] = useState("");
  const [addToNotes, setAddToNotes] = useState(false);
  const [addSaving, setAddSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    const [{ data: ss }, { data: ns }] = await Promise.all([
      supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false }),
      supabase.from("plan_nodes").select("id, title").eq("user_id", user.id),
    ]);
    setSessions((ss as SessionRow[]) || []);
    setNodes((ns as PlanNode[]) || []);
  }, [user, viewDate]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = useCallback((s: SessionRow) => {
    setEditingId(s.id);
    setEditNote(s.note || "");
    setEditToNotes(false);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditNote("");
    setEditToNotes(false);
  }, []);

  // 收进笔记库（笔记灵感库 entries 表）
  const pushToNotes = useCallback(
    async (text: string, sessionTitle: string) => {
      if (!user) return;
      await supabase.from("entries").insert({
        user_id: user.id,
        type: "note",
        content: text,
        category: "专注复盘",
        tags: ["专注", sessionTitle].filter(Boolean),
        source: "web",
      });
    },
    [user]
  );

  const saveNote = useCallback(
    async (s: SessionRow) => {
      setSavingNote(true);
      const note = editNote.trim();
      if (editToNotes && note) await pushToNotes(note, s.title);
      const { error } = await supabase
        .from("time_entries")
        .update({ note: note || null })
        .eq("id", s.id);
      setSavingNote(false);
      if (error) {
        alert(
          editToNotes && note
            ? "收获已存入笔记库，但未能附到专注记录（运行 migrate-focus-reflection.sql 后可内联显示）。"
            : "保存失败，请先在 Supabase 运行 migrate-focus-reflection.sql（time_entries.note 列）。"
        );
        if (!(editToNotes && note)) return;
      }
      setEditingId(null);
      setEditNote("");
      setEditToNotes(false);
      load();
    },
    [editNote, editToNotes, pushToNotes, load]
  );

  const nodeTitle = useCallback(
    (id: string | null) => (id ? nodes.find((n) => n.id === id)?.title || "已删除节点" : null),
    [nodes]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      await supabase.from("time_entries").delete().eq("id", id);
      setDeletingId(null);
      load();
    },
    [load]
  );

  const openAdd = useCallback(() => {
    setAddOpen(true);
    setAddTitle("");
    setAddStart("");
    setAddEnd("");
    setAddToNotes(false);
  }, []);

  const cancelAdd = useCallback(() => {
    setAddOpen(false);
    setAddTitle("");
    setAddStart("");
    setAddEnd("");
    setAddToNotes(false);
  }, []);

  const addManualEntry = useCallback(async () => {
    if (!user || !selectedDay) return;
    const title = addTitle.trim();
    if (!title) return;
    setAddSaving(true);

    const [y, m, d] = selectedDay.split("-").map(Number);
    // 起始时刻：填了开始时间用之，否则默认当天 12:00（仅用于排序/落到当天）
    let hh = 12;
    let mm = 0;
    if (addStart) {
      const [a, b] = addStart.split(":").map(Number);
      hh = a;
      mm = b;
    }
    const createdAt = new Date(y, m - 1, d, hh, mm).toISOString();

    // 时长：填了开始+结束且结束晚于开始才计算，否则记 0 分钟
    let duration = 0;
    if (addStart && addEnd) {
      const [sh, sm] = addStart.split(":").map(Number);
      const [eh, em] = addEnd.split(":").map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      if (diff > 0) duration = diff;
    }

    if (addToNotes) await pushToNotes(title, "");

    const { error } = await supabase.from("time_entries").insert({
      user_id: user.id,
      title,
      duration_minutes: duration,
      created_at: createdAt,
      tags: [],
    });
    setAddSaving(false);
    if (error) {
      alert("记录失败：" + error.message);
      return;
    }
    cancelAdd();
    load();
  }, [user, selectedDay, addTitle, addStart, addEnd, addToNotes, pushToNotes, cancelAdd, load]);

  // 按天聚合
  const byDay = useMemo(() => {
    const map: Record<string, { minutes: number; count: number; rows: SessionRow[] }> = {};
    sessions.forEach((s) => {
      const k = dayKey(new Date(s.created_at));
      if (!map[k]) map[k] = { minutes: 0, count: 0, rows: [] };
      map[k].minutes += s.duration_minutes || 0;
      map[k].count += 1;
      map[k].rows.push(s);
    });
    return map;
  }, [sessions]);

  // 选中日的贡献（按节点聚合）
  const selectedDetail = useMemo(() => {
    if (!selectedDay) return null;
    const day = byDay[selectedDay];
    if (!day) return { minutes: 0, rows: [] as SessionRow[], contrib: [] as { title: string; minutes: number }[] };
    const contribMap: Record<string, number> = {};
    day.rows.forEach((r) => {
      if (r.node_id) contribMap[r.node_id] = (contribMap[r.node_id] || 0) + (r.duration_minutes || 0);
    });
    const contrib = Object.entries(contribMap)
      .map(([id, minutes]) => ({ title: nodeTitle(id) || "节点", minutes }))
      .sort((a, b) => b.minutes - a.minutes);
    return { minutes: day.minutes, rows: day.rows, contrib };
  }, [selectedDay, byDay, nodeTitle]);

  // 月度网格
  const cells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // 周一为起点：getDay() 0=周日
    const lead = (firstDay.getDay() + 6) % 7;
    const arr: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    return arr;
  }, [viewDate]);

  const monthTotal = useMemo(() => sessions.reduce((s, r) => s + (r.duration_minutes || 0), 0), [sessions]);
  const todayKey = dayKey(new Date());

  const maxDayMin = useMemo(() => Math.max(1, ...Object.values(byDay).map((d) => d.minutes)), [byDay]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 月历 */}
      <div className="lg:col-span-2 bg-white rounded-card border border-[#e3f2fd] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1565c0] text-sm flex items-center gap-1.5">
            <CalIcon className="size-4" />
            {viewDate.getFullYear()} 年 {viewDate.getMonth() + 1} 月
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#42a5f5]">本月专注 {monthTotal} 分钟</span>
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-[#e3f2fd] text-[#5c8dc9] transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => {
                const d = new Date();
                setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelectedDay(dayKey(d));
              }}
              className="text-xs px-2 py-1 rounded-lg hover:bg-[#e3f2fd] text-[#5c8dc9] transition-colors"
            >
              今天
            </button>
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-[#e3f2fd] text-[#5c8dc9] transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-xs text-[#90a4ae] py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`b${i}`} />;
            const k = dayKey(d);
            const info = byDay[k];
            const isToday = k === todayKey;
            const isSel = k === selectedDay;
            const intensity = info ? 0.15 + 0.85 * (info.minutes / maxDayMin) : 0;
            return (
              <button
                key={k}
                onClick={() => setSelectedDay(k)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative ${
                  isSel ? "ring-2 ring-[#1e88e5]" : ""
                } ${isToday ? "font-bold" : ""}`}
                style={{
                  backgroundColor: info ? `rgba(66,165,245,${intensity})` : "#f5f9ff",
                  color: intensity > 0.5 ? "#fff" : "#1a3a5c",
                }}
              >
                <span>{d.getDate()}</span>
                {info && <span className="text-[9px] opacity-90">{info.minutes}分</span>}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[#90a4ae] mt-3">💡 颜色越深表示当天专注时长越多；点击某天查看详情。</p>
      </div>

      {/* 当日详情 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#1565c0] text-sm">
            {selectedDay ? selectedDay.replace(/-/g, "/") : "选择日期"}
          </h3>
          {selectedDay && !addOpen && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
            >
              <Plus className="size-3.5" /> 记一笔
            </button>
          )}
        </div>

        {addOpen && (
          <div className="mb-4 p-3 rounded-lg bg-[#f5f9ff] border border-[#e3f2fd] space-y-2">
            <input
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="这天我干了什么..."
              className="w-full border border-[#e3f2fd] rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#90a4ae] shrink-0">几点到几点（可不填）</label>
              <input
                type="time"
                value={addStart}
                onChange={(e) => setAddStart(e.target.value)}
                className="border border-[#e3f2fd] rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
              />
              <span className="text-xs text-[#90a4ae]">→</span>
              <input
                type="time"
                value={addEnd}
                onChange={(e) => setAddEnd(e.target.value)}
                className="border border-[#e3f2fd] rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
              />
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-[#5c6b7a] cursor-pointer">
              <input
                type="checkbox"
                checked={addToNotes}
                onChange={(e) => setAddToNotes(e.target.checked)}
                className="accent-[#42a5f5]"
              />
              同时记录到笔记库
            </label>
            <div className="flex gap-2">
              <button
                onClick={addManualEntry}
                disabled={!addTitle.trim() || addSaving}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
              >
                <Check className="size-3" /> {addSaving ? "保存中..." : "保存"}
              </button>
              <button
                onClick={cancelAdd}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-[#90a4ae] hover:bg-[#e3f2fd] transition-colors"
              >
                <X className="size-3" /> 取消
              </button>
            </div>
          </div>
        )}

        {!selectedDetail || selectedDetail.rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#90a4ae]">这一天还没有记录</div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-[#1a3a5c]">
              当天记录 <span className="font-bold text-[#42a5f5]">{selectedDetail.rows.length}</span> 条，专注{" "}
              <span className="font-bold text-[#42a5f5]">{selectedDetail.minutes}</span> 分钟
            </div>

            {selectedDetail.contrib.length > 0 && (
              <div>
                <div className="text-xs text-[#90a4ae] mb-1.5">🌳 为这些分支做了贡献</div>
                <div className="space-y-1">
                  {selectedDetail.contrib.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#1a3a5c] truncate">{c.title}</span>
                      <span className="text-[#42a5f5] shrink-0 ml-2">{c.minutes}分</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-[#90a4ae] mb-1.5">⏱ 当天记录</div>
              <div className="space-y-2">
                {selectedDetail.rows.map((r) => (
                  <div key={r.id} className="p-2 rounded-lg bg-[#f5f9ff]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-[#e3f2fd] text-[#1565c0] shrink-0">
                        {r.duration_minutes || 0}分
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#1a3a5c] truncate">{r.title}</div>
                        <div className="text-[11px] text-[#90a4ae]">
                          {new Date(r.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                          {r.node_id && <span className="text-[#42a5f5]"> · {nodeTitle(r.node_id)}</span>}
                        </div>
                      </div>
                      {editingId !== r.id && deletingId !== r.id && (
                        <div className="flex items-center shrink-0">
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1 rounded text-[#90a4ae] hover:text-[#42a5f5] hover:bg-[#e3f2fd] transition-colors"
                            title={r.note ? "编辑收获" : "补写收获"}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(r.id)}
                            className="p-1 rounded text-[#90a4ae] hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="删除这条记录"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {deletingId === r.id ? (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-red-500">确定删除这条记录？</span>
                        <button
                          onClick={() => deleteEntry(r.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="size-3" /> 删除
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-[#90a4ae] hover:bg-[#e3f2fd] transition-colors"
                        >
                          <X className="size-3" /> 取消
                        </button>
                      </div>
                    ) : editingId === r.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="这次专注我学到了/收获了什么..."
                          className="w-full border border-[#e3f2fd] rounded-lg p-2 text-xs resize-none h-16 bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                          autoFocus
                        />
                        <label className="flex items-center gap-1.5 text-[11px] text-[#5c6b7a] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editToNotes}
                            onChange={(e) => setEditToNotes(e.target.checked)}
                            className="accent-[#42a5f5]"
                          />
                          同时存入笔记库
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveNote(r)}
                            disabled={savingNote}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
                          >
                            <Check className="size-3" /> {savingNote ? "保存中..." : "保存"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-[#90a4ae] hover:bg-[#e3f2fd] transition-colors"
                          >
                            <X className="size-3" /> 取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      r.note && (
                        <div className="mt-1.5 text-xs text-[#5c6b7a] bg-white rounded-lg px-2 py-1.5 border border-[#e3f2fd]">
                          ✍️ {r.note}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
