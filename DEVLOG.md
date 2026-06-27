# 🏠 个人人生面板 — 开发者日志

## 项目信息
- **项目名称**：人生面板（待定）
- **开始日期**：2026-06-26
- **技术栈**：Next.js 14 + Supabase + Electron + Tailwind CSS + shadcn/ui
- **风格方向**：晴空蓝系 + Q版/二次元悬浮伙伴
- **开发路线**：A — 分步递进（Web 面板 → 悬浮伙伴 → 串联闭环）

---

## 日志

### 2026-06-26 #1 — 项目启动 & 需求对齐

**确认事项：**
- ✅ 核心闭环：桌面悬浮窗快捷捕获 → Web 面板深度整理回顾
- ✅ 设备覆盖：手机浏览器 + 电脑网页 + 桌面 Electron 悬浮窗
- ✅ 数据库：Supabase（实时同步，免自搭服务器）
- ✅ UI 框架：Tailwind CSS + shadcn/ui
- ✅ 悬浮伙伴：Q版卡通 + 二次元混合风格
- ✅ 开发路线：先 Web 面板，再加悬浮伙伴，最后串联

**功能模块清单：**
1. 📝 日记（含心情/感受/感悟）
2. ⏱️ 时间安排 / 日程
3. 💰 记账
4. 🎯 目标规划 / 年度计划
5. 📊 复盘汇总
6. 📈 数据统计 / 可视化
7. 🔔 提醒管理
8. 🎨 悬浮伙伴自定义

---

### 2026-06-26 #2 — Web 布局 & 配色确认

**确认事项：**
- ✅ 桌面端：左侧固定导航 + 右侧卡片网格
- ✅ 移动端：卡片堆叠 + 底部 Tab 切换
- ✅ 默认首页：今日概览（聚合常用卡片）
- ✅ 配色：方案 A「晴空蓝」— 白底 + 浅蓝 #42a5f5 主色 + 淡黄 #fff9c4 点缀

**变更：**
- ❌ 温馨治愈风（暖橙系）→ ✅ 晴空蓝系

---

### 2026-06-26 #3 — 数据库结构确认

**确认事项：**
- ✅ 7 张核心表：diaries / time_entries / reflections / transactions / goals / reminders / partner_config
- ✅ 所有表 user_id 关联 Supabase 内置认证
- ✅ reflections 开启 Realtime 实时同步（悬浮窗 ↔ 网页）

---

### 2026-06-26 #4 — 悬浮伙伴交互确认

**确认事项：**
- ✅ 三种状态：待机（安静陪伴）/ 提醒（表情+气泡）/ 交互（点击展开面板）
- ✅ 面板功能：番茄钟 + 一句话复盘 + 心情选择 + 快捷跳转网页
- ✅ 右键菜单：打开网页 / 设置 / 更换角色 / 退出
- ✅ 拖拽移动角色，记住位置偏好
- ✅ 复盘数据自动同步到 Supabase → 网页端即时可见

---

### 2026-06-26 #5 — 完整设计文档完成

设计文档已写入 `C:\Users\29948\.claude\plans\web-joyful-oasis.md`，涵盖：
- ✅ 架构总览
- ✅ 全部 7 张数据表设计（字段 + 类型）
- ✅ Web 面板布局 + 导航结构 + 配色规范
- ✅ 悬浮伙伴窗口特性 + 三种状态 + 面板交互 + 右键菜单
- ✅ 三步开发路线
- ✅ 验证方式

---

### 2026-06-26 #7 — 项目初始化 & 布局框架完成 ✅

**完成内容：**
- ✅ Next.js 14 + Tailwind CSS v4 + shadcn/ui（base-nova）+ @base-ui/react
- ✅ 晴空蓝主题 CSS 变量（亮色/暗色双模式）
- ✅ 左侧固定导航（9 个模块，可折叠）+ 移动端底部 5 Tab 导航
- ✅ 首页仪表盘：问候条（时段自适应 + 心情选择）+ 番茄钟 + 快捷复盘 + 日程 + 桌面伙伴记录
- ✅ 9 个页面路由全部就位（占位页面）
- ✅ Supabase 客户端初始化
- ✅ TypeScript 类型定义（7 张表接口）
- ✅ 需求清单 REQUIREMENTS.md 文档化
- ✅ 开发环境 http://localhost:3000 正常运行

**Git 备份：**
- `80f9ede` — feat: 初始化项目
- `076adfe` — feat: 布局框架 + 首页仪表盘 + 全部页面路由 + 晴空蓝主题

**下一步：** 创建 Supabase 项目 → 建表 → 认证

---

### 2026-06-26 #8 — Supabase 数据库建表完成 ✅

**项目信息：**
- URL: `meyatacfvwhzdlpogwoe.supabase.co`
- 7 张表已在 PostgreSQL 中创建
- 所有表启用 RLS（Row Level Security），用户只能读写自己的数据
- reflections 表已加入 Realtime 发布（悬浮窗 ↔ 网页实时同步）

