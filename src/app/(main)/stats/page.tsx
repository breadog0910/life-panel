"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface MoodCount {
  mood: string;
  count: number;
  percentage: number;
}

interface TagCount {
  tag: string;
  minutes: number;
  percentage: number;
}

interface CategoryAmount {
  category: string;
  amount: number;
}

interface StatsData {
  totalDiaries: number;
  totalReflections: number;
  totalFocusHours: number;
  totalTransactions: number;
  moodDistribution: MoodCount[];
  timeByTag: TagCount[];
  expensesByCategory: CategoryAmount[];
  incomeByCategory: CategoryAmount[];
  totalExpenses: number;
  totalIncome: number;
}

const MOOD_LABELS: Record<string, string> = {
  "😊": "开心",
  "😐": "平常",
  "😢": "低落",
  "😡": "生气",
};

const MOOD_COLORS: Record<string, string> = {
  "😊": "#42a5f5",
  "😐": "#90a4ae",
  "😢": "#64b5f6",
  "😡": "#ef5350",
};

export default function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    async function loadAll() {
      // Fetch diaries
      const { data: diaries } = await supabase
        .from("diaries")
        .select("mood")
        .eq("user_id", user!.id)
        .is("deleted_at", null);

      // Fetch reflections
      const { data: reflections } = await supabase
        .from("reflections")
        .select("mood")
        .eq("user_id", user!.id);

      // Fetch time entries
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("duration_minutes, tags")
        .eq("user_id", user!.id);

      // Fetch current month transactions
      const startDate = `${currentMonth}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const endDate = `${currentMonth}-${String(lastDay).padStart(2, "0")}`;
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type, category")
        .eq("user_id", user!.id)
        .gte("date", startDate)
        .lte("date", endDate);

      // --- Compute mood distribution ---
      const moodMap: Record<string, number> = {};
      (diaries || []).forEach((d) => {
        if (d.mood) moodMap[d.mood] = (moodMap[d.mood] || 0) + 1;
      });
      (reflections || []).forEach((r) => {
        if (r.mood) moodMap[r.mood] = (moodMap[r.mood] || 0) + 1;
      });
      const totalMoods = Object.values(moodMap).reduce((s, c) => s + c, 0);
      const moodDistribution: MoodCount[] = ["😊", "😐", "😢", "😡"]
        .filter((m) => moodMap[m])
        .map((mood) => ({
          mood,
          count: moodMap[mood],
          percentage: totalMoods > 0 ? Math.round((moodMap[mood] / totalMoods) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // --- Compute time by tag ---
      const tagMinutes: Record<string, number> = {};
      const entries = timeEntries || [];
      entries.forEach((e) => {
        const tags = e.tags?.length ? e.tags : ["未分类"];
        const share = (e.duration_minutes || 0) / tags.length;
        tags.forEach((tag: string) => {
          tagMinutes[tag] = (tagMinutes[tag] || 0) + share;
        });
      });
      const totalMinutes = Object.values(tagMinutes).reduce((s, m) => s + m, 0);
      const timeByTag: TagCount[] = Object.entries(tagMinutes)
        .map(([tag, minutes]) => ({
          tag,
          minutes: Math.round(minutes),
          percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
        }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 6);

      // --- Compute finance by category ---
      const txns = transactions || [];
      const expenseByCategory: Record<string, number> = {};
      const incomeByCategory: Record<string, number> = {};
      let totalExpenses = 0;
      let totalIncome = 0;

      txns.forEach((t) => {
        const amt = Number(t.amount);
        if (t.type === "expense") {
          expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + amt;
          totalExpenses += amt;
        } else {
          incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + amt;
          totalIncome += amt;
        }
      });

      const mapCategory = (map: Record<string, number>): CategoryAmount[] =>
        Object.entries(map)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount);

      // --- Total focus hours ---
      const totalFocusHours = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

      setStats({
        totalDiaries: diaries?.length || 0,
        totalReflections: reflections?.length || 0,
        totalFocusHours: Math.round((totalFocusHours / 60) * 10) / 10,
        totalTransactions: transactions?.length || 0,
        moodDistribution,
        timeByTag,
        expensesByCategory: mapCategory(expenseByCategory),
        incomeByCategory: mapCategory(incomeByCategory),
        totalExpenses,
        totalIncome,
      });
      setLoading(false);
    }

    loadAll();
  }, [user, currentMonth, now]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#90a4ae] text-sm">
        加载中...
      </div>
    );
  }

  if (!stats) return null;

  const maxMoodCount = Math.max(...stats.moodDistribution.map((m) => m.count), 1);
  const maxTagMinutes = Math.max(...stats.timeByTag.map((t) => t.minutes), 1);
  const maxExpenseAmount = Math.max(...stats.expensesByCategory.map((e) => e.amount), 1);
  const maxIncomeAmount = Math.max(...stats.incomeByCategory.map((e) => e.amount), 1);

  function formatCurrency(n: number): string {
    return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <BarChart3 className="size-5" /> 📈 数据统计
      </h2>

      {/* Summary numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "总日记", value: stats.totalDiaries, icon: "📝" },
          { label: "总复盘", value: stats.totalReflections, icon: "💡" },
          { label: "专注小时", value: stats.totalFocusHours, icon: "⏱️" },
          { label: "本月记账", value: stats.totalTransactions, icon: "💰" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-card p-4 border border-[#e3f2fd] text-center"
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-[#1a3a5c]">{s.value}</div>
            <div className="text-xs text-[#90a4ae]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mood distribution */}
        <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
          <h3 className="font-semibold text-[#1565c0] text-sm mb-4">😊 心情分布</h3>
          {stats.moodDistribution.length === 0 ? (
            <div className="text-center py-6 text-sm text-[#90a4ae]">
              还没有心情数据，去写日记或复盘吧
            </div>
          ) : (
            <div className="space-y-3">
              {stats.moodDistribution.map((m) => (
                <div key={m.mood}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#1a3a5c]">
                      {m.mood} {MOOD_LABELS[m.mood] || ""}
                    </span>
                    <span className="text-xs text-[#90a4ae]">
                      {m.count} 次 · {m.percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#e3f2fd] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(m.count / maxMoodCount) * 100}%`,
                        backgroundColor: MOOD_COLORS[m.mood] || "#42a5f5",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Time distribution by tag */}
        <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
          <h3 className="font-semibold text-[#1565c0] text-sm mb-4">⏱️ 时间分布（按标签）</h3>
          {stats.timeByTag.length === 0 ? (
            <div className="text-center py-6 text-sm text-[#90a4ae]">
              还没有时间记录
            </div>
          ) : (
            <div className="space-y-3">
              {stats.timeByTag.map((t) => (
                <div key={t.tag}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#1a3a5c] truncate max-w-[120px]">
                      #{t.tag}
                    </span>
                    <span className="text-xs text-[#90a4ae]">
                      {t.minutes >= 60
                        ? `${Math.floor(t.minutes / 60)}h${t.minutes % 60 > 0 ? t.minutes % 60 + "m" : ""}`
                        : `${t.minutes}m`}{" "}
                      · {t.percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#e3f2fd] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#42a5f5] rounded-full transition-all duration-700"
                      style={{ width: `${(t.minutes / maxTagMinutes) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense by category */}
        <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
          <h3 className="font-semibold text-[#1565c0] text-sm mb-4">
            💸 支出分类（本月 · ¥{formatCurrency(stats.totalExpenses)}）
          </h3>
          {stats.expensesByCategory.length === 0 ? (
            <div className="text-center py-6 text-sm text-[#90a4ae]">
              本月暂无支出
            </div>
          ) : (
            <div className="space-y-3">
              {stats.expensesByCategory.map((e) => (
                <div key={e.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#1a3a5c]">{e.category}</span>
                    <span className="text-xs text-[#90a4ae]">
                      ¥{formatCurrency(e.amount)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#e3f2fd] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#ef5350] rounded-full transition-all duration-700"
                      style={{ width: `${(e.amount / maxExpenseAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Income by category */}
        <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
          <h3 className="font-semibold text-[#1565c0] text-sm mb-4">
            💰 收入分类（本月 · ¥{formatCurrency(stats.totalIncome)}）
          </h3>
          {stats.incomeByCategory.length === 0 ? (
            <div className="text-center py-6 text-sm text-[#90a4ae]">
              本月暂无收入
            </div>
          ) : (
            <div className="space-y-3">
              {stats.incomeByCategory.map((e) => (
                <div key={e.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#1a3a5c]">{e.category}</span>
                    <span className="text-xs text-[#90a4ae]">
                      ¥{formatCurrency(e.amount)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#e3f2fd] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#43a047] rounded-full transition-all duration-700"
                      style={{ width: `${(e.amount / maxIncomeAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
