# Changelog

冰雪之巅项目的版本变更记录。格式基于 [Keep a Changelog](https://keepachangelog.com/)。

## [Unreleased] - 进行中

### 计划中
- 真实支付接入（需商户号）
- 推荐系统 v2（ML 模型）
- 装备保险合作

---

## [1.2.1] - 2026-06-09 — E2E Bugfix

### 🐛 修复
- community.js 导入不存在的 `getCurrentUser` from api.js（改用 auth.js）— 修复 "CommunityUI is not defined" 阻断整个社区模块
- profile.js 同样错误的 `getCurrentUser` 导入路径 — 修复用户资料/我的发布/实名认证相关页面崩溃
- hamburger `aria-expanded` 点击后不切换 + `aria-label` 动态更新（"打开菜单" / "关闭菜单"）

### ✨ A11y
- 添加 skip-link "跳到主要内容"（定位 #app）
- 顶部 nav 加 `aria-label="主导航"`
- main 加 `tabindex="-1"` 让 skip-link 可焦点
- msg-btn 加 `aria-label="消息中心"`
- user-menu-btn 加 `aria-haspopup="menu" aria-expanded="false"`
- user-icon 加 `aria-hidden="true"`
- user-dropdown 加 `role="menu"`，子按钮 `role="menuitem"`
- updateAuthUI 注入 HTML 加 escapeHtml 防御 XSS

---

## [1.2.0] - 2026-06-08 — Phase 3：社区 + 实时 + Storage

### ✨ 新增
- 雪友社区（posts / comments / likes / 楼中楼）
- 4 类帖子：雪场攻略 / 装备讨论 / 问答 / 晒板
- 帖子 Realtime 订阅（实时新评论）
- Supabase Storage 图片上传 API（`uploadImage` / `deleteImage`）
- 个人资料编辑页（显示名 / 头像 / 城市 / 技能 / 简介）
- 雪友社区入口（导航栏 + 首页）
- 站内信 Realtime 订阅（`subscribeToMessages`）

### 🔒 安全
- 所有 innerHTML 注入点添加 `escapeHtml`（order.js / admin.js / app.js / recommendation.js / host.js / trust.js / community.js）
- 模块暴露到 window（App / ProductFilter / Auth / OrderFlow / OrderHistory / Cart / HostUI / TrustUI / CommunityUI / ProfileUI）

### 🌐 SEO
- meta description / keywords / author / robots / canonical
- Open Graph（type / title / description / url / image / locale）
- Twitter Card
- JSON-LD 结构化数据（WebSite + Organization + SearchAction）
- sitemap.xml
- robots.txt
- 移动端 theme-color
- inline SVG favicon

### ♿ A11y
- 全局焦点环（替代 `outline:none`）
- 关键按钮 `aria-label` / `aria-expanded` / `aria-controls`
- 导航 `role="menubar"` / `menuitem`
- 购物车计数 `aria-live="polite"`
- 所有 button 显式 `type="button"`

### 🗄️ Schema
- `posts` / `post_comments` / `post_likes` / `post_favorites`
- `listing_images`
- 触发器：post 计数自动维护 / 浏览数自增
- Storage bucket `listings`（公开，10MB / 张）
- RLS：posts / comments / likes / favorites / images

---

## [1.1.0] - 2026-06-05 — Phase 2：信任体系

### ✨ 新增
- 评价系统（5 星 + 3 项子评分 + 标签 + 卖家回复 + 匿名）
- 评价区块嵌入产品详情页（评分分布柱状图 + 列表）
- 站内信（发送 / 会话 / 收件箱 / 未读数）
- 实名认证 / 店铺认证表单
- 发布者信息卡（详情页，含头像 / 认证标识 / 评分 / 成交数 / 联系按钮）
- 消息入口 + 未读红点
- 用户菜单：我的发布 / 编辑资料 / 实名认证 / 退出

### 🎯 推荐引擎升级
- 融合 host 评分（verified +8、rating ≥ 4.5 +5、completed_rentals ≥ 10 +3）
- 城市同城加分（+5）
- "实名认证" / "同城" / "资深发布者" 推荐理由

### 🗄️ Schema（无新增表）
- 利用 phase1-schema.sql 的 `reviews` / `messages` 表

---

## [1.0.0] - 2026-06-05 — Phase 1：双边平台

### ✨ 新增
- C2C / B2C 双边租赁平台
- 发布者入驻（个人 / 雪具店角色选择）
- 雪具发布动态表单（20+ 字段）
- 我的发布管理（编辑 / 下架）
- 用户发布 listings 与平台 PRODUCTS 合并展示
- 雪具详情支持（host 信息 + 评价）
- 角色切换（renter / host / both）
- 导航栏：发布雪具主按钮（绿色）

### 🗄️ Schema
- `listings` 表（核心新增，30+ 字段）
- `host_verifications` / `reviews` / `messages` / `favorites`
- 触发器：host 统计自动维护 / listing 评分自动更新
- RLS：public 读 / host 改自己 / admin 管全部

---

## [0.5.0] - 2026-05-24 — 智能推荐 + 安全

### ✨ 新增
- 智能推荐引擎（规则引擎，技能 + 地形 + 身材 + 性别 + 城市）
- 板长计算器（身高 + 体重 + 地形微调）
- 3 题推荐问卷（技能 / 地形 / 身材）
- 推荐结果 Top 3 + 匹配理由
- 产品列表 tab：全部 / 为你推荐 / 热门 / 合适尺寸
- 产品详情页：推荐度进度条 / 完整规格 / 特点标签
- 12 款产品元数据补全（skillLevel / terrain / heightRange / weightRange / bootSize / shape / camber）

### 🔒 安全修复（4.5/10 → 8.4/10）
- C1: App / ProductFilter / Auth / OrderFlow / OrderHistory 暴露到 window
- C2: supabase-client.js 改用 `createClient()` 直接创建（避免 CDN 时序）
- C3: 全项目添加 `escapeHtml`（XSS 防御）
- C4: localStorage 旧产品数据自动迁移回填新字段
- C5: 板长计算器添加边界校验（体重负数 / 身高超界）
- Cart is not defined 修复（`window.Cart = Cart`）
- M1: 删假压缩函数（`compress/decompress` 改恒等映射，避免破坏多空格数据）
- M2: 问卷重入状态恢复
- M3: suitable tab 空状态 + 降级文案
- m1: `substr` → `slice`
- m2: 标签文案 "已登录" → "已设置偏好"
- m3 / m4: 私有约定 + ID 唯一性

---

## [0.1.0] - 2026-05-22 — MVP

### ✨ 初版
- 12 款单板产品展示 + 筛选
- 4 档套餐（2/3/5/7 天）
- 购物车 + 4 步结账
- Supabase 邮箱密码注册 / 登录
- 订单管理
- 管理后台
- 基础 RLS
