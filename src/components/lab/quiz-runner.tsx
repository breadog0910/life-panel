"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Clock, RotateCcw, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { QuizQuestion, QuizMode } from "@/types/database";

interface QuizRunnerProps {
  questions: QuizQuestion[];
  mode: QuizMode;
  paperId: string | null;
  limitSeconds: number | null;
  onExit: () => void;
}

const TYPE_LABEL: Record<QuizQuestion["type"], string> = {
  single: "单选",
  multiple: "多选",
  judge: "判断",
};

function gradeQuestion(q: QuizQuestion, userAns: number[]): boolean {
  const a = [...q.answer].sort((x, y) => x - y);
  const b = [...userAns].sort((x, y) => x - y);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function fmtTime(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function QuizRunner({
  questions,
  mode,
  paperId,
  limitSeconds,
  onExit,
}: QuizRunnerProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<number[][]>(() => questions.map(() => []));
  const [revealed, setRevealed] = useState<boolean[]>(() => questions.map(() => false));
  const [submitted, setSubmitted] = useState(false);
  const [remaining, setRemaining] = useState<number>(limitSeconds ?? 0);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [savingAttempt, setSavingAttempt] = useState(false);
  const submittedRef = useRef(false);

  const score = questions.reduce(
    (s, q, i) => s + (gradeQuestion(q, answers[i]) ? 1 : 0),
    0
  );

  const saveAttempt = async () => {
    if (!user || savingAttempt) return;
    setSavingAttempt(true);
    const duration = Math.round((Date.now() - startedAt) / 1000);
    await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      paper_id: paperId,
      mode,
      answers,
      score,
      total: questions.length,
      duration_seconds: mode === "exam" ? duration : null,
    });
    setSavingAttempt(false);
  };

  const handleSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    void saveAttempt();
  };

  // 考试倒计时
  useEffect(() => {
    if (mode !== "exam" || submitted) return;
    if (remaining <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, submitted]);

  const toggleOption = (qi: number, oi: number) => {
    if (submitted) return;
    const q = questions[qi];
    setAnswers((prev) => {
      const next = prev.map((a) => [...a]);
      if (q.type === "multiple") {
        const cur = next[qi];
        const pos = cur.indexOf(oi);
        if (pos >= 0) cur.splice(pos, 1);
        else cur.push(oi);
      } else {
        next[qi] = [oi];
      }
      return next;
    });
  };

  const reveal = (qi: number) => {
    setRevealed((prev) => {
      const next = [...prev];
      next[qi] = true;
      return next;
    });
  };

  const restart = () => {
    setAnswers(questions.map(() => []));
    setRevealed(questions.map(() => false));
    setSubmitted(false);
    submittedRef.current = false;
    setRemaining(limitSeconds ?? 0);
    setStartedAt(Date.now());
  };

  const answeredCount = answers.filter((a) => a.length > 0).length;
  const total = questions.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const showResult = submitted; // 自测交卷后也显示成绩页

  const encourage =
    percent >= 90
      ? "太强了，几乎全对！🎉"
      : percent >= 60
      ? "不错，再接再厉 💪"
      : "别灰心，多练几次就好啦 🐕";

  return (
    <div className="space-y-4">
      {/* 顶部状态条 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm text-[#5c8dc9]">
          <span className="px-2 py-0.5 rounded-full bg-[#e3f2fd] text-[#1565c0] text-xs font-medium">
            {mode === "exam" ? "考试模式" : "自测模式"}
          </span>
          {!submitted && <span className="text-xs text-[#90a4ae]">已作答 {answeredCount}/{total}</span>}
        </div>
        {mode === "exam" && !submitted && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium tabular-nums ${
              remaining <= 30 ? "bg-[#ffebee] text-[#ef5350]" : "bg-[#e3f2fd] text-[#1565c0]"
            }`}
          >
            <Clock className="size-4" /> {fmtTime(remaining)}
          </div>
        )}
      </div>

      {/* 成绩页 */}
      {showResult && (
        <div className="bg-white rounded-card border border-[#e3f2fd] p-5 text-center space-y-2">
          <div className="text-3xl">{percent >= 60 ? "🎉" : "📚"}</div>
          <div className="text-2xl font-bold text-[#1565c0]">
            {score} / {total}
          </div>
          <div className="text-sm text-[#90a4ae]">正确率 {percent}% · {encourage}</div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={restart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
            >
              <RotateCcw className="size-4" /> 再来一次
            </button>
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#f5f9ff] text-[#5c8dc9] hover:bg-[#e3f2fd] transition-colors"
            >
              <ArrowLeft className="size-4" /> 返回
            </button>
          </div>
        </div>
      )}

      {/* 题目列表 */}
      <div className="space-y-3">
        {questions.map((q, qi) => {
          const userAns = answers[qi];
          // 自测：揭示后判分；考试：交卷后判分
          const judging = mode === "selftest" ? revealed[qi] : submitted;
          const correct = judging && gradeQuestion(q, userAns);
          return (
            <div key={q.id} className="bg-white rounded-card border border-[#e3f2fd] p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[#e3f2fd] text-[#1565c0] mt-0.5">
                  {TYPE_LABEL[q.type]}
                </span>
                <div className="font-medium text-[#1a3a5c] text-sm leading-relaxed">
                  {qi + 1}. {q.question}
                  {q.type === "multiple" && (
                    <span className="text-xs text-[#90a4ae] ml-1">（多选）</span>
                  )}
                </div>
                {judging && (
                  correct ? (
                    <CheckCircle2 className="size-5 text-[#43a047] shrink-0 ml-auto" />
                  ) : (
                    <XCircle className="size-5 text-[#ef5350] shrink-0 ml-auto" />
                  )
                )}
              </div>

              <div className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const picked = userAns.includes(oi);
                  const isCorrectOpt = q.answer.includes(oi);
                  let cls = "border-[#e3f2fd] bg-[#f5f9ff] text-[#5c8dc9]";
                  if (judging) {
                    if (isCorrectOpt) cls = "border-[#43a047]/40 bg-[#e8f5e9] text-[#2e7d32]";
                    else if (picked) cls = "border-[#ef5350]/40 bg-[#ffebee] text-[#c62828]";
                  } else if (picked) {
                    cls = "border-[#42a5f5] bg-[#e3f2fd] text-[#1565c0] font-medium";
                  }
                  return (
                    <button
                      key={oi}
                      onClick={() => toggleOption(qi, oi)}
                      disabled={judging}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${cls} disabled:cursor-default`}
                    >
                      <span
                        className={`shrink-0 inline-flex items-center justify-center size-5 text-xs ${
                          q.type === "multiple" ? "rounded" : "rounded-full"
                        } border ${
                          picked ? "border-current" : "border-[#cfd8dc]"
                        }`}
                      >
                        {picked ? "✓" : String.fromCharCode(65 + oi)}
                      </span>
                      <span className="min-w-0">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* 自测：查看解析按钮 / 解析区 */}
              {mode === "selftest" && !revealed[qi] && (
                <button
                  onClick={() => reveal(qi)}
                  disabled={userAns.length === 0}
                  className="text-xs text-[#42a5f5] hover:text-[#1e88e5] disabled:text-[#cfd8dc] disabled:cursor-not-allowed"
                >
                  查看解析
                </button>
              )}
              {judging && (
                <div className="text-xs text-[#5c8dc9] bg-[#f5f9ff] rounded-lg p-2.5 leading-relaxed">
                  <span className="font-medium text-[#1565c0]">
                    正确答案：{q.answer.map((i) => String.fromCharCode(65 + i)).join(" ")}
                  </span>
                  {q.explanation && (
                    <p className="mt-1 text-[#90a4ae]">解析：{q.explanation}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部操作 */}
      {!submitted && (
        <div className="flex items-center justify-between gap-2 sticky bottom-16 md:bottom-2">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-[#f5f9ff] text-[#5c8dc9] hover:bg-[#e3f2fd] transition-colors"
          >
            <ArrowLeft className="size-4" /> 退出
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 max-w-[240px] ml-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
          >
            {mode === "exam" ? "交卷" : "交卷查看成绩"}
          </button>
        </div>
      )}
    </div>
  );
}
