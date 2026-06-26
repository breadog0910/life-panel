"use client";

// 模拟数据，后续对接 Supabase reflections 表（Realtime）
const mockReflections = [
  { id: "1", content: "学了 React hooks，组件化思路更清晰了", time: "今天 15:30", mood: "😊" },
  { id: "2", content: "运动了 30 分钟，出完汗很舒服", time: "今天 16:00", mood: "😊" },
];

export default function DesktopReflections() {
  return (
    <div className="bg-white rounded-card p-5 border border-[#e3f2fd]">
      <h3 className="font-semibold text-[#1565c0] text-sm mb-3 flex items-center gap-2">
        <span>🐱</span> 来自桌面伙伴
      </h3>
      {mockReflections.length > 0 ? (
        <div className="space-y-2">
          {mockReflections.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#f5f9ff] border border-[#e3f2fd]"
            >
              <span className="text-lg shrink-0">{r.mood}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1a3a5c] leading-relaxed">「{r.content}」</p>
                <span className="text-xs text-[#90a4ae] mt-0.5 block">{r.time}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-[#90a4ae]">
          🐱 桌面伙伴还没有消息～
        </div>
      )}
      <div className="mt-3 text-right">
        <span className="text-xs text-[#90a4ae]">
          {mockReflections.length} 条来自桌面伙伴
        </span>
      </div>
    </div>
  );
}
