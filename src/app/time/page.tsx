import { Clock } from "lucide-react";

export default function TimePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <Clock className="size-5" /> ⏱️ 时间安排
      </h2>
      <div className="bg-white rounded-card p-8 border border-[#e3f2fd] text-center text-sm text-[#90a4ae]">
        时间安排功能开发中，即将支持日程管理、番茄钟计时和工时统计...
      </div>
    </div>
  );
}
