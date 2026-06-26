import { BarChart3 } from "lucide-react";

export default function StatsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <BarChart3 className="size-5" /> 📈 数据统计
      </h2>
      <div className="bg-white rounded-card p-8 border border-[#e3f2fd] text-center text-sm text-[#90a4ae]">
        数据统计功能开发中（P1），即将展示心情趋势、时间分布和记账图表...
      </div>
    </div>
  );
}
