"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export function CompanionAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signIn, signUp } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // While auth is loading, show a minimal character immediately (don't block)
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-transparent">
        <div className="text-6xl animate-breathe select-none drop-shadow-lg">🐱</div>
      </div>
    );
  }

  // Login form (explicitly triggered)
  if (showLogin && !user) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-[260px]">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">🐱</div>
            <h3 className="text-sm font-semibold text-[#1565c0]">
              {isSignUp ? "注册伙伴账号" : "登录伙伴"}
            </h3>
            <p className="text-[10px] text-[#90a4ae] mt-1">
              登录后数据同步到网页面板
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setSubmitting(true);
              const result = isSignUp
                ? await signUp(email, password)
                : await signIn(email, password);
              setSubmitting(false);
              if (result.error) setError(result.error);
            }}
            className="space-y-2.5"
          >
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
              required
              className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 focus:border-[#42a5f5]"
            />
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码（至少6位）"
              required minLength={6}
              className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 focus:border-[#42a5f5]"
            />

            {error && (
              <p className="text-[10px] text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-50 transition-colors"
            >
              {submitting ? "处理中..." : isSignUp ? "注册" : "登录"}
            </button>
          </form>

          <p className="text-center mt-3">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-[10px] text-[#90a4ae] hover:text-[#5c8dc9] transition-colors"
            >
              {isSignUp ? "已有账号？登录" : "没有账号？注册"}
            </button>
          </p>

          <p className="text-center mt-3">
            <button
              onClick={() => setShowLogin(false)}
              className="text-[10px] text-[#42a5f5] hover:underline"
            >
              ← 返回
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Logged in → show full companion
  if (user) return <>{children}</>;

  // Not logged in, not showing login → show companion with "先登录" banner
  return (
    <div className="relative w-full h-screen bg-transparent">
      {children}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1.5 bg-white/80 backdrop-blur-sm border-b border-[#e3f2fd]">
        <span className="text-[10px] text-[#90a4ae]">未登录，数据不会同步</span>
        <button
          onClick={() => setShowLogin(true)}
          className="text-[10px] text-[#42a5f5] font-medium hover:underline"
        >
          登录 / 注册
        </button>
      </div>
    </div>
  );
}
