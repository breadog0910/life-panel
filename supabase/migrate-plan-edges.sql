-- ============================================================
-- 技能树多连线：plan_edges 表（节点间任意多对多连线，可删除）
-- 在 Supabase SQL Editor 执行即可；可重复运行
-- ============================================================

CREATE TABLE IF NOT EXISTS plan_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES plan_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES plan_nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (source_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_edges_user ON plan_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_edges_source ON plan_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_plan_edges_target ON plan_edges(target_id);

ALTER TABLE plan_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用户只能读写自己的连线" ON plan_edges;
CREATE POLICY "用户只能读写自己的连线" ON plan_edges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 把现有 parent_id 的父子关系迁移成连线（source=父，target=子）
INSERT INTO plan_edges (user_id, source_id, target_id)
SELECT user_id, parent_id, id
FROM plan_nodes
WHERE parent_id IS NOT NULL
ON CONFLICT (source_id, target_id) DO NOTHING;
