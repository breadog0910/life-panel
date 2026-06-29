"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Wallet,
  Map,
  FlaskConical,
  Settings,
} from "lucide-react";

const mobileNavItems = [
  { href: "/", label: "概览", icon: LayoutDashboard },
  { href: "/diary", label: "笔记", icon: BookOpen },
  { href: "/plan", label: "计划", icon: Map },
  { href: "/finance", label: "记账", icon: Wallet },
  { href: "/lab", label: "实验室", icon: FlaskConical },
  { href: "/settings", label: "设置", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e3f2fd] z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-14 px-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0 px-1.5 py-1 rounded-lg text-[10px] transition-colors min-w-[44px]",
                isActive
                  ? "text-[#42a5f5] font-medium"
                  : "text-[#90a4ae]"
              )}
            >
              <Icon className="size-4 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
