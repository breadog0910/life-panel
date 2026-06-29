"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Languages,
  ArrowLeft,
  Upload,
  Sparkles,
  Save,
  Play,
  Trash2,
  RefreshCw,
  Check,
  X,
  RotateCcw,
  Shuffle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { extractText } from "@/lib/doc-extract";
import type { Flashcard, FlashcardDeck } from "@/types/database";

type Step = "config" | "ready" | "study";
type Direction = "en2zh" | "zh2en" | "random";
type Face = "en" | "zh";
type CardMode = "auto" | "word" | "sentence";

const clampCount = (n: unknown) => Math.max(5, Math.min(100, Math.floor(Number(n) || 0) || 0));
const clampThreshold = (n: unknown) => Math.max(1, Math.min(10, Math.floor(Number(n) || 0) || 1));

const DIRECTION_LABEL: Record<Direction, string> = {
  en2zh: "英 → 中",
  zh2en: "中 → 英",
  random: "每张随机",
};

const MODE_LABEL: Record<CardMode, string> = {
  auto: "自动判断",
  word: "单词 / 短语",
  sentence: "整句翻译",
};

const MODE_HINT: Record<CardMode, string> = {
  auto: "单词表就出词，句子或课文就出整句。",
  word: "提取重点词、短语，配中文释义。",
  sentence: "按句子切分，整句英文配中文翻译。",
};

// 根据文本长度自适应字号：长句子用小一点的字号避免溢出
function textSizeClass(s: string, english: boolean): string {
  const len = s.length;
  if (len > 90) return "text-base leading-relaxed";
  if (len > 50) return "text-lg leading-relaxed";
  if (len > 24) return "text-xl";
  return english ? "text-3xl" : "text-2xl";
}

