import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Fact {
  id: number;
  text: string;
  ts: number;
}

const PROVIDER_CONFIGS: Record<
  AIProvider,
  { defaultBase: string; defaultModel: string }
> = {
  deepseek: { defaultBase: "https://api.deepseek.com", defaultModel: "deepseek-chat" },
  qwen: { defaultBase: "https://dashscope.aliyuncs.com/compatible-mode/v1", defaultModel: "qwen-plus" },
  glm: { defaultBase: "https://open.bigmodel.cn/api/paas/v4", defaultModel: "glm-4-flash" },
  doubao: { defaultBase: "https://ark.cn-beijing.volces.com/api/v3", defaultModel: "" },
  openai: { defaultBase: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  anthropic: { defaultBase: "https://api.anthropic.com", defaultModel: "claude-3-haiku-20240307" },
};

const FACT_EXTRACTION_INSTRUCTION = `你是记忆抽取器。请从下面这段对话里，提炼关于「用户本人」值得长期记住的事实，比如姓名/称呼、喜好、厌恶、目标、习惯、职业/身份、正在做的事、重要的人和事、约定、计划等。每条是一句独立、具体、自包含的中文陈述（不要代词指代不明）。与【已有记忆】比对，只输出【新增或更新】的事实，不要重复已有的。严格只输出一个 JSON 数组，例如 ["用户叫小明","用户在备考研究生"]；如果这段对话没有值得长期记住的信息，就输出 []。不要输出任何其它文字。`;

// ── Token-based fact retrieval (same algorithm as companion.py) ──
function memTokens(s: string): Set<string> {
  s = (s || "").toLowerCase();
  const tokens = new Set<string>();
  for (const w of s.match(/[a-z0-9]+/g) || []) {
    if (w.length >= 2) tokens.add(w);
  }
  const cjk = s.match(/[一-鿿]/g) || [];
  for (const c of cjk) tokens.add(c);
  for (let i = 0; i < cjk.length - 1; i++) tokens.add(cjk[i] + cjk[i + 1]);
  return tokens;
}

function retrieveFacts(facts: Fact[], query: string, k = 6): string[] {
  if (!facts.length) return [];
  const qt = memTokens(query);
  const scored = facts.map((f) => {
    const ft = memTokens(f.text);
    const common = [...ft].filter((t) => qt.has(t)).length;
    return { score: common, ts: f.ts, text: f.text };
  });
  scored.sort((a, b) => b.score - a.score || b.ts - a.ts);
  const picked = scored
    .filter((s) => s.score > 0)
    .slice(0, k)
    .map((s) => s.text);
  if (picked.length < k) {
    const recent = [...facts].sort((a, b) => b.ts - a.ts);
    for (const f of recent) {
      if (!picked.includes(f.text)) picked.push(f.text);
      if (picked.length >= k) break;
    }
  }
  return picked;
}

// ── LLM call ──
async function llmChat(
  provider: AIProvider,
  apiKey: string,
  apiBase: string | undefined,
  model: string | undefined,
  messages: { role: string; content: string }[],
  systemPrompt: string,
): Promise<string> {
  const pc = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.deepseek;
  const base = (apiBase || pc.defaultBase).replace(/\/$/, "");
  const mdl = model || pc.defaultModel;

  if (provider === "anthropic") {
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: mdl,
        max_tokens: 800,
        system: systemPrompt,
        messages,
        temperature: 0.7,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Anthropic ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || "";
  }

  // OpenAI-compatible
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: mdl,
      messages: [{ role: "system", content: systemPrompt }].concat(messages as any),
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// ── POST /api/ai/chat ──
export async function POST(req: Request) {
  try {
    const { messages, facts, nickname } = await req.json();

    // Auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "用户验证失败" }, { status: 401 });
    }

    // Fetch AI settings
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();

    if (!aiSettings?.api_key) {
      return NextResponse.json(
        { error: "请先在「AI 设置」中配置 API Key" },
        { status: 400 },
      );
    }

    // Build system prompt with mem0 facts
    const factsList: Fact[] = Array.isArray(facts) ? facts : [];
    const lastUserMsg = [...(messages || [])].reverse().find((m: any) => m.role === "user");
    const query = lastUserMsg?.content || "";
    const relevant = retrieveFacts(factsList, query);

    const nick = (nickname || "小H").trim() || "小H";
    let systemPrompt = `你是「${nick}」，用户桌面上的一个温暖、可爱、懂陪伴的小伙伴。说话亲切自然、口语化，像熟悉的朋友一样关心 ta，可以适当用 emoji。回答尽量简短（通常 1-3 句），除非用户明确要求展开。`;
    if (relevant.length) {
      systemPrompt += `\n\n【你已经记住的关于 ta 的事】（自然地运用，别生硬复述）：\n${relevant.map((t) => "- " + t).join("\n")}`;
    }

    // Chat with LLM
    const msgList: ChatMessage[] = Array.isArray(messages) ? messages.slice(-24) : [];
    const reply = await llmChat(
      aiSettings.provider,
      aiSettings.api_key,
      aiSettings.api_base,
      aiSettings.model,
      msgList,
      systemPrompt,
    );

    // Extract facts (mem0 add) — best-effort, don't block reply
    let newFacts: string[] = [];
    try {
      const transcript = msgList
        .map((m: ChatMessage) => (m.role === "user" ? "用户：" : "我：") + m.content)
        .join("\n");
      const existing = factsList
        .slice(-60)
        .map((f) => f.text)
        .join("\n- ");
      const extractionReply = await llmChat(
        aiSettings.provider,
        aiSettings.api_key,
        aiSettings.api_base,
        aiSettings.model,
        [
          {
            role: "user",
            content: `${FACT_EXTRACTION_INSTRUCTION}\n\n【已有记忆】\n- ${existing || "（暂无）"}\n\n【新对话】\n${transcript}`,
          },
        ],
        "你是负责抽取用户长期记忆的助手，严格只输出 JSON 数组。",
      );
      try {
        const arr = JSON.parse(extractionReply);
        if (Array.isArray(arr)) newFacts = arr.filter((x) => typeof x === "string" && x.trim());
      } catch {
        // parse failure — ignore, facts are best-effort
      }
    } catch {
      // extraction failure — ignore
    }

    return NextResponse.json({ reply: reply || "（没有内容）", newFacts });
  } catch (error: any) {
    console.error("Chat API 错误:", error);
    return NextResponse.json(
      { error: error.message || "AI 处理失败" },
      { status: 500 },
    );
  }
}
