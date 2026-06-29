-- ============================================================
-- 实验室 / 英语闪卡 迁移脚本
-- 在 Supabase SQL Editor 中运行此文件
-- ============================================================

-- flashcard_decks —— 保存的闪卡组
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{ id, en, zh }]
  card_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user ON flashcard_decks(user_id, created_at DESC);
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户只能读写自己的闪卡组" ON flashcard_decks;
CREATE POLICY "用户只能读写自己的闪卡组" ON flashcard_decks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 完成！实验室英语闪卡相关表已就绪。
-- ============================================================