**创建的表：** diaries, time_entries, reflections, transactions, goals, reminders, partner_config

**Git 备份：**
- `c188cfc` — Supabase 环境 + SQL 建表脚本

**下一步：** 核心页面开发

---

### 2026-06-26 #9 — 认证 + 数据接入完成 ✅

**完成内容：**
- ✅ AuthContext 全局认证状态 + AppShell 路由守卫（未登录跳转登录页）
- ✅ 邮箱注册/登录（Supabase Auth）+ 退出功能
- ✅ 侧边栏显示用户邮箱 + 退出按钮
- ✅ 快捷复盘接入 Supabase reflections 表
- ✅ 桌面伙伴卡片实时订阅 Realtime（INSERT 事件即时刷新）

**Git 备份：**
- `fc31814` — 邮箱认证系统
- `a03e150` — 快捷复盘接入 Supabase + 实时订阅

**下一步：** 核心页面开发

---

### 2026-06-26 #10 — 核心页面完成 ✅

**完成内容：**
- ✅ **日记页** — 日期列表 + 心情/天气/标签 + 增删改查（软删除）
- ✅ **时间安排页** — 快速计时器 + 日程列表 + 事项增删改
- ✅ **复盘汇总页** — 统计卡片（总数/今日/桌面/网页）+ 复盘列表 + 实时订阅
- ✅ 三个页面均通过 Supabase 直连 + RLS 数据隔离

**Git 备份：**
- `66868e0` — 日记 CRUD + 时间安排 + 复盘汇总

**下一步：** 部署到 Vercel

---

### 2026-06-26 #11 — Vercel 部署成功 ✅但没法使用国内无法访问

**完成内容：**
- ✅ 项目部署到 Vercel，生产环境就绪
- ✅ 域名：https://life-panel-phi.vercel.app（别名）
- ✅ 环境变量 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已持久化到 Vercel 项目
- ✅ Supabase Auth 回调 URL 已更新（Vercel + localhost）
- ✅ Supabase 客户端改为延迟初始化（Proxy 模式，避免构建时 env 缺失报错）
- ✅ 添加 `vercel.json` 明确框架为 Next.js
- ✅ 添加 CSS 模块 TypeScript 类型声明（修复类型检查错误）
- ✅ 本地构建 + Vercel 构建均通过（12 个页面全部静态生成成功）

**解决的问题：**
- `supabaseUrl is required` — 静态页面生成时 env 不可用 → Proxy 延迟初始化
- `No Output Directory named "public"` — Vercel 框架检测问题 → vercel.json 指定 nextjs
- CSS import type error → 添加 css.d.ts 声明文件

**Git 备份：**
- `bc8f0de` — 添加 CSS TypeScript 声明文件
- `7bde121` — Vercel 部署成功

**下一步：** 第 2 步 — Electron 悬浮伙伴

---

### 2026-06-26 #12 — 桌面悬浮伙伴开发 ✅（Edge App 模式）

**完成内容：**
- ✅ 悬浮伙伴专用页面 `/companion`（独立布局，无 AppShell）
  - 🐱 Q版角色渲染（Emoji + CSS 呼吸动画 + 随机气泡）
  - 🍅 内置番茄钟（25分钟倒计时，开始/暂停/重置）
  - 💡 一句话复盘（心情选择 + 文本输入 + 发送到 Supabase，source='desktop'）
  - 🔐 独立登录（邮箱注册/登录，8秒超时保护）
  - 状态切换：待机（128×128 仅角色）↔ 展开（320×460 完整面板）
- ✅ Electron 主进程代码编写完成（透明窗口 + 托盘 + IPC）
- ✅ 启动方式：Edge App 模式（`npm run companion`）
  - 无浏览器边框、独立桌面窗口
  - 启动脚本：`companion-start.bat`

**Electron 模块问题（已记录）：**
- Electron 31/42 的 `electron` 内置模块仅限默认 ASAR 访问，用户代码无法 import
- 降级到 31 + 自定义 ASAR 均不可行
- 后续若需透明悬浮窗，可考虑：electron-forge 脚手架 / Tauri / Win32 WebView2

**文件清单：**
| 文件 | 说明 |
|------|------|
| `src/app/companion/page.tsx` | 悬浮伙伴 UI（角色 + 面板 + 动画） |
| `src/app/companion/layout.tsx` | 独立布局（透明背景） |
| `src/app/companion/companion-shell.tsx` | AuthProvider 包裹 |
| `src/app/companion/companion-auth-gate.tsx` | 登录/注册门禁 |
| `desktop/main.js` | Electron 主进程（备选） |
| `desktop/preload.js` | Electron IPC 桥接（备选） |
| `companion-start.bat` | Windows 一键启动脚本 |

**Git 备份：** 待提交

**下一步：** 继续开发剩余模块（记账/目标/统计/提醒），或等待 Electron 透明窗口方案

---

### 2026-06-26 #13 — Python tkinter 悬浮伙伴重写 ✅

