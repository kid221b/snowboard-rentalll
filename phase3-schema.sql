-- =============================================
-- 冰雪之巅 Phase 3：社区 + 实时 + Storage
-- 运行位置：Supabase Dashboard → SQL Editor
-- 前置：先跑过 phase1-schema.sql
-- =============================================

-- =============================================
-- 1. posts 雪场攻略 / 装备讨论
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL DEFAULT 'discussion',  -- 'resort' (雪场攻略) | 'gear' (装备讨论) | 'qna' (问答) | 'showcase' (晒板)
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT[],
  tags TEXT[],
  -- 关联
  resort_name TEXT,                 -- 雪场名（resort 类型必填）
  resort_location TEXT,             -- 雪场地点
  skill_level TEXT,                 -- 攻略适用水平
  -- 关联商品
  related_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  -- 统计
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  -- 状态
  status TEXT DEFAULT 'published',  -- 'published' | 'hidden' | 'draft'
  is_pinned BOOLEAN DEFAULT FALSE,
  -- 时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category, created_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_posts_resort ON posts(resort_name) WHERE category = 'resort';

-- 全文搜索
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(
  to_tsvector('simple', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(resort_name, ''))
);

-- =============================================
-- 2. post_comments 评论 / 楼中楼
-- =============================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,  -- 楼中楼
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'visible',  -- 'visible' | 'hidden'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON post_comments(parent_id);

-- =============================================
-- 3. post_likes 点赞
-- =============================================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON post_likes(user_id, created_at DESC);

-- =============================================
-- 4. post_favorites 收藏
-- =============================================
CREATE TABLE IF NOT EXISTS post_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =============================================
-- 5. listing_images 表（规范化图片存储）
-- =============================================
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,         -- Supabase Storage 路径
  public_url TEXT NOT NULL,           -- 公共 URL
  position INTEGER DEFAULT 0,         -- 排序
  is_cover BOOLEAN DEFAULT FALSE,    -- 是否封面
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images(listing_id, position);

-- =============================================
-- 6. 触发器：post 计数维护
-- =============================================
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_favorites' THEN
      UPDATE posts SET favorite_count = favorite_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_favorites' THEN
      UPDATE posts SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trg_post_likes_count ON post_likes;
CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS trg_post_favorites_count ON post_favorites;
CREATE TRIGGER trg_post_favorites_count
  AFTER INSERT OR DELETE ON post_favorites
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS trg_post_comments_count ON post_comments;
CREATE TRIGGER trg_post_comments_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- =============================================
-- 7. 触发器：reviews 图片更新 listing 图片
-- =============================================
-- （可选：评价也能传图，复用 listing_images 表）
ALTER TABLE listing_images
  ADD COLUMN IF NOT EXISTS review_id UUID REFERENCES reviews(id) ON DELETE CASCADE;

-- =============================================
-- 8. RLS 策略
-- =============================================

-- posts RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published posts" ON posts;
CREATE POLICY "Public read published posts" ON posts
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Authors manage own posts" ON posts;
CREATE POLICY "Authors manage own posts" ON posts
  FOR ALL USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins manage posts" ON posts;
CREATE POLICY "Admins manage posts" ON posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- post_comments RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read visible comments" ON post_comments;
CREATE POLICY "Public read visible comments" ON post_comments
  FOR SELECT USING (status = 'visible');

DROP POLICY IF EXISTS "Authors write comments" ON post_comments;
CREATE POLICY "Authors write comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors delete own comments" ON post_comments;
CREATE POLICY "Authors delete own comments" ON post_comments
  FOR DELETE USING (auth.uid() = author_id);

-- post_likes RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read likes" ON post_likes;
CREATE POLICY "Public read likes" ON post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own likes" ON post_likes;
CREATE POLICY "Users manage own likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- post_favorites RLS
ALTER TABLE post_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON post_favorites;
CREATE POLICY "Users manage own favorites" ON post_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- listing_images RLS
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read listing images" ON listing_images;
CREATE POLICY "Public read listing images" ON listing_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts manage own listing images" ON listing_images;
CREATE POLICY "Hosts manage own listing images" ON listing_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_images.listing_id AND host_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_images.listing_id AND host_id = auth.uid())
  );

-- =============================================
-- 9. Storage Bucket：listings（用于存雪具图片）
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listings',
  'listings',
  TRUE,                                  -- 公开桶
  10 * 1024 * 1024,                      -- 10MB 单文件上限
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS：允许已登录用户上传到自己的目录
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listings' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update own listing images" ON storage.objects;
CREATE POLICY "Users can update own listing images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))
  );

DROP POLICY IF EXISTS "Users can delete own listing images" ON storage.objects;
CREATE POLICY "Users can delete own listing images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))
  );

-- =============================================
-- 10. Realtime 订阅配置
-- =============================================
-- Supabase Realtime 需在 Dashboard 启用 messages / posts / post_comments
-- 这里只是注释提示，启用需在 Dashboard → Database → Replication 设置
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages, posts, post_comments;

-- =============================================
-- 10.5 RPC：post 浏览数自增
-- =============================================
CREATE OR REPLACE FUNCTION increment_post_view(p_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =============================================
-- 11. seed 数据：示例雪场攻略
-- =============================================
-- 注意：需要至少一个 host 用户存在，posts.author_id 引用真实用户
-- 示例（请把 <YOUR_USER_ID> 替换为你的真实用户 UUID）：
--
-- INSERT INTO posts (author_id, category, title, content, resort_name, skill_level)
-- VALUES (
--   '<YOUR_USER_ID>',
--   'resort',
--   '将军山滑雪场全攻略（2026 雪季）',
--   '雪场位于新疆阿勒泰，12 月-3 月是最佳雪季。雪道总长 40km，最长雪道 5km...',
--   '将军山滑雪场',
--   'intermediate'
-- );

SELECT 'Phase 3 Schema 完成！' as status;
