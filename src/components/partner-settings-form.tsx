"use client";

import { useState, useEffect, useCallback } from "react";

// ── Component ────────────────────────────────────────

export default function PartnerSettingsForm() {
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
              Windows 免安装单文件，下载后双击即用。桌面会出现悬浮窗：左键逗它说句话、右键「开始专注」计时、右键「记点碎碎念」随手记想法，专注结束写一句复盘就会记进「计划中心」的日历。
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
          首次运行若弹出「Windows 已保护你的电脑」，点「更多信息 → 仍要运行」即可（未签名提示，文件本身安全）。登录后专注记录和碎碎念才会同步到网页。
        </p>
      </div>

      {/* ═══ Card: Appearance lives on the desktop now ═══ */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
        <p className="text-sm font-semibold text-[#1a3a5c]">
          🎨 想换形象 / 皮肤？
        </p>
        <p className="text-[11px] text-[#5c8dc9] mt-1.5 leading-relaxed">
          形象和皮肤都在桌面悬浮窗上直接改，更直观也更方便——
          在悬浮窗上<strong className="text-[#1565c0]">右键 → 「换形象…」</strong>，选个 Emoji 或一张本地图片即可，<strong className="text-[#1565c0]">即点即换、无需登录</strong>。
        </p>
        <p className="text-[10px] text-[#90a4ae] mt-2 leading-relaxed">
          网页这边只保留启动/下载，外观统一在桌面端管理，少一处来回切换。
        </p>
      </div>
    </div>
  );
}
