# RLS 问题修复指南

## 问题
创建心愿时报错：`new row violates row-level security policy for table "wishes"`

## 原因
Supabase 默认启用行级安全 (RLS)，但策略配置不正确导致插入数据失败。

## 解决方案（推荐）

在 **Supabase SQL Editor** 中运行以下 SQL：

```sql
-- 禁用 wishes 表的 RLS（适合开发/测试环境）
ALTER TABLE wishes DISABLE ROW LEVEL SECURITY;
```

## 运行步骤

1. 打开 https://supabase.com
2. 进入你的项目
3. 点击左侧 **SQL Editor**
4. 点击 **New Query**
5. 粘贴上面的 SQL
6. 点击 **Run** (或按 Ctrl+Enter)
7. 看到成功消息后，刷新你的应用页面
8. 再次尝试创建心愿（包括不公开的）

## 验证

运行后：
- 公开心愿 ✅ 可以创建
- 不公开心愿 ✅ 可以创建
- 首页显示"保密" ✅ 正常工作

## 生产环境注意事项

如果是生产环境，建议保持 RLS 启用并使用正确的策略：

```sql
-- 重新启用 RLS
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- 删除所有现有策略
DROP POLICY IF EXISTS "enableViewingOnlyPublicWishes" ON wishes;
DROP POLICY IF EXISTS "enableInsertForAuthenticatedUsers" ON wishes;
DROP POLICY IF EXISTS "enableUpdateForAllUsers" ON wishes;

-- 创建正确的策略
-- 只允许查看公开的心愿
CREATE POLICY "select_public_wishes"
  ON wishes FOR SELECT
  USING (is_public = true);

-- 允许任何人创建心愿
CREATE POLICY "insert_all_users"
  ON wishes FOR INSERT
  WITH CHECK (true);

-- 允许任何人更新心愿（点赞）
CREATE POLICY "update_all_users"
  ON wishes FOR UPDATE
  USING (true);
```
