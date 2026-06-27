-- ============================================================
-- 笔记灵感库迁移脚本
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- 1. 创建 entries 表（笔记灵感库主表）
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'link', 'video', 'note')),
  title TEXT,
  content TEXT,
  media_urls TEXT[],
  link_url TEXT,
  link_title TEXT,
  link_description TEXT,
  link_favicon TEXT,
  mood TEXT CHECK (mood IN ('😊', '😐', '😢', '😡')),
  weather TEXT,
  tags TEXT[],
  category TEXT,
  source TEXT DEFAULT 'web' CHECK (source IN ('desktop', 'web', 'mobile')),
  ai_summary TEXT,
  ai_tags TEXT[],
  ai_category TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_type ON entries(user_id, type);
CREATE INDEX IF NOT EXISTS idx_entries_user_category ON entries(user_id, category);

-- RLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的笔记" ON entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime（桌面悬浮窗同步）
ALTER PUBLICATION supabase_realtime ADD TABLE entries;

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entries_updated_at
BEFORE UPDATE ON entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. 创建 ai_settings 表（AI 模型配置）
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'deepseek' CHECK (provider IN ('deepseek', 'qwen', 'glm', 'doubao', 'openai', 'anthropic')),
  api_key TEXT,
  api_base TEXT,
  model TEXT,
  auto_tag_enabled BOOLEAN DEFAULT true,
  auto_category_enabled BOOLEAN DEFAULT true,
  auto_summary_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的AI设置" ON ai_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ai_settings_updated_at
BEFORE UPDATE ON ai_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. 迁移旧数据（可选，有旧数据才运行）
-- ============================================================
-- 迁移 diaries -> entries
INSERT INTO entries (user_id, type, content, mood, weather, tags, source, entry_date, created_at, updated_at)
SELECT user_id, 'text' as type, content, mood, weather, tags, 'web' as source, date as entry_date, created_at, created_at
FROM diaries
WHERE deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- 迁移 reflections -> entries
INSERT INTO entries (user_id, type, content, mood, tags, source, category, entry_date, created_at, updated_at)
SELECT user_id, 'note' as type, content, mood, ARRAY[]::TEXT[] as tags, source, '心情' as category, DATE(created_at) as entry_date, created_at, created_at
FROM reflections
ON CONFLICT DO NOTHING;

-- ============================================================
-- 完成！
-- ============================================================
-- 接下来需要在 Storage 中创建 entry_media bucket
-- 参见 migrate-storage.md