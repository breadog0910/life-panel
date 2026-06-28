-- ============================================================
-- 实验室 / 智能题库 迁移脚本
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- 1) beta_config —— 内测共享 API 总开关（单行，归管理员所有）
CREATE TABLE IF NOT EXISTS beta_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  share_api_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE beta_config ENABLE ROW LEVEL SECURITY;
-- 所有登录用户可读开关状态（仅布尔，不含任何 Key）
DROP POLICY IF EXISTS "登录用户可读内测开关" ON beta_config;
CREATE POLICY "登录用户可读内测开关" ON beta_config
  FOR SELECT USING (auth.role() = 'authenticated');
-- 仅管理员邮箱可写（双保险：uid 自洽 + email 校验）
DROP POLICY IF EXISTS "仅管理员可写内测开关" ON beta_config;
CREATE POLICY "仅管理员可写内测开关" ON beta_config
  FOR ALL USING (
    auth.uid() = admin_user_id
    AND (auth.jwt() ->> 'email') = '2994811601@qq.com'
  ) WITH CHECK (
    auth.uid() = admin_user_id
    AND (auth.jwt() ->> 'email') = '2994811601@qq.com'
  );

-- 2) quiz_papers —— 保存的题目集（模拟卷）
CREATE TABLE IF NOT EXISTS quiz_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  single_count INT NOT NULL DEFAULT 0,
  multiple_count INT NOT NULL DEFAULT 0,
  judge_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quiz_papers_user ON quiz_papers(user_id, created_at DESC);
ALTER TABLE quiz_papers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能读写自己的题集" ON quiz_papers;
CREATE POLICY "用户只能读写自己的题集" ON quiz_papers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3) quiz_attempts —— 作答记录（考试/自测成绩）
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES quiz_papers(id) ON DELETE SET NULL,
  mode TEXT NOT NULL,            -- 'selftest' | 'exam'
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INT NOT NULL DEFAULT 0,  -- 答对题数
  total INT NOT NULL DEFAULT 0,
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, created_at DESC);
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能读写自己的作答" ON quiz_attempts;
CREATE POLICY "用户只能读写自己的作答" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 完成！实验室智能题库相关表已就绪。
-- ============================================================
