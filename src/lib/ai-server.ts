import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider, QuizQuestion, QuizQuestionType } from "@/types/database";
import { ADMIN_EMAIL } from "@/lib/admin";

export interface ResolvedAIConfig {
  provider: AIProvider;
  apiKey: string;
  apiBase?: string | null;
  model?: string | null;
  usedAdmin: boolean;
}

const PROVIDER_CONFIGS: Record<AIProvider, { defaultBase: string; defaultModel: string }> = {
  deepseek: { defaultBase: "https://api.deepseek.com", defaultModel: "deepseek-chat" },
  qwen: { defaultBase: "https://dashscope.aliyuncs.com/compatible-mode/v1", defaultModel: "qwen-plus" },
  glm: { defaultBase: "https://open.bigmodel.cn/api/paas/v4", defaultModel: "glm-4-flash" },
  doubao: { defaultBase: "https://ark.cn-beijing.volces.com/api/v3", defaultModel: "" },
  openai: { defaultBase: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  anthropic: { defaultBase: "https://api.anthropic.com", defaultModel: "claude-3-haiku-20240307" },
};

// 实验室功能的 API 配置解析：自有 Key 优先，否则在管理员开放共享时回退到管理员 Key。
// adminClient 必须是 service-role 客户端（绕过 RLS）。Key 仅在服务端使用，绝不下发前端。
export async function resolveAIConfig(
  adminClient: SupabaseClient,
  userId: string
): Promise<ResolvedAIConfig | null> {
  // 1) 用户自己的 Key 优先
  const { data: own } = await adminClient
    .from("ai_settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (own?.api_key) {
    return {
      provider: own.provider,
      apiKey: own.api_key,
      apiBase: own.api_base,
      model: own.model,
      usedAdmin: false,
    };
  }

  // 2) 回退：管理员开放共享时用管理员 Key
  const { data: beta } = await adminClient
    .from("beta_config")
    .select("*")
    .eq("share_api_enabled", true)
    .limit(1)
    .maybeSingle();
  if (!beta?.admin_user_id) return null;

  // 共享 API 权限校验：管理员本人，或被单独授予 share_api 的用户，才能用共享 Key
  if (userId !== beta.admin_user_id) {
    const { data: betaUser } = await adminClient
      .from("beta_users")
      .select("share_api")
      .eq("user_id", userId)
      .maybeSingle();
    if (!betaUser?.share_api) return null;
  }

  // 纵深防御：再确认该 admin_user_id 对应的确是管理员邮箱（RLS 已限管理员写）
  const { data: adminUser, error: adminErr } = await adminClient.auth.admin.getUserById(
    beta.admin_user_id
  );
  if (adminErr || adminUser?.user?.email !== ADMIN_EMAIL) return null;

  const { data: adminSettings } = await adminClient
    .from("ai_settings")
    .select("*")
    .eq("user_id", beta.admin_user_id)
    .single();
  if (!adminSettings?.api_key) return null;

  return {
    provider: adminSettings.provider,
    apiKey: adminSettings.api_key,
    apiBase: adminSettings.api_base,
    model: adminSettings.model,
    usedAdmin: true,
  };
}

interface QuizCounts {
  single: number;
  multiple: number;
  judge: number;
}

const MAX_SOURCE_CHARS = 8000; // 控制 token，避免超长资料导致请求过大/超费用

function buildSystemPrompt(counts: QuizCounts): string {
  return `你是出题专家。请依据用户给出的【资料】出题：单选题 ${counts.single} 道、多选题 ${counts.multiple} 道、判断题 ${counts.judge} 道。
严格只返回如下 JSON（不要任何额外文字、不要 markdown 代码块）：
{
  "questions": [
    { "type": "single", "question": "题干", "options": ["选项A","选项B","选项C","选项D"], "answer": [0], "explanation": "解析" },
    { "type": "multiple", "question": "题干", "options": ["..."], "answer": [0,2], "explanation": "解析" },
    { "type": "judge", "question": "题干", "options": ["正确","错误"], "answer": [0], "explanation": "解析" }
  ]
}
规则：
- answer 用 options 中正确项的下标（从 0 开始）。
- 单选题 answer 长度为 1；多选题 answer 至少含 2 个下标；判断题 options 固定为 ["正确","错误"]，answer 为 [0]（正确）或 [1]（错误）。
- 题目必须严格基于【资料】内容，explanation 说明为什么。
- 题目数量必须与要求一致。`;
}

function normalizeQuestions(raw: unknown): QuizQuestion[] {
  const arr = Array.isArray((raw as { questions?: unknown })?.questions)
    ? (raw as { questions: unknown[] }).questions
    : Array.isArray(raw)
    ? (raw as unknown[])
    : [];
  const out: QuizQuestion[] = [];
  arr.forEach((item, idx) => {
    const q = item as Record<string, unknown>;
    const typeRaw = String(q.type || "").toLowerCase();
    const type: QuizQuestionType =
      typeRaw === "multiple" ? "multiple" : typeRaw === "judge" ? "judge" : "single";
    const question = String(q.question || "").trim();
    if (!question) return;

    let options: string[];
    if (type === "judge") {
      options = ["正确", "错误"];
    } else {
      options = Array.isArray(q.options) ? q.options.map((o) => String(o)) : [];
      if (options.length < 2) return;
    }

    const rawAns = Array.isArray(q.answer)
      ? q.answer
      : q.answer != null
      ? [q.answer]
      : [];
    let answer = rawAns
      .map((a) => Number(a))
      .filter((n) => Number.isInteger(n) && n >= 0 && n < options.length);
    answer = Array.from(new Set(answer)).sort((a, b) => a - b);
    if (type === "single" || type === "judge") answer = answer.slice(0, 1);
    if (answer.length === 0) answer = [0];

    out.push({
      id: `q_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      question,
      options,
      answer,
      explanation: String(q.explanation || "").trim(),
    });
  });
  return out;
}

// 调用 LLM 出题，返回规范化后的题目数组
export async function generateQuizJSON(
  config: ResolvedAIConfig,
  sourceText: string,
  counts: QuizCounts
): Promise<QuizQuestion[]> {
  const pc = PROVIDER_CONFIGS[config.provider] || PROVIDER_CONFIGS.deepseek;
  const base = (config.apiBase || pc.defaultBase).replace(/\/$/, "");
  const model = config.model || pc.defaultModel;
  const systemPrompt = buildSystemPrompt(counts);
  const userContent = `【资料】\n${sourceText.slice(0, MAX_SOURCE_CHARS)}`;

  let resultText: string;
  if (config.provider === "anthropic") {
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
        temperature: 0.4,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI 接口错误: ${res.status} - ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    resultText = data.content?.[0]?.text || "{}";
  } else {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI 接口错误: ${res.status} - ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    resultText = data.choices?.[0]?.message?.content || "{}";
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(resultText);
  } catch {
    // 个别模型会包额外文字，尝试截取首个 JSON 对象
    const m = resultText.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("AI 返回内容无法解析为题目");
    parsed = JSON.parse(m[0]);
  }
  const questions = normalizeQuestions(parsed);
  if (questions.length === 0) throw new Error("AI 未能生成有效题目，请调整资料或重试");
  return questions;
}
