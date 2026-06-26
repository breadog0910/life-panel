"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Send, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

declare global {
  interface Window {
    electronAPI?: {
      expandWindow: () => Promise<boolean>;
      collapseWindow: () => Promise<boolean>;
      getWindowPosition: () => Promise<{ x: number; y: number }>;
      openWebPanel: () => Promise<void>;
    };
  }
}

const moods = ["😊", "😐", "😢", "😡"] as const;
const DEFAULT_TIME = 25 * 60;

const idlePhrases = [
  "今天也要加油呀～",
  "记得休息一下哦",
  "喝点水吧 💧",
  "摸摸头～",
  "有什么想说的吗？",
];

export default function CompanionPage() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Random idle bubble ───────────────────────────────

  useEffect(() => {
    let cancelled = false;
    function showBubble() {
      if (cancelled) return;
      const phrase = idlePhrases[Math.floor(Math.random() * idlePhrases.length)];
      setBubbleText(phrase);
      bubbleTimerRef.current = setTimeout(() => {
        if (!cancelled) setBubbleText("");
        if (!cancelled) {
          bubbleTimerRef.current = setTimeout(showBubble, 8000 + Math.random() * 12000);
        }
      }, 3000);
    }
    const init = setTimeout(showBubble, 3000);
    return () => {
      cancelled = true;
      clearTimeout(init);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  // ── Pomodoro timer ───────────────────────────────────

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setIsRunning(false);
        setPomodoroCount((c) => c + 1);
        return DEFAULT_TIME;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DEFAULT_TIME);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // ── Expand / Collapse ────────────────────────────────

  const handleCharacterClick = () => {
    if (!expanded) {
      setExpanded(true);
      // Electron: resize window; Edge: just CSS transition
      window.electronAPI?.expandWindow();
    }
  };

  const handleCollapse = () => {
    setExpanded(false);
    window.electronAPI?.collapseWindow();
  };

  const handleOpenWeb = () => {
    if (window.electronAPI) {
      window.electronAPI.openWebPanel();
    } else {
      window.open("https://life-panel-phi.vercel.app", "_blank");
    }
  };

  // ── Submit reflection ─────────────────────────────────

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setSaving(true);
    await supabase.from("reflections").insert({
      user_id: user.id,
      content: content.trim(),
      mood: mood || "😊",
      source: "desktop",
    });
    setSaving(false);
    setSubmitted(true);
    setContent("");
    setMood(null);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      {/* ── IDLE STATE ────────────────────────────────── */}
      {!expanded && (
        <div
          className="relative flex flex-col items-center cursor-pointer group py-4"
          onClick={handleCharacterClick}
        >
          {/* Speech bubble */}
          {bubbleText && (
            <div className="mb-2 bg-white/90 backdrop-blur-sm text-[#1a3a5c] text-xs px-3 py-1.5 rounded-2xl shadow-md whitespace-nowrap animate-bubble-in border border-[#e3f2fd] relative">
              {bubbleText}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/90 border-r border-b border-[#e3f2fd] rotate-45" />
            </div>
          )}

          {/* Character */}
          <div className="text-6xl animate-breathe select-none drop-shadow-lg transition-transform group-hover:scale-110">
            🐱
          </div>
          <span className="text-[10px] text-[#5c8dc9] mt-1 font-medium">小橘</span>
          <span className="text-[9px] text-[#90a4ae] mt-0.5 opacity-60">点击打开面板</span>
        </div>
      )}

      {/* ── EXPANDED STATE ────────────────────────────── */}
      {expanded && (
        <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#e3f2fd] flex flex-col overflow-hidden max-w-[320px] mx-auto my-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e3f2fd] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐱</span>
              <span className="font-semibold text-[#1565c0] text-sm">小橘</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenWeb}
                className="p-1.5 rounded-lg hover:bg-[#f0f6ff] text-[#5c8dc9] transition-colors"
                title="打开网页面板"
              >
                <Globe className="size-4" />
              </button>
              <button
                onClick={handleCollapse}
                className="text-xs text-[#90a4ae] hover:text-[#5c8dc9] px-2 py-1 rounded-lg hover:bg-[#f0f6ff] transition-colors"
              >
                收起 ✕
              </button>
            </div>
          </div>

          {/* Pomodoro */}
          <div className="px-4 py-3 border-b border-[#e3f2fd] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#1565c0] text-xs flex items-center gap-1.5">
                <span>🍅</span> 番茄钟
              </h3>
              {pomodoroCount > 0 && (
                <span className="text-[10px] bg-[#e3f2fd] text-[#42a5f5] px-2 py-0.5 rounded-full font-medium">
                  {pomodoroCount} 轮
                </span>
              )}
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1a3a5c] tabular-nums tracking-tight">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
            </div>
            <div className="flex gap-2 justify-center mt-2">
              <button
                onClick={toggleTimer}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
              >
                {isRunning ? <Pause className="size-3" /> : <Play className="size-3" />}
                {isRunning ? "暂停" : "开始"}
              </button>
              <button
                onClick={resetTimer}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-medium bg-[#f0f6ff] text-[#5c8dc9] hover:bg-[#e3f2fd] transition-colors"
              >
                <RotateCcw className="size-3" />
                重置
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 px-4 py-2 border-b border-[#e3f2fd] shrink-0">
            <button className="flex-1 text-xs py-1.5 rounded-lg bg-[#f0f6ff] text-[#5c8dc9] hover:bg-[#e3f2fd] transition-colors">
              ⏱️ 计时
            </button>
            <button className="flex-1 text-xs py-1.5 rounded-lg bg-[#f0f6ff] text-[#5c8dc9] hover:bg-[#e3f2fd] transition-colors">
              📅 日程
            </button>
            <button
              onClick={handleOpenWeb}
              className="flex-1 text-xs py-1.5 rounded-lg bg-[#f0f6ff] text-[#5c8dc9] hover:bg-[#e3f2fd] transition-colors"
            >
              🖥️ 网页
            </button>
          </div>

          {/* Reflection */}
          <div className="flex-1 flex flex-col px-4 py-3 min-h-0">
            <h3 className="font-semibold text-[#1565c0] text-xs mb-2 flex items-center gap-1.5 shrink-0">
              <span>💡</span> 今天学到了什么？
            </h3>
            {submitted ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[#42a5f5] font-medium text-sm">✅ 已记录！干得漂亮～</span>
              </div>
            ) : (
              <>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="一句话记录今天的收获..."
                  className="w-full border border-[#e3f2fd] rounded-xl p-2.5 text-xs resize-none h-16 focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 focus:border-[#42a5f5] placeholder:text-[#90a4ae] bg-white/70 shrink-0"
                />
                <div className="flex items-center justify-between mt-2 shrink-0">
                  <div className="flex gap-1.5">
                    {moods.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        className={`text-lg px-1.5 py-0.5 rounded-lg transition-all ${
                          mood === m ? "bg-[#e3f2fd] scale-110" : "opacity-40 hover:opacity-70"
                        }`}
                        title={m === "😊" ? "开心" : m === "😐" ? "平常" : m === "😢" ? "低落" : "生气"}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!content.trim() || saving}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="size-3" />
                    {saving ? "保存..." : "发送"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
