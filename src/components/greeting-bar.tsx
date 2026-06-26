"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const moods = ["😊", "😐", "😢", "😡"] as const;
type Mood = (typeof moods)[number];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "🌙 夜深了，注意休息呀";
  if (hour < 9) return "🌅 早上好，新的一天开始了";
  if (hour < 12) return "☀️ 上午好，精力充沛的时候";
  if (hour < 14) return "🌤️ 中午好，记得吃饭休息";
  if (hour < 18) return "☀️ 下午好，今天也要加油呀";
  if (hour < 21) return "🌅 傍晚好，回顾一下今天";
  return "🌙 晚上好，安静复盘的时候了";
}

function formatDate(): string {
  return new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export default function GreetingBar() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  // Load today's mood from Supabase on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("diaries")
      .select("mood")
      .eq("user_id", user.id)
      .eq("date", today)
      .is("deleted_at", null)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.mood && moods.includes(data.mood as Mood)) {
          setSelectedMood(data.mood as Mood);
        }
      });
  }, [user, today]);

  const handleMoodClick = async (mood: Mood) => {
    setSelectedMood(mood);
    if (!user) return;

    // Upsert: update existing diary for today, or create mood-only entry
    const { data: existing } = await supabase
      .from("diaries")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      await supabase.from("diaries").update({ mood }).eq("id", existing.id);
    } else {
      await supabase.from("diaries").insert({
        user_id: user.id,
        date: today,
        mood,
        content: "",
        tags: [],
      });
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#e3f2fd] to-[#fff9c4] rounded-card p-5 md:p-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-[#1565c0]">
          {getGreeting()}
        </h2>
        <p className="text-sm text-[#5c8dc9] mt-1">{formatDate()}</p>
      </div>
      <div className="flex gap-2">
        {moods.map((mood) => (
          <button
            key={mood}
            onClick={() => handleMoodClick(mood)}
            className={`text-2xl md:text-3xl p-1.5 rounded-xl transition-all ${
              selectedMood === mood
                ? "bg-white shadow-md scale-110"
                : "hover:scale-110 opacity-60 hover:opacity-100"
            }`}
            title={
              mood === "😊"
                ? "开心"
                : mood === "😐"
                ? "平常"
                : mood === "😢"
                ? "低落"
                : "生气"
            }
          >
            {mood}
          </button>
        ))}
      </div>
    </div>
  );
}
