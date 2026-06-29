import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackToSettings() {
  return (
    <Link
      href="/settings"
      className="inline-flex items-center gap-1.5 text-sm text-[#5c8dc9] hover:text-[#1565c0] transition-colors"
    >
      <ArrowLeft className="size-4" /> 返回设置
    </Link>
  );
}
