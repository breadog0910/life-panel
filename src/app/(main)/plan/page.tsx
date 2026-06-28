"use client";

import { useEffect, useState } from "react";
import { Target, Network, Timer, Calendar } from "lucide-react";
import SkillTree from "@/components/plan/skill-tree";
import FocusTimer from "@/components/plan/focus-timer";
import PlanCalendar from "@/components/plan/plan-calendar";

type Tab = "tree" | "timer" | "calendar";

const TABS: { key: Tab; label: string; icon: typeof Network }[] = [
  { key: "tree", label: "技能树", icon: Network },
  { key: "timer", label: "专注计时", icon: Timer },
  { key: "calendar", label: "日历", icon: Calendar },
];

export default function PlanPage() {
  const [tab, setTab] = useState<Tab>("tree");
  const [preselectNode, setPreselectNode] = useState<{ id: string; title: string } | null>(null);
  const [preselectPlan, setPreselectPlan] = useState<{ id: string; title: string; nodeId: string | null } | null>(
    null
  );

  const startTimerForNode = (id: string, title: string) => {
    setPreselectNode({ id, title });
    setTab("timer");
  };

  const startFocusForPlan = (plan: { id: string; title: string; nodeId: string | null }) => {
    setPreselectPlan(plan);
    setTab("timer");
  };

  // 从今日概览「去专注」带 query 进入：/plan?focusPlan=<id>&t=<title>&n=<nodeId>
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const id = sp.get("focusPlan");
    if (id) {
      startFocusForPlan({ id, title: sp.get("t") || "专注", nodeId: sp.get("n") || null });
      window.history.replaceState({}, "", "/plan");
    }
  }, []);

  return (
    <div className="space-y-3">
      {/* 头部 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <Target className="size-5" /> 🗺️ 计划中心
        </h2>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 bg-[#f5f9ff] p-1 rounded-full w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                tab === t.key ? "bg-white text-[#1565c0] shadow-sm" : "text-[#5c8dc9] hover:text-[#1565c0]"
              }`}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 内容 */}
      {tab === "tree" && <SkillTree onStartTimer={startTimerForNode} />}
      {tab === "timer" && (
        <FocusTimer
          preselectNode={preselectNode}
          onClearPreselect={() => setPreselectNode(null)}
          preselectPlan={preselectPlan}
          onClearPreselectPlan={() => setPreselectPlan(null)}
        />
      )}
      {tab === "calendar" && <PlanCalendar onStartFocusForPlan={startFocusForPlan} />}
    </div>
  );
}
