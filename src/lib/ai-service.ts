import type { AIProvider } from "@/types/database";

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  apiBase?: string;
  model?: string;
}

interface AIProcessResult {
  tags: string[];
  category: string;
  summary: string;
}

const PROVIDER_CONFIGS: Record<AIProvider, { defaultBase: string; defaultModel: string }> = {
  deepseek: {
    defaultBase: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
  },
  qwen: {
    defaultBase: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
  },
  glm: {
    defaultBase: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4-flash",
  },
  doubao: {
    defaultBase: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModel: "ep-20241201000000-xxxxx",
  },
  openai: {
    defaultBase: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  anthropic: {
    defaultBase: "https://api.anthropic.com",
    defaultModel: "claude-3-haiku-20240307",
  },
};

const SYSTEM_PROMPT = `你是一个智能笔记助手。请分析用户的笔记内容，完成以下任务：

1. 提取 3-8 个关键词标签（中文，简洁）
2. 自动分类到以下类别之一：工作、学习、生活、灵感、心情、其他
3. 生成一句话摘要（不超过 50 字）

请严格按以下 JSON 格式返回，不要有其他文字：
{
  "tags": ["标签1", "标签2"],
  "category": "分类名",
  "summary": "摘要内容"
}`;

export async function processWithAI(
  content: string,
  config: AIConfig
): Promise<AIProcessResult> {
  const providerConfig = PROVIDER_CONFIGS[config.provider];
  const apiBase = config.apiBase || providerConfig.defaultBase;
  const model = config.model || providerConfig.defaultModel;

  if (config.provider === "anthropic") {
    return processWithAnthropic(content, { ...config, apiBase, model });
  }

  return processWithOpenAICompat(content, { ...config, apiBase, model });
}

// OpenAI 兼容接口（DeepSeek / Qwen / GLM / Doubao / OpenAI）
async function processWithOpenAICompat(
  content: string,
  config: Required<AIConfig> & { apiBase: string; model: string }
): Promise<AIProcessResult> {
  const res = await fetch(`${config.apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI 接口错误: ${res.status} - ${text}`);
  }

  const data = await res.json();
  const resultText = data.choices?.[0]?.message?.content || "{}";
  return parseAIResult(resultText);
}

// Anthropic 接口
async function processWithAnthropic(
  content: string,
  config: Required<AIConfig> & { apiBase: string; model: string }
): Promise<AIProcessResult> {
  const res = await fetch(`${config.apiBase}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI 接口错误: ${res.status} - ${text}`);
  }

  const data = await res.json();
  const resultText = data.content?.[0]?.text || "{}";
  return parseAIResult(resultText);
}

function parseAIResult(text: string): AIProcessResult {
  try {
    const json = JSON.parse(text);
    return {
      tags: Array.isArray(json.tags) ? json.tags.slice(0, 8) : [],
      category: json.category || "其他",
      summary: json.summary || "",
    };
  } catch {
    // 解析失败，尝试从文本中提取
    return {
      tags: [],
      category: "其他",
      summary: "",
    };
  }
}
