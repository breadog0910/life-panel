"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Upload,
  Sparkles,
  Save,
  Play,
  GraduationCap,
  Trash2,
  RefreshCw,
  Shuffle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { extractText } from "@/lib/doc-extract";
import type { QuizQuestion, QuizPaper, QuizMode } from "@/types/database";
import QuizRunner from "@/components/lab/quiz-runner";
import QuizPicker from "@/components/lab/quiz-picker";

type Step = "config" | "ready" | "select" | "running";

const clamp = (n: unknown) => Math.max(0, Math.min(30, Math.floor(Number(n) || 0)));

function examLimitSeconds(count: number): number {
  return Math.max(1, Math.ceil(count * 1.5)) * 60;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export default function QuizTool() {
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("config");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);

  const [single, setSingle] = useState(5);
  const [multiple, setMultiple] = useState(0);
  const [judge, setJudge] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [needKey, setNeedKey] = useState(false);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const [runMode, setRunMode] = useState<QuizMode>("selftest");
  const [runPaperId, setRunPaperId] = useState<string | null>(null);
  const [runLimit, setRunLimit] = useState<number | null>(null);
  const [runReturnStep, setRunReturnStep] = useState<Step>("ready");

  const [pickerPool, setPickerPool] = useState<QuizQuestion[]>([]);
  const [pickerTitle, setPickerTitle] = useState("");
  const [pickerSourceId, setPickerSourceId] = useState<string | null>(null);
  const [pickerReturn, setPickerReturn] = useState<Step>("ready");

  const [papers, setPapers] = useState<QuizPaper[]>([]);
  const [papersLoading, setPapersLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [savingPaper, setSavingPaper] = useState(false);
  const [savedTip, setSavedTip] = useState(false);

  const countByType = (t: QuizQuestion["type"]) =>
    questions.filter((q) => q.type === t).length;

  const loadPapers = useCallback(async () => {
    if (!user) return;
    setPapersLoading(true);
    const { data } = await supabase
      .from("quiz_papers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setPapers(data as QuizPaper[]);
    setPapersLoading(false);
  }, [user]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setExtracting(true);
    try {
      const extracted = await extractText(file);
      setText(extracted);
      setFileName(file.name);
    } catch {
      setError("文档解析失败，请改用 .txt 或直接粘贴文字");
    } finally {
      setExtracting(false);
    }
  };

  const handleGenerate = async () => {
    setError("");
    setNeedKey(false);
    if (!text.trim() || single + multiple + judge < 1) return;
    setGenerating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("请先登录");
        return;
      }
      const res = await fetch("/api/lab/quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text, single, multiple, judge }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "出题失败");
        if (typeof data.error === "string" && data.error.includes("AI 智能设置")) {
          setNeedKey(true);
        }
        return;
      }
      setQuestions(data.questions as QuizQuestion[]);
      setStep("ready");
    } catch (e) {
      setError("网络错误，请稍后重试");
    } finally {
      setGenerating(false);
    }
  };

  const startRun = (
    qs: QuizQuestion[],
    mode: QuizMode,
    paperId: string | null,
    returnStep: Step
  ) => {
    setQuestions(qs);
    setRunMode(mode);
    setRunPaperId(paperId);
    setRunLimit(mode === "exam" ? examLimitSeconds(qs.length) : null);
    setRunReturnStep(returnStep);
    setStep("running");
  };

  const openPicker = (
    pool: QuizQuestion[],
    sourceId: string | null,
    returnStep: Step
  ) => {
    const stamp = new Date().toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    setPickerPool(pool);
    setPickerSourceId(sourceId);
    setPickerReturn(returnStep);
    setPickerTitle(`组卷 ${stamp}`);
    setStep("select");
  };

  const insertPaper = async (qs: QuizQuestion[], title: string) => {
    if (!user) return;
    await supabase.from("quiz_papers").insert({
      user_id: user.id,
      title,
      questions: qs,
      single_count: qs.filter((q) => q.type === "single").length,
      multiple_count: qs.filter((q) => q.type === "multiple").length,
      judge_count: qs.filter((q) => q.type === "judge").length,
    });
    loadPapers();
  };

  const handleSavePaper = async () => {
    if (!user || questions.length === 0) return;
    const defaultTitle = `模拟卷 ${new Date().toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    setSavingPaper(true);
    await insertPaper(questions, defaultTitle);
    setSavingPaper(false);
    setSavedTip(true);
    setTimeout(() => setSavedTip(false), 2000);
  };

  const handleDeletePaper = async (id: string) => {
    await supabase.from("quiz_papers").delete().eq("id", id);
    setConfirmDeleteId(null);
    loadPapers();
  };

  // ===== 答题中 =====
  if (step === "running") {
    return (
      <div className="space-y-4">
        <QuizRunner
          questions={questions}
          mode={runMode}
          paperId={runPaperId}
          limitSeconds={runLimit}
          onExit={() => {
            setStep(runReturnStep);
            loadPapers();
          }}
        />
      </div>
    );
  }

  // ===== 抽题组卷 =====
  if (step === "select") {
    return (
      <QuizPicker
        pool={pickerPool}
        defaultTitle={pickerTitle}
        onSelfTest={(qs) => startRun(qs, "selftest", pickerSourceId, pickerReturn)}
        onExam={(qs) => startRun(qs, "exam", pickerSourceId, pickerReturn)}
        onCompose={(qs, title) => insertPaper(qs, title)}
        onCancel={() => setStep(pickerReturn)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <FileText className="size-5" /> 📝 智能题库
        </h2>
        <Link
          href="/lab"
          className="flex items-center gap-1.5 text-sm text-[#42a5f5] hover:text-[#1e88e5] transition-colors"
        >
          <ArrowLeft className="size-4" /> 实验室
        </Link>
      </div>

      {/* 阶段 A：录入与配置 */}
      {step === "config" && (
        <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-[#1a3a5c] mb-1.5 block">
              资料内容
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="粘贴课文 / 笔记 / 知识点，或上传 .txt / .docx 文档..."
              className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 resize-y"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-[#90a4ae]">已 {text.length} 字</span>
              <label className="flex items-center gap-1.5 text-xs text-[#42a5f5] hover:text-[#1e88e5] cursor-pointer">
                <Upload className="size-3.5" />
                {extracting ? "解析中..." : "上传 .txt / .docx"}
                <input
                  type="file"
                  accept=".txt,.docx"
                  className="hidden"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {fileName && (
              <p className="text-xs text-[#90a4ae] mt-1">已载入：{fileName}</p>
            )}
          </div>

          {/* 题量配置 */}
          <div>
            <label className="text-sm font-medium text-[#1a3a5c] mb-1.5 block">
              出题数量（每类 0~30）
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["单选题", single, setSingle],
                  ["多选题", multiple, setMultiple],
                  ["判断题", judge, setJudge],
                ] as const
              ).map(([label, val, setter]) => (
                <div key={label}>
                  <span className="text-xs text-[#90a4ae] mb-1 block">{label}</span>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={val}
                    onChange={(e) => setter(clamp(e.target.value))}
                    className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-[#ef5350] bg-[#ffebee] rounded-lg p-2.5">
              {error}
              {needKey && (
                <Link href="/settings/ai" className="ml-2 underline text-[#1565c0]">
                  去 AI 设置
                </Link>
              )}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!text.trim() || single + multiple + judge < 1 || generating}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
          >
            <Sparkles className="size-4" />
            {generating ? "AI 出题中…（资料越长越久）" : "生成题目"}
          </button>
        </div>
      )}

      {/* 阶段 B：操作区 */}
      {step === "ready" && (
        <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
          <div>
            <div className="text-base font-semibold text-[#1565c0]">
              已生成 {questions.length} 道题
            </div>
            <div className="text-xs text-[#90a4ae] mt-0.5">
              单选 {countByType("single")} · 多选 {countByType("multiple")} · 判断{" "}
              {countByType("judge")}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => startRun(questions, "selftest", null, "ready")}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
            >
              <Play className="size-4" /> 开始自测
            </button>
            <button
              onClick={() => startRun(questions, "exam", null, "ready")}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#1565c0] text-white hover:bg-[#0d47a1] transition-colors"
            >
              <GraduationCap className="size-4" /> 开始考试
            </button>
            <button
              onClick={handleSavePaper}
              disabled={savingPaper}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] disabled:opacity-40 transition-colors"
            >
              <Save className="size-4" /> {savedTip ? "已保存 ✨" : "保存为模拟卷"}
            </button>
          </div>

          <button
            onClick={() => openPicker(questions, null, "ready")}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#fff8e1] text-[#b8860b] border border-[#ffe082] hover:bg-[#fff3cf] transition-colors"
          >
            <Shuffle className="size-4" /> 抽题组卷（勾选 / 随机抽几道）
          </button>

          <div className="text-xs text-[#90a4ae]">
            考试模式限时约 {Math.ceil(questions.length * 1.5)} 分钟，到点自动交卷。多出几道题就能攒成大题库，再从里面抽题组小卷。
          </div>

          <button
            onClick={() => setStep("config")}
            className="flex items-center gap-1.5 text-sm text-[#42a5f5] hover:text-[#1e88e5] transition-colors"
          >
            <RefreshCw className="size-4" /> 重新出题
          </button>
        </div>
      )}

      {/* 我的模拟卷 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#1a3a5c]">我的模拟卷</h3>
        {papersLoading ? (
          <div className="text-sm text-[#90a4ae] py-4">加载中...</div>
        ) : papers.length === 0 ? (
          <div className="bg-white rounded-card border border-[#e3f2fd] p-6 text-center text-sm text-[#90a4ae]">
            还没有保存的模拟卷～<br />
            <span className="text-xs">出题后点「保存为模拟卷」即可复用</span>
          </div>
        ) : (
          <div className="space-y-2">
            {papers.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-card border border-[#e3f2fd] p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#1a3a5c] truncate">{p.title}</div>
                  <div className="text-xs text-[#90a4ae] mt-0.5">
                    共 {p.questions?.length ?? 0} 题（单 {p.single_count}/多 {p.multiple_count}/判{" "}
                    {p.judge_count}） · {relativeTime(p.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {confirmDeleteId === p.id ? (
                    <>
                      <button
                        onClick={() => handleDeletePaper(p.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        确认删除?
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg text-xs text-[#5c8dc9] bg-[#f5f9ff] hover:bg-[#e3f2fd] transition-colors"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startRun(p.questions || [], "selftest", p.id, "config")}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] transition-colors"
                      >
                        自测
                      </button>
                      <button
                        onClick={() => startRun(p.questions || [], "exam", p.id, "config")}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1565c0] text-white hover:bg-[#0d47a1] transition-colors"
                      >
                        考试
                      </button>
                      <button
                        onClick={() => openPicker(p.questions || [], p.id, "config")}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#fff8e1] text-[#b8860b] border border-[#ffe082] hover:bg-[#fff3cf] transition-colors"
                      >
                        抽题
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