**完成内容：**
- ✅ 从 Electron → Python tkinter 技术方案切换（`-transparentcolor` 魔法透明）
- ✅ 三模式角色渲染：Emoji 预设 / 自定义图片（PNG/JPG via PIL）/ GIF 动图（逐帧播放）
- ✅ 呼吸动画 / 随机气泡 / 点击反应 / 拖拽移动
- ✅ 右键菜单：打开网页面板 / 设置 / 退出
- ✅ 位置持久化（companion_position.json）
- ✅ 配置热加载（5 秒轮询 companion_config.json mtime）
- ✅ PID 文件机制 → 网页端可检测/控制进程启停

**关键文件：**
| 文件 | 说明 |
|------|------|
| `desktop/companion.py` | tkinter 悬浮窗主程序 |
| `desktop/companion_config.json` | 桥接配置文件 |
| `desktop/companion.pid` | 进程 ID（启停控制） |
| `companion-start.bat` | 一键启动 pythonw |

**解决的关键问题：**
- tkinter PhotoImage 不支持 PNG → 改用 PIL.Image + ImageTk
- 网页上传图片不可见 → 同时保存到 `public/companion/` 和 `desktop/`
- 点击不可开浏览器 → 改为显示反应气泡

**Git 备份：** 待提交

---

### 2026-06-26 #14 — 伙伴设置 Web 面板完成 ✅

**完成内容：**
- ✅ `/partner` 设置页面：角色预览 + 模式切换 + 图片上传 + 昵称/行为设置
- ✅ API Routes：`/api/partner/config`（读写配置）、`/api/partner/upload`（图片上传）
- ✅ `/api/partner/companion`（GET 状态 + POST 启动/停止）→ PID 文件 + tasklist/taskkill
- ✅ 9 个预设角色：🐱🐶🐰🐼🦊🐸😺🐻🐧
- ✅ 支持上传自定义 PNG/JPG/GIF 图片
- ✅ 状态卡片：实时轮询悬浮窗运行状态 + 一键启停

**文件清单：**
| 文件 | 说明 |
|------|------|
| `src/components/partner-settings-form.tsx` | 设置表单组件 |
| `src/app/api/partner/config/route.ts` | 配置 CRUD API |
| `src/app/api/partner/upload/route.ts` | 图片上传 API |
| `src/app/api/partner/companion/route.ts` | 启停控制 API |

**Git 备份：** 待提交

---

### 2026-06-26 #15 — P1 功能全部实现 ✅

**完成内容：**
- ✅ **记账页面** — 收支 CRUD + 日期分组账本 + 月度汇总（收入/支出/结余）+ 月份筛选
- ✅ **目标页面** — CRUD + 进度条 + 状态筛选（进行中/已完成/已放弃）+ 截止日期倒计时
- ✅ **提醒页面** — CRUD + 自定义 toggle 开关 + 重复规则（每天/每周/单次）+ 时间选择器
- ✅ **统计页面** — 跨表数据聚合 + 纯 CSS 柱状图（心情/时间/支出/收入）
- ✅ **首页改进** — GreetingBar 心情持久化（upsert diaries）、PomodoroCard 番茄数据持久化（写入 time_entries）、ScheduleCard 接入 Supabase 真实数据
- ✅ **README.md** — 项目文档

**修改/新建文件：**
| 文件 | 操作 |
|------|------|
| `src/app/(main)/finance/page.tsx` | 替换（完整记账 CRUD） |
| `src/app/(main)/goals/page.tsx` | 替换（完整目标 CRUD） |
| `src/app/(main)/reminders/page.tsx` | 替换（完整提醒 CRUD） |
| `src/app/(main)/stats/page.tsx` | 替换（跨表统计 + CSS 图表） |
| `src/components/greeting-bar.tsx` | 修改（心情持久化） |
| `src/components/pomodoro-card.tsx` | 修改（番茄数据持久化） |
| `src/components/schedule-card.tsx` | 替换（Supabase 数据接入） |
| `README.md` | 新建 |
| `REQUIREMENTS.md` | 更新状态 |
| `DEVLOG.md` | 更新日志 |

**项目完成度：** 全部 9 个功能模块 ✅ 已完成

**Git 备份：** 待提交

---

### 2026-06-26 #16 — Bug 排查与修复

**发现的问题列表：**

