-- =============================================
-- 冰雪之巅 - 单板租赁平台 Supabase 初始化脚本
-- =============================================

-- 1. 创建 profiles 表（用户信息）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 products 表（单板产品）
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  type TEXT NOT NULL,
  length TEXT NOT NULL,
  width TEXT NOT NULL,
  flex INTEGER NOT NULL,
  price INTEGER NOT NULL,
  deposit INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sales INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建 accessories 表（配件）
CREATE TABLE IF NOT EXISTS accessories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  deposit INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建 orders 表（订单）
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  product_id TEXT NOT NULL,
  accessory_ids TEXT[],
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  deposit INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 启用 RLS（行级安全策略）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 6. 创建访问策略
-- 产品和配件：公开读取
CREATE POLICY "Public can read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public can read accessories" ON accessories FOR SELECT USING (true);

-- 订单：登录用户只能查自己的订单，公开插入（游客可下单），但只能更新自己的
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

-- 用户信息：用户只能操作自己的
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 7. 自动创建 profile 触发器（用户注册时自动创建）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 8. 插入初始产品数据（12款单板）
-- =============================================

INSERT INTO products (id, name, brand, type, length, width, flex, price, deposit, stock, sales, featured, description) VALUES
('sb001', 'Burton Custom X 158', 'Burton', 'all-mountain', '158cm', '25.5cm', 7, 199, 500, 8, 156, true, 'Burton旗舰款全能板，采用碳纤维增强技术，提供卓越的操控性。'),
('sb002', 'Rossignol Templar HP', 'Rossignol', 'all-mountain', '156cm', '25.2cm', 6, 168, 400, 12, 89, true, '法国品牌经典全能板，拥有出色的稳定性和容错率。'),
('sb003', 'Jones Ultracraft', 'Jones', 'freeride', '162cm', '26.0cm', 8, 248, 600, 5, 67, true, '专为深粉雪设计，超宽板腰提供更大的浮力。'),
('sb004', 'Never Summer Proto', 'Never Summer', 'freestyle', '154cm', '24.8cm', 5, 188, 450, 9, 112, false, '经典公园板，拥有均衡的弹性配置。'),
('sb005', 'GNU Grace女士板', 'GNU', 'women', '146cm', '23.5cm', 4, 148, 350, 15, 203, true, '专为女性设计的公园板，轻量化设计。'),
('sb006', 'CAPiTA Birds of Prey', 'CAPiTA', 'freeride', '160cm', '26.2cm', 8, 228, 550, 6, 78, false, '专业高山板，适合陡峭地形和粉雪。'),
('sb007', 'Salomon Assassin', 'Salomon', 'all-mountain', '157cm', '25.5cm', 6, 178, 420, 10, 95, false, ' Salomon全能板，均衡性能适合各种地形。'),
('sb008', 'Ride Warpig', 'Ride', 'freestyle', '151cm', '26.5cm', 5, 158, 380, 8, 134, true, '短宽设计，公园和野雪两相宜。'),
('sb009', 'Arbor Coda', 'Arbor', 'all-mountain', '159cm', '25.8cm', 7, 198, 480, 7, 86, false, '环保材料全能板，稳定性极佳。'),
('sb010', 'Bataleon Evil Twin', 'Bataleon', 'freestyle', '155cm', '25.0cm', 5, 188, 450, 11, 167, true, '3D板底技术，容错率极高的公园板。'),
('sb011', 'Lib Tech Skate Banana', 'Lib Tech', 'all-mountain', '153cm', '25.2cm', 4, 168, 400, 14, 198, false, 'Magne-Traction板刃技术，新手友好。'),
('sb012', 'Yes Greats', 'Yes', 'freeride', '161cm', '26.0cm', 7, 218, 520, 6, 52, false, '专业级高山板，极佳的粉雪表现。');

-- =============================================
-- 9. 插入配件数据（6种）
-- =============================================

INSERT INTO accessories (id, name, price, deposit, stock) VALUES
('acc001', '固定器套装', 30, 100, 20),
('acc002', '雪鞋租赁', 40, 200, 25),
('acc003', '头盔护具套装', 25, 150, 30),
('acc004', '雪镜', 15, 80, 40),
('acc005', '护脸面罩', 10, 30, 50),
('acc006', '雪具包', 20, 100, 15);

-- 完成！
SELECT '数据库初始化完成！' as status;