-- ============================================================
-- 计划中心 v2 迁移脚本（板块分类 + 折叠子树）
-- 前提：已运行过 migrate-plan-center.sql
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- 1. plan_categories — 板块/分类（学习 / 健康 / 事业 ...）
CREATE TABLE IF NOT EXISTS plan_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#42a5f5',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_categories_user ON plan_categories(user_id);

ALTER TABLE plan_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能读写自己的板块" ON plan_categories;
CREATE POLICY "用户只能读写自己的板块" ON plan_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. plan_nodes 增加 板块关联 + 折叠状态
ALTER TABLE plan_nodes ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES plan_categories(id) ON DELETE SET NULL;
ALTER TABLE plan_nodes ADD COLUMN IF NOT EXISTS collapsed BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 完成！
-- ============================================================
