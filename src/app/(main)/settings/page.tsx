"use client";

import Link from "next/link";
import { Settings, Sparkles, MessageSquarePlus, Smartphone, Dog, ChevronRight } from "lucide-react";

const links = [
  {
    href: "/settings/ai",
    icon: Sparkles,
    title: "连接 AI 大模型",
    desc: "配置 DeepSeek / 通义千问 / 智谱 / OpenAI 等 API Key",
    desktopOnly: false,
  },
  {
    href: "/feedback",
    icon: MessageSquarePlus,
    title: "意见反馈",
    desc: "提建议、报 Bug，并查看管理员回复",
    desktopOnly: false,
  },
  {
    href: "/settings/home-screen",
    icon: Smartphone,
    title: "添加到桌面",
    desc: "自定义主屏幕封面 + 查看添加方法",
    desktopOnly: false,
  },
  {
    href: "/partner",
    icon: Dog,
    title: "伙伴设置",
    desc: "桌面悬浮伙伴的形象与下载",
    desktopOnly: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
        <Settings className="size-5" /> ⚙️ 设置
      </h2>

      <div className="space-y-2">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`${
                l.desktopOnly ? "hidden md:flex" : "flex"
              } items-center gap-3 bg-white rounded-card border border-[#e3f2fd] p-4 hover:border-[#42a5f5] hover:shadow-sm transition-all group`}
            >
              <div className="size-10 rounded-xl bg-[#f0f6ff] flex items-center justify-center text-[#42a5f5] shrink-0">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[#1a3a5c] group-hover:text-[#1565c0] transition-colors">
                  {l.title}
                </h3>
                <p className="text-xs text-[#90a4ae] mt-0.5 leading-relaxed">{l.desc}</p>
              </div>
              <ChevronRight className="size-4 text-[#90a4ae] shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
