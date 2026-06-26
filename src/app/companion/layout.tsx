import type { Metadata } from "next";
import "../globals.css";
import CompanionShell from "./companion-shell";

export const metadata: Metadata = {
  title: "悬浮伙伴",
  description: "桌面悬浮伙伴面板",
};

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-transparent antialiased overflow-hidden select-none">
        <CompanionShell>{children}</CompanionShell>
      </body>
    </html>
  );
}
