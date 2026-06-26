import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/app-shell";

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
      <body className="min-h-screen bg-[var(--background)] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
