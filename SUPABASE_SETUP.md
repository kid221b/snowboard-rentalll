# Supabase 部署指南

冰雪之巅项目 Phase 0/1/2/3/1.2.1 全部前端代码已经推送（`fef0474`），但**数据库 schema 需要手动跑 SQL**。这是线上站能完整跑起来的最后一步。

预计耗时：**10-15 分钟**（3 个 SQL 文件 + 后台配置）。

---

## 前提

- 一个 Supabase 项目（https://supabase.com 创建一个免费的）
- 项目 URL 形如 `https://xxxxxxxxxxxx.supabase.co`
- anon public key（用于替换前端代码）

---

## 步骤 1 — 创建项目

1. 打开 https://supabase.com → New project
2. 选最近的 Region（推荐 Singapore / Tokyo 适合中国）
3. 强密码记好（**这是数据库密码，不是 anon key**）
4. 等 1-2 分钟项目初始化

---

## 步骤 2 — 跑 SQL（按顺序，三个文件）

路径：Supabase Dashboard → 左侧 **SQL Editor** → **New query**

### 2.1 跑 `supabase-init.sql`

```bash
# 复制下面的命令在 PowerShell 读取文件内容
Get-Content "D:\ai project\snowboard-rental\supabase-init.sql" -Raw
```

- 全选输出 → 粘贴到 SQL Editor → Ctrl+Enter 运行
- ✅ 看到 4 张表：`profiles` / `products` / `accessories` / `orders`
- ❌ 如果报错：通常是 RLS 重复定义，删掉旧的 `DROP POLICY IF EXISTS ...` 重跑

### 2.2 跑 `phase1-schema.sql`（双边平台 + 信任体系）

```bash
Get-Content "D:\ai project\snowboard-rental\phase1-schema.sql" -Raw
```

- 12 段，包含 listings / host_verifications / reviews / messages / favorites + RLS + 触发器 + seed
- ✅ 最后 3 行应无 error
- ⚠️ seed 部分会插 3 条示例 listings（不影响生产）

### 2.3 跑 `phase3-schema.sql`（社区 + 实时 + Storage）

```bash
Get-Content "D:\ai project\snowboard-rental\phase3-schema.sql" -Raw
```

- 11 段，包含 posts / comments / likes / favorites / images + RLS + Storage bucket + Realtime 配置
- ✅ 最后一段会看到 1 个新 bucket `listings`（公开）

---

## 步骤 3 — 启用 Realtime 订阅

路径：Dashboard → **Database** → **Replication** → 找到以下表，确认 `Source` 列有 `supabase_realtime`：

| 表 | 说明 |
|---|---|
| `messages` | 站内信实时推送 |
| `posts` | 社区帖子列表实时 |
| `post_comments` | 评论实时 |

如果是空的，点 "0 sources" → 在弹出框里勾选 `supabase_realtime` → Save。

> ⚠️ 跳过这步不会报错，但**站内信和评论不会自动推送**（需要手动刷新页面）

---

## 步骤 4 — Storage bucket 设为 Public

路径：Dashboard → **Storage** → `listings`

- 如果不存在：会自动由 phase3-schema 创建
- 点 bucket → **Configuration** → Public bucket 开关 → ON
- File size limit：10 MB（默认应该对的）

> ⚠️ 不设 public → 上传的图片会 403，发布雪具和发帖子的图片功能不可用

---

## 步骤 5 — 注册测试账号（验证注册可用）

1. Dashboard → **Authentication** → **Providers** → Email：确认 **Enable** 打开
2. 在自己项目网站点 "登录/注册" 弹窗
3. 用真实邮箱注册（dev 环境 Supabase 经常拦截 `test@example.com` 这种假域名）
4. 收确认邮件 → 点链接激活

> ⚠️ 如果还报 500：检查 SMTP 配置（Authentication → Email Templates → 看错误日志）

---

## 步骤 6 — 替换前端 Supabase 凭证（可选，仅在用自己的项目时）

默认前端用的是 `https://tcfauscqmfaimucuxrlm.supabase.co`，是项目 demo 用的公开 anon key。

如果用**自己的 Supabase 项目**，编辑：

```js
// D:\ai project\snowboard-rental\js\supabase-client.js
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY';  // Dashboard → Settings → API
```

然后 commit + push → GitHub Pages 自动 deploy。

---

## 跑完验证清单

| 项 | 命令 / 操作 | 预期 |
|---|---|---|
| ✅ SQL 跑完 | Dashboard → Table Editor | 看到 10+ 张表 |
| ✅ Realtime 启用 | Database → Replication | messages/posts/post_comments 有 source |
| ✅ Storage public | Storage → listings → Configuration | 开关 ON |
| ✅ 注册可用 | 站点点注册 | 收邮件激活 |
| ✅ 雪友社区 | 站点点 "雪友社区" | 看到 5 个 tab + 示例帖子 |
| ✅ 发布雪具 | 用户菜单 → 成为发布者 | 弹入驻表单 |

---

## 常见错误速查

| 错误 | 原因 | 修法 |
|---|---|---|
| `relation "auth.users" does not exist` | 没装 Supabase Auth 扩展 | 创建新项目（auth schema 默认存在） |
| `policy ... already exists` | 重复跑 SQL | 在 SQL Editor 顶部加 `DROP POLICY IF EXISTS <name> ON <table>;` |
| `permission denied for schema public` | 数据库密码错误 | Settings → Database → Reset password |
| `storage.objects ... not found` | phase3-schema 没跑完 | 重跑 phase3-schema |
| `/auth/v1/signup 500` | SMTP 没配 | Authentication → SMTP Settings → 配 SendGrid / Mailgun / Resend |

---

## 跑完告诉我

我帮你做这些：
- 验证线上站所有模块（雪友社区/我的发布/评价/站内信）能跑通
- 提交一份"上线就绪"确认
- 给你写运维 checklist（每日/每周）

如果遇到错误卡住，把 SQL Editor 的红色报错截给我，秒解。
