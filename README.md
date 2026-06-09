# 冰雪之巅 / Snowboard Rental

> 面向**中阶 / 高阶滑雪爱好者**的单板装备**双边（C2C + B2C）租赁平台**。  
> 个人和雪具店都可以发布雪具，按技能 / 地形 / 身材智能匹配，押金担保 + 信誉体系透明 + 雪友社区。

线上站点：https://kid221b.github.io/snowboard-rentalll/

---

## 🎯 项目目标

滑雪技术的进步导致**中阶 / 高阶玩家**对雪具有持续升级需求，但他们面对：
- 线下雪具店**信息不透明**（型号 / 板型 / 适配人群）
- 二手市场**专业参数不完整**（硬度 / 板底 / 适配身高 / 使用痕迹）
- 缺乏**可信的租借双方**匹配平台

冰雪之巅解决：**专业参数化** + **智能推荐** + **信誉体系** + **雪友社区**。

---

## 🏗️ 技术栈

| 层 | 选型 |
|---|------|
| 前端 | 纯原生 HTML + CSS + JavaScript（无框架） |
| 模块 | ES Modules |
| 后端 | Supabase（BaaS：Auth + PostgreSQL + Realtime + Storage） |
| 部署 | GitHub Pages（静态托管，自动 deploy） |
| CDN | jsDelivr（Supabase JS SDK） |

---

## 📁 目录结构

```
snowboard-rental/
├── index.html              # 入口（包含 SEO meta、JSON-LD）
├── css/
│   └── styles.css          # 全局样式（含 Phase 1-3 模块化扩展）
├── js/
│   ├── supabase-client.js  # Supabase 客户端
│   ├── data.js             # 内置产品数据 + listings 缓存
│   ├── api.js              # 全部 Supabase CRUD（含 listings/reviews/messages/posts）
│   ├── auth.js             # 认证模块
│   ├── app.js              # 主应用（导航 / 详情 / 筛选 / 购物车）
│   ├── cart.js             # 购物车
│   ├── order.js            # 订单流程
│   ├── admin.js            # 管理后台
│   ├── recommendation.js   # 智能推荐 + 板长计算
│   ├── host.js             # 发布者入驻 + 雪具发布
│   ├── trust.js            # 评价 / 站内信 / 实名认证
│   ├── community.js        # 雪友社区（posts / comments / likes）
│   └── profile.js          # 个人资料编辑
├── supabase-init.sql       # 初始 schema（profiles / products / orders / accessories）
├── phase1-schema.sql       # 升级：listings / reviews / messages / favorites / host_verifications
├── phase3-schema.sql       # 升级：posts / comments / likes / Storage bucket / Realtime
├── sitemap.xml             # SEO 站点地图
├── robots.txt              # 爬虫规则
└── README.md
```

---

## 🗄️ 数据库 Schema

### Core 表（supabase-init.sql）
- `profiles` — 用户信息
- `products` — 平台内置 12 款单板
- `accessories` — 配件
- `orders` — 订单

### Phase 1（双边平台）
- `listings` — **用户发布的雪具**（核心新增）
- `reviews` — 评价
- `messages` — 站内信
- `favorites` — 收藏
- `host_verifications` — 实名/店铺认证

### Phase 3（社区 + 实时）
- `posts` — 雪场攻略 / 装备讨论
- `post_comments` — 评论 / 楼中楼
- `post_likes` — 点赞
- `post_favorites` — 收藏
- `listing_images` — 规范化图片存储

### Storage Buckets
- `listings` — 雪具图片（10MB / 张，公开）

### RLS
所有表启用 Row Level Security：
- `listings` — 公开读 active 状态，host 只能改自己的
- `reviews` — 公开读，reviewer 才能写
- `messages` — 仅收发方可见
- `posts` — 公开读 published，author 改自己

---

## ✨ 核心功能

### 1. 智能推荐 + 板长计算
3 题问卷（技能 + 地形 + 身材）→ 规则引擎打分 → Top 3 推荐 + 推荐板长。

推荐算法输入：技能水平（4 档）、地形（4 类）、身高 / 体重 / 鞋码、性别、所在城市。  
输出：评分 + 匹配理由（如"适合中高级水平 + 同城北京"）。

