-- ============================================================
-- 笔记灵感库 / 私密隐藏标记 迁移脚本
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- entries.is_private —— 标记为私密的笔记默认在列表里只显示锁定占位，不展示内容
ALTER TABLE entries ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_entries_user_private ON entries(user_id, is_private);

-- ============================================================
-- 完成！笔记私密隐藏字段已就绪。
-- ============================================================
