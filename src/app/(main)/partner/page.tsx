import { Settings } from "lucide-react";

export default function PartnerPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <Settings className="size-5" /> 🎨 伙伴设置
      </h2>
      <div className="bg-white rounded-card p-8 border border-[#e3f2fd] text-center text-sm text-[#90a4ae]">
        伙伴设置功能开发中（P2），即将支持角色、皮肤、昵称自定义...
      </div>
    </div>
  );
}