### 2. C2C / B2C 双边平台
任何用户可成为 host（个人 / 雪具店），发布雪具：
- 完整动态表单（标题 / 品牌 / 型号 / 年份 / 类型 / 板长 / 板宽 / 硬度 / 板型 / 板底 / 适配人群 / 使用情况 / 描述 / 价格 / 押金 / 租期 / 交付方式 / 城市 / 图片）
- 实名认证 → 标识 ✓ 徽章
- 我的发布管理（编辑 / 下架）

### 3. 信任体系
- 评价（5 星 + 3 项子评分 + 标签 + 文字 + 匿名选项）
- 评价自动计算 listing 综合分
- 站内信（Realtime 实时推送）
- 实名 / 店铺认证（待管理员审核）

### 4. 雪友社区
- 4 类帖子：雪场攻略 / 装备讨论 / 问答 / 晒板
- 评论 + 楼中楼
- 点赞
- Realtime 实时新评论

### 5. SEO + A11y
- meta description / OG / Twitter Card / JSON-LD
- sitemap.xml / robots.txt
- ARIA 属性 / 焦点环 / 键盘导航
- 颜色对比度调整

---

## 🚀 本地开发

### 前置
- 一个 Supabase 项目（`https://supabase.com`）
- 现代浏览器（Chrome / Edge / Firefox）

### Supabase 配置
1. 创建项目
2. SQL Editor 依次跑：
   - `supabase-init.sql`（初始 schema）
   - `phase1-schema.sql`（Phase 1 升级）
   - `phase3-schema.sql`（Phase 3 升级 + Storage bucket）
3. Dashboard → Database → Replication 启用 realtime for `messages` / `posts` / `post_comments`
4. Storage → `listings` bucket 已自动创建，设为 public

### Supabase 配置更新
编辑 `js/supabase-client.js` 替换 `supabaseUrl` 和 `supabaseKey`。

```js
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY';
```

### 启动本地服务器
```bash
# Python 3
python -m http.server 8000

# 或 Node
npx http-server -p 8000
```

访问 `http://localhost:8000`。

---

## 📦 部署

推送到 `main` 分支即自动部署到 GitHub Pages（`.github/workflows/` 自行配置）。

```bash
git push origin main
```

如果 GitHub 443 端口被屏蔽，用 HTTP/1.0：
```bash
git -c http.version=HTTP/1.0 push origin main
```

---

## 🛣️ 路线图

### ✅ Phase 0（已完成）
- 安全修复（XSS / IDOR / 字段注入 / 错误泄露 / 模块暴露）
- 智能推荐 + 板长计算 + 产品参数补全

### ✅ Phase 1（已完成）
- Schema 改造（listings / reviews / messages）
- 发布者入驻 + 雪具发布表单
- 用户发布商品与平台产品合并展示

### ✅ Phase 2（已完成）
- 评价系统（含子评分 / 标签 / 卖家回复）
- 站内信（Realtime）
- 实名 / 店铺认证流程

### ✅ Phase 3（已完成）
- 雪友社区（posts / comments / likes）
- Supabase Storage 图片上传
- Realtime 订阅
- 个人资料编辑
- SEO 完整化（meta / OG / sitemap / JSON-LD）
- A11y Quick Wins

### ✅ E2E 测试（2026-06-09，12 模块，Playwright MCP 自动化）
- ✅ 首页 / 产品 / 详情 / 购物车 / 结账 / 智能推荐 / SEO — 全部通过
- ✅ 订单 tab / A11y 焦点环 / 移动汉堡 / keyboard nav — 通过
- 🐛 已修复：community.js 错误导入、profile.js 错误导入、hamburger aria-expanded 不更新
- ⚠️ 待用户侧：Supabase Auth 500 / listings 404（依赖 SQL Editor 跑 phase1-schema.sql）

### ⏳ Phase 4（待办）
- 真实支付接入（需商户号）
- 推荐系统 v2（ML 模型）
- 装备保险合作
- 雪场天气数据集成
- 移动端 App

---

## 🤝 贡献

本项目以单兵模式开发，质量优先。  
欢迎反馈、bug 报告、功能建议。

## 📄 许可

MIT
