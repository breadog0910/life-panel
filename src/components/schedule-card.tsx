"use client";

import { Plus, Clock } from "lucide-react";

// 模拟数据，后续对接 Supabase
const mockSchedules = [
  { id: "1", time: "09:00", title: "写代码", duration: "2h", color: "bg-[#e3f2fd] text-[#1565c0]" },
  { id: "2", time: "14:00", title: "阅读", duration: "1h", color: "bg-[#e8f5e9] text-[#2e7d32]" },
];

export default function ScheduleCard() {
  return (
    <div className="bg-white rounded-card p-5 border border-[#e3f2fd]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#1565c0] text-sm">📅 今日日程</h3>
        <button className="text-xs text-[#42a5f5] hover:text-[#1e88e5] flex items-center gap-1 transition-colors">
          <Plus className="size-3" /> 添加
        </button>
      </div>
      {mockSchedules.length > 0 ? (
        <div className="space-y-2">
          {mockSchedules.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e3f2fd]/50 hover:bg-[#f5f9ff] transition-colors"
            >
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${item.color}`}>
                <Clock className="size-3" />
                {item.time}
              </div>
              <span className="text-sm text-[#1a3a5c] flex-1">{item.title}</span>
              <span className="text-xs text-[#90a4ae]">{item.duration}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-[#90a4ae]">
          ✨ 今天还没有安排～
        </div>
      )}
    </div>
  );
}
