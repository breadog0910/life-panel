-- ============================================================
-- 日程规划：给 time_entries 增加 status 列
--   planned   = 待完成的日程规划（琥珀色，可去专注 / 打勾完成 / 划去）
--   done      = 已完成的专注 / 记录（蓝色）
--   cancelled = 已划去（灰色划线保留）
-- 旧数据 status 为 NULL，应用层一律视为 done
-- 在 Supabase SQL Editor 执行即可；可重复运行
-- ============================================================

ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS status TEXT;
