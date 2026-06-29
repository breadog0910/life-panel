"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquarePlus, Send, Check, Clock, CornerDownRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Feedback } from "@/types/database";
import BackToSettings from "@/components/back-to-settings";

function fmt(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setList((data as Feedback[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!user) return;
    const text = content.trim();
    if (!text) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("feedback")
      .insert({ user_id: user.id, content: text });
    setSubmitting(false);
    if (!error) {
      setContent("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
      load();
    }
  };

  if (!user) {
    return (
      <div className="space-y-4 max-w-2xl">
        <BackToSettings />
        <div className="flex items-center justify-center h-64 text-[#90a4ae] text-sm">
          请先登录后再提交反馈～
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <BackToSettings />
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <MessageSquarePlus className="size-5" /> 💌 意见反馈
      </h2>
      <p className="text-sm text-[#90a4ae]">
        有什么想吐槽、想要的功能、遇到的 Bug，都可以告诉我，我会一条条看～
      </p>

      {/* 提交框 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-4 space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的建议或问题…"
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-[#e3f2fd] text-sm text-[#1a3a5c] resize-none focus:outline-none focus:border-[#42a5f5]"
        />
        <div className="flex items-center justify-between">
          {sent ? (
            <span className="flex items-center gap-1.5 text-xs text-[#2e7d32]">
              <Check className="size-3.5" /> 已收到，谢谢你的反馈！
            </span>
          ) : (
            <span className="text-xs text-[#90a4ae]">提交后我会在后台看到</span>
          )}
          <button
            onClick={submit}
            disabled={submitting || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors disabled:opacity-50"
          >
            <Send className="size-3.5" /> {submitting ? "提交中..." : "提交反馈"}
          </button>
        </div>
      </div>

      {/* 历史反馈 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#1a3a5c]">我的反馈</h3>
        {loading ? (
          <div className="text-sm text-[#90a4ae] py-6 text-center">加载中...</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-[#90a4ae] py-6 text-center">还没有提交过反馈</div>
        ) : (
          list.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-card border border-[#e3f2fd] p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#90a4ae]">{fmt(f.created_at)}</span>
                {f.reply ? (
                  <span className="flex items-center gap-1 text-[11px] text-[#2e7d32]">
                    <Check className="size-3" /> 已回复
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-[#e65100]">
                    <Clock className="size-3" /> 待回复
                  </span>
                )}
              </div>
              <p className="text-sm text-[#1a3a5c] whitespace-pre-wrap break-words">
                {f.content}
              </p>
              {f.reply && (
                <div className="flex gap-2 bg-[#f0f6ff] rounded-lg p-3">
                  <CornerDownRight className="size-4 text-[#42a5f5] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#5c8dc9] mb-0.5">
                      管理员回复 · {fmt(f.replied_at)}
                    </div>
                    <p className="text-sm text-[#1a3a5c] whitespace-pre-wrap break-words">
                      {f.reply}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
