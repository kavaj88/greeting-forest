-- RLS 策略修复脚本
-- 在 Supabase SQL Editor 中运行此脚本修复"不公开心愿"保存报错问题

-- 删除旧策略
DROP POLICY IF EXISTS "公开心愿可被任何人查看" ON wishes;
DROP POLICY IF EXISTS "任何人可以创建心愿" ON wishes;
DROP POLICY IF EXISTS "任何人可以点赞" ON wishes;
DROP POLICY IF EXISTS "允许查看公开心愿" ON wishes;
DROP POLICY IF EXISTS "允许创建心愿" ON wishes;
DROP POLICY IF EXISTS "允许更新心愿" ON wishes;

-- 重新创建正确的策略

-- 1. 只允许查看公开的心愿
CREATE POLICY "enableViewingOnlyPublicWishes"
  ON wishes FOR SELECT
  USING (is_public = true);

-- 2. 允许创建任何心愿（包括公开和不公开）
CREATE POLICY "enableInsertForAllUsers"
  ON wishes FOR INSERT
  WITH CHECK (true);

-- 3. 允许更新任何心愿（用于点赞等功能）
CREATE POLICY "enableUpdateForAllUsers"
  ON wishes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 验证策略已创建
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wishes';
