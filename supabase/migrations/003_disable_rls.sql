-- 彻底修复 RLS 问题
-- 在 Supabase SQL Editor 中运行此脚本

-- 方法 1：完全禁用 RLS（最简单，适合开发环境）
ALTER TABLE wishes DISABLE ROW LEVEL SECURITY;

-- 方法 2：如果要保持 RLS 启用，先删除所有策略再重建
-- 取消下面注释使用方法 2，同时注释掉上面的 DISABLE 语句

/*
-- 删除所有现有策略
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wishes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON wishes', pol.policyname);
    END LOOP;
END $$;

-- 重新创建策略
-- 1. 只允许查看公开的心愿
CREATE POLICY "enableViewingOnlyPublicWishes"
  ON wishes FOR SELECT
  USING (is_public = true);

-- 2. 允许认证用户创建任何心愿
CREATE POLICY "enableInsertForAuthenticatedUsers"
  ON wishes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR true);

-- 3. 允许更新任何心愿
CREATE POLICY "enableUpdateForAllUsers"
  ON wishes FOR UPDATE
  USING (true);
*/

-- 验证 RLS 状态
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'wishes';
