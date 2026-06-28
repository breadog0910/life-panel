"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Brain } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Fact {
  id: number;
  text: string;
  ts: number;
}

const STORAGE_KEY = "companion_chat_v2";

function loadFromStorage(): { messages: ChatMessage[]; facts: Fact[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return {
        messages: d.messages || [],
        facts: d.facts || [],
      };
    }
  } catch {}
  return { messages: [], facts: [] };
}

function saveToStorage(messages: ChatMessage[], facts: Fact[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ messages, facts }),
    );
  } catch {}
}

export default function CompanionChat({ nickname = "小H" }: { nickname?: string }) {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const { messages: msgs, facts: f } = loadFromStorage();
    setMessages(msgs);
    setFacts(f);
    setLoaded(true);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;
    setInput("");
    setSending(true);

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user" as const, content: text },
    ];
    setMessages(newMessages);

    // Show "typing" placeholder
    const typingIdx = newMessages.length;
    setMessages([...newMessages, { role: "assistant", content: "正在输入…" }]);

    try {
      const token = session?.access_token;
      if (!token) throw new Error("未登录");

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          facts,
          nickname,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "请求失败");

      // Replace typing indicator with real reply
      const replyText = data.reply || "（没有内容）";
      const finalMessages: ChatMessage[] = [
        ...newMessages,
        { role: "assistant", content: replyText },
      ];

      // Merge new facts
      let updatedFacts = facts;
      if (Array.isArray(data.newFacts) && data.newFacts.length > 0) {
        const existing = new Set(facts.map((f) => f.text.toLowerCase().replace(/\s+/g, "")));
        const nextId = Math.max(0, ...facts.map((f) => f.id)) + 1;
        for (const t of data.newFacts) {
          const norm = (t || "").trim().toLowerCase().replace(/\s+/g, "");
          if (!norm || existing.has(norm)) continue;
          updatedFacts = [
            ...updatedFacts,
            { id: nextId + updatedFacts.length, text: t.trim(), ts: Date.now() / 1000 },
          ];
          existing.add(norm);
        }
        if (updatedFacts.length > 200) {
          updatedFacts = updatedFacts.slice(-200);
        }
      }

      setMessages(finalMessages);
      setFacts(updatedFacts);
      saveToStorage(finalMessages, updatedFacts);
    } catch (err: any) {
      const finalMessages: ChatMessage[] = [
        ...newMessages,
        { role: "assistant", content: "⚠ " + (err.message || "出错了") },
      ];
      setMessages(finalMessages);
      saveToStorage(finalMessages, facts);
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    if (!confirm("确定要清空全部聊天记录和记忆吗？这无法恢复。")) return;
    const empty: ChatMessage[] = [];
    const emptyFacts: Fact[] = [];
    setMessages(empty);
    setFacts(emptyFacts);
    saveToStorage(empty, emptyFacts);
  };

  const handleShowMemory = () => {
    const items = facts
      .slice()
      .sort((a, b) => b.ts - a.ts)
      .map((f) => f.text);
    if (!items.length) {
      alert("我还没记住什么呢～多聊几句，我会慢慢记住关于你的事 💙");
      return;
    }
    alert("记得的事（" + items.length + " 条）：\n\n" + items.map((t) => "· " + t).join("\n"));
  };

  if (!loaded) return null;

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#42a5f5] text-white shrink-0">
        <span className="font-bold text-sm">💬 和{nickname}聊天</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShowMemory}
            className="text-xs text-white/80 hover:text-white transition-colors"
            title="记得的事"
          >
            <Brain className="size-4" />
          </button>
          <button
            onClick={handleClear}
            className="text-xs text-white/80 hover:text-white transition-colors"
            title="清空记忆"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#f7fbff]">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#90a4ae]">
            来和我说点什么吧～我会记住我们聊过的内容 💙
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#42a5f5] text-white rounded-br-md"
                    : m.content.startsWith("⚠")
                    ? "bg-[#fff3e0] text-[#e65100] rounded-bl-md"
                    : m.content === "正在输入…"
                    ? "bg-[#e3f2fd] text-[#90a4ae] rounded-bl-md italic"
                    : "bg-white border border-[#e3f2fd] text-[#1a3a5c] rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-[#e3f2fd] bg-white shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="说点什么…"
          disabled={sending}
          className="flex-1 border border-[#e3f2fd] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="p-2 rounded-full bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
