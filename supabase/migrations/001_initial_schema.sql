-- 祈愿林数据库迁移脚本
-- 运行于 Supabase SQL Editor

-- 创建心愿表
CREATE TABLE IF NOT EXISTS wishes (
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wishes_category ON wishes(category);
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_is_public ON wishes(is_public);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wishes_updated_at
  BEFORE UPDATE ON wishes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建点赞函数
CREATE OR REPLACE FUNCTION increment_like(wish_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE wishes
  SET likes = likes + 1
  WHERE id = wish_id;
END;
$$ LANGUAGE plpgsql;

-- 设置行级安全策略 (RLS)
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "公开心愿可被任何人查看" ON wishes;
DROP POLICY IF EXISTS "任何人可以创建心愿" ON wishes;
DROP POLICY IF EXISTS "任何人可以点赞" ON wishes;

-- 允许任何人读取公开的心愿
CREATE POLICY "允许查看公开心愿"
  ON wishes FOR SELECT
  USING (is_public = true);

-- 允许任何人创建心愿（包括公开和不公开）
CREATE POLICY "允许创建心愿"
  ON wishes FOR INSERT
  WITH CHECK (true);

-- 允许任何人点赞（更新 likes 字段）
CREATE POLICY "允许更新心愿"
  ON wishes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 插入测试数据
INSERT INTO wishes (category, content, author, is_public, likes, bg_variant) VALUES
  ('blessing', '愿父母身体健康，平安喜乐。希望能有更多时间陪伴他们。', '远方的游子', true, 12, 2),
  ('vent', '今天又加班到了十二点，感觉生活全被工作填满了。真想去山里呆几天什么都不管啊！！', '打工人小王', true, 45, 3),
  ('wish', '希望能顺利通过下个月的雅思考试，拿到心仪大学的 offer！努力不负韶华。', '考鸭', true, 8, 1),
  ('blessing', '祝所有的好心人都能被世界温柔以待。', '匿名', true, 102, 0),
  ('vent', '为什么每次下雨天打车都这么难？站在雨里等了半个小时，鞋子全湿透了，心情糟透了。', '落汤鸡', true, 3, 0),
  ('wish', '存钱买一辆属于自己的车，带家人去自驾游。', '大梦想家', true, 21, 1);
