"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Key, Globe, Sparkles, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { AIProvider, AISettings } from "@/types/database";
import BackToSettings from "@/components/back-to-settings";

const providerOptions: { key: AIProvider; label: string; desc: string }[] = [
  { key: "deepseek", label: "DeepSeek", desc: "便宜好用，中文优秀" },
  { key: "qwen", label: "通义千问", desc: "阿里出品，稳定可靠" },
  { key: "glm", label: "智谱清言", desc: "国产老牌，功能全面" },
  { key: "doubao", label: "字节豆包", desc: "字节跳动，速度快" },
  { key: "openai", label: "OpenAI", desc: "GPT 系列，效果最好" },
  { key: "anthropic", label: "Anthropic", desc: "Claude 系列，长文本强" },
];

export default function AISettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Partial<AISettings>>({
    provider: "deepseek",
    api_key: "",
    api_base: "",
    model: "",
    auto_tag_enabled: true,
    auto_category_enabled: true,
    auto_summary_enabled: false,
  });

  useEffect(() => {
    if (!user) return;
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);

    const { data: existing } = await supabase
      .from("ai_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase
        .from("ai_settings")
        .update({
          provider: settings.provider,
          api_key: settings.api_key,
          api_base: settings.api_base || null,
          model: settings.model || null,
          auto_tag_enabled: settings.auto_tag_enabled,
          auto_category_enabled: settings.auto_category_enabled,
          auto_summary_enabled: settings.auto_summary_enabled,
        })
        .eq("user_id", user.id);
    } else {
      await supabase.from("ai_settings").insert({
        user_id: user.id,
        provider: settings.provider,
        api_key: settings.api_key,
        api_base: settings.api_base || null,
        model: settings.model || null,
        auto_tag_enabled: settings.auto_tag_enabled,
        auto_category_enabled: settings.auto_category_enabled,
        auto_summary_enabled: settings.auto_summary_enabled,
      });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <BackToSettings />
        <div className="flex items-center justify-center h-64 text-[#90a4ae] text-sm">
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <BackToSettings />
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Settings className="size-5 text-[#1565c0]" />
        <h2 className="text-xl font-bold text-[#1565c0]">AI 设置</h2>
      </div>

      <p className="text-sm text-[#90a4ae]">
        配置你的 AI 模型，用于自动打标签、分类和摘要生成。API Key 只保存在你自己的账户中。
      </p>

      {/* 模型选择 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
        <h3 className="font-semibold text-[#1565c0] text-sm flex items-center gap-2">
          <Globe className="size-4" /> 选择模型服务商
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {providerOptions.map((p) => (
            <button
              key={p.key}
              onClick={() => setSettings({ ...settings, provider: p.key })}
              className={`p-3 rounded-lg border text-left transition-all ${
                settings.provider === p.key
                  ? "border-[#42a5f5] bg-[#f0f6ff]"
                  : "border-[#e3f2fd] hover:border-[#bbdefb]"
              }`}
            >
              <div className="text-sm font-medium text-[#1a3a5c]">{p.label}</div>
              <div className="text-xs text-[#90a4ae] mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* API 配置 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
        <h3 className="font-semibold text-[#1565c0] text-sm flex items-center gap-2">
          <Key className="size-4" /> API 配置
        </h3>

        <div>
          <label className="text-xs text-[#90a4ae] mb-1.5 block">API Key</label>
          <input
            type="password"
            value={settings.api_key || ""}
            onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
            placeholder="sk-..."
            className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
          />
        </div>

        <div>
          <label className="text-xs text-[#90a4ae] mb-1.5 block">
            API Base URL（可选，留空用默认）
          </label>
          <input
            type="text"
            value={settings.api_base || ""}
            onChange={(e) => setSettings({ ...settings, api_base: e.target.value })}
            placeholder="https://..."
            className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
          />
        </div>

        <div>
          <label className="text-xs text-[#90a4ae] mb-1.5 block">
            模型名称（可选，留空用默认）
          </label>
          <input
            type="text"
            value={settings.model || ""}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            placeholder="如 deepseek-chat / gpt-4o-mini"
            className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
          />
        </div>
      </div>

      {/* 功能开关 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-5 space-y-4">
        <h3 className="font-semibold text-[#1565c0] text-sm flex items-center gap-2">
          <Sparkles className="size-4" /> AI 功能
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-sm text-[#1a3a5c]">自动打标签</div>
              <div className="text-xs text-[#90a4ae]">AI 自动提取笔记关键词</div>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_tag_enabled}
              onChange={(e) =>
                setSettings({ ...settings, auto_tag_enabled: e.target.checked })
              }
              className="size-5 accent-[#42a5f5]"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-sm text-[#1a3a5c]">自动分类</div>
              <div className="text-xs text-[#90a4ae]">AI 自动归类到工作/学习/生活等</div>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_category_enabled}
              onChange={(e) =>
                setSettings({ ...settings, auto_category_enabled: e.target.checked })
              }
              className="size-5 accent-[#42a5f5]"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-sm text-[#1a3a5c]">自动生成摘要</div>
              <div className="text-xs text-[#90a4ae]">AI 生成一句话摘要（消耗更多 token）</div>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_summary_enabled}
              onChange={(e) =>
                setSettings({ ...settings, auto_summary_enabled: e.target.checked })
              }
              className="size-5 accent-[#42a5f5]"
            />
          </label>
        </div>
      </div>

      {/* 提示 */}
      <div className="bg-[#fff9c4]/30 border border-[#fff176] rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="size-5 text-[#f9a825] shrink-0 mt-0.5" />
        <div className="text-xs text-[#f9a825]">
          <p className="font-medium mb-1">注意事项</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>API Key 存储在你的 Supabase 账户中，不会分享给第三方</li>
            <li>AI 调用产生的费用由你自己的 API Key 承担</li>
            <li>建议使用便宜的模型用于自动标签，如 DeepSeek / Qwen-Plus</li>
          </ul>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
        >
          {saved ? (
            <>
              <Check className="size-4" /> 已保存
            </>
          ) : (
            <>
              <Save className="size-4" />
              {saving ? "保存中..." : "保存设置"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
