"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Shuffle, Play, GraduationCap, Save, CheckCheck, Eraser } from "lucide-react";
import type { QuizQuestion } from "@/types/database";

interface QuizPickerProps {
  pool: QuizQuestion[];
  defaultTitle: string;
  onSelfTest: (qs: QuizQuestion[]) => void;
  onExam: (qs: QuizQuestion[]) => void;
  onCompose: (qs: QuizQuestion[], title: string) => Promise<void> | void;
  onCancel: () => void;
}

const TYPE_LABEL: Record<QuizQuestion["type"], string> = {
  single: "单选",
  multiple: "多选",
  judge: "判断",
};

const clampTo = (n: unknown, max: number) =>
  Math.max(0, Math.min(max, Math.floor(Number(n) || 0)));

export default function QuizPicker({
  pool,
  defaultTitle,
  onSelfTest,
  onExam,
  onCompose,
  onCancel,
}: QuizPickerProps) {
  const avail = useMemo(
    () => ({
      single: pool.filter((q) => q.type === "single").length,
      multiple: pool.filter((q) => q.type === "multiple").length,
      judge: pool.filter((q) => q.type === "judge").length,
    }),
    [pool]
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState(defaultTitle);
  const [composing, setComposing] = useState(false);
  const [composedTip, setComposedTip] = useState(false);

  const [drawSingle, setDrawSingle] = useState(Math.min(5, avail.single));
  const [drawMultiple, setDrawMultiple] = useState(0);
  const [drawJudge, setDrawJudge] = useState(0);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const randomDraw = () => {
    const pickType = (type: QuizQuestion["type"], n: number) => {
      const ids = pool.filter((q) => q.type === type).map((q) => q.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      return ids.slice(0, n);
    };
    setSelected(
      new Set<string>([
        ...pickType("single", drawSingle),
        ...pickType("multiple", drawMultiple),
        ...pickType("judge", drawJudge),
      ])
    );
  };

  const selectAll = () => setSelected(new Set(pool.map((q) => q.id)));
  const clearAll = () => setSelected(new Set());

  const selectedQuestions = pool.filter((q) => selected.has(q.id));
  const selCount = selectedQuestions.length;
  const cnt = (t: QuizQuestion["type"]) =>
    selectedQuestions.filter((q) => q.type === t).length;

  const handleCompose = async () => {
    if (selCount === 0) return;
    setComposing(true);
    await onCompose(selectedQuestions, title.trim() || defaultTitle);
    setComposing(false);
    setComposedTip(true);
    setTimeout(() => setComposedTip(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <Shuffle className="size-5" /> 抽题组卷
        </h2>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-[#42a5f5] hover:text-[#1e88e5] transition-colors"
        >
          <ArrowLeft className="size-4" /> 返回
        </button>
      </div>

      <p className="text-xs text-[#90a4ae]">
        题库共 {pool.length} 题（单 {avail.single}/多 {avail.multiple}/判 {avail.judge}）。
        可手动勾选，或按数量随机抽取。
      </p>

      {/* 随机抽取 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-4 space-y-3">
        <div className="text-sm font-medium text-[#1a3a5c]">随机抽取</div>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["单选题", drawSingle, setDrawSingle, avail.single],
              ["多选题", drawMultiple, setDrawMultiple, avail.multiple],
              ["判断题", drawJudge, setDrawJudge, avail.judge],
            ] as const
          ).map(([label, val, setter, max]) => (
            <div key={label}>
              <span className="text-xs text-[#90a4ae] mb-1 block">
                {label}（≤{max}）
              </span>
              <input
                type="number"
                min={0}
                max={max}
                value={val}
                onChange={(e) => setter(clampTo(e.target.value, max))}
                className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
              />
            </div>
          ))}
        </div>
        <button
          onClick={randomDraw}
          disabled={drawSingle + drawMultiple + drawJudge < 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] disabled:opacity-40 transition-colors"
        >
          <Shuffle className="size-4" /> 随机抽取（覆盖当前勾选）
        </button>
      </div>

      {/* 选择工具条 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-[#5c8dc9]">
          已选 <b className="text-[#1565c0]">{selCount}</b> 题（单 {cnt("single")}/多{" "}
          {cnt("multiple")}/判 {cnt("judge")}）
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="flex items-center gap-1 text-xs text-[#42a5f5] hover:text-[#1e88e5]"
          >
            <CheckCheck className="size-3.5" /> 全选
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-[#90a4ae] hover:text-[#5c8dc9]"
          >
            <Eraser className="size-3.5" /> 清空
          </button>
        </div>
      </div>

      {/* 题目列表（勾选） */}
      <div className="space-y-1.5">
        {pool.map((q, i) => {
          const picked = selected.has(q.id);
          return (
            <button
              key={q.id}
              onClick={() => toggle(q.id)}
              className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                picked
                  ? "border-[#42a5f5] bg-[#e3f2fd]"
                  : "border-[#e3f2fd] bg-white hover:bg-[#f5f9ff]"
              }`}
            >
              <span
                className={`shrink-0 mt-0.5 inline-flex items-center justify-center size-5 rounded border text-xs ${
                  picked ? "border-[#42a5f5] text-[#1565c0]" : "border-[#cfd8dc] text-transparent"
                }`}
              >
                ✓
              </span>
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[#e3f2fd] text-[#1565c0] mt-0.5">
                {TYPE_LABEL[q.type]}
              </span>
              <span className="min-w-0 text-[#1a3a5c]">
                {i + 1}. {q.question}
              </span>
            </button>
          );
        })}
      </div>

      {/* 底部：组卷 / 自测 / 考试 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-4 space-y-3 sticky bottom-16 md:bottom-2">
        <div>
          <label className="text-xs text-[#90a4ae] mb-1 block">卷名（组卷时用）</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={defaultTitle}
            className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => onSelfTest(selectedQuestions)}
            disabled={selCount === 0}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
          >
            <Play className="size-4" /> 自测选中题
          </button>
          <button
            onClick={() => onExam(selectedQuestions)}
            disabled={selCount === 0}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#1565c0] text-white hover:bg-[#0d47a1] disabled:opacity-40 transition-colors"
          >
            <GraduationCap className="size-4" /> 考试选中题
          </button>
          <button
            onClick={handleCompose}
            disabled={selCount === 0 || composing}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] disabled:opacity-40 transition-colors"
          >
            <Save className="size-4" /> {composedTip ? "已组卷 ✨" : "组卷（存模拟卷）"}
          </button>
        </div>
      </div>
    </div>
  );
}
