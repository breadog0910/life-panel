"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Send,
  Check,
  Clock,
  CornerDownRight,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import type { AdminFeedbackRow } from "@/types/database";

function fmt(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.email);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminFeedbackRow[]>([]);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!admin) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("请先登录");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/admin/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "加载失败");
      setRows(data.feedback || []);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    load();
  }, [load]);

  const sendReply = async (row: AdminFeedbackRow) => {
    const reply = (drafts[row.id] ?? "").trim();
    if (!reply) return;
    setSavingId(row.id);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feedbackId: row.id, reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "回复失败");
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, reply, replied_at: new Date().toISOString() }
            : r
        )
      );
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    } catch (e: any) {
      setError(e.message || "回复失败");
    } finally {
      setSavingId(null);
    }
  };

  if (!admin) {
    return (
      <div className="bg-white rounded-card border border-[#e3f2fd] p-8 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-sm font-medium text-[#1a3a5c]">仅管理员可见</p>
      </div>
    );
  }

  const pending = rows.filter((r) => !r.reply).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <MessageSquare className="size-5" /> 💬 反馈箱
          {pending > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fff3e0] text-[#e65100]">
              {pending} 条待回复
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] transition-colors"
          >
            <RefreshCw className="size-3.5" /> 刷新
          </button>
          <Link
            href="/lab"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#f0f6ff] text-[#5c8dc9] hover:bg-[#e3f2fd] transition-colors"
          >
            <ArrowLeft className="size-3.5" /> 返回实验室
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-sm text-[#c62828] bg-[#ffebee] rounded-lg px-3 py-2">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-[#90a4ae] py-8 text-center">加载中...</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-[#90a4ae] py-8 text-center">还没有收到反馈</div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-card border border-[#e3f2fd] p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#1a3a5c] font-medium truncate" title={row.email || ""}>
                  {row.email || "（无邮箱）"}
                </span>
                <span className="text-[11px] text-[#90a4ae] shrink-0">{fmt(row.created_at)}</span>
              </div>
              <p className="text-sm text-[#1a3a5c] whitespace-pre-wrap break-words">
                {row.content}
              </p>

              {row.reply ? (
                <div className="flex gap-2 bg-[#f0f6ff] rounded-lg p-3">
                  <CornerDownRight className="size-4 text-[#42a5f5] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px] text-[#2e7d32] mb-0.5">
                      <Check className="size-3" /> 已回复 · {fmt(row.replied_at)}
                    </div>
                    <p className="text-sm text-[#1a3a5c] whitespace-pre-wrap break-words">
                      {row.reply}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-[11px] text-[#e65100]">
                    <Clock className="size-3" /> 待回复
                  </div>
                  <div className="flex items-end gap-2">
                    <textarea
                      value={drafts[row.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      placeholder="写下回复…"
                      rows={2}
                      className="flex-1 px-3 py-2 rounded-lg border border-[#e3f2fd] text-sm text-[#1a3a5c] resize-none focus:outline-none focus:border-[#42a5f5]"
                    />
                    <button
                      onClick={() => sendReply(row)}
                      disabled={savingId === row.id || !(drafts[row.id] ?? "").trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors disabled:opacity-50 shrink-0"
                    >
                      <Send className="size-3.5" /> {savingId === row.id ? "发送中" : "回复"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
