-- ============================================================
-- 笔记追记 / 评论 迁移脚本
-- 为「笔记灵感库」每条笔记增加可追加的评论 / 追记
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- entry_comments —— 笔记的追记 / 评论（一对多，归笔记所有者所有）
CREATE TABLE IF NOT EXISTS entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entry_comments_entry ON entry_comments(entry_id, created_at);
CREATE INDEX IF NOT EXISTS idx_entry_comments_user ON entry_comments(user_id);

ALTER TABLE entry_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能读写自己的追记" ON entry_comments;
CREATE POLICY "用户只能读写自己的追记" ON entry_comments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 完成！笔记追记 / 评论表已就绪。
-- ============================================================
