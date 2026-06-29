-- ============================================================
-- 实验室 / 内测白名单 迁移脚本
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- beta_users —— 内测白名单（每个被授权用户一行）
-- 两个独立权限：lab_access = 可访问实验室；share_api = 可用管理员开放的共享 API Key
CREATE TABLE IF NOT EXISTS beta_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 拆分两个独立权限列。
-- 先以 DEFAULT true 加列：旧白名单行（原本同时享有实验室+共享API）回填为 true，保留原行为；
-- 再把默认值改为 false：之后管理员新建的行默认不授予，按需逐项开通。
ALTER TABLE beta_users ADD COLUMN IF NOT EXISTS lab_access BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE beta_users ALTER COLUMN lab_access SET DEFAULT false;
ALTER TABLE beta_users ADD COLUMN IF NOT EXISTS share_api BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE beta_users ALTER COLUMN share_api SET DEFAULT false;

ALTER TABLE beta_users ENABLE ROW LEVEL SECURITY;

-- 登录用户只能查到「自己是否在白名单」这一行，用于前端 gating
DROP POLICY IF EXISTS "用户可读自己的内测白名单状态" ON beta_users;
CREATE POLICY "用户可读自己的内测白名单状态" ON beta_users
  FOR SELECT USING (auth.uid() = user_id);

-- 仅管理员邮箱可读全部 + 写（增删白名单）。
-- 实际增删走服务端 service-role（绕过 RLS），此策略为纵深防御。
DROP POLICY IF EXISTS "仅管理员可管理内测白名单" ON beta_users;
CREATE POLICY "仅管理员可管理内测白名单" ON beta_users
  FOR ALL USING (
    (auth.jwt() ->> 'email') = '2994811601@qq.com'
  ) WITH CHECK (
    (auth.jwt() ->> 'email') = '2994811601@qq.com'
  );

-- ============================================================
-- 完成！内测白名单表已就绪。
-- ============================================================
