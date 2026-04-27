-- 添加谢愿词字段到 wishes 表
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS thanked_content TEXT;
ALTER TABLE wishes ADD COLUMN IF NOT EXISTS thanked_at TIMESTAMPTZ;
