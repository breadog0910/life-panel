"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export function CompanionAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-2xl animate-breathe">🐱</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-[#e3f2fd] p-5 w-full max-w-[240px]">
          <div className="text-center mb-4">
            <div className="text-4xl mb-1">🐱</div>
            <h3 className="text-sm font-semibold text-[#1565c0]">
              {isSignUp ? "注册伙伴" : "登录伙伴"}
            </h3>
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
              required
              className="w-full border border-[#e3f2fd] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 focus:border-[#42a5f5] bg-white/70"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              required
              minLength={6}
              className="w-full border border-[#e3f2fd] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 focus:border-[#42a5f5] bg-white/70"
            />

            {error && (
              <p className="text-[10px] text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-1.5 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-50 transition-colors"
            >
              {submitting
                ? "处理中..."
                : isSignUp
                ? "注册"
                : "登录"}
            </button>
          </form>

          <p className="text-center mt-3">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-[10px] text-[#90a4ae] hover:text-[#5c8dc9] transition-colors"
            >
              {isSignUp ? "已有账号？登录" : "没有账号？注册"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
