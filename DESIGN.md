# 🏠 个人人生面板 — 设计文档

## 项目概述

**目标**：一个人生管理 Web 应用 + 桌面悬浮伙伴，支持手机/电脑同步。核心闭环：桌面悬浮窗快捷捕获（计时、复盘）→ Web 面板深度整理回顾（日记、记账、规划）。

**日期**：2026-06-26
**技术栈**：Next.js 14 + Supabase + Electron + Tailwind CSS + shadcn/ui
**风格**：晴空蓝系（#42a5f5 主色 + 白底 + 淡黄点缀）+ Q版/二次元悬浮伙伴

---

## 一、架构总览

```
 手机浏览器 📱 ──▶  Next.js Web App  ──▶  Supabase (PostgreSQL + Realtime)
                        ▲                        │
 电脑浏览器 🖥️  ───────┘                        │
                        ▲                        ▼
 Electron悬浮伙伴 🐱 ──┘              实时同步：手机/电脑/悬浮窗数据互通
```

- **Web 前端**：Next.js 14 App Router + React + Tailwind CSS + shadcn/ui
- **后端服务**：Supabase（数据库 + 认证 + 实时推送 + Row Level Security）
- **桌面应用**：Electron 独立窗口（透明无边框、始终置顶）
- **部署**：Vercel（Web 端，免费）+ 本地 Electron 打包

---

## 二、功能模块

| 优先级 | 模块 | 说明 |
|--------|------|------|
| P0 | 📝 日记 | 每日日记 + 心情/感受/感悟 + 天气 + 图片 |
| P0 | ⏱️ 时间安排 & 计时 | 日程安排 + 番茄钟计时器 |
| P0 | 📊 复盘汇总 | 悬浮窗一句话复盘 → 网页端汇总展示 |
| P1 | 💰 记账 | 收支流水 + 分类统计 |
| P1 | 🎯 目标规划 | 年度/月度目标 + 进度追踪 |
| P1 | 🔔 提醒管理 | 定时提醒 + 重复规则 |
| P1 | 📈 数据统计 | 心情趋势、时间分布、记账图表 |
| P2 | 🎨 悬浮伙伴自定义 | 角色/皮肤/昵称更换 |

---

## 三、数据库设计（Supabase PostgreSQL）

### 表结构

**diaries** — 日记
| 列 | 类型 | 说明 |
|----|------|------|
| id | uuid | 主键 |
| user_id | uuid | 关联用户（FK → auth.users） |
| date | date | 日记日期 |
| mood | text | 心情：😊/😐/😢/😡 |
| content | text | 日记正文 |
| weather | text | 天气（可选） |
| image_url | text | 图片（可选） |
| tags | text[] | 标签数组 |
| created_at | timestamptz | |
| deleted_at | timestamptz | 软删除 |

**time_entries** — 时间安排 & 计时记录
| 列 | 类型 | 说明 |
|----|------|------|
| id | uuid | 主键 |
| user_id | uuid | |
| title | text | 事项标题 |
| start_time | timestamptz | 开始时间 |
| end_time | timestamptz | 结束时间 |
| duration_minutes | int | 时长（分钟） |
| pomodoro_count | int | 番茄轮数 |
| tags | text[] | |
| created_at | timestamptz | |

**reflections** — 悬浮窗/网页复盘（⚠️ 开 Realtime）
| 列 | 类型 | 说明 |
|----|------|------|
| id | uuid | 主键 |
| user_id | uuid | |
| content | text | 复盘内容 |
| mood | text | 心情 |
| source | text | 'desktop' / 'web' |
| time_entry_id | uuid? | 关联计时记录 |
| created_at | timestamptz | |

**transactions** — 记账
| 列 | 类型 | 说明 |
|----|------|------|
| id | uuid | 主键 |
| user_id | uuid | |
| amount | numeric | 金额 |
| type | text | 'income' / 'expense' |
| category | text | 分类（餐饮/交通/购物…） |
| note | text | 备注 |
| date | date | |
| created_at | timestamptz | |

**goals** — 目标规划
| 列 | 类型 | 说明 |
|----|------|------|
| id | uuid | 主键 |
| user_id | uuid | |
| title | text | 目标标题 |
| description | text | 描述 |
| progress | int | 进度 0-100 |
| deadline | date | 截止日期 |
| status | text | 'active'/'completed'/'abandoned' |
| created_at | timestamptz | |

**reminders** — 提醒
| 列 | 类型 | 说明 |
|----|------|------|
| id | uuid | 主键 |
| user_id | uuid | |
| title | text | 提醒内容 |
| trigger_time | time | 触发时间 |
| repeat_rule | text | 'daily'/'weekly'/'none' |
| enabled | bool | |
| created_at | timestamptz | |

