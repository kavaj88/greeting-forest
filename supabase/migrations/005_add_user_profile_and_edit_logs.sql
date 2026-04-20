-- 创建修改日志表
CREATE TABLE IF NOT EXISTS edit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update_reason', 'delete'
  old_content TEXT, -- 修改前的内容（JSON 格式）
  new_content TEXT, -- 修改后的内容（JSON 格式）
  review_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  review_comment TEXT, -- 审核意见
  reviewer_email TEXT, -- 审核人邮箱
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_edit_logs_wish_id ON edit_logs(wish_id);
CREATE INDEX IF NOT EXISTS idx_edit_logs_user_email ON edit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_edit_logs_review_status ON edit_logs(review_status);

-- wishes 表添加审核状态字段
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS reason TEXT; -- 发念缘由
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS reason_review_status TEXT DEFAULT 'approved';
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS reason_pending TEXT; -- 待审核的发念缘由

-- 添加所有者邮箱字段（用于用户中心查询）
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wishes_owner_email ON wishes(owner_email);

-- 创建短编号函数（基于 ID 生成 6 位短编号）
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TEXT AS $$
DECLARE
  short_id TEXT;
BEGIN
  -- 使用当前时间戳 + 随机数生成 6 位数字
  short_id := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN short_id;
END;
$$ LANGUAGE plpgsql;

-- 添加短编号列到 wishes 表
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS short_id TEXT;

-- 为现有数据生成短编号
UPDATE wishes SET short_id = generate_short_id() WHERE short_id IS NULL;

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishes_short_id ON wishes(short_id);

-- 禁用 RLS（开发环境）
ALTER TABLE edit_logs DISABLE ROW LEVEL SECURITY;
