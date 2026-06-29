import { Settings } from "lucide-react";
import PartnerSettingsForm from "@/components/partner-settings-form";
import BackToSettings from "@/components/back-to-settings";

export default function PartnerPage() {
  return (
    <div className="space-y-4">
      <BackToSettings />
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <Settings className="size-5" /> 🎨 伙伴设置
      </h2>
      <PartnerSettingsForm />
    </div>
  );
}
