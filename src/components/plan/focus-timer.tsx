"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Play, Pause, Square, Timer, RotateCcw, Plus, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { PlanNode } from "@/types/database";

type Mode = "countup" | "countdown";

interface SessionRow {
  id: string;
  title: string;
  duration_minutes: number | null;
  node_id: string | null;
  note: string | null;
  status?: string | null;
  created_at: string;
}

interface Finished {
  entryId: string;
  minutes: number;
  title: string;
}

interface Persisted {
  mode: Mode;
  countdownMin: number;
  title: string;
  assocNodeId: string | null;
  running: boolean;
  startedAt: number | null;
  baseElapsed: number;
}

const LS_KEY = "lp-focus-timer";

export default function FocusTimer({
  preselectNode,
  onClearPreselect,
  preselectPlan,
  onClearPreselectPlan,
}: {
  preselectNode: { id: string; title: string } | null;
  onClearPreselect: () => void;
  preselectPlan?: { id: string; title: string; nodeId: string | null } | null;
  onClearPreselectPlan?: () => void;
}) {
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>("countdown");
  const [countdownMin, setCountdownMin] = useState(25);
  // 基于时间戳计时：startedAt = 当前运行段的开始时刻；baseElapsed = 此前累计秒数（暂停留存）
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [baseElapsed, setBaseElapsed] = useState(0);
  const [tick, setTick] = useState(0); // 仅用于每秒触发重渲染

  const [title, setTitle] = useState("");
  const [assocNodeId, setAssocNodeId] = useState<string | null>(null);

  const [nodes, setNodes] = useState<PlanNode[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [pickParentId, setPickParentId] = useState<string>("");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // 今日记录里事后改/补节点归属
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeParent, setNewNodeParent] = useState("");

  // 完成后的轻量化复盘 / 收获
  const [reflectText, setReflectText] = useState("");
  const [reflectToNotes, setReflectToNotes] = useState(false);
  const [reflectCategory, setReflectCategory] = useState("专注复盘");
  const [reflectSaved, setReflectSaved] = useState(false);

  // 今日记录里事后补/改复盘
  const [editNote, setEditNote] = useState("");
  const [editToNotes, setEditToNotes] = useState(false);

  const finishingRef = useRef(false);
  const restoredRef = useRef(false);
  // 若由「日程规划 → 去专注」进入，记下该规划 id；结束时把它就地转成已完成记录而非新建
  const planIdRef = useRef<string | null>(null);

  // 实时计算已专注秒数（运行中用墙钟时间，保证切页面/刷新后仍正确）
  const elapsed =
    running && startedAt != null
      ? baseElapsed + Math.floor((Date.now() - startedAt) / 1000)
      : baseElapsed;

  const nodeTitle = useCallback(
    (id: string | null) => (id ? nodes.find((n) => n.id === id)?.title || "已删除节点" : null),
    [nodes]
  );

  const loadData = useCallback(async () => {
    if (!user) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [{ data: ns }, { data: ss }] = await Promise.all([
      supabase.from("plan_nodes").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .order("created_at", { ascending: false }),
    ]);
    setNodes((ns as PlanNode[]) || []);
    setSessions(
      ((ss as SessionRow[]) || []).filter((r) => r.status !== "planned" && r.status !== "cancelled")
    );
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 挂载时从 localStorage 恢复（支持切 tab / 切页面 / 刷新后继续计时）
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Persisted;
      if (p.mode) setMode(p.mode);
      if (typeof p.countdownMin === "number") setCountdownMin(p.countdownMin);
      if (p.title) setTitle(p.title);
      if (p.assocNodeId) setAssocNodeId(p.assocNodeId);
      setBaseElapsed(p.baseElapsed || 0);
      setStartedAt(p.startedAt ?? null);
      setRunning(!!p.running);
    } catch {
      /* ignore */
    }
  }, []);

  // 状态变更时持久化（tick 不触发，避免高频写入）
  useEffect(() => {
    if (!restoredRef.current) return;
    const data: Persisted = { mode, countdownMin, title, assocNodeId, running, startedAt, baseElapsed };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [mode, countdownMin, title, assocNodeId, running, startedAt, baseElapsed]);

  // 从技能树跳转预选
  useEffect(() => {
    if (preselectNode) {
      setAssocNodeId(preselectNode.id);
      setTitle((t) => t || preselectNode.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectNode]);

  // 从「日程规划 → 去专注」进入：带入标题/节点并记下规划 id
  useEffect(() => {
    if (preselectPlan) {
      planIdRef.current = preselectPlan.id;
      setTitle(preselectPlan.title);
      setAssocNodeId(preselectPlan.nodeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectPlan]);

  // 每秒触发重渲染（仅运行中）
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [running]);

  // 倒计时到点自动结束（含切页面归来后超时的兜底）
  useEffect(() => {
    if (mode === "countdown" && running && elapsed >= countdownMin * 60) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, running, elapsed, mode, countdownMin]);

  const startOrResume = () => {
    setErrMsg(null);
    setFinished(null);
    finishingRef.current = false;
    setStartedAt(Date.now());
    setRunning(true);
  };

  const pauseTimer = () => {
    setBaseElapsed(elapsed);
    setStartedAt(null);
    setRunning(false);
  };

  const resetTimer = () => {
    setRunning(false);
    setStartedAt(null);
    setBaseElapsed(0);
    setErrMsg(null);
    finishingRef.current = false;
  };

  const finish = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const capped = mode === "countdown" ? Math.min(elapsed, countdownMin * 60) : elapsed;
    setRunning(false);
    setStartedAt(null);
    setBaseElapsed(0);
    if (!user || capped < 30) {
      if (capped > 0 && capped < 30) setErrMsg("本次专注不足 30 秒，未记录");
      finishingRef.current = false;
      return;
    }
    const minutes = Math.max(1, Math.round(capped / 60));
    const planId = planIdRef.current;
    let entryId: string | null = null;
    if (planId) {
      // 由日程规划进入：就地把这条规划转成已完成的专注记录
      const { data, error } = await supabase
        .from("time_entries")
        .update({
          title: title.trim() || "专注",
          duration_minutes: minutes,
          pomodoro_count: Math.floor(minutes / 25),
          node_id: assocNodeId,
          status: "done",
          created_at: new Date().toISOString(),
        })
        .eq("id", planId)
        .select("id")
        .single();
      if (error) {
        setErrMsg("记录失败：" + error.message);
        finishingRef.current = false;
        return;
      }
      entryId = (data as { id: string }).id;
      planIdRef.current = null;
      onClearPreselectPlan?.();
    } else {
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          user_id: user.id,
          title: title.trim() || "专注",
          duration_minutes: minutes,
          pomodoro_count: Math.floor(minutes / 25),
          node_id: assocNodeId,
          status: "done",
          tags: [],
        })
        .select("id")
        .single();
      if (error) {
        setErrMsg("记录失败：" + error.message);
        finishingRef.current = false;
        return;
      }
      entryId = (data as { id: string }).id;
    }
    setFinished({ entryId, minutes, title: title.trim() || "专注" });
    setPickParentId(assocNodeId || "");
    setReflectText("");
    setReflectToNotes(false);
    setReflectCategory("专注复盘");
    setReflectSaved(false);
    finishingRef.current = false;
    await loadData();
  };

  // 入树：挂到已有节点下
  const attachUnder = async () => {
    if (!user || !finished || !pickParentId) return;
    const parent = nodes.find((n) => n.id === pickParentId);
    const { data } = await supabase
      .from("plan_nodes")
      .insert({
        user_id: user.id,
        parent_id: pickParentId,
        title: finished.title,
        node_type: "task",
        progress: 100,
        status: "completed",
        category_id: parent?.category_id || null,
        pos_x: (parent?.pos_x || 0) + (Math.random() * 160 - 80),
        pos_y: (parent?.pos_y || 0) + 140,
      })
      .select("id")
      .single();
    if (data) {
      await supabase.from("time_entries").update({ node_id: (data as { id: string }).id }).eq("id", finished.entryId);
    }
    setFinished(null);
    await loadData();
  };

  // 入树：新建独立节点
  const addStandalone = async () => {
    if (!user || !finished) return;
    const { data } = await supabase
      .from("plan_nodes")
      .insert({
        user_id: user.id,
        parent_id: null,
        title: finished.title,
        node_type: "task",
        progress: 100,
        status: "completed",
        pos_x: 200 + Math.random() * 200,
        pos_y: 120 + Math.random() * 200,
      })
      .select("id")
      .single();
    if (data) {
      await supabase.from("time_entries").update({ node_id: (data as { id: string }).id }).eq("id", finished.entryId);
    }
    setFinished(null);
    await loadData();
  };

  const deleteSession = async (id: string) => {
    if (!confirm("删除这条专注记录？")) return;
    await supabase.from("time_entries").delete().eq("id", id);
    loadData();
  };

  const openSessionEditor = (s: SessionRow) => {
    if (editingSessionId === s.id) {
      setEditingSessionId(null);
      return;
    }
    setEditingSessionId(s.id);
    setCreateMode(false);
    setNewNodeTitle(s.title || "");
    setNewNodeParent("");
    setEditNote(s.note || "");
    setEditToNotes(false);
  };

  // 事后修改 / 设置 / 清除这条记录的归属节点
  const reassignSession = async (sessionId: string, nodeId: string | null) => {
    await supabase.from("time_entries").update({ node_id: nodeId }).eq("id", sessionId);
    await loadData();
  };

  // 事后新建一个节点来承载这次专注
  const createNodeForSession = async (s: SessionRow) => {
    if (!user) return;
    const t = newNodeTitle.trim() || s.title || "专注";
    const parent = newNodeParent ? nodes.find((n) => n.id === newNodeParent) : undefined;
    const { data } = await supabase
      .from("plan_nodes")
      .insert({
        user_id: user.id,
        parent_id: newNodeParent || null,
        title: t,
        node_type: "task",
        progress: 100,
        status: "completed",
        category_id: parent?.category_id || null,
        pos_x: (parent?.pos_x ?? 200) + (Math.random() * 160 - 80),
        pos_y: (parent?.pos_y ?? 120) + 140,
      })
      .select("id")
      .single();
    if (data) {
      await supabase.from("time_entries").update({ node_id: (data as { id: string }).id }).eq("id", s.id);
    }
    setEditingSessionId(null);
    setCreateMode(false);
    await loadData();
  };

  // 收进笔记库（笔记灵感库 entries 表）
  const pushToNotes = async (text: string, sessionTitle: string, category: string) => {
    if (!user) return;
    await supabase.from("entries").insert({
      user_id: user.id,
      type: "note",
      content: text,
      category: category.trim() || "专注复盘",
      tags: ["专注", sessionTitle].filter(Boolean),
      source: "web",
    });
  };

  // 完成面板：保存这次专注的复盘 / 收获
  const saveReflection = async () => {
    if (!finished) return;
    const note = reflectText.trim();
    if (!note) {
      setReflectSaved(true);
      return;
    }
    // 先收进笔记库（entries 表始终存在，不受 note 列影响）
    if (reflectToNotes) await pushToNotes(note, finished.title, reflectCategory);
    // 再附到专注记录上（note 列若未迁移会报错，软提示但不阻塞）
    const { error } = await supabase.from("time_entries").update({ note }).eq("id", finished.entryId);
    if (error) {
      setErrMsg(
        reflectToNotes
          ? "收获已存入笔记库，但未能附到专注记录（运行 migrate-focus-reflection.sql 后可内联显示）"
          : "保存失败：请先运行 migrate-focus-reflection.sql 添加 note 列"
      );
    }
    setReflectSaved(true);
    await loadData();
  };

  // 今日记录：事后补 / 改这条专注的复盘
  const saveSessionNote = async (s: SessionRow) => {
    const note = editNote.trim();
    if (editToNotes && note) await pushToNotes(note, s.title, "专注复盘");
    const { error } = await supabase
      .from("time_entries")
      .update({ note: note || null })
      .eq("id", s.id);
    if (error) {
      setErrMsg(
        editToNotes && note
          ? "收获已存入笔记库，但未能附到专注记录（运行 migrate-focus-reflection.sql 后可内联显示）"
          : "保存失败：请先运行 migrate-focus-reflection.sql 添加 note 列"
      );
      return;
    }
    setEditingSessionId(null);
    await loadData();
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const displaySeconds = mode === "countdown" ? Math.max(0, countdownMin * 60 - elapsed) : elapsed;
  const todayTotal = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 计时器 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
        {/* 模式切换 */}
        <div className="flex gap-2">
          {(["countdown", "countup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                if (running) return;
                setMode(m);
                setBaseElapsed(0);
                setStartedAt(null);
              }}
              disabled={running}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 ${
                mode === m ? "bg-[#42a5f5] text-white" : "bg-[#f5f9ff] text-[#5c8dc9] hover:bg-[#e3f2fd]"
              }`}
            >
              {m === "countdown" ? "⏳ 倒计时" : "⏱ 正计时"}
            </button>
          ))}
        </div>

        {/* 倒计时时长设置 */}
        {mode === "countdown" && !running && baseElapsed === 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#90a4ae]">时长</span>
            <div className="flex gap-1">
              {[15, 25, 45, 60].map((min) => (
                <button
                  key={min}
                  onClick={() => setCountdownMin(min)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                    countdownMin === min ? "bg-[#e3f2fd] text-[#1565c0] font-medium" : "bg-[#f5f9ff] text-[#90a4ae]"
                  }`}
                >
                  {min}分
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={180}
              value={countdownMin}
              onChange={(e) => {
                const v = Math.max(1, Math.min(180, Number(e.target.value) || 1));
                setCountdownMin(v);
              }}
              className="w-16 border border-[#e3f2fd] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
            />
          </div>
        )}

        {/* 时间显示 */}
        <div className="text-center py-4">
          <div className="text-5xl font-bold text-[#1a3a5c] tabular-nums">{fmt(displaySeconds)}</div>
        </div>

        {/* 正在做什么 */}
        <div>
          <label className="text-xs text-[#90a4ae] mb-1 block">正在做什么</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：读《深度工作》第三章"
            className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
          />
        </div>

        {/* 关联节点 */}
        <div>
          <label className="text-xs text-[#90a4ae] mb-1 block">关联到技能树节点（可选）</label>
          <div className="flex items-center gap-2">
            <select
              value={assocNodeId || ""}
              onChange={(e) => {
                setAssocNodeId(e.target.value || null);
                if (!e.target.value) onClearPreselect();
              }}
              className="flex-1 border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
            >
              <option value="">不关联</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
            {assocNodeId && (
              <button
                onClick={() => {
                  setAssocNodeId(null);
                  onClearPreselect();
                }}
                className="text-[#90a4ae] hover:text-[#666]"
                title="清除关联"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-2">
          {!running ? (
            <button
              onClick={startOrResume}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
            >
              <Play className="size-4" /> {baseElapsed > 0 ? "继续" : "开始"}
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#fff3e0] text-[#e65100] hover:bg-[#ffe0b2] transition-colors"
            >
              <Pause className="size-4" /> 暂停
            </button>
          )}
          {(running || baseElapsed > 0) && (
            <button
              onClick={finish}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#66bb6a] text-white hover:bg-[#43a047] transition-colors"
            >
              <Square className="size-4" /> 结束并记录
            </button>
          )}
          <button
            onClick={resetTimer}
            className="px-3 py-2.5 rounded-full text-sm bg-[#f5f9ff] text-[#90a4ae] hover:bg-[#e3f2fd] transition-colors"
            title="重置"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        {errMsg && <p className="text-xs text-red-500 text-center">{errMsg}</p>}

        {/* 完成后入树 */}
        {finished && (
          <div className="rounded-lg bg-[#e8f5e9] border border-[#c8e6c9] p-3 space-y-2">
            <div className="text-sm font-medium text-[#2e7d32] flex items-center gap-1">
              <Check className="size-4" /> 已记录 {finished.minutes} 分钟专注 · {finished.title}
            </div>

            {/* 轻量化复盘 / 收获 */}
            <div className="rounded-lg bg-white/70 border border-[#c8e6c9] p-2.5 space-y-2">
              <label className="text-xs font-medium text-[#2e7d32]">✍️ 这次的收获（可选）</label>
              <textarea
                value={reflectText}
                onChange={(e) => {
                  setReflectText(e.target.value);
                  setReflectSaved(false);
                }}
                rows={2}
                placeholder="我学到了什么 / 有什么感悟…"
                className="w-full border border-[#c8e6c9] rounded-lg px-2 py-1.5 text-xs bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#66bb6a]/30"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 text-xs text-[#558b2f] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reflectToNotes}
                    onChange={(e) => setReflectToNotes(e.target.checked)}
                    className="accent-[#66bb6a]"
                  />
                  顺手收进笔记库
                </label>
                {reflectToNotes && (
                  <input
                    value={reflectCategory}
                    onChange={(e) => setReflectCategory(e.target.value)}
                    placeholder="分类"
                    className="w-24 border border-[#c8e6c9] rounded-lg px-2 py-1 text-xs bg-white focus:outline-none"
                  />
                )}
              </div>
              <button
                onClick={saveReflection}
                disabled={reflectSaved && !reflectText.trim()}
                className="w-full px-3 py-1.5 rounded-full text-xs font-medium bg-[#66bb6a] text-white hover:bg-[#43a047] disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
              >
                {reflectSaved ? (
                  <>
                    <Check className="size-3" /> 已保存收获
                  </>
                ) : (
                  "保存收获"
                )}
              </button>
            </div>

            <p className="text-xs text-[#558b2f]">把这次努力加进技能树？</p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <select
                  value={pickParentId}
                  onChange={(e) => setPickParentId(e.target.value)}
                  className="flex-1 border border-[#c8e6c9] rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none"
                >
                  <option value="">选择父节点...</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={attachUnder}
                  disabled={!pickParentId}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  挂到该节点下
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addStandalone}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-[#2e7d32] border border-[#c8e6c9] hover:bg-[#f1f8e9] transition-colors"
                >
                  <Plus className="size-3" /> 新建独立节点
                </button>
                <button
                  onClick={() => setFinished(null)}
                  className="flex-1 px-3 py-1.5 rounded-full text-xs text-[#90a4ae] hover:bg-white transition-colors"
                >
                  仅记录，不入树
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 今日记录 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#1565c0] text-sm flex items-center gap-1.5">
            <Timer className="size-4" /> 今日专注
          </h3>
          <span className="text-xs text-[#42a5f5]">共 {todayTotal} 分钟 · {sessions.length} 次</span>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#90a4ae]">
            🌱 今天还没有专注记录
            <br />
            <span className="text-xs">设定时长，开始第一次专注吧</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
            {sessions.map((s) => {
              const editing = editingSessionId === s.id;
              return (
                <div
                  key={s.id}
                  className="rounded-lg border border-[#e3f2fd]/60 hover:bg-[#f5f9ff] transition-colors group"
                >
                  <div className="flex items-center gap-2 p-2.5">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-[#e3f2fd] text-[#1565c0] shrink-0">
                      {s.duration_minutes || 0}分
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#1a3a5c] truncate">{s.title}</div>
                      <div className="text-[11px] text-[#90a4ae]">
                        {new Date(s.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                        {s.node_id ? (
                          <span className="text-[#42a5f5]"> · 🌳 {nodeTitle(s.node_id)}</span>
                        ) : (
                          <span className="text-[#f0a020]"> · 未归属</span>
                        )}
                      </div>
                      {s.note && (
                        <div className="text-[11px] text-[#7c9c6e] truncate mt-0.5">✍️ {s.note}</div>
                      )}
                    </div>
                    <button
                      onClick={() => openSessionEditor(s)}
                      title="设置归属节点"
                      className={`p-1 rounded text-xs transition-all ${
                        editing
                          ? "text-[#1e88e5] bg-[#e3f2fd]"
                          : "opacity-0 group-hover:opacity-100 text-[#42a5f5] hover:bg-[#e3f2fd]"
                      }`}
                    >
                      🌳
                    </button>
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 p-1 rounded transition-all"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  {editing && (
                    <div className="px-2.5 pb-2.5 pt-2 border-t border-[#e3f2fd]/60 space-y-2">
                      {!createMode ? (
                        <>
                          <label className="text-[11px] text-[#90a4ae] block">归属到技能树节点</label>
                          <select
                            value={s.node_id || ""}
                            onChange={(e) => reassignSession(s.id, e.target.value || null)}
                            className="w-full border border-[#e3f2fd] rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                          >
                            <option value="">不关联</option>
                            {nodes.map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.title}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              setCreateMode(true);
                              setNewNodeTitle(s.title || "");
                              setNewNodeParent("");
                            }}
                            className="text-xs text-[#42a5f5] hover:underline flex items-center gap-1"
                          >
                            <Plus className="size-3" /> 新建一个节点来承载它
                          </button>
                        </>
                      ) : (
                        <>
                          <label className="text-[11px] text-[#90a4ae] block">新建节点</label>
                          <input
                            value={newNodeTitle}
                            onChange={(e) => setNewNodeTitle(e.target.value)}
                            placeholder="节点标题"
                            className="w-full border border-[#e3f2fd] rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                          />
                          <select
                            value={newNodeParent}
                            onChange={(e) => setNewNodeParent(e.target.value)}
                            className="w-full border border-[#e3f2fd] rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                          >
                            <option value="">作为独立节点</option>
                            {nodes.map((n) => (
                              <option key={n.id} value={n.id}>
                                挂到：{n.title}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => createNodeForSession(s)}
                              disabled={!newNodeTitle.trim()}
                              className="flex-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
                            >
                              创建并关联
                            </button>
                            <button
                              onClick={() => setCreateMode(false)}
                              className="px-3 py-1.5 rounded-full text-xs text-[#90a4ae] hover:bg-white transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        </>
                      )}

                      {/* 复盘 / 收获 */}
                      <div className="pt-2 border-t border-[#e3f2fd]/60 space-y-1.5">
                        <label className="text-[11px] text-[#90a4ae] block">✍️ 这次的收获</label>
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          rows={2}
                          placeholder="补一句：我学到了什么 / 有什么感悟…"
                          className="w-full border border-[#e3f2fd] rounded-lg px-2 py-1.5 text-xs bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-1.5 text-[11px] text-[#90a4ae] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editToNotes}
                              onChange={(e) => setEditToNotes(e.target.checked)}
                              className="accent-[#42a5f5]"
                            />
                            同时存入笔记库
                          </label>
                          <button
                            onClick={() => saveSessionNote(s)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
                          >
                            保存收获
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
