# Supabase 数据库设置指南

## 1. 创建 Supabase 项目

1. 访问 https://supabase.com
2. 登录/注册账号
3. 创建新项目

## 2. 运行数据库迁移脚本

### 方法一：SQL Editor（推荐）

1. 在 Supabase 仪表板中，点击左侧 **SQL Editor**
2. 点击 **New Query**
3. 复制 `supabase/migrations/001_initial_schema.sql` 的全部内容
4. 粘贴到 SQL Editor
5. 点击 **Run** 执行

### 方法二：数据库页面

1. 在 Supabase 仪表板中，点击左侧 **Table Editor**
2. 点击 **New Table** 创建表
3. 按照以下结构手动创建字段

## 3. 获取 API 密钥

1. 点击左侧 **Settings** (设置图标)
2. 点击 **API**
3. 复制以下信息：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## 4. 更新环境变量

编辑项目根目录的 `.env` 文件：

```bash
VITE_SUPABASE_URL=你的项目 URL
VITE_SUPABASE_ANON_KEY=你的 anon key
```

## 5. 验证连接

运行 `npm run dev` 启动项目，打开浏览器查看是否正常加载数据。

## 数据库表结构

### wishes 表

```sql
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('blessing', 'wish', 'vent')),
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '匿名',
  is_public BOOLEAN NOT NULL DEFAULT true,
  likes INTEGER NOT NULL DEFAULT 0,
  bg_variant INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 索引

- `idx_wishes_category` - 按类型查询
- `idx_wishes_created_at` - 按时间排序
- `idx_wishes_is_public` - 按公开状态筛选

### 函数

- `increment_like(wish_id)` - 点赞计数 +1

### 安全策略 (RLS)

- 任何人可查看公开的心愿
- 任何人可创建心愿
- 任何人可点赞心愿

## 故障排查

### 问题：无法连接数据库

1. 检查 `.env` 文件是否存在
2. 确认 URL 和 key 是否正确
3. 检查网络是否可访问 Supabase

### 问题：数据加载失败

1. 检查浏览器控制台错误信息
2. 确认 wishes 表是否存在
3. 确认 RLS 策略是否已启用

### 问题：无法插入数据

1. 检查表结构是否正确
2. 确认 INSERT 策略是否存在
3. 查看 Supabase 日志
