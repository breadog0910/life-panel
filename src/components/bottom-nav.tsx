"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  Wallet,
  Target,
} from "lucide-react";

const mobileNavItems = [
  { href: "/", label: "概览", icon: LayoutDashboard },
  { href: "/diary", label: "日记", icon: BookOpen },
  { href: "/time", label: "时间", icon: Clock },
  { href: "/finance", label: "记账", icon: Wallet },
  { href: "/goals", label: "规划", icon: Target },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e3f2fd] z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors min-w-0",
                isActive
                  ? "text-[#42a5f5] font-medium"
                  : "text-[#90a4ae]"
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