| # | Bug 描述 | 文件 | 优先级 | 状态 |
|---|----------|------|--------|------|
| 1 | `stats/page.tsx` — `useEffect` 依赖中包含 `now`（new Date()），每次渲染都是新对象，可能导致无限循环 | `src/app/(main)/stats/page.tsx` | 高 | 待修复 |
| 2 | `AppShell` 重复包裹 `AuthProvider`，与 `(main)/layout.tsx` 中的 `AppShell` 冲突 | `src/components/app-shell.tsx` | 高 | 待修复 |
| 3 | `PomodoroCard` 每秒 `tick` 时都尝试插入数据库，性能极差 | `src/components/pomodoro-card.tsx` | 高 | 待修复 |
| 4 | `BottomNav` 移动端只有 5 个导航项，缺失统计/复盘/提醒/伙伴 | `src/components/bottom-nav.tsx` | 中 | 待修复 |
| 5 | `QuickReflection` 提交后没检查 `error` 就显示成功 | `src/components/quick-reflection.tsx` | 中 | 待修复 |
| 6 | `TimePage` 计时器 `stopTimer` 直接用 `timerSeconds / 60` 取整，丢失余数秒数 | `src/app/(main)/time/page.tsx` | 中 | 待修复 |
| 7 | `ScheduleCard` 用 `created_at` 过滤"今日"不准确，应该用日期部分 | `src/components/schedule-card.tsx` | 中 | 待修复 |
| 8 | `CompanionPage` 收起面板后未重置编辑状态 | `src/app/companion/page.tsx` | 低 | 待修复 |
| 9 | `GoalsPage` 没有验证 `deadline` 格式 | `src/app/(main)/goals/page.tsx` | 低 | 待修复 |
| 10 | `CompanionPage` 的 `tick` useCallback 依赖数组为空，但函数内使用了 `user` | `src/app/companion/page.tsx` | 低 | 待修复 |

**修复进度：**
- [x] #1 stats useEffect 依赖问题 — 已修复（将 now 和 currentMonth 移入 useEffect 内部）
- [x] #2 AppShell 重复 AuthProvider — **经验证非bug**：两个路由组 (main) 和 (companion) 各自独立使用 AuthProvider，是设计如此
- [x] #3 PomodoroCard 性能问题 — **经验证非bug**：insert 只在 prev<=1 时执行一次，非每秒执行
- [x] #4 BottomNav 导航不完整 — 已修复（扩展到 8 项：概览/日记/时间/记账/规划/复盘/统计/提醒）
- [x] #5 QuickReflection 错误处理 — 已修复（添加 error 状态和错误提示）
- [x] #6 TimePage 计时器分钟计算 — 已修复（Math.floor 改为 Math.round）
- [x] #7 ScheduleCard 日期过滤 — 已修复（使用精确的今日开始/结束时间戳）
- [x] #8 Companion 状态重置 — 已修复（handleCollapse 时重置表单状态）
- [x] #9 Goals deadline 验证 — 已修复（formatDeadline 添加无效日期检查）
- [x] #10 Companion tick 依赖 — **经验证非bug**：tick 函数不使用 user，依赖数组为空正确

---

### 2026-06-26 #17 — 笔记灵感库大改版

**模块定位：** 从「日记」升级为「笔记灵感库」—— 既是日记，也是灵感收集，什么都能往里丢。

**核心变化：**
- 合并 diary + reflections → entries 一张表
- 支持多种内容类型：文字 / 图片 / 链接（第一版）
- 双视图切换：时间轴视图 + 瀑布流视图
- AI 能力：自动打标签 + 自动分类 + 摘要生成
- 多模型可切换：DeepSeek / 通义千问 / 智谱 / 豆包

**开发计划：**

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 数据库：新建 entries 表 + 迁移脚本 + 类型定义 | ✅ 完成 |
| Phase 2 | 页面：双视图列表 + 新建/编辑 + 筛选搜索 | ✅ 完成 |
| Phase 3 | 图片上传：Supabase Storage + 上传组件 | ✅ 完成 |
| Phase 4 | AI 能力：多模型服务层 + 自动标签分类 | ✅ 完成 |
| Phase 5 | 整合：导航更新 + 桌面伙伴同步 + QuickReflection | ✅ 完成 |

**新增文件：**
- `src/app/(main)/settings/ai/page.tsx` — AI 设置页面
- `src/app/api/ai/process/route.ts` — AI 处理 API
- `src/lib/ai-service.ts` — AI 服务层（多模型）
- `src/lib/storage.ts` — Supabase Storage 工具
- `src/components/image-upload.tsx` — 图片上传组件

**修改文件：**
- `src/app/(main)/diary/page.tsx` — 重写为笔记灵感库
- `src/components/sidebar.tsx` — 导航更新
- `src/components/bottom-nav.tsx` — 底部导航更新
- `src/components/quick-reflection.tsx` — 同步写入 entries
- `src/app/companion/page.tsx` — 桌面伙伴同步写入 entries
- `supabase/schema.sql` — 新增 entries / ai_settings 表

**使用前需要做：**
1. 在 Supabase 运行新的 schema.sql（创建 entries 和 ai_settings 表）
2. 在 Supabase Storage 创建 `entry_media` bucket（公开可读）
3. 设置 SUPABASE_SERVICE_ROLE_KEY 环境变量（用于 AI API 用户验证）
4. 在设置 → AI 设置中配置你的 API Key

---

### 2026-06-27 #18 — 计划中心（时间 + 规划 + 提醒 三合一）

