# Supabase 配置说明

## 启用邮箱 OTP 登录

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入你的项目 → Authentication → Providers
3. 找到 **Email** 提供商，点击进入
4. 启用以下选项：
   - ✅ Enable Email Login
   - ✅ Enable Email OTP
   - ❌ Disable Signups (如果需要限制注册)

## 配置邮件发送

### 开发环境（默认）
Supabase 默认会发送邮件到真实邮箱，但新用户有发送限制。

### 查看测试邮件
开发期间，邮件可能会进入 Supabase 的测试队列：
- 进入 Authentication → Email Templates
- 查看发送的邮件内容

### 自定义邮件模板
在 Authentication → Email Templates 中可以自定义：
- Magic Link 邮件
- OTP 验证码邮件
- Password Reset 邮件

## 数据库迁移

运行以下 SQL 创建 users 表（如果需要存储额外用户信息）：

```sql
-- 已在 004_create_users_table.sql 中定义
-- 运行：进入 SQL Editor → New Query → 粘贴执行
```

## 环境变量

确保 `.env` 文件包含：

```
VITE_SUPABASE_URL=你的项目 URL
VITE_SUPABASE_ANON_KEY=你的 Anon Key
```

## 测试登录

1. 点击"去祈愿"按钮
2. 如果未登录，会弹出登录/注册窗口
3. 新用户：输入邮箱 → 获取验证码 → 输入验证码 → 设置密码
4. 老用户：输入邮箱和密码 → 登录

## 注意事项

- 验证码有效期：10 分钟
- 验证码重发间隔：60 秒
- 密码要求：至少 6 位
- 登录状态保持：默认 1 周（可配置）
