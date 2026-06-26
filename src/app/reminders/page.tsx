import { Bell } from "lucide-react";

export default function RemindersPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <Bell className="size-5" /> 🔔 提醒管理
      </h2>
      <div className="bg-white rounded-card p-8 border border-[#e3f2fd] text-center text-sm text-[#90a4ae]">
        提醒管理功能开发中（P1），即将支持定时提醒和重复规则设置...
      </div>
    </div>
  );
}
