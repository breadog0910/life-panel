import AppShell from "@/components/app-shell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppShell>{children}</AppShell>
    </div>
  );
}