**partner_config** — 悬浮伙伴设置
| 列 | 类型 | 说明 |
|----|------|------|
| id | uuid | 主键 |
| user_id | uuid | (unique) |
| character_id | text | 角色标识 |
| nickname | text | 昵称 |
| skin | text | 皮肤 |
| position_x | int | 桌面X位置 |
| position_y | int | 桌面Y位置 |

### 安全策略
- 所有表启用 Row Level Security（RLS）
- 策略：`user_id = auth.uid()` 只能读写自己的数据
- reflections 表启用 `ALTER PUBLICATION supabase_realtime ADD TABLE reflections`

---

## 四、Web 面板设计

### 布局
- **桌面端**（≥768px）：左侧固定导航（200px）+ 右侧内容区（卡片网格）
- **移动端**（<768px）：卡片堆叠 + 底部 Tab 导航
- **默认首页**：今日概览（问候 + 心情 + 计时器 + 复盘 + 日程 + 悬浮窗同步）

### 导航结构
```
🏠 今日概览（首页）
📝 日记
⏱️ 时间安排
💰 记账
🎯 目标规划
📊 复盘汇总
📈 数据统计
🔔 提醒管理
🎨 伙伴设置
```

### 配色规范（晴空蓝）
- 页面背景：`#f5f9ff`
- 卡片背景：`#ffffff`
- 主色按钮/强调：`#42a5f5`
- 深色强调：`#1e88e5`
- 文字主色：`#1a3a5c`
- 文字次要：`#5c8dc9`
- 点缀色：`#fff9c4`（淡黄，问候条渐变）
- 导航背景渐变：`#e3f2fd → #bbdefb`
- 边框：`#e3f2fd`
- 圆角：统一 12px（卡片）/ 8px（按钮）

### 组件（复用 shadcn/ui）
- Button, Input, Textarea, Select, Dialog, Popover, Calendar, Card, Tabs
- 图表使用 Recharts（轻量）

---

## 五、桌面悬浮伙伴设计（Electron）

### 窗口特性
- 透明无边框窗口，始终置顶
- 尺寸：约 120×120（待机）/ 280×420（展开面板）
- 可拖拽移动，位置持久化到 partner_config
- 系统托盘驻留（右键退出/显示）

### 三种状态
1. **待机** — 角色在桌面随机位置，GIF 动画（眨眼/晃动），偶尔冒泡说话
2. **提醒** — 触发提醒时：角色变大 + 表情变化 + 气泡文字 + Windows Notification
3. **交互** — 点击角色展开面板（见下方）

### 展开面板
```
┌─────────────────┐
│ 🐱 小橘    ⚙️  │  ← 角色头像 + 昵称 + 设置
├─────────────────┤
│   🍅 番茄钟      │
│    25:00        │
│  [▶ 开始][↻ 重置]│
├─────────────────┤
│ [⏱️计时][📝复盘] │  ← 快捷操作
│ [📅日程][🖥️网页] │
├─────────────────┤
│ 💡 今天学到了什么？│
│ [_____________] │  ← 一句话复盘输入
│ 😊 😐 😢       │  ← 心情选择
│ [发送 →]        │
└─────────────────┘
```

### 右键菜单
- 🖥️ 打开网页面板
- ⚙️ 伙伴设置
- 🔄 更换角色
- ❌ 退出

### 与 Web 端复用
- Electron 内嵌同一个 Next.js 页面（如 `/partner-panel`）
- 数据通过 Supabase JS SDK 直连，不走 Next.js API

---

## 六、开发路线

### 第 1 步：Web 面板先行（当前阶段）
1. 初始化 Next.js 项目 + Tailwind + shadcn/ui
2. 搭建 Supabase 项目 + 建表 + RLS
3. 实现认证（邮箱注册/登录）
4. 搭建布局框架（导航 + 响应式）
5. 实现核心页面：日记、时间安排、复盘汇总、今日概览
6. 部署到 Vercel 验证

### 第 2 步：补悬浮伙伴
1. Electron 项目搭建
2. 透明悬浮窗 + 角色展示
3. 面板交互（计时 + 复盘输入）
4. 系统通知与提醒
5. 与 Supabase 实时同步

### 第 3 步：串联闭环 & 补充模块
1. 记账、目标规划、数据统计
2. 提醒管理完善
3. 悬浮伙伴自定义页面
4. 整体打磨 & 测试

---

## 七、验证方式

- Web 面板：Vercel 部署后用手机 + 电脑浏览器访问，确认布局和功能
- 数据同步：手机写日记 → 电脑刷新即时可见
- 悬浮窗：Electron 本地运行，确认透明置顶 + 复盘同步到网页
- 数据库：Supabase Dashboard 检查 RLS 隔离正确
