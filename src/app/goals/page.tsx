import { Target } from "lucide-react";

export default function GoalsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <Target className="size-5" /> 🎯 目标规划
      </h2>
      <div className="bg-white rounded-card p-8 border border-[#e3f2fd] text-center text-sm text-[#90a4ae]">
        目标规划功能开发中（P1），即将支持年度/月度目标和进度追踪...
      </div>
    </div>
  );
}
