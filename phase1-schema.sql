-- =============================================
-- 冰雪之巅 Phase 1：双边平台 Schema 改造
-- 目标：中阶/高阶雪友 C2C/B2C 社区化租赁
-- 运行位置：Supabase Dashboard → SQL Editor
-- =============================================

-- 0. 启用必要扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. profiles 扩展：角色、实名、店铺信息
-- =============================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'renter',         -- 'renter' | 'host' | 'both' | 'admin'
  ADD COLUMN IF NOT EXISTS display_name TEXT,                  -- 公开昵称（用于商品页）
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,                           -- 个人简介
  ADD COLUMN IF NOT EXISTS city TEXT,                          -- 所在城市
  ADD COLUMN IF NOT EXISTS skill_level TEXT,                   -- 自我标注技能
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,     -- 实名认证
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS host_since TIMESTAMP WITH TIME ZONE, -- 成为发布者时间
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,           -- 综合评分 0-5
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,     -- 评分次数
  ADD COLUMN IF NOT EXISTS listing_count INTEGER DEFAULT 0,    -- 在售商品数
  ADD COLUMN IF NOT EXISTS completed_rentals INTEGER DEFAULT 0; -- 完成租赁数

-- 索引
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- =============================================
-- 2. listings 雪具商品表（核心新增表）
-- =============================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 发布者
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source TEXT DEFAULT 'individual',            -- 'individual' | 'shop' | 'platform'

  -- 基础信息
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,                                   -- 具体型号
  year INTEGER,                                 -- 上市年份 (e.g. 2023)

  -- 规格
  type TEXT,                                    -- all-mountain/freestyle/freeride/women
  length TEXT,                                  -- 板长字符串 (e.g. '158cm')
  width TEXT,                                   -- 板宽
  flex INTEGER CHECK (flex BETWEEN 1 AND 10),   -- 硬度
  shape TEXT,                                   -- directional/twin/twin-tip
  camber TEXT,                                  -- camber/rocker/flat/hybrid

  -- 适配人群（推荐引擎输入）
  skill_level TEXT[],                           -- 数组 [beginner/intermediate/advanced/expert]
  terrain TEXT[],                               -- [groomed/park/powder/backcountry]
  height_range NUMERIC[],                       -- [min, max] cm
  weight_range NUMERIC[],                       -- [min, max] kg
  boot_size INTEGER[],                          -- [min, max] 欧码

  -- 使用情况
  condition TEXT DEFAULT 'good',                 -- new/like-new/good/fair
  usage_count INTEGER DEFAULT 0,                -- 累计出租次数
  age_years NUMERIC,                            -- 板子使用年限
  defects TEXT,                                 -- 已知瑕疵/使用痕迹描述

  -- 描述与图片
  description TEXT,
  features TEXT[],                              -- 特点标签数组
  images TEXT[],                                -- 图片 URL 数组（Phase 2 接 Supabase Storage）

  -- 租赁设置
  price_per_day INTEGER NOT NULL,
  deposit INTEGER NOT NULL DEFAULT 0,
  min_days INTEGER DEFAULT 1,
  max_days INTEGER DEFAULT 30,
  available BOOLEAN DEFAULT TRUE,
  shipping BOOLEAN DEFAULT FALSE,               -- 是否支持邮寄
  self_pickup BOOLEAN DEFAULT TRUE,             -- 是否支持自提

  -- 位置
  city TEXT,

  -- 评分
  rating NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- 状态
  status TEXT DEFAULT 'active',                 -- 'active' | 'paused' | 'removed'
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_listings_host ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_brand ON listings(brand) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_available ON listings(available, status);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_per_day) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);

-- GIN 索引支持 skill_level/terrain 数组查询
CREATE INDEX IF NOT EXISTS idx_listings_skill ON listings USING GIN(skill_level);
CREATE INDEX IF NOT EXISTS idx_listings_terrain ON listings USING GIN(terrain);

-- 全文搜索索引（中文+英文）
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings USING GIN(
  to_tsvector('simple', title || ' ' || COALESCE(brand, '') || ' ' || COALESCE(model, '') || ' ' || COALESCE(description, ''))
);

-- =============================================
-- 3. host_verifications 实名/店铺认证
-- =============================================
CREATE TABLE IF NOT EXISTS host_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,                            -- 'individual_id' | 'shop_license' | 'business_license'
  real_name TEXT,                                -- 真实姓名（仅管理员可见）
  id_number_hash TEXT,                           -- 证件号哈希（加密，不存明文）
  id_image_url TEXT,                             -- 证件照片 URL
  shop_name TEXT,                                -- 店铺名（如果是店铺）
  shop_license_url TEXT,
  status TEXT DEFAULT 'pending',                 -- 'pending' | 'approved' | 'rejected'
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_verifications_user ON host_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON host_verifications(status);

-- =============================================
-- 4. reviews 评价系统
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  reviewer_id UUID REFERENCES auth.users(id) NOT NULL,  -- 评价人（租客）
  reviewee_id UUID REFERENCES auth.users(id) NOT NULL,  -- 被评价人（卖家/平台）

  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  tags TEXT[],                                   -- ['装备描述准确', '沟通及时', '包装完好', '板子状态好']

  -- 子评分（可选）
  accuracy_rating INTEGER,                       -- 描述准确度 1-5
  communication_rating INTEGER,                  -- 沟通 1-5
  condition_rating INTEGER,                      -- 实际状况 1-5

  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'visible',                 -- 'visible' | 'hidden' | 'reported'

  host_reply TEXT,                               -- 卖家回复
  host_reply_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);