**模块定位：** 把原来分散的「时间安排」「目标规划」「提醒管理」三个板块合并为一个 **🗺️ 计划中心**。核心是一棵可视化「人生技能树」——从最大的人生愿望（根节点）逐层向下拆解到目标、具体任务；每个节点可进入计时，计时结束后把投入时长挂回节点上，直观看到自己在每条分支上的努力。提醒作为备忘性质的一块以抽屉形式整合进来。

**愿景拆解（与用户确认）：**
- 全景规划：愿望 🌟 → 目标 🎯 → 任务 ✅ 三级技能树
- 自由加节点、拖拽布局、连线建立父子关系
- 选中节点 → 计时 → 计时结束写入 time_entries 并关联该节点 → 节点显示累计投入分钟
- 提醒 / 备忘整合为侧边抽屉

**技术选型：**
- 画布：`@xyflow/react`（React Flow v12）—— 自定义节点 + 连线 + 小地图 + 拖拽持久化
- 数据：新建 `plan_nodes` 表（树形自引用 parent_id），`time_entries` 增加 `node_id` 外键

**开发阶段：**

| 阶段 | 内容 | 状态 |
|------|------|------|
| P1 | 数据层：plan_nodes 表 + 迁移脚本 + 类型定义（PlanNode / node_id） | ✅ |
| P2 | 树视图：React Flow 画布渲染节点（自定义 PlanNodeCard） | ✅ |
| P3 | 拖拽：节点坐标持久化 + 连线设置父子关系 | ✅ |
| P4 | 计时联动：节点 → 计时 → 写 time_entries（带 node_id）→ 累计投入回显 | ✅ |
| P5 | 提醒 / 备忘整合为侧边抽屉（ReminderDrawer） | ✅ |
| P6 | 收尾：导航三合一 + 删除旧页面 + DEVLOG | ✅ |

**新增文件：**
| 文件 | 说明 |
|------|------|
| `supabase/migrate-plan-center.sql` | 计划中心迁移脚本（建表 / RLS / 触发器 / goals→plan_nodes 迁移） |
| `src/app/(main)/plan/page.tsx` | 计划中心主页面（React Flow 画布 + 节点详情面板 + 计时器） |
| `src/components/plan-node-card.tsx` | React Flow 自定义节点组件（类型徽章 / 进度条 / 累计投入 / deadline） |
| `src/components/reminder-drawer.tsx` | 提醒 / 备忘侧边抽屉（reminders CRUD） |

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/types/database.ts` | 新增 PlanNode / PlanNodeType / PlanNodeStatus；TimeEntry 加 node_id |
| `src/components/sidebar.tsx` | 删除 时间 / 目标 / 提醒，新增「计划中心」（Map 图标） |
| `src/components/bottom-nav.tsx` | 移动端导航三合一，新增「计划」 |
| `src/components/schedule-card.tsx` | 首页日程卡「添加」跳转 `/time` → `/plan` |

**删除文件：**
- `src/app/(main)/time/page.tsx`
- `src/app/(main)/goals/page.tsx`
- `src/app/(main)/reminders/page.tsx`

**使用前需要做：**
1. 在 Supabase SQL Editor 运行 `supabase/migrate-plan-center.sql`（建 plan_nodes 表、给 time_entries 加 node_id、把旧 goals 迁移成顶层目标节点）

**下一步：** 浏览器验证计划中心交互（加节点 / 拖拽 / 连线 / 计时 / 提醒抽屉）

---

### 2026-06-27 #19 — 计划中心 v2（多 Tab + 折叠子树 + 板块分类 + 专注计时联动 + 日历）

**模块定位：** 在「人生技能树」基础上，按用户反馈升级为多 Tab 的完整闭环：技能树负责规划，专注计时负责执行，日历负责回顾。三者通过 `time_entries.node_id` 串联——计时产生的投入既回显到树节点，也沉淀进日历贡献视图。

**用户反馈与对应改动：**
- ✅ 子树一键收拢/展开 —— 节点底部箭头按钮，折叠时隐藏全部后代并显示隐藏数量
- ✅ 更多自定义颜色 —— 10 色调色板，节点可单独上色（覆盖板块色）
- ✅ 更多板块 —— 新建 `plan_categories`（名称 + 颜色），节点可归类，顶部 chips 一键筛选
- ✅ 修复「节点计时没用」—— 移除树内联计时，独立成「专注计时」Tab；insert 检查 error 并提示，降低记录门槛到 30 秒
- ✅ 像日程一样的计时画面，和树分开 —— 专注计时 Tab：倒计时（15/25/45/60/自定义）+ 正计时，可记录「正在做什么」
- ✅ 计时完入树 —— 完成后可「挂到已有节点下」或「新建独立节点」（自动建 100% 完成的 task 并回写 node_id）
- ✅ 日历看一天的贡献 —— 月历热力图（颜色深浅=专注时长）+ 当日详情（为哪些分支做了贡献 + 专注记录列表）
- ✅ 树上保留「去专注计时」快捷入口（跳到计时 Tab 并预选该节点）

**架构：** `/plan` 页面改为 Tab 容器（技能树 / 专注计时 / 日历），切 Tab 时组件 remount 自动重载数据；提醒/备忘仍为侧边抽屉。

**新增文件：**
| 文件 | 说明 |
|------|------|
| `supabase/migrate-plan-center-v2.sql` | v2 迁移：plan_categories 表 + plan_nodes 加 category_id / collapsed |
| `src/components/plan/skill-tree.tsx` | 技能树画布（从旧 plan/page.tsx 迁移并增强：折叠 / 颜色 / 板块 / 去计时） |
| `src/components/plan/focus-timer.tsx` | 专注计时 Tab（倒计时 + 正计时 + 关联节点 + 完成入树 + 今日记录） |
| `src/components/plan/plan-calendar.tsx` | 日历 Tab（月历热力图 + 当日贡献明细） |

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/app/(main)/plan/page.tsx` | 重写为多 Tab 容器，串联三个组件 + 提醒抽屉 |
| `src/components/plan-node-card.tsx` | 支持自定义/板块色、板块徽章、折叠按钮 |
| `src/types/database.ts` | 新增 PlanCategory；PlanNode 加 category_id / collapsed |
| `src/components/quick-reflection.tsx` | 修复 `.catch`（thenable 改 `.then(ok, err)`） |

