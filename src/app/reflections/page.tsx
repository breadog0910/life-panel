import { Lightbulb } from "lucide-react";

export default function ReflectionsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <Lightbulb className="size-5" /> 📊 复盘汇总
      </h2>
      <div className="bg-white rounded-card p-8 border border-[#e3f2fd] text-center text-sm text-[#90a4ae]">
        复盘汇总功能开发中，即将汇聚桌面伙伴和网页端的所有复盘记录...
      </div>
    </div>
  );
}
