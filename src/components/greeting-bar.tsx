"use client";

import { useState, useEffect } from "react";

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

function weatherEmoji(condition: string): string {
  const c = condition || "";
  if (c.includes("雷")) return "⛈️";
  if (c.includes("雪")) return "❄️";
  if (c.includes("雨")) return "🌧️";
  if (c.includes("雾") || c.includes("霾")) return "🌫️";
  if (c.includes("多云")) return "⛅";
  if (c.includes("阴")) return "☁️";
  if (c.includes("晴")) return "☀️";
  if (c.includes("风") || c.includes("沙")) return "💨";
  return "🌤️";
}

type Weather = { temp: number; condition: string; city: string };

export default function GreetingBar() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [wxLoading, setWxLoading] = useState(true);

  // 浏览器端直接拉取，按用户真实 IP 自动定位城市
  useEffect(() => {
    let active = true;
    fetch("https://60s.viki.moe/v2/weather")
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        const d = j?.data;
        const w = d?.weather;
        if (w && typeof w.temperature === "number") {
          setWeather({
            temp: Math.round(w.temperature),
            condition: typeof w.condition === "string" ? w.condition : "",
            city: d?.location?.city || d?.location?.name || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setWxLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#e3f2fd] to-[#fff9c4] rounded-card p-5 md:p-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-[#1565c0]">
          {getGreeting()}
        </h2>
        <p className="text-sm text-[#5c8dc9] mt-1">{formatDate()}</p>
      </div>
      {weather ? (
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-3xl md:text-4xl">{weatherEmoji(weather.condition)}</span>
          <div className="text-right">
            <div className="text-xl md:text-2xl font-bold text-[#1565c0] leading-none">
              {weather.temp}°
            </div>
            <div className="text-xs text-[#5c8dc9] mt-1 truncate max-w-[7rem]">
              {weather.city}
              {weather.city && weather.condition ? " · " : ""}
              {weather.condition}
            </div>
          </div>
        </div>
      ) : (
        wxLoading && <span className="text-xs text-[#90a4ae] shrink-0">天气加载中…</span>
      )}
    </div>
  );
}