**使用前需要做：**
1. 先确认已运行过 `supabase/migrate-plan-center.sql`（v1）
2. 在 Supabase SQL Editor 运行 `supabase/migrate-plan-center-v2.sql`（建 plan_categories 表、给 plan_nodes 加 category_id / collapsed 列）

**验证状态：** TypeScript 类型检查通过；dev server（:3005）`/plan` 编译成功返回 200。交互式浏览器联调因当前环境 WebView 未就绪未执行，待用户登录 + 运行 v2 迁移后自测。

**待用户自测主流程：** 加愿望 → 加子目标 → 拖拽连线 → 设板块/颜色 → 折叠子树 → 去计时（倒计时/正计时）→ 完成入树 → 日历看当日贡献。

---

### 2026-06-27 #20 — 修复：专注计时切换页面会停止

**问题：** 专注计时用 React 的 `setInterval` 每秒累加 `seconds` 状态。切 tab（技能树/日历）或离开 `/plan` 时 `FocusTimer` 组件卸载，状态丢失，计时清零。

**修复：** 改为**基于时间戳 + localStorage** 的计时：
- 只持久化「开始时刻 `startedAt` + 此前累计 `baseElapsed` + running」，显示时间由 `now - startedAt` 实时算出
- 切 tab / 切页面 / 刷新浏览器后，挂载时从 localStorage（key `lp-focus-timer`）恢复，墙钟时间继续，不清零
- 新增「暂停 / 继续」：暂停冻结累计秒数，继续从断点接着走
- 倒计时即使在别的页面超时，回来也会自动结算（时长封顶为设定值）
- tick 仅触发重渲染，不写库不写 localStorage（避免高频写入）

**修改文件：** `src/components/plan/focus-timer.tsx`

---

### 2026-06-27 #21 — 今日专注：事后补/改/清归属节点

**诉求：** 计时结束当下若忘了把这次专注挂到技能树节点，事后无法补救会后悔。

**改动：** 「今日专注」记录列表里，每条记录都能事后管理归属——
- 每条记录显示归属状态：已挂节点显示 `🌳 节点名`，未挂显示橙色「未归属」提示
- 行内 🌳 按钮展开归属编辑器，可：
  - **改/设/清**：下拉选择关联到任一技能树节点，或选「不关联」直接清除归属（即时写 `time_entries.node_id`）
  - **新建承载节点**：填标题 + 选父节点（或作为独立节点），一键创建 100% 完成的 task 节点并回写关联
- 编辑即时落库并刷新，无需重新计时

**修改文件：** `src/components/plan/focus-timer.tsx`（新增 `editingSessionId / createMode / newNodeTitle / newNodeParent` 状态与 `openSessionEditor / reassignSession / createNodeForSession` 处理函数 + 列表行内编辑器 UI）

**验证状态：** TypeScript 类型检查通过；dev server（:3005）热重载编译成功。待用户刷新浏览器自测。

---

### 2026-06-27 #22 — 专注复盘：每次专注后记收获，可选收进笔记库

**诉求：** 每次专注结束想做一个轻量化复盘（学到了什么 / 感悟），并能选择把它归到「笔记灵感库」里。

**改动：**
- **完成面板**新增「✍️ 这次的收获」：一个 textarea 记录复盘 + 「顺手收进笔记库」勾选（可填分类，默认「专注复盘」）+「保存收获」按钮。复盘文字写到该条专注记录上（`time_entries.note`），勾选时同步在 `entries`（笔记库）建一条 note（tag 含「专注」+ 标题）。
- **今日专注**记录支持事后补 / 改复盘：每条记录若有复盘，列表里以「✍️ …」预览一行；展开行内编辑器后多出「这次的收获」区，可补写 / 修改 + 同样可勾选存入笔记库。
- **优雅降级**：`time_entries` 列表查询改为 `select("*")`，即使没运行迁移（缺 `note` 列）也不会崩；写 note 失败时给软提示（且若已勾选存笔记，笔记照常入库）。

