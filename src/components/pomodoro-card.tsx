"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

const DEFAULT_TIME = 25 * 60; // 25 minutes in seconds

export default function PomodoroCard() {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setIsRunning(false);
        setPomodoroCount((c) => c + 1);
        return DEFAULT_TIME;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DEFAULT_TIME);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-white rounded-card p-5 border border-[#e3f2fd]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1565c0] text-sm flex items-center gap-2">
          <span className="text-lg">🍅</span> 番茄钟
        </h3>
        {pomodoroCount > 0 && (
          <span className="text-xs bg-[#e3f2fd] text-[#42a5f5] px-2 py-1 rounded-full font-medium">
            {pomodoroCount} 轮完成
          </span>
        )}
      </div>
      <div className="text-center py-3">
        <div className="text-5xl font-bold text-[#1a3a5c] tabular-nums tracking-tight">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>
      <div className="flex gap-2 justify-center mt-3">
        <button
          onClick={toggleTimer}
          className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
        >
          {isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
          {isRunning ? "暂停" : "开始"}
        </button>
        <button
          onClick={resetTimer}
          className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium bg-[#f0f6ff] text-[#5c8dc9] hover:bg-[#e3f2fd] transition-colors"
        >
          <RotateCcw className="size-4" />
          重置
        </button>
      </div>
    </div>
  );
}
