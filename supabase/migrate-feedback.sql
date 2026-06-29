-- ============================================================
-- 意见反馈 迁移脚本
-- 在 Supabase SQL Editor 中运行此文件（幂等，可重复执行）
-- ============================================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 用户可读自己的反馈（含管理员回复）
DROP POLICY IF EXISTS "用户可读自己的反馈" ON feedback;
CREATE POLICY "用户可读自己的反馈" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可提交自己的反馈
DROP POLICY IF EXISTS "用户可提交反馈" ON feedback;
CREATE POLICY "用户可提交反馈" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理员可读写全部反馈（含回复）
DROP POLICY IF EXISTS "管理员可管理全部反馈" ON feedback;
CREATE POLICY "管理员可管理全部反馈" ON feedback
  FOR ALL USING ((auth.jwt() ->> 'email') = '2994811601@qq.com')
  WITH CHECK ((auth.jwt() ->> 'email') = '2994811601@qq.com');

-- ============================================================
-- 完成！意见反馈表已就绪。
-- ============================================================
