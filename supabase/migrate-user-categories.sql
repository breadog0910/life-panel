-- ============================================================
-- 用户自定义分类/板块迁移脚本（记账 + 笔记灵感库）
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- user_categories — 通用分类表
--   module: 'finance'（记账）| 'entry'（笔记灵感库）
--   kind:   记账区分 'income' / 'expense'；笔记为 NULL
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  kind TEXT,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_categories_user_module ON user_categories(user_id, module);

ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能读写自己的分类" ON user_categories;
CREATE POLICY "用户只能读写自己的分类" ON user_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 完成！默认分类由前端首次进入时自动写入，之后可自由增删改。
-- ============================================================
