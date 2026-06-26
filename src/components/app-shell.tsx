"use client";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/sidebar";
import BottomNav from "@/components/bottom-nav";
import AuthForm from "@/components/auth-form";

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f9ff]">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-3">🐱</div>
          <p className="text-sm text-[#5c8dc9]">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 overflow-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}
