"use client";

import Link from "next/link";
import { FlaskConical, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";

interface Demo {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  badge?: string;
}

const demos: Demo[] = [
  {
    href: "/lab/quiz",
    emoji: "📝",
    title: "智能题库",
    desc: "上传文档/粘贴文字，AI 出选择/多选/判断题，自测 · 模拟卷 · 考试",
    badge: "内测",
  },
];

export default function LabPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.email);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <FlaskConical className="size-5" /> 🧪 实验室
        </h2>
        {admin && (
          <div className="flex items-center gap-2">
            <Link
              href="/lab/users"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] transition-colors"
            >
              <Users className="size-3.5" /> 用户管理
            </Link>
          </div>
        )}
      </div>

      <p className="text-sm text-[#90a4ae]">内置一些我在折腾的小玩意儿，点进去体验吧～</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {demos.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="bg-white rounded-card p-4 border border-[#e3f2fd] hover:border-[#42a5f5] hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{d.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[#1a3a5c] group-hover:text-[#1565c0] transition-colors">
                    {d.title}
                  </h3>
                  {d.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fff3e0] text-[#e65100]">
                      {d.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#90a4ae] mt-1 leading-relaxed">{d.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