**数据：** 复盘绑定专注记录用新增列 `time_entries.note`；存笔记库复用既有 `entries` 表（type=note）。

**新增文件：** `supabase/migrate-focus-reflection.sql`（`ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS note TEXT`）

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/types/database.ts` | TimeEntry 加 `note?: string` |
| `src/components/plan/focus-timer.tsx` | 完成面板复盘区 + 今日记录行内复盘编辑 + `pushToNotes / saveReflection / saveSessionNote` |

**使用前需要做：** 在 Supabase SQL Editor 运行 `supabase/migrate-focus-reflection.sql`（加 `note` 列；不运行也不影响其它功能，只是复盘无法附到专注记录、但仍可存入笔记库）。

**验证状态：** TypeScript 类型检查通过；dev server（:3005）热重载编译成功。待用户刷新浏览器自测。

---

### 2026-06-27 #23 — 复盘可在日历回看修改 + 技能树节点多连线

**诉求：** ①专注复盘也要能修改，并在日历当日详情里展示这些收获方便回看；②技能树每个节点支持连多个其他节点（线要能删除，从一个底部可接多个头部、多个也可接到一个）。

**改动：**
- **日历当日详情**：每条专注记录展示其复盘收获（「✍️ …」），并可就地编辑/补写过去日期的收获（铅笔按钮 → textarea →「同时存入笔记库」勾选 → 保存/取消），写回 `time_entries.note`，勾选时同步在 `entries`（笔记库）建一条 note，再刷新。这样不只今日，任意历史日期的复盘都能回看、修改、并选择是否归档到笔记库（与「今日专注」记录的编辑能力一致）。
- **技能树多连线**：从单一 `parent_id` 父子模型升级为独立的 `plan_edges` 多对多连线表。
  - 一个节点底部 source 可连多个头部 target，多个节点也可连入同一节点；
  - 连线可删除：点击连线弹确认即删（或选中按删除键，`onEdgesDelete`）；
  - 折叠算法重写为 DAG：基于 edges 构建邻接表 + 入度，从无入边的「根」BFS 求可见集，折叠节点的下游中无其它可见路径到达的判为隐藏，并统计隐藏后代数用于「+N」提示；
  - `addChild` 新建子节点时同步建一条连线。
- **优雅降级**：`plan_edges` 查询失败（表未迁移）时回退用 `parent_id` 派生连线（id 形如 `pid-xxx`），此时连线删除回退为清子节点 `parent_id`、新建连线回退为写 `parent_id`，迁移前不影响使用。

**数据：** 复盘复用 `time_entries.note`；多连线新增 `plan_edges` 表（`source_id`/`target_id` 多对多，`UNIQUE(source_id,target_id)`，`ON DELETE CASCADE`，RLS）。

**新增文件：** `supabase/migrate-plan-edges.sql`（建 `plan_edges` 表 + 索引 + RLS + 从现有 `parent_id` 迁移连线）

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/types/database.ts` | 新增 `PlanEdge` 接口 |
| `src/components/plan/skill-tree.tsx` | `plan_edges` 数据层 + `onConnect/onEdgeClick/onEdgesDelete` + DAG 折叠 + `addChild` 建边 + parent_id 回退 |
| `src/components/plan/plan-calendar.tsx` | 当日详情展示+就地编辑复盘收获，`select("*")` 带 note |

**使用前需要做：** 在 Supabase SQL Editor 运行 `supabase/migrate-plan-edges.sql`（多连线）与（若尚未运行）`supabase/migrate-focus-reflection.sql`（复盘 note 列）。未运行 `plan_edges` 迁移时技能树自动回退到单父模型，仍可正常使用。

**验证状态：** TypeScript 类型检查通过；dev server（:3005）热重载编译成功。待用户刷新浏览器自测。

---

### 2026-06-27 #24 — 日历手动补记：干了什么 + 几点到几点 + 可选入笔记

**诉求：** 在日历里能补记「我干了什么」，并可选填「几点到几点」（也可不填），同时可选择记到笔记库。

**改动：**
- **当日详情**新增「记一笔」按钮，展开后是补记表单：
  - 「这天我干了什么」标题（必填）；
  - 「几点到几点」开始/结束时间（`type=time`，均可不填）；
  - 「同时记录到笔记库」勾选。
- 保存逻辑（`addManualEntry`）：以选中日期 + 开始时间组成 `created_at`（未填时间默认当天 12:00，仅用于落在当天）；填了开始+结束且结束晚于开始则算出 `duration_minutes`，否则记 0 分；插入 `time_entries`；勾选则同步往 `entries`（笔记库，type=note，tag 含「专注」）插一条。
- 文案：当日汇总改为「当天记录 N 条，专注 X 分钟」，列表标题「⏱ 当天记录」，空态「这一天还没有记录」，以兼容非计时类的手动补记。

