"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Upload, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// ── Character presets ────────────────────────────────

const PRESETS = [
  { id: "cat", emoji: "🐱", name: "小H", label: "猫" },
  { id: "dog", emoji: "🐶", name: "旺财", label: "狗" },
  { id: "rabbit", emoji: "🐰", name: "小白", label: "兔" },
  { id: "panda", emoji: "🐼", name: "团团", label: "熊猫" },
  { id: "fox", emoji: "🦊", name: "小狐", label: "狐狸" },
  { id: "frog", emoji: "🐸", name: "呱呱", label: "蛙" },
  { id: "cat2", emoji: "😺", name: "咪咪", label: "笑脸猫" },
  { id: "bear", emoji: "🐻", name: "憨憨", label: "熊" },
  { id: "penguin", emoji: "🐧", name: "豆豆", label: "企鹅" },
];

type Mode = "emoji" | "image" | "gif";

interface Settings {
  mode: Mode;
  character: string;
  character_id: string;
  nickname: string;
  breathing_enabled: boolean;
  bubble_enabled: boolean;
  image_path: string;
}

const DEFAULTS: Settings = {
  mode: "emoji",
  character: "🐱",
  character_id: "cat",
  nickname: "小H",
  breathing_enabled: true,
  bubble_enabled: true,
  image_path: "",
};

// ── Component ────────────────────────────────────────

