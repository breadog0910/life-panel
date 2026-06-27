# 🏠 人生面板 (Life Panel)

> 一个人生管理 Web 应用 + 桌面悬浮伙伴，支持手机 / 电脑 / 桌面悬浮窗同步。

**核心闭环**：桌面悬浮窗快捷捕获（计时、复盘）→ Web 面板深度整理回顾（笔记、计划、记账），并由 AI 自动为笔记打标签、分类、摘要。

## ✨ 功能

| 模块 | 说明 |
|------|------|
| 🏠 今日概览 | 问候条 + 心情 + 番茄钟 + 快捷复盘 + 日程卡片 |
| 📝 笔记灵感库 | 统一 entries（文本/图片/链接/视频/笔记），心情/天气/标签 + 图片上传 + AI 自动标签·分类·摘要 + 软删除 |
| 🗺️ 计划中心 | 三合一工作台，统一原「时间 / 目标 / 提醒」三模块 |
| └ 技能树 | React Flow 画布：愿望/目标/任务节点 · 多对多连线 · 子树折叠 · 板块分类 + 10 色调色板 · 拖拽定位 |
| └ 专注计时 | 倒计时 / 正计时，完成后挂到技能树节点或新建节点，可记复盘收获并选择存入笔记库 |
| └ 日历 | 月历热力图 + 当日详情 · 就地编辑复盘 · 手动「记一笔」· 记录删除 |
| └ 提醒 / 备忘 | 侧边抽屉，定时提醒 + 重复规则 + 开关切换 |
| 💰 记账 | 收支流水 + 日期分组账本 + 月度汇总 |
| 📈 数据统计 | 心情 / 时间 / 收支图表（跨表聚合 + CSS 柱状图） |
| 🤖 AI 智能设置 | 6 家模型供应商（DeepSeek / 通义千问 / 智谱 GLM / 豆包 / OpenAI / Anthropic）· API Key 配置 · 自动标签/分类/摘要开关 |
| 🐱 桌面伙伴 | Python tkinter 透明悬浮窗 + Emoji/图片/GIF 三模式 |
| 🎨 伙伴设置 | Web 面板设置角色 / 昵称 / 动画 + 一键启停 |

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| **Web 前端** | Next.js 14（App Router）· React 18 · TypeScript · Tailwind CSS 4 · lucide-react |
| **画布** | @xyflow/react v12（技能树节点 + 自定义连线） |
| **后端 / 数据库** | Supabase（PostgreSQL + Auth + Realtime + Storage + RLS） |
| **AI** | OpenAI 兼容接口 + Anthropic，多供应商可切换（`/api/ai/process`） |
| **桌面悬浮窗** | Python 3 + tkinter + Pillow（透明窗口 + GIF 帧播放） |
| **部署** | Vercel（Web）· 本地 Python（悬浮窗） |

## 📁 目录结构

```
个人学习面板/
├── desktop/                       # Python 桌面悬浮窗
│   ├── companion.py               # 主程序 (tkinter)
│   ├── companion_config.json      # 桥接配置
│   └── companion_position.json    # 窗口位置
├── src/
│   ├── app/
│   │   ├── (main)/                # 主面板 (需登录)
│   │   │   ├── page.tsx           # 今日概览
│   │   │   ├── diary/             # 笔记灵感库
│   │   │   ├── plan/              # 计划中心 (技能树 / 专注计时 / 日历)
│   │   │   ├── finance/           # 记账
│   │   │   ├── stats/             # 数据统计
│   │   │   ├── partner/           # 伙伴设置
│   │   │   └── settings/ai/       # AI 智能设置
│   │   ├── companion/             # 悬浮伙伴页面
│   │   └── api/
│   │       ├── ai/process/        # AI 内容处理接口
│   │       └── partner/           # 伙伴配置 / 上传 / 桥接接口
│   ├── components/
│   │   ├── plan/                  # 技能树 / 专注计时 / 日历
│   │   ├── plan-node-card.tsx     # 技能树节点卡片
│   │   ├── reminder-drawer.tsx    # 提醒抽屉
│   │   ├── image-upload.tsx       # 图片上传
│   │   └── ...                    # 导航、概览卡片等共享组件
│   ├── lib/                       # Supabase 客户端 · Auth · AI 服务 · Storage
│   └── types/                     # TypeScript 类型
├── supabase/
│   ├── schema.sql                 # 全量建表脚本
│   └── migrate-*.sql              # 增量迁移脚本（见下方说明）
├── DEVLOG.md                      # 开发者日志
└── companion-start.bat            # Windows 悬浮窗启动脚本
```

## 🚀 本地运行

### 前置条件

- Node.js 18+ · npm
- Python 3.12+ · pip（仅桌面悬浮窗需要）
- Supabase 项目

### 安装

```bash
# 克隆项目
git clone https://github.com/breadog0910/life-panel.git && cd life-panel

# 安装 Node 依赖
npm install

# 安装 Python 依赖（桌面悬浮窗）
pip install Pillow

# 配置环境变量：在项目根目录创建 .env.local
```

`.env.local` 需填入：

```bash
NEXT_PUBLIC_SUPABASE_URL=你的-supabase-项目-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的-supabase-anon-key
```

### 数据库初始化

在 Supabase SQL Editor 中执行：

1. `supabase/schema.sql` — 全量建表（entries / time_entries / transactions / partner_config / ai_settings 等）
2. 按顺序执行增量迁移脚本：
   - `migrate-entries.sql` — 笔记灵感库
   - `migrate-storage.md` — 图片存储桶 `entry_media`（按文档在 Storage 建桶并配 RLS）
   - `migrate-plan-center.sql` → `migrate-plan-center-v2.sql` — 计划中心（plan_nodes / plan_categories）
   - `migrate-plan-edges.sql` — 技能树多对多连线（plan_edges）
   - `migrate-focus-reflection.sql` — 专注复盘字段（time_entries.note）

> ⚠️ 迁移脚本需按上述顺序执行；表/列均使用 `IF NOT EXISTS`，可重复运行。

### 启动

```bash
# Web 面板
npm run dev              # → http://localhost:3000

# 桌面悬浮窗
npm run companion        # 或双击 companion-start.bat

# Web + 悬浮窗一起启
npm run electron:dev
```

## 🎨 配色

晴空蓝系：

- 主色 `#42a5f5` · 深色 `#1e88e5` / `#1565c0`
- 背景 `#f5f9ff` · 卡片 `#ffffff`
- 文字 `#1a3a5c` / `#5c8dc9`
- 点缀 `#fff9c4` · 边框 `#e3f2fd`

## 📄 许可

MIT