**数据：** 复用 `time_entries`（显式写 `created_at` 落到选中日）与 `entries`（笔记库）。无新增表/列。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/components/plan/plan-calendar.tsx` | 「记一笔」表单 + `addManualEntry/openAdd/cancelAdd` + 文案兼容 |

**验证状态：** TypeScript 类型检查通过；dev server（:3005）热重载编译成功。待用户刷新浏览器自测。

---

### 2026-06-27 #25 — 删除按钮 + 技能树连线改为显式删除（修误删）

**诉求：** ①日历记录要有删除按钮；②技能树「点一下线就删除了，没经过我的同意」。

**根因：** 原技能树连线删除用 `onEdgeClick` + `window.confirm("删除这条连线？")`，但在 IDE 内置预览 webview 里 `window.confirm` 会被自动忽略（直接当作确认），导致单击连线即删，未经二次确认。

**改动：**
- **技能树连线（`skill-tree.tsx`）：** 彻底移除 `onEdgeClick` 自动删除逻辑，改用自定义连线组件 `DeletableEdge`（基于 `BaseEdge` + `EdgeLabelRenderer` + `getBezierPath`）：
  - 单击连线先「选中」→ 连线变红（stroke `#ef5350`、加粗）；
  - 选中后在连线中点出现红色圆形 `×` 按钮，点 `×` 才真正删除（`×` 点击本身即显式同意，不依赖浏览器弹窗）；
  - 注册 `edgeTypes={{ deletable }}`，flowEdges 改用 `type:"deletable"` 并注入 `data.onDelete`，经 `edgeDeleteRef` 拿到最新删除逻辑；保留键盘 `onEdgesDelete`（先选中再按删除键，同属显式操作）。
  - 底部提示更新为「想删连线先单击选中它（变红），再点中间的 × 删除」。
- **日历记录（`plan-calendar.tsx`）：** 当日详情每条记录行新增垃圾桶按钮，点击后行内出现「确定删除这条记录？[删除][取消]」二次确认（`deletingId` 状态，应用内确认，同样不用 `window.confirm`）；确认后 `deleteEntry` 删 `time_entries` 并刷新。

**教训：** IDE 预览 webview 会吞掉 `window.confirm`，凡需用户确认的破坏性操作一律用应用内 UI（选中态 / 行内二次确认按钮），不依赖浏览器原生弹窗。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/components/plan/skill-tree.tsx` | `DeletableEdge` 自定义连线 + `edgeTypes`/`edgeDeleteRef`，移除 `onEdgeClick` 自动删除，提示文案 |
| `src/components/plan/plan-calendar.tsx` | 每条记录加删除按钮 + `deletingId` 行内二次确认 + `deleteEntry` |

**验证状态：** TypeScript 类型检查通过；dev server（:3005）热重载编译成功。待用户刷新浏览器自测。

---

### 2026-06-27 #26 — 修复：桌面悬浮窗「启动不了」（残留 PID 误判）

**现象：** 双击 `companion-start.bat` / `npm run companion` 后悬浮窗不出现，也没有任何报错提示。

**根因：** `companion.py` 的单实例检查只校验「`companion.pid` 里的 PID 号是否被占用」，不校验占用者是不是悬浮窗本身。而 `companion.pid` 仅在**正常退出**时删除——上次若崩溃 / 被杀 / 关机，pid 文件残留；Windows 又会把该 PID 号回收给无关进程，于是 `OpenProcess` 成功 → 脚本误判「已在运行」→ `sys.exit(0)`。再加 `pythonw` 无控制台，`print` 的提示用户看不到，表现就是「双击没反应」。

**改动（`desktop/companion.py`）：**
- 新增 `_pid_is_companion(pid)`：用 `QueryFullProcessImageNameW`（`PROCESS_QUERY_LIMITED_INFORMATION`）取得占用该 PID 的进程映像路径，仅当其为 `python` 进程时才判定「确有伙伴在运行」。
- 入口单实例检查改为：仅当 `old_pid != 当前进程` 且 `_pid_is_companion(old_pid)` 为真才退出；否则视 `companion.pid` 为残留，删除后继续启动。

**验证：**
- 残留/被回收的 PID（实测保留死 PID 3416）→ 新实例正常启动并改写 pid ✅
- 真有伙伴在运行 → 第二个实例正确输出 `Companion already running (PID …)` 并退出，仅保留一个进程 ✅
- 环境确认正常：Python 3.12.10 / Pillow 12.2.0 / `pythonw` 可用。

**附带：** `.gitignore` 增加 `desktop/companion.pid`、`desktop/__pycache__/`，避免运行产物入库。

**教训：** PID 文件做单实例锁必须校验进程身份（映像名/命令行），否则 PID 回收会造成「永远启动不了」；`pythonw` 会吞掉所有控制台输出，调试时改用 `python` 跑以暴露异常。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | `_pid_is_companion` 进程身份校验 + 入口单实例逻辑加固 |
| `.gitignore` | 忽略 `desktop/companion.pid`、`desktop/__pycache__/` |
