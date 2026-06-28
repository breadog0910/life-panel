"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (isSignUp) {
      const { error: err } = await signUp(email, password);
      if (err) {
        setError(err);
      } else {
        setSuccessMsg("✅ 注册成功！请查看邮箱确认链接（可能需要检查垃圾邮件）。确认后即可登录。");
      }
    } else {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f9ff] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐕</div>
          <h1 className="text-2xl font-bold text-[#1565c0]">人生面板</h1>
          <p className="text-sm text-[#5c8dc9] mt-1">记录生活，见证成长</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-card p-6 border border-[#e3f2fd] shadow-sm">
          <h2 className="text-lg font-semibold text-[#1a3a5c] mb-4">
            {isSignUp ? "📝 创建账号" : "🔑 登录"}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-600">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5c8dc9] mb-1">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 focus:border-[#42a5f5]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5c8dc9] mb-1">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
                required
                minLength={6}
                className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 focus:border-[#42a5f5]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-[#42a5f5] text-white font-medium text-sm hover:bg-[#1e88e5] disabled:opacity-50 transition-colors"
            >
              {loading ? "处理中..." : isSignUp ? "注册" : "登录"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccessMsg("");
              }}
              className="text-sm text-[#42a5f5] hover:text-[#1e88e5]"
            >
              {isSignUp ? "已有账号？去登录 →" : "没有账号？去注册 →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
