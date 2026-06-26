# 🏠 人生面板 (Life Panel)

> 一个人生管理 Web 应用 + 桌面悬浮伙伴，支持手机/电脑同步。

**核心闭环**：桌面悬浮窗快捷捕获（计时、复盘）→ Web 面板深度整理回顾（日记、记账、规划）。

## ✨ 功能

| 模块 | 说明 | 状态 |
|------|------|:----:|
| 🏠 今日概览 | 问候条 + 心情 + 番茄钟 + 快捷复盘 + 日程 | ✅ |
| 📝 日记 | 每日日记 + 心情/天气/标签 + 软删除 | ✅ |
| ⏱️ 时间安排 | 日程记录 + 番茄钟计时器 + 标签 | ✅ |
| 📊 复盘汇总 | 悬浮窗/网页复盘展示 + 实时订阅 | ✅ |
| 💰 记账 | 收支流水 + 日期分组账本 + 月度汇总 | ✅ |
| 🎯 目标规划 | 目标 CRUD + 进度条 + 状态筛选 + 截止日 | ✅ |
| 🔔 提醒管理 | 定时提醒 + 重复规则 + 开关切换 | ✅ |
| 📈 数据统计 | 心情/时间/收支图表（跨表聚合 + CSS 柱状图） | ✅ |
| 🐱 桌面伙伴 | Python tkinter 透明悬浮窗 + Emoji/图片/GIF 三模式 | ✅ |
| 🎨 伙伴设置 | Web 面板设置角色/昵称/动画 + 一键启停 | ✅ |

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| **Web 前端** | Next.js 14 · React 18 · TypeScript · Tailwind CSS 4 · lucide-react |
| **后端/数据库** | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| **桌面悬浮窗** | Python 3 + tkinter + Pillow (透明窗口 + GIF 帧播放) |
| **部署** | Vercel (Web) · 本地 Python (悬浮窗) |

## 📁 目录结构

```
个人学习面板/
├── desktop/                  # Python 桌面悬浮窗
│   ├── companion.py          # 主程序 (tkinter)
│   ├── companion_config.json # 桥接配置
│   └── companion.pid         # 进程 ID
├── src/
│   ├── app/
│   │   ├── (main)/           # 主面板 (需登录)
│   │   │   ├── page.tsx      # 今日概览
│   │   │   ├── diary/        # 日记
│   │   │   ├── time/         # 时间安排
│   │   │   ├── finance/      # 记账
│   │   │   ├── goals/        # 目标规划
│   │   │   ├── reflections/  # 复盘汇总
│   │   │   ├── stats/        # 数据统计
│   │   │   ├── reminders/    # 提醒管理
│   │   │   └── partner/      # 伙伴设置
│   │   ├── companion/        # 悬浮伙伴页面
│   │   └── api/partner/      # 伙伴设置 API
│   ├── components/           # 共享组件
│   ├── lib/                  # Supabase 客户端 + Auth
│   └── types/                # TypeScript 类型
├── supabase/                 # 数据库建表 SQL
├── REQUIREMENTS.md           # 需求清单
├── DESIGN.md                 # 设计文档
├── DEVLOG.md                 # 开发者日志
└── companion-start.bat       # Windows 悬浮窗启动脚本
```

## 🚀 本地运行

### 前置条件

- Node.js 18+ · npm
- Python 3.12+ · pip
- Supabase 项目

### 安装

```bash
# 克隆项目
git clone <repo-url> && cd 个人学习面板

# 安装 Node 依赖
npm install

# 安装 Python 依赖
pip install Pillow

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 Supabase URL 和 anon key
```

### 启动

```bash
# Web 面板
npm run dev              # 启动 Next.js 开发服务器 → http://localhost:3000

# 桌面悬浮窗
npm run companion        # 启动 Python 悬浮窗
# 或双击 companion-start.bat
```

## 🎨 配色

晴空蓝系：
- 主色 `#42a5f5` · 深色 `#1e88e5`
- 背景 `#f5f9ff` · 卡片 `#ffffff`
- 文字 `#1a3a5c` / `#5c8dc9`
- 点缀 `#fff9c4` · 边框 `#e3f2fd`

## 📄 许可

MIT
