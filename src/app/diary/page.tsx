import { BookOpen } from "lucide-react";

export default function DiaryPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <BookOpen className="size-5" /> 📝 日记
      </h2>
      <div className="bg-white rounded-card p-8 border border-[#e3f2fd] text-center text-sm text-[#90a4ae]">
        日记功能开发中，即将支持每日心情记录、感受感悟、天气和图片...
      </div>
    </div>
  );
}
