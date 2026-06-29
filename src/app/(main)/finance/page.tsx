"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Wallet, Plus, Trash2, Save, X, Settings2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Transaction, CategoryKind } from "@/types/database";
import { useCategories, type CategorySeed } from "@/lib/use-categories";
import CategoryManager from "@/components/category-manager";
import FinanceCharts from "@/components/finance-charts";

const FINANCE_SEEDS: CategorySeed[] = [
  ...["餐饮", "交通", "购物", "娱乐", "学习", "医疗", "住房", "其他"].map(
    (name) => ({ kind: "expense" as CategoryKind, name })
  ),
  ...["工资", "奖金", "投资", "兼职", "红包", "其他"].map(
    (name) => ({ kind: "income" as CategoryKind, name })
  ),
];

function formatCurrency(n: number): string {
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FinancePage() {
  const { user } = useAuth();
  const [yearTx, setYearTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    categories,
    loaded: catsLoaded,
    add: addCategory,
    rename: renameCategory,
    remove: removeCategory,
  } = useCategories("finance", FINANCE_SEEDS);
  const [managerOpen, setManagerOpen] = useState(false);

  // Form state
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const currentCats = categories.filter((c) => c.kind === type);
  const firstCatName = (k: CategoryKind) => categories.find((c) => c.kind === k)?.name ?? "";

  // Month filter
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const year = filterMonth.slice(0, 4);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setYearTx(data as Transaction[]);
    setLoading(false);
  }, [user, filterMonth]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // 当前筛选月份的流水（从整年数据派生，供汇总卡片和账本列表使用）
  const transactions = useMemo(
    () => yearTx.filter((t) => t.date.startsWith(filterMonth)),
    [yearTx, filterMonth]
  );

  // 新建记录且未选分类时，默认选中当前类型的第一个分类
  useEffect(() => {
    if (!catsLoaded || !editing || editId) return;
    if (!category && currentCats.length) setCategory(currentCats[0].name);
  }, [catsLoaded, editing, editId, category, currentCats]);

  // Monthly summary
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  // Group by date for ledger display
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    (acc[t.date] ??= []).push(t);
    return acc;
  }, {});

  const resetForm = () => {
    setAmount("");
    setType("expense");
    setCategory(firstCatName("expense"));
    setNote("");
    setDate(new Date().toISOString().slice(0, 10));
    setEditId(null);
    setEditing(false);
  };

  const handleEdit = (t: Transaction) => {
    setEditId(t.id);
    setAmount(String(t.amount));
    setType(t.type);
    setCategory(t.category);
    setNote(t.note || "");
    setDate(t.date);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user || !amount.trim() || isNaN(Number(amount))) return;
    setSaving(true);
    const payload = {
      amount: Number(amount),
      type,
      category,
      note: note.trim() || undefined,
      date,
    };
    if (editId) {
      await supabase.from("transactions").update(payload).eq("id", editId);
    } else {
      await supabase.from("transactions").insert({ user_id: user.id, ...payload });
    }
    setSaving(false);
    resetForm();
    loadTransactions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await supabase.from("transactions").delete().eq("id", id);
    loadTransactions();
  };

  const months: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#90a4ae] text-sm">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <Wallet className="size-5" /> 💰 记账
        </h2>
        <button
          onClick={() => {
            resetForm();
            setEditing(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
        >
          <Plus className="size-4" /> 记一笔
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-[#5c8dc9]">月份：</label>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="border border-[#e3f2fd] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 bg-white"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m.replace("-", "年")}月
            </option>
          ))}
        </select>
      </div>

      {/* Monthly summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-card p-4 border border-[#e3f2fd] text-center">
          <div className="text-xs text-[#90a4ae]">收入</div>
          <div className="text-lg font-bold text-[#43a047]">¥{formatCurrency(totalIncome)}</div>
        </div>
        <div className="bg-white rounded-card p-4 border border-[#e3f2fd] text-center">
          <div className="text-xs text-[#90a4ae]">支出</div>
          <div className="text-lg font-bold text-[#ef5350]">¥{formatCurrency(totalExpense)}</div>
        </div>
        <div className="bg-white rounded-card p-4 border border-[#e3f2fd] text-center">
          <div className="text-xs text-[#90a4ae]">结余</div>
          <div className={`text-lg font-bold ${balance >= 0 ? "text-[#42a5f5]" : "text-[#ef5350]"}`}>
            ¥{formatCurrency(balance)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <FinanceCharts monthTx={transactions} yearTx={yearTx} filterMonth={filterMonth} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ledger list */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-card border border-[#e3f2fd] p-4">
            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-12 text-sm text-[#90a4ae]">
                💰 本月还没有记账记录
                <br />
                <span className="text-xs">点击右上角「记一笔」开始</span>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([d, items]) => {
                    const dayIncome = items
                      .filter((i) => i.type === "income")
                      .reduce((s, i) => s + Number(i.amount), 0);
                    const dayExpense = items
                      .filter((i) => i.type === "expense")
                      .reduce((s, i) => s + Number(i.amount), 0);
                    return (
                      <div key={d}>
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-xs font-medium text-[#5c8dc9]">
                            {new Date(d).toLocaleDateString("zh-CN", {
                              month: "long",
                              day: "numeric",
                              weekday: "short",
                            })}
                          </span>
                          <span className="text-xs text-[#90a4ae]">
                            收 ¥{formatCurrency(dayIncome)} · 支 ¥{formatCurrency(dayExpense)}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {items.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-[#f5f9ff] border border-[#e3f2fd] group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-lg shrink-0">
                                  {t.type === "income" ? "💰" : "💸"}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded text-xs bg-[#e3f2fd] text-[#1565c0]">
                                      {t.category}
                                    </span>
                                    {t.note && (
                                      <span className="text-sm text-[#1a3a5c] truncate">{t.note}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-sm font-semibold tabular-nums ${
                                    t.type === "income" ? "text-[#43a047]" : "text-[#ef5350]"
                                  }`}
                                >
                                  {t.type === "income" ? "+" : "-"}¥{formatCurrency(Number(t.amount))}
                                </span>
                                <button
                                  onClick={() => handleEdit(t)}
                                  className="opacity-0 group-hover:opacity-100 text-xs text-[#42a5f5] hover:bg-[#e3f2fd] px-1.5 py-0.5 rounded transition-all"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => handleDelete(t.id)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:bg-red-50 rounded transition-all"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Edit panel */}
        <div>
          {editing ? (
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1565c0] text-sm">
                  {editId ? "编辑记录" : "新增记录"}
                </h3>
                <button onClick={resetForm} className="text-[#90a4ae] hover:text-[#666]">
                  <X className="size-4" />
                </button>
              </div>

              {/* Type toggle */}
              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">类型</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setType("expense");
                      setCategory(firstCatName("expense"));
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      type === "expense"
                        ? "bg-[#ffebee] text-[#ef5350] border border-[#ef5350]/20"
                        : "bg-[#f5f5f5] text-[#90a4ae]"
                    }`}
                  >
                    💸 支出
                  </button>
                  <button
                    onClick={() => {
                      setType("income");
                      setCategory(firstCatName("income"));
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      type === "income"
                        ? "bg-[#e8f5e9] text-[#43a047] border border-[#43a047]/20"
                        : "bg-[#f5f5f5] text-[#90a4ae]"
                    }`}
                  >
                    💰 收入
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">金额</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#90a4ae]">¥</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border border-[#e3f2fd] rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-[#90a4ae]">分类</label>
                  <button
                    onClick={() => setManagerOpen(true)}
                    className="text-xs text-[#42a5f5] hover:text-[#1e88e5] flex items-center gap-1"
                  >
                    <Settings2 className="size-3" /> 管理分类
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentCats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                        category === c.name
                          ? "bg-[#e3f2fd] text-[#1565c0] font-medium"
                          : "bg-[#f5f9ff] text-[#5c8dc9] hover:bg-[#e3f2fd]"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                  {category && !currentCats.some((c) => c.name === category) && (
                    <button className="px-3 py-1.5 rounded-lg text-xs bg-[#e3f2fd] text-[#1565c0] font-medium">
                      {category}
                    </button>
                  )}
                  {currentCats.length === 0 && !category && (
                    <span className="text-xs text-[#90a4ae] py-1.5">点「管理分类」添加</span>
                  )}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">备注（可选）</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="备注..."
                  className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!amount.trim() || isNaN(Number(amount)) || saving}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
              >
                <Save className="size-3.5" />
                {saving ? "保存中..." : "保存"}
              </button>

              {editId && (
                <button
                  onClick={() => handleDelete(editId)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="size-3.5" /> 删除
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5 text-center">
              <div className="py-8 text-sm text-[#90a4ae]">
                点击「记一笔」按钮<br />添加新的收支记录
              </div>
            </div>
          )}
        </div>
      </div>

      {managerOpen && (
        <CategoryManager
          title={`管理${type === "expense" ? "支出" : "收入"}分类`}
          categories={currentCats}
          onAdd={async (name) => {
            await addCategory(name, type);
          }}
          onRename={async (id, name) => {
            const c = categories.find((x) => x.id === id);
            await renameCategory(id, name);
            if (c && c.name === category) setCategory(name);
          }}
          onRemove={async (id) => {
            const c = categories.find((x) => x.id === id);
            await removeCategory(id);
            if (c && c.name === category) setCategory("");
          }}
          onClose={() => setManagerOpen(false)}
        />
      )}
    </div>
  );
}
