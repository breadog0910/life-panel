import CompanionShell from "./companion-shell";

export const metadata = {
  title: "悬浮伙伴",
  description: "桌面悬浮伙伴面板",
};

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-transparent overflow-hidden select-none w-screen h-screen">
      <CompanionShell>{children}</CompanionShell>
    </div>
  );
}
