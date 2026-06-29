"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Wallet,
  Map,
  Settings,
  FlaskConical,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", label: "今日概览", icon: LayoutDashboard },
  { href: "/diary", label: "笔记灵感库", icon: BookOpen },
  { href: "/plan", label: "计划中心", icon: Map },
  { href: "/finance", label: "记账", icon: Wallet },
  { href: "/lab", label: "实验室", icon: FlaskConical },
  { href: "/settings", label: "设置", icon: Settings },
];

function UserFooter() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <div className="size-8 rounded-full bg-gradient-to-br from-[#90caf9] to-[#42a5f5] flex items-center justify-center text-sm shrink-0">
          🐕
        </div>
        <span className="text-xs text-[#64b5f6] truncate" title={user?.email}>
          {user?.email?.split("@")[0]}
        </span>
      </div>
      <button
        onClick={signOut}
        className="p-1.5 rounded-lg hover:bg-white/50 text-[#64b5f6] hover:text-red-400 transition-colors shrink-0"
        title="退出登录"
      >
        <LogOut className="size-3.5" />
      </button>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0",
        "bg-gradient-to-b from-[#e3f2fd] to-[#bbdefb]",
        "border-r border-[#bbdefb] transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[200px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-[#bbdefb]">
        {!collapsed && (
          <h1 className="font-bold text-[#1565c0] text-sm">🌸 人生面板</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-white/50 text-[#64b5f6] transition-colors"
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                "hover:bg-white/60",
                isActive
                  ? "bg-white text-[#1565c0] font-medium shadow-sm"
                  : "text-[#64b5f6]"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[#bbdefb]">
        {collapsed ? (
          <button title="退出" className="p-1.5 rounded-lg hover:bg-white/50 text-[#64b5f6] transition-colors w-full flex justify-center">
            <LogOut className="size-4" />
          </button>
        ) : (
          <UserFooter />
        )}
      </div>
    </aside>
  );
}
