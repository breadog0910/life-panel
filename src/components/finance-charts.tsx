"use client";

import { useMemo, useState } from "react";
import { BarChart3, PieChart } from "lucide-react";
import type { Transaction } from "@/types/database";

function fmt(n: number): string {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 分类配色：同一个分类在三张图里用同一种颜色
// 支出走马卡龙柔和色系，收入走清爽蓝绿系
const EXPENSE_COLORS = [
  "#ffb3ba",
  "#ffd9a0",
  "#fce3a6",
  "#c7e9b4",
  "#a8e6cf",
  "#a0d8ef",
  "#b5c7f0",
  "#cdb4db",
  "#f7c5d9",
  "#e8c1a0",
  "#d6e5a3",
  "#f1b7b1",
];
const INCOME_COLORS = [
  "#42a5f5",
  "#66bb6a",
  "#26c6da",
  "#5c6bc0",
  "#9ccc65",
  "#26a69a",
  "#29b6f6",
  "#7e57c2",
  "#9ccc65",
  "#00acc1",
  "#5c6bc0",
  "#43a047",
];
const PALETTES: Record<"expense" | "income", string[]> = {
  expense: EXPENSE_COLORS,
  income: INCOME_COLORS,
};

type Seg = { name: string; value: number };
type Kind = "expense" | "income";

// 一根按分类堆叠的柱子（用 flex-grow 按金额比例分配高度）
function StackedBar({
  segs,
  total,
  max,
  width,
  color,
}: {
  segs: Seg[];
  total: number;
  max: number;
  width: string;
  color: (name: string) => string;
}) {
  return (
    <div
      className={`${width} rounded-t-sm overflow-hidden flex flex-col-reverse`}
      style={{ height: total > 0 ? `${Math.max((total / max) * 100, 4)}%` : 0 }}
    >
      {segs.map((s) => (
        <div key={s.name} style={{ flexGrow: s.value, flexBasis: 0, backgroundColor: color(s.name) }} />
      ))}
    </div>
  );
}

export default function FinanceCharts({
  monthTx,
  yearTx,
  filterMonth,
}: {
  monthTx: Transaction[];
  yearTx: Transaction[];
  filterMonth: string;
}) {
  const [kind, setKind] = useState<Kind>("expense");
  const year = Number(filterMonth.slice(0, 4));
  const month = Number(filterMonth.slice(5, 7));

  // 稳定的「分类 → 颜色」映射：按 kind 分别取整年出现过的分类、按名称排序固定配色
  const catColor = useMemo(() => {
    const sets: Record<Kind, Set<string>> = { expense: new Set(), income: new Set() };
    for (const t of yearTx) sets[t.type].add(t.category);
    const map = new Map<string, string>();
    (["expense", "income"] as const).forEach((k) => {
      const palette = PALETTES[k];
      [...sets[k]].sort().forEach((name, i) => map.set(`${k}|${name}`, palette[i % palette.length]));
    });
    return map;
  }, [yearTx]);
  const colorOf = (k: Kind, name: string) => catColor.get(`${k}|${name}`) ?? "#90a4ae";

  // 把一组流水按分类聚成有序段落
  const toSegs = (txs: Transaction[]) => {
    const m = new Map<string, number>();
    for (const t of txs) m.set(t.category, (m.get(t.category) ?? 0) + Number(t.amount));
    const segs = [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    return { segs, total: segs.reduce((s, x) => s + x.value, 0) };
  };

  // ① 本月每日柱状图（按分类堆叠）
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyData = useMemo(() => {
    const buckets: Transaction[][] = Array.from({ length: daysInMonth }, () => []);
    for (const t of monthTx) {
      if (t.type !== kind) continue;
      const d = Number(t.date.slice(8, 10));
      if (d >= 1 && d <= daysInMonth) buckets[d - 1].push(t);
    }
    return buckets.map((txs, i) => ({ day: i + 1, ...toSegs(txs) }));
  }, [monthTx, kind, daysInMonth]);
  const dailyMax = Math.max(1, ...dailyData.map((d) => d.total));
  const dailyTotal = dailyData.reduce((s, d) => s + d.total, 0);

  // ② 本年每月柱状图（收入 / 支出 各一根，按分类堆叠）
  const monthlyData = useMemo(() => {
    const buckets: Record<Kind, Transaction[]>[] = Array.from({ length: 12 }, () => ({
      expense: [],
      income: [],
    }));
    for (const t of yearTx) {
      const mm = Number(t.date.slice(5, 7));
      if (mm >= 1 && mm <= 12) buckets[mm - 1][t.type].push(t);
    }
    return buckets.map((b, i) => ({ m: i + 1, income: toSegs(b.income), expense: toSegs(b.expense) }));
  }, [yearTx]);
  const monthlyMax = Math.max(1, ...monthlyData.flatMap((d) => [d.income.total, d.expense.total]));

  // ③ 本月分类占比扇形图
  const pie = useMemo(() => toSegs(monthTx.filter((t) => t.type === kind)), [monthTx, kind]);
  let acc = 0;
  const conic = pie.total
    ? `conic-gradient(${pie.segs
        .map((it) => {
          const start = (acc / pie.total) * 360;
          acc += it.value;
          const end = (acc / pie.total) * 360;
          return `${colorOf(kind, it.name)} ${start}deg ${end}deg`;
        })
        .join(", ")})`
    : "conic-gradient(#eef4fb 0deg 360deg)";

  const kindLabel = kind === "expense" ? "支出" : "收入";

  return (
    <div className="space-y-4">
      {/* Header + 支出/收入 toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1565c0] flex items-center gap-1.5">
          <BarChart3 className="size-4" /> 图表分析
        </h3>
        <div className="flex rounded-full bg-[#f5f9ff] border border-[#e3f2fd] p-0.5 text-xs">
          {(["expense", "income"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-3 py-1 rounded-full transition-colors ${
                kind === k
                  ? k === "expense"
                    ? "bg-[#ffebee] text-[#ef5350] font-medium"
                    : "bg-[#e8f5e9] text-[#43a047] font-medium"
                  : "text-[#90a4ae] hover:text-[#5c8dc9]"
              }`}
            >
              {k === "expense" ? "支出" : "收入"}
            </button>
          ))}
        </div>
      </div>

      {/* ① 本月每日 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#5c8dc9]">
            {month} 月每日{kindLabel}
            <span className="text-[10px] text-[#b0bec5] ml-1.5">按分类配色</span>
          </span>
          <span className="text-xs text-[#90a4ae]">合计 ¥{fmt(dailyTotal)}</span>
        </div>
        {dailyTotal === 0 ? (
          <div className="h-24 flex items-center justify-center text-xs text-[#90a4ae]">
            本月暂无{kindLabel}记录
          </div>
        ) : (
          <div className="flex items-stretch h-32 gap-[2px]">
            {dailyData.map((d) => (
              <div
                key={d.day}
                className="flex-1 flex flex-col items-center"
                title={`${d.day}日 ¥${fmt(d.total)}`}
              >
                <div className="flex-1 w-full flex items-end">
                  <StackedBar segs={d.segs} total={d.total} max={dailyMax} width="w-full" color={(n) => colorOf(kind, n)} />
                </div>
                <span className="text-[8px] text-[#b0bec5] mt-1 h-2.5 leading-none">
                  {d.day === 1 || d.day % 5 === 0 ? d.day : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ③ 本月分类占比 */}
        <div className="bg-white rounded-card border border-[#e3f2fd] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#5c8dc9] flex items-center gap-1.5">
              <PieChart className="size-3.5" /> {month} 月{kindLabel}分类
            </span>
          </div>
          {pie.total === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-[#90a4ae]">
              本月暂无{kindLabel}记录
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative size-28 rounded-full shrink-0" style={{ background: conic }}>
                <div className="absolute inset-[22%] rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-[9px] text-[#90a4ae]">{kindLabel}</span>
                  <span className="text-[11px] font-semibold text-[#1a3a5c]">¥{fmt(pie.total)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5 max-h-32 overflow-y-auto">
                {pie.segs.map((it) => (
                  <div key={it.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="size-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: colorOf(kind, it.name) }}
                    />
                    <span className="text-[#1a3a5c] truncate flex-1">{it.name}</span>
                    <span className="text-[#90a4ae] tabular-nums shrink-0">
                      {((it.value / pie.total) * 100).toFixed(0)}%
                    </span>
                    <span className="text-[#5c8dc9] tabular-nums shrink-0 w-16 text-right">¥{fmt(it.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ② 本年每月收支 */}
        <div className="bg-white rounded-card border border-[#e3f2fd] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#5c8dc9]">{year} 年每月收支</span>
            <span className="text-[10px] text-[#90a4ae]">左 收入 · 右 支出（按分类配色）</span>
          </div>
          {yearTx.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-[#90a4ae]">
              本年暂无记账记录
            </div>
          ) : (
            <div className="flex items-stretch h-32 gap-1">
              {monthlyData.map((d) => (
                <div
                  key={d.m}
                  className="flex-1 flex flex-col items-center"
                  title={`${d.m}月 · 收 ¥${fmt(d.income.total)} 支 ¥${fmt(d.expense.total)}`}
                >
                  <div className="flex-1 w-full flex items-end justify-center gap-[2px]">
                    <StackedBar segs={d.income.segs} total={d.income.total} max={monthlyMax} width="w-1.5" color={(n) => colorOf("income", n)} />
                    <StackedBar segs={d.expense.segs} total={d.expense.total} max={monthlyMax} width="w-1.5" color={(n) => colorOf("expense", n)} />
                  </div>
                  <span
                    className={`text-[8px] mt-1 h-2.5 leading-none ${
                      d.m === month ? "text-[#1565c0] font-semibold" : "text-[#b0bec5]"
                    }`}
                  >
                    {d.m}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
