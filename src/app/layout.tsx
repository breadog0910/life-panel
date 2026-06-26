import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/sidebar";
import BottomNav from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "人生面板",
  description: "个人人生管理面板 — 日记、时间、复盘、规划",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body
        className="min-h-screen bg-[var(--background)] antialiased"
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pb-20 md:pb-0 overflow-auto">
            <div className="max-w-5xl mx-auto p-4 md:p-6">{children}</div>
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
