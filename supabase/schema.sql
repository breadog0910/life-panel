-- 🏠 人生面板 — 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行此文件

-- ============================================================
-- 1. entries — 笔记灵感库（合并 diaries + reflections）
-- ============================================================
CREATE TABLE entries (
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

CREATE INDEX idx_entries_user_date ON entries(user_id, entry_date DESC);
CREATE INDEX idx_entries_user_type ON entries(user_id, type);
CREATE INDEX idx_entries_user_category ON entries(user_id, category);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的笔记" ON entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 开启 Realtime（桌面悬浮窗同步）
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
-- 1.1 diaries — 旧日记表（保留，数据迁移到 entries 后可删除）
-- ============================================================
CREATE TABLE diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT CHECK (mood IN ('😊', '😐', '😢', '😡')),
  content TEXT,
  weather TEXT,
  image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_diaries_user_date ON diaries(user_id, date DESC);

ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的日记" ON diaries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. time_entries — 时间安排 & 计时
-- ============================================================
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  pomodoro_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_time_entries_user ON time_entries(user_id, created_at DESC);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的时间条目" ON time_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. reflections — 复盘（⚠️ 开启 Realtime）
-- ============================================================
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('😊', '😐', '😢', '😡')),
  source TEXT DEFAULT 'web' CHECK (source IN ('desktop', 'web')),
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reflections_user ON reflections(user_id, created_at DESC);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的复盘" ON reflections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 开启 Realtime（悬浮窗 → 网页实时同步）
ALTER PUBLICATION supabase_realtime ADD TABLE reflections;

-- ============================================================
-- 4. transactions — 记账
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的账目" ON transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. goals — 目标规划
-- ============================================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_goals_user ON goals(user_id, status);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的目标" ON goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. reminders — 提醒
-- ============================================================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  trigger_time TIME NOT NULL,
  repeat_rule TEXT DEFAULT 'none' CHECK (repeat_rule IN ('daily', 'weekly', 'none')),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reminders_user ON reminders(user_id, enabled);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的提醒" ON reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. partner_config — 悬浮伙伴设置
-- ============================================================
CREATE TABLE partner_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id TEXT DEFAULT 'cat_orange',
  nickname TEXT DEFAULT '小H',
  skin TEXT DEFAULT 'default',
  position_x INTEGER DEFAULT 100,
  position_y INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE partner_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的伙伴设置" ON partner_config
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. ai_settings — AI 模型配置（多模型支持）
-- ============================================================
CREATE TABLE ai_settings (
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
-- 数据迁移脚本（已有数据的用户运行一次即可）
-- ============================================================
-- 迁移 diaries -> entries
-- INSERT INTO entries (user_id, type, content, mood, weather, tags, source, entry_date, created_at, updated_at)
-- SELECT user_id, 'text' as type, content, mood, weather, tags, 'web' as source, date as entry_date, created_at, created_at
-- FROM diaries
-- WHERE deleted_at IS NULL;

-- 迁移 reflections -> entries
-- INSERT INTO entries (user_id, type, content, mood, tags, source, entry_date, created_at, updated_at)
-- SELECT user_id, 'note' as type, content, mood, ARRAY[]::TEXT[] as tags, source, DATE(created_at) as entry_date, created_at, created_at
-- FROM reflections;

-- ============================================================
-- Storage — 笔记图片存储
-- ============================================================
-- 在 Supabase Dashboard 中手动创建：
-- 1. Storage → Create new bucket
-- 2. Name: entry_media
-- 3. 开启 Public（公开可读）
-- 4. 添加策略（Policy）：
--    - 上传：用户只能上传到自己的文件夹 (user_id = auth.uid())
--    - 读取：公开可读（Public bucket 已开启）
--    - 删除：用户只能删除自己的文件
--
-- SQL 策略示例（在 SQL Editor 运行）：
-- CREATE POLICY "用户只能上传自己的笔记图片"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'entry_media' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "用户只能删除自己的笔记图片"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (bucket_id = 'entry_media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 完成！
-- ============================================================
