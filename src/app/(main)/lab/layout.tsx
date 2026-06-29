"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";

export default function LabLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const admin = isAdmin(user?.email);
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAllowed(false);
      setChecking(false);
      return;
    }
    if (admin) {
      setAllowed(true);
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("beta_users")
        .select("lab_access")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setAllowed(!!data?.lab_access);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, admin, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center h-64 text-[#90a4ae] text-sm">加载中...</div>
    );
  }

  if (!allowed) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <FlaskConical className="size-5" /> 🧪 实验室
        </h2>
        <div className="bg-white rounded-card border border-[#e3f2fd] p-8 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-sm font-medium text-[#1a3a5c]">实验室正在内测中</p>
          <p className="text-xs text-[#90a4ae] mt-2 leading-relaxed">
            这里的功能还在小范围内测，开放后就能玩啦～
            <br />
            想提前体验可以找管理员申请内测名额 🐕
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