export default function PartnerSettingsForm() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [companionRunning, setCompanionRunning] = useState(false);
  const [companionChecking, setCompanionChecking] = useState(false);

  // ── Companion status ────────────────────────────

  const checkCompanion = useCallback(async () => {
    setCompanionChecking(true);
    try {
      const res = await fetch("/api/partner/companion");
      const data = await res.json();
      setCompanionRunning(data.running);
    } catch {
      // ignore
    }
    setCompanionChecking(false);
  }, []);

  useEffect(() => {
    checkCompanion();
    // Poll every 10s
    const iv = setInterval(checkCompanion, 10000);
    return () => clearInterval(iv);
  }, [checkCompanion]);

  const toggleCompanion = async () => {
    setCompanionChecking(true);
    try {
      const action = companionRunning ? "stop" : "start";
      const res = await fetch("/api/partner/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (action === "start" && data.starting) {
        setCompanionRunning(true);
      } else if (action === "stop") {
        setCompanionRunning(false);
      }
      // Re-check after short delay for accuracy
      setTimeout(checkCompanion, 2000);
    } catch {
      // ignore
    }
    setCompanionChecking(false);
  };

  // ── Load current config ──────────────────────────

  useEffect(() => {
    fetch("/api/partner/config")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.mode) {
          setSettings(data);
          if (data.image_path) {
            setPreviewUrl(`/companion/${data.image_path}`);
          }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // ── Save ─────────────────────────────────────────

  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/partner/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silently fail
    }
    setSaving(false);
  }, [settings, user]);

  // ── File upload ──────────────────────────────────

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      const mode = file.type === "image/gif" ? "gif" : "image";
      const form = new FormData();
      form.append("file", file);
      form.append("mode", mode);

      try {
        const res = await fetch("/api/partner/upload", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (data.success) {
          setSettings((prev) => ({
            ...prev,
            mode: mode as Mode,
            image_path: data.image_path,
          }));
          // Show local preview
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
      } catch {
        // silently fail
      }
      setUploading(false);
    },
    []
  );

  // ── Mode switch ──────────────────────────────────

  const switchMode = (mode: Mode) => {
    if (mode === "emoji") {
      // Restore last emoji
      setSettings((prev) => ({
        ...prev,
        mode: "emoji",
        image_path: "",
      }));
      setPreviewUrl(null);
    } else {
      setSettings((prev) => ({ ...prev, mode }));
    }
  };

  // ── Emoji select ─────────────────────────────────

  const selectPreset = (preset: (typeof PRESETS)[number]) => {
    setSettings((prev) => ({
      ...prev,
      mode: "emoji",
      character: preset.emoji,
      character_id: preset.id,
      nickname: preset.name,
      image_path: "",
    }));
    setPreviewUrl(null);
  };

  // ── Drop handlers ────────────────────────────────

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  // ── Live preview character ───────────────────────

  const previewCharacter =
    settings.mode === "emoji"
      ? settings.character
      : previewUrl
        ? null
        : "🖼️";

  if (!loaded) {
    return (
      <div className="bg-white rounded-card p-8 border border-[#e3f2fd] text-center text-sm text-[#90a4ae]">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══ Card 0: Companion Status ═══ */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                companionRunning ? "bg-[#66bb6a] animate-pulse" : "bg-[#cfd8dc]"
              }`}
            />
            <div>
              <p className="text-sm font-semibold text-[#1a3a5c]">
                桌面悬浮窗
              </p>
              <p className="text-[10px] text-[#90a4ae]">
                {companionRunning ? "🐱 小H正在桌面上陪你" : "悬浮窗未启动"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleCompanion}
            disabled={companionChecking}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              companionRunning
                ? "bg-[#fff0f0] text-[#ef5350] hover:bg-[#ffdddd]"
                : "bg-[#42a5f5] text-white hover:bg-[#1e88e5]"
            } disabled:opacity-50`}
          >
            {companionChecking ? "…" : companionRunning ? "关闭悬浮窗" : "启动悬浮窗"}
          </button>
        </div>
      </div>

      {/* ═══ Card: Download Desktop Companion ═══ */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1a3a5c]">
              💻 下载桌面悬浮伙伴
            </p>
            <p className="text-[11px] text-[#90a4ae] mt-1 leading-relaxed">
              Windows 免安装单文件，下载后双击即用。桌面会出现悬浮窗：左键逗它说句话、右键「开始专注」计时，专注结束写一句复盘就会记进「计划中心」的日历。
            </p>
          </div>
          <a
            href="/download/xiaoh.exe"
            download="小H桌面伙伴.exe"
            className="shrink-0 px-4 py-2 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-all whitespace-nowrap"
          >
            ⬇ 下载 (.exe)
          </a>
        </div>
        <p className="mt-3 text-[10px] text-[#b0bec5] leading-relaxed">
          首次运行若弹出「Windows 已保护你的电脑」，点「更多信息 → 仍要运行」即可（未签名提示，文件本身安全）。登录后专注记录才会同步到日历。
        </p>
      </div>

      {/* ═══ Card 1: Live Preview ═══ */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-6">
        <h3 className="text-sm font-semibold text-[#1565c0] mb-3">
          👁️ 实时预览
        </h3>
        <div className="flex items-center gap-5">
          {/* Character preview */}
          <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-[#f5f9ff] border border-[#e3f2fd] overflow-hidden">
            {settings.mode === "emoji" ? (
              <span
                className={
                  settings.breathing_enabled
                    ? "animate-breathe select-none"
                    : "select-none"
                }
                style={{ fontSize: "52px", lineHeight: 1 }}
              >
                {settings.character}
              </span>
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="预览"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-4xl opacity-30">🖼️</span>
            )}
          </div>
          {/* Info */}
          <div>
            <p className="text-[#1a3a5c] font-semibold text-lg">
              {settings.nickname || "未命名"}
            </p>
            <p className="text-xs text-[#90a4ae]">
              {settings.mode === "emoji"
                ? "Emoji 模式"
                : settings.mode === "gif"
                  ? "GIF 动图模式"
                  : "自定义图片模式"}
            </p>
            <p className="text-xs text-[#90a4ae] mt-0.5">
              呼吸动画: {settings.breathing_enabled ? "开" : "关"} · 气泡:{" "}
              {settings.bubble_enabled ? "开" : "关"}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Card 2: Mode Switch ═══ */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-6">
        <h3 className="text-sm font-semibold text-[#1565c0] mb-3">
          🎭 角色模式
        </h3>
        <div className="flex gap-1 bg-[#f0f6ff] rounded-xl p-1">
          {(
            [
              ["emoji", "Emoji 预设"],
              ["image", "自定义图片"],
              ["gif", "GIF 动图"],
            ] as [Mode, string][]
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => switchMode(mode)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                settings.mode === mode
                  ? "bg-white text-[#1565c0] shadow-sm"
                  : "text-[#90a4ae] hover:text-[#5c8dc9]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Card 3a: Emoji grid (mode=emoji) ═══ */}
      {settings.mode === "emoji" && (
        <div className="bg-white rounded-card border border-[#e3f2fd] p-6">
          <h3 className="text-sm font-semibold text-[#1565c0] mb-3">
            🐱 选择角色
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => {
              const selected = settings.character_id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPreset(p)}
                  className={`flex flex-col items-center py-3 rounded-xl transition-all border ${
                    selected
                      ? "border-[#42a5f5] bg-[#e3f2fd] ring-2 ring-[#42a5f5]/30"
                      : "border-transparent hover:bg-[#f0f6ff]"
                  }`}
                >
                  <span className="text-3xl">{p.emoji}</span>
                  <span className="text-[10px] text-[#5c8dc9] mt-1">
                    {p.name}
                  </span>
                  <span className="text-[9px] text-[#90a4ae]">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Card 3b: File upload (mode=image or gif) ═══ */}
      {(settings.mode === "image" || settings.mode === "gif") && (
        <div className="bg-white rounded-card border border-[#e3f2fd] p-6">
          <h3 className="text-sm font-semibold text-[#1565c0] mb-3">
            {settings.mode === "gif" ? "🎞️ 上传 GIF 动图" : "🖼️ 上传图片"}
          </h3>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-[#42a5f5] bg-[#e3f2fd]"
                : "border-[#e3f2fd] hover:border-[#bbdefb]"
            }`}
          >
            <label className="cursor-pointer block">
              <input
                type="file"
                accept={settings.mode === "gif" ? "image/gif" : "image/png,image/jpeg,image/webp,image/gif"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                }}
                className="hidden"
              />
              <Upload className="size-8 mx-auto text-[#90a4ae] mb-2" />
              <p className="text-sm text-[#5c8dc9] font-medium">
                {uploading ? "上传中..." : "点击选择或拖拽文件到此处"}
              </p>
              <p className="text-[10px] text-[#90a4ae] mt-1">
                {settings.mode === "gif"
                  ? "支持 GIF 动图 · 最大 5MB"
                  : "支持 PNG / JPG / WebP · 最大 5MB"}
              </p>
            </label>
          </div>

          {/* Uploaded preview */}
          {previewUrl && settings.image_path && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-[#f0f6ff] rounded-xl">
              {settings.mode === "gif" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="已上传"
                  className="w-12 h-12 object-contain rounded-lg"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="已上传"
                  className="w-12 h-12 object-contain rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#1a3a5c] font-medium truncate">
                  {settings.image_path}
                </p>
                <p className="text-[10px] text-[#42a5f5]">已上传 ✅</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Card 4: Behavior ═══ */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-6">
        <h3 className="text-sm font-semibold text-[#1565c0] mb-3">
          ⚙️ 行为设置
        </h3>

        {/* Nickname */}
        <div className="mb-4">
          <label className="text-xs text-[#5c8dc9] font-medium block mb-1.5">
            🏷️ 昵称
          </label>
          <input
            type="text"
            value={settings.nickname}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, nickname: e.target.value }))
            }
            maxLength={10}
            className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm text-[#1a3a5c] focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 focus:border-[#42a5f5]"
            placeholder="给桌宠起个名字"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {/* Breathing */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#1a3a5c] font-medium">🫁 呼吸动画</p>
              <p className="text-[10px] text-[#90a4ae]">
                {settings.mode === "gif"
                  ? "GIF 模式下由动图自身控制动画"
                  : "角色轻微缩放，模拟呼吸效果"}
              </p>
            </div>
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  breathing_enabled: !prev.breathing_enabled,
                }))
              }
              disabled={settings.mode === "gif"}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.mode === "gif"
                  ? "bg-[#e3f2fd] cursor-not-allowed"
                  : settings.breathing_enabled
                    ? "bg-[#42a5f5]"
                    : "bg-[#cfd8dc]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.breathing_enabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Bubble */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#1a3a5c] font-medium">💬 气泡消息</p>
              <p className="text-[10px] text-[#90a4ae]">
                随机出现鼓励和提醒的话语
              </p>
            </div>
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  bubble_enabled: !prev.bubble_enabled,
                }))
              }
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.bubble_enabled ? "bg-[#42a5f5]" : "bg-[#cfd8dc]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.bubble_enabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Save bar ═══ */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-4 flex items-center justify-between">
        <div>
          {saved && (
            <span className="text-xs text-[#66bb6a] flex items-center gap-1">
              <Check className="size-3" /> 保存成功 ✅ 桌面伙伴将自动更新
            </span>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-50 transition-colors"
        >
          <Save className="size-4" />
          {saving ? "保存中..." : "保存设置"}
        </button>
      </div>

      {/* ═══ Tip card ═══ */}
      <div className="bg-[#fff9c4]/40 rounded-card border border-[#fff9c4] p-4 text-center">
        <p className="text-xs text-[#8b6914]">
          💡 保存后桌面伙伴会在 5 秒内自动更新。
          若未生效，请重启 <code className="bg-white/50 px-1 rounded">companion-start.bat</code>
        </p>
      </div>
    </div>
  );
}
