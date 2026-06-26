import { Wallet } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <Wallet className="size-5" /> 💰 记账
      </h2>
      <div className="bg-white rounded-card p-8 border border-[#e3f2fd] text-center text-sm text-[#90a4ae]">
        记账功能开发中（P1），即将支持收支流水和分类统计...
      </div>
    </div>
  );
}
