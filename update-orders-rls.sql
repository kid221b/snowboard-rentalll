-- =============================================
-- 更新订单表 RLS 策略
-- 目的：用户只能查看和修改自己的订单，保护隐私
-- =============================================

-- 删除旧的公开访问策略
DROP POLICY IF EXISTS "Public can view orders" ON orders;
DROP POLICY IF EXISTS "Public can update orders" ON orders;

-- 创建新的用户专属策略
-- 查看：游客(user_id=null) 或 登录用户只能看自己的
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

-- 更新：用户只能修改自己的订单
CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

-- 插入：保持公开（游客也能下单）
-- WITH CHECK 不需要，因为游客 user_id 为 NULL，auth.uid() = NULL 不会匹配任何行
-- 所以游客的订单插入靠的是 INSERT 策略本身（不是 SELECT/UPDATE）
-- 但实际上 INSERT WITH CHECK (true) 允许任何人插入，所以游客下单可以成功