-- =============================================
-- 5. messages 站内信
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_listing ON messages(listing_id);

-- =============================================
-- 6. favorites 收藏夹
-- =============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, created_at DESC);

-- =============================================
-- 7. orders 扩展（加 host_id / listing_id / 押金状态）
-- =============================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id),
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS tracking_no TEXT,
  ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'pending',  -- pending/paid/refunded/forfeit
  ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deposit_refunded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS user_message TEXT;                        -- 租客留言

CREATE INDEX IF NOT EXISTS idx_orders_host ON orders(host_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);

-- =============================================
-- 8. RLS 行级安全策略
-- =============================================

-- listings RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active listings" ON listings;
CREATE POLICY "Public read active listings" ON listings
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Hosts can manage own listings" ON listings;
CREATE POLICY "Hosts can manage own listings" ON listings
  FOR ALL USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Admins manage all listings" ON listings;
CREATE POLICY "Admins manage all listings" ON listings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- reviews RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read visible reviews" ON reviews;
CREATE POLICY "Public read visible reviews" ON reviews
  FOR SELECT USING (status = 'visible');

DROP POLICY IF EXISTS "Reviewers write own reviews" ON reviews;
CREATE POLICY "Reviewers write own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Reviewees reply to reviews" ON reviews;
CREATE POLICY "Reviewees reply to reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewee_id);

-- messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own messages" ON messages;
CREATE POLICY "Users see own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users send messages" ON messages;
CREATE POLICY "Users send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- favorites RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON favorites;
CREATE POLICY "Users manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- host_verifications RLS（仅本人和管理员可见）
ALTER TABLE host_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own verifications" ON host_verifications;
CREATE POLICY "Users see own verifications" ON host_verifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users submit verifications" ON host_verifications;
CREATE POLICY "Users submit verifications" ON host_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins review verifications" ON host_verifications;
CREATE POLICY "Admins review verifications" ON host_verifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- 9. 触发器：listings 变更自动更新 host 统计
-- =============================================
CREATE OR REPLACE FUNCTION update_host_listing_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET listing_count = (SELECT COUNT(*) FROM listings WHERE host_id = NEW.host_id AND status = 'active')
    WHERE id = NEW.host_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET listing_count = (SELECT COUNT(*) FROM listings WHERE host_id = OLD.host_id AND status = 'active')
    WHERE id = OLD.host_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- 状态变化时重算两个 host（虽然一般不会跨 host 改）
    UPDATE profiles
    SET listing_count = (SELECT COUNT(*) FROM listings WHERE host_id = NEW.host_id AND status = 'active')
    WHERE id = NEW.host_id;
    IF OLD.host_id != NEW.host_id THEN
      UPDATE profiles
      SET listing_count = (SELECT COUNT(*) FROM listings WHERE host_id = OLD.host_id AND status = 'active')
      WHERE id = OLD.host_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trg_update_host_listing_count ON listings;
CREATE TRIGGER trg_update_host_listing_count
  AFTER INSERT OR UPDATE OR DELETE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_host_listing_count();

-- 触发器：review 提交时更新 listing 评分
CREATE OR REPLACE FUNCTION update_listing_rating()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'visible' THEN
    UPDATE listings
    SET
      rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE listing_id = NEW.listing_id AND status = 'visible'),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE listing_id = NEW.listing_id AND status = 'visible')
    WHERE id = NEW.listing_id;

    -- 同时更新 host 评分
    UPDATE profiles
    SET
      rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE reviewee_id = listings.host_id AND status = 'visible'),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = listings.host_id AND status = 'visible')
    FROM listings
    WHERE listings.id = NEW.listing_id
      AND profiles.id = listings.host_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trg_update_listing_rating ON reviews;
CREATE TRIGGER trg_update_listing_rating
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_listing_rating();

-- 触发器：订单完成时更新 host completed_rentals
CREATE OR REPLACE FUNCTION update_host_completed_rentals()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE profiles
    SET completed_rentals = completed_rentals + 1
    WHERE id = NEW.host_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trg_update_host_completed ON orders;
CREATE TRIGGER trg_update_host_completed
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_host_completed_rentals();

-- =============================================
-- 10. RPC：listing 浏览数自增
-- =============================================
CREATE OR REPLACE FUNCTION increment_listing_view(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings SET view_count = view_count + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =============================================
-- 11. handle_new_user 触发器：自动建 profile（SECURITY INVOKER）
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, display_name, city)
  VALUES (
    new.id,
    new.email,
    'renter',
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'city'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 12. seed 数据：示例 listings
-- =============================================
-- 注意：这里用 placeholder host_id，实际使用前需要在 Supabase 创建一个示例用户并替换。
-- 现阶段让 listings 通过 host_id 校验；可以临时禁用 trigger 或用 admin 用户。

-- 把当前 admin 用户的 listings 测试数据跳过（避免 RLS 报错）
-- 在你的第一个 host 用户注册后，运行：
--   INSERT INTO listings (host_id, title, brand, model, year, type, length, width, flex, shape, camber,
--                         skill_level, terrain, height_range, weight_range, boot_size,
--                         condition, price_per_day, deposit, city, description, features, images)
--   VALUES (...);

-- =============================================
-- 完成提示
-- =============================================
SELECT 'Phase 1 Schema 完成！' as status;
