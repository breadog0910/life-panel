-- ============================================================
-- 计划中心迁移脚本（合并 时间 + 规划 + 提醒）
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- 1. 创建 plan_nodes 表（技能树节点，树形结构）
CREATE TABLE IF NOT EXISTS plan_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES plan_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  node_type TEXT NOT NULL DEFAULT 'goal' CHECK (node_type IN ('wish', 'goal', 'task')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  deadline DATE,
  pos_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  pos_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_nodes_user ON plan_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_nodes_parent ON plan_nodes(parent_id);

ALTER TABLE plan_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的计划节点" ON plan_nodes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at 自动更新（复用已有的 update_updated_at 函数）
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plan_nodes_updated_at ON plan_nodes;
CREATE TRIGGER plan_nodes_updated_at
BEFORE UPDATE ON plan_nodes
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. time_entries 增加 node_id（计时记录挂回节点）
-- ============================================================
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS node_id UUID REFERENCES plan_nodes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_node ON time_entries(node_id);

-- ============================================================
-- 3. 迁移旧 goals → plan_nodes（作为顶层目标节点）
-- ============================================================
INSERT INTO plan_nodes (user_id, parent_id, title, description, node_type, progress, status, deadline, pos_x, pos_y, created_at)
SELECT
  user_id,
  NULL AS parent_id,
  title,
  description,
  'goal' AS node_type,
  COALESCE(progress, 0),
  status,
  deadline,
  (random() * 400)::int AS pos_x,
  (random() * 300)::int AS pos_y,
  created_at
FROM goals
ON CONFLICT DO NOTHING;

-- ============================================================
-- 完成！
-- ============================================================