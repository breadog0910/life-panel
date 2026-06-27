"use client";

import { useState } from "react";
import { Target, Bell, Network, Timer, Calendar } from "lucide-react";
import SkillTree from "@/components/plan/skill-tree";
import FocusTimer from "@/components/plan/focus-timer";
import PlanCalendar from "@/components/plan/plan-calendar";
import ReminderDrawer from "@/components/reminder-drawer";

type Tab = "tree" | "timer" | "calendar";

const TABS: { key: Tab; label: string; icon: typeof Network }[] = [
  { key: "tree", label: "技能树", icon: Network },
  { key: "timer", label: "专注计时", icon: Timer },
  { key: "calendar", label: "日历", icon: Calendar },
];

export default function PlanPage() {
  const [tab, setTab] = useState<Tab>("tree");
  const [reminderOpen, setReminderOpen] = useState(false);
  const [preselectNode, setPreselectNode] = useState<{ id: string; title: string } | null>(null);

  const startTimerForNode = (id: string, title: string) => {
    setPreselectNode({ id, title });
    setTab("timer");
  };

  return (
    <div className="space-y-3">
      {/* 头部 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <Target className="size-5" /> 🗺️ 计划中心
        </h2>
        <button
          onClick={() => setReminderOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium bg-[#fff3e0] text-[#e65100] hover:bg-[#ffe0b2] transition-colors"
        >
          <Bell className="size-4" /> 提醒 / 备忘
        </button>
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
        <FocusTimer preselectNode={preselectNode} onClearPreselect={() => setPreselectNode(null)} />
      )}
      {tab === "calendar" && <PlanCalendar />}

      <ReminderDrawer open={reminderOpen} onClose={() => setReminderOpen(false)} />
    </div>
  );
}