function pickFace(d: Direction): Face {
  if (d === "en2zh") return "en";
  if (d === "zh2en") return "zh";
  return Math.random() < 0.5 ? "en" : "zh";
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

// ===================== 学习会话 =====================

interface QueueItem {
  card: Flashcard;
  progress: number;
  face: Face;
}

const SWIPE = 90;

function FlashcardSession({
  cards,
  threshold,
  initialDirection,
  onExit,
}: {
  cards: Flashcard[];
  threshold: number;
  initialDirection: Direction;
  onExit: () => void;
}) {
  const total = cards.length;
  const [direction, setDirection] = useState<Direction>(initialDirection);
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    cards.map((card) => ({ card, progress: 0, face: pickFace(initialDirection) }))
  );
  const [graduated, setGraduated] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const startX = useRef(0);

  const current = queue[0];

  const applyKnow = useCallback(() => {
    if (!current) return;
    const np = current.progress + 1;
    if (np >= threshold) {
      setGraduated((g) => g + 1);
      setQueue((q) => q.slice(1));
    } else {
      setQueue((q) => [...q.slice(1), { ...q[0], progress: np, face: pickFace(direction) }]);
    }
  }, [current, threshold, direction]);

  const applyDont = useCallback(() => {
    if (!current) return;
    setQueue((q) => [...q.slice(1), { ...q[0], progress: 0, face: pickFace(direction) }]);
  }, [current, direction]);

  const fly = useCallback(
    (dir: "know" | "dont") => {
      if (busy || !current) return;
      setBusy(true);
      setDx(dir === "know" ? 520 : -520);
      window.setTimeout(() => {
        if (dir === "know") applyKnow();
        else applyDont();
        setDx(0);
        setFlipped(false);
        setBusy(false);
      }, 190);
    },
    [busy, current, applyKnow, applyDont]
  );

  // 键盘：← 不认识 / → 认识 / 空格·↑ 翻面
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy || !current) return;
      if (e.key === "ArrowRight") fly("know");
      else if (e.key === "ArrowLeft") fly("dont");
      else if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, current, fly]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (busy) return;
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDx(e.clientX - startX.current);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    const d = e.clientX - startX.current;
    if (Math.abs(d) < 6) {
      setFlipped((f) => !f);
      setDx(0);
      return;
    }
    if (d > SWIPE) return fly("know");
    if (d < -SWIPE) return fly("dont");
    setDx(0);
  };

  const changeDirection = (d: Direction) => {
    setDirection(d);
    setFlipped(false);
    setQueue((q) => q.map((it) => ({ ...it, face: pickFace(d) })));
  };

  const restart = () => {
    setQueue(cards.map((card) => ({ card, progress: 0, face: pickFace(direction) })));
    setGraduated(0);
    setFlipped(false);
    setDx(0);
    setBusy(false);
  };

  // 全部掌握
  if (!current) {
    return (
      <div className="bg-white rounded-card border border-[#e3f2fd] p-8 text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <div className="text-lg font-semibold text-[#1565c0]">全部掌握啦！</div>
        <p className="text-sm text-[#90a4ae]">
          {total} 张卡片，每张都认识了 {threshold} 遍～
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={restart}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] transition-colors"
          >
            <RotateCcw className="size-4" /> 再学一遍
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    );
  }

  const frontText = current.face === "en" ? current.card.en : current.card.zh;
  const backText = current.face === "en" ? current.card.zh : current.card.en;
  const showText = flipped ? backText : frontText;
  const isEnglishShown = flipped ? current.face !== "en" : current.face === "en";
  const faceLabel = isEnglishShown ? "英文" : "中文";

  const opacity = 1 - Math.min(Math.abs(dx) / 600, 0.55);

  return (
    <div className="space-y-4">
      {/* 顶部统计 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-[#5c8dc9]">
          剩余 <b className="text-[#1565c0]">{queue.length}</b> · 已掌握{" "}
          <b className="text-[#43a047]">{graduated}</b>/{total}
        </div>
        <div className="flex items-center gap-1.5">
          {(["en2zh", "zh2en", "random"] as Direction[]).map((d) => (
            <button
              key={d}
              onClick={() => changeDirection(d)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                direction === d
                  ? "bg-[#1565c0] text-white"
                  : "bg-[#f5f9ff] text-[#5c8dc9] hover:bg-[#e3f2fd]"
              }`}
            >
              {DIRECTION_LABEL[d]}
            </button>
          ))}
        </div>
      </div>

      {/* 卡片 */}
      <div className="relative select-none" style={{ touchAction: "pan-y" }}>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translateX(${dx}px) rotate(${dx * 0.04}deg)`,
            transition: dragging ? "none" : "transform 180ms ease, opacity 180ms ease",
            opacity,
          }}
          className="relative cursor-grab active:cursor-grabbing bg-white rounded-card border border-[#e3f2fd] shadow-sm min-h-[240px] flex flex-col items-center justify-center px-6 py-10 text-center"
        >
          {/* 滑动方向提示 */}
          {dx > 30 && (
            <span className="absolute top-4 right-4 text-sm font-bold text-[#43a047] border-2 border-[#43a047] rounded-lg px-2 py-0.5 rotate-12">
              认识 ✓
            </span>
          )}
          {dx < -30 && (
            <span className="absolute top-4 left-4 text-sm font-bold text-[#ef5350] border-2 border-[#ef5350] rounded-lg px-2 py-0.5 -rotate-12">
              不认识
            </span>
          )}

          <span className="text-[11px] tracking-wide text-[#90a4ae] mb-3">
            {faceLabel}
            {!flipped && " · 点击卡片翻面"}
          </span>
          <div
            className={`font-semibold text-[#1a3a5c] break-words ${textSizeClass(
              showText,
              isEnglishShown
            )}`}
          >
            {showText}
          </div>

          {/* 认识进度 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {Array.from({ length: threshold }).map((_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full ${
                  i < current.progress ? "bg-[#43a047]" : "bg-[#e3f2fd]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => fly("dont")}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium bg-[#ffebee] text-[#ef5350] hover:bg-[#ffcdd2] disabled:opacity-40 transition-colors"
        >
          <X className="size-4" /> 不认识
        </button>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium bg-[#f5f9ff] text-[#1565c0] hover:bg-[#e3f2fd] transition-colors"
        >
          <RefreshCw className="size-4" /> 翻面
        </button>
        <button
          onClick={() => fly("know")}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium bg-[#e8f5e9] text-[#43a047] hover:bg-[#c8e6c9] disabled:opacity-40 transition-colors"
        >
          <Check className="size-4" /> 认识
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[#90a4ae]">
          向右滑=认识，向左滑=不认识；不认识会清零并重新轮换
        </span>
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-sm text-[#42a5f5] hover:text-[#1e88e5] transition-colors"
        >
          <ArrowLeft className="size-4" /> 退出
        </button>
      </div>
    </div>
  );
}

// ===================== 主工具 =====================

export default function FlashcardTool() {
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("config");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [count, setCount] = useState(20);
  const [mode, setMode] = useState<CardMode>("auto");

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [needKey, setNeedKey] = useState(false);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [deckTitle, setDeckTitle] = useState("");
  const [fromSaved, setFromSaved] = useState(false);

  const [threshold, setThreshold] = useState(2);
  const [direction, setDirection] = useState<Direction>("en2zh");

  const [savingDeck, setSavingDeck] = useState(false);
  const [savedTip, setSavedTip] = useState(false);

  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [decksLoading, setDecksLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadDecks = useCallback(async () => {
    if (!user) return;
    setDecksLoading(true);
    const { data } = await supabase
      .from("flashcard_decks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setDecks(data as FlashcardDeck[]);
    setDecksLoading(false);
  }, [user]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

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
    if (!text.trim()) return;
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
      const res = await fetch("/api/lab/flashcards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text, count, mode }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "生成失败");
        if (typeof data.error === "string" && data.error.includes("AI 智能设置")) {
          setNeedKey(true);
        }
        return;
      }
      setCards(data.cards as Flashcard[]);
      setDeckTitle(
        `单词卡 ${new Date().toLocaleString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );
      setFromSaved(false);
      setStep("ready");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDeck = async () => {
    if (!user || cards.length === 0) return;
    setSavingDeck(true);
    await supabase.from("flashcard_decks").insert({
      user_id: user.id,
      title: deckTitle || "单词卡",
      cards,
      card_count: cards.length,
    });
    setSavingDeck(false);
    setSavedTip(true);
    setFromSaved(true);
    setTimeout(() => setSavedTip(false), 2000);
    loadDecks();
  };

  const reviewDeck = (deck: FlashcardDeck) => {
    setCards(deck.cards || []);
    setDeckTitle(deck.title);
    setFromSaved(true);
    setStep("ready");
  };

  const handleDeleteDeck = async (id: string) => {
    await supabase.from("flashcard_decks").delete().eq("id", id);
    setConfirmDeleteId(null);
    loadDecks();
  };

  // ===== 学习中 =====
  if (step === "study") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2 min-w-0">
            <Languages className="size-5 shrink-0" />
            <span className="truncate">🃏 {deckTitle}</span>
          </h2>
        </div>
        <FlashcardSession
          cards={cards}
          threshold={threshold}
          initialDirection={direction}
          onExit={() => {
            setStep(fromSaved ? "config" : "ready");
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <Languages className="size-5" /> 🃏 英语闪卡
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
              placeholder="粘贴单词表 / 课文 / 句子 / 中英对照，或上传 .txt / .docx 文档，AI 会自动整理成「英文↔中文」卡片（单词或整句都可以）..."
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
            {fileName && <p className="text-xs text-[#90a4ae] mt-1">已载入：{fileName}</p>}
          </div>

          {/* 卡片粒度 */}
          <div>
            <label className="text-sm font-medium text-[#1a3a5c] mb-1.5 block">
              卡片粒度
            </label>
            <div className="flex flex-wrap gap-2">
              {(["auto", "word", "sentence"] as CardMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mode === m
                      ? "bg-[#1565c0] text-white"
                      : "bg-[#f5f9ff] text-[#5c8dc9] hover:bg-[#e3f2fd]"
                  }`}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#90a4ae] mt-1">{MODE_HINT[mode]}</p>
          </div>

          {/* 张数 */}
          <div>
            <label className="text-sm font-medium text-[#1a3a5c] mb-1.5 block">
              生成卡片数量（5~100）
            </label>
            <input
              type="number"
              min={5}
              max={100}
              value={count}
              onChange={(e) => setCount(clampCount(e.target.value))}
              className="w-32 border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
            />
            <p className="text-xs text-[#90a4ae] mt-1">
              资料里词条不够时，AI 会少生成一些。
            </p>
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
            disabled={!text.trim() || generating}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
          >
            <Sparkles className="size-4" />
            {generating ? "AI 生成卡片中…（资料越长越久）" : "生成卡片"}
          </button>
        </div>
      )}

      {/* 阶段 B：准备开始 */}
      {step === "ready" && (
        <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-5">
          <div>
            <div className="text-base font-semibold text-[#1565c0]">
              共 {cards.length} 张卡片
            </div>
            <div className="text-xs text-[#90a4ae] mt-0.5 truncate">{deckTitle}</div>
          </div>

          {/* 朝向 */}
          <div>
            <label className="text-sm font-medium text-[#1a3a5c] mb-1.5 block">
              卡片正面
            </label>
            <div className="flex flex-wrap gap-2">
              {(["en2zh", "zh2en", "random"] as Direction[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    direction === d
                      ? "bg-[#1565c0] text-white"
                      : "bg-[#f5f9ff] text-[#5c8dc9] hover:bg-[#e3f2fd]"
                  }`}
                >
                  {d === "random" && <Shuffle className="size-3 inline mr-1 -mt-0.5" />}
                  {DIRECTION_LABEL[d]}
                </button>
              ))}
            </div>
          </div>

          {/* 认识几遍 */}
          <div>
            <label className="text-sm font-medium text-[#1a3a5c] mb-1.5 block">
              认识几遍算掌握（1~10）
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={threshold}
              onChange={(e) => setThreshold(clampThreshold(e.target.value))}
              className="w-24 border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
            />
            <p className="text-xs text-[#90a4ae] mt-1">
              标「认识」累计达到该次数才毕业；标「不认识」会清零，一直轮到掌握为止。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setStep("study")}
              disabled={cards.length === 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
            >
              <Play className="size-4" /> 开始学习
            </button>
            {!fromSaved && (
              <button
                onClick={handleSaveDeck}
                disabled={savingDeck}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] disabled:opacity-40 transition-colors"
              >
                <Save className="size-4" /> {savedTip ? "已保存 ✨" : "保存卡片组"}
              </button>
            )}
          </div>

          <button
            onClick={() => setStep("config")}
            className="flex items-center gap-1.5 text-sm text-[#42a5f5] hover:text-[#1e88e5] transition-colors"
          >
            <RefreshCw className="size-4" /> 重新生成
          </button>
        </div>
      )}

      {/* 我的卡片组 */}
      {step === "config" && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#1a3a5c]">我的卡片组</h3>
          {decksLoading ? (
            <div className="text-sm text-[#90a4ae] py-4">加载中...</div>
          ) : decks.length === 0 ? (
            <div className="bg-white rounded-card border border-[#e3f2fd] p-6 text-center text-sm text-[#90a4ae]">
              还没有保存的卡片组～<br />
              <span className="text-xs">生成后点「保存卡片组」即可反复复习</span>
            </div>
          ) : (
            <div className="space-y-2">
              {decks.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-card border border-[#e3f2fd] p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#1a3a5c] truncate">{d.title}</div>
                    <div className="text-xs text-[#90a4ae] mt-0.5">
                      {d.card_count} 张 · {relativeTime(d.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {confirmDeleteId === d.id ? (
                      <>
                        <button
                          onClick={() => handleDeleteDeck(d.id)}
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
                          onClick={() => reviewDeck(d)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] transition-colors"
                        >
                          复习
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(d.id)}
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
      )}
    </div>
  );
}
