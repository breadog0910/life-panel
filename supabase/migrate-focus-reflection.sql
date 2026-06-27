-- ============================================================
-- 专注复盘：给 time_entries 增加 note 列（每次专注的轻量化复盘 / 收获）
-- 在 Supabase SQL Editor 执行即可；可重复运行
-- ============================================================

ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS note TEXT;
