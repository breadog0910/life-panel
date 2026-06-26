"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const moods = [
  { emoji: "😊", label: "开心" },
  { emoji: "😐", label: "平常" },
  { emoji: "😢", label: "低落" },
] as const;

export default function QuickReflection() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("reflections").insert({
      user_id: user.id,
      content: content.trim(),
      mood: mood || "😊",
      source: "web",
    });
    setSaving(false);

    if (!error) {
      setSubmitted(true);
      setTimeout(() => {
        setContent("");
        setMood(null);
        setSubmitted(false);
      }, 2000);
    }
  };

  return (
    <div className="bg-white rounded-card p-5 border border-[#e3f2fd]">
      <h3 className="font-semibold text-[#1565c0] text-sm mb-3 flex items-center gap-2">
        <span>💡</span> 今天学到了什么？
      </h3>
      {submitted ? (
        <div className="text-center py-6 text-[#42a5f5] font-medium">
          ✅ 已记录！干得漂亮～
        </div>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="一句话记录今天的收获、感悟或反思..."
            className="w-full border border-[#e3f2fd] rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 focus:border-[#42a5f5] placeholder:text-[#90a4ae]"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              {moods.map((m) => (
                <button
                  key={m.emoji}
                  onClick={() => setMood(m.emoji)}
                  className={`text-xl px-2 py-1 rounded-lg transition-all ${
                    mood === m.emoji
                      ? "bg-[#e3f2fd] scale-110"
                      : "opacity-50 hover:opacity-80"
                  }`}
                  title={m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="size-3.5" />
              {saving ? "保存中..." : "发送"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
