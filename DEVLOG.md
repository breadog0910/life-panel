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

---

### 2026-06-27 #27 — 桌面悬浮伙伴打包成单文件 exe（免装 Python）

**诉求：** 「没办法让网页端用户都使用上悬浮伙伴吗」——确认方向为**打包桌面程序**：把 Python 悬浮窗打包成可下载、双击即用的单文件 `小橘.exe`，访问者不需要装 Python。

**架构前提（已与用户说明）：** 云端部署（Vercel）的网页 API 跑在云服务器，浏览器沙箱内无法在访问者本地桌面 spawn 进程，所以「网页一键启动悬浮窗」只在本机跑 Next.js 时才成立。要让任意网页用户用上悬浮伙伴，正解是分发一个本地可执行程序。

**冻结安全改造（`desktop/companion.py`）：**
- `FROZEN = getattr(sys, "frozen", False)`；新增 `resource_path()` 经 `sys._MEIPASS` 定位内置只读资源。
- `BASE_DIR` 冻结时取 `sys.executable` 所在目录（打包后 `__file__` 指向解压临时目录，不可靠）。
- 可写数据目录：冻结时落 `%APPDATA%\小橘\`（exe 所在目录可能只读），脚本态仍写 `desktop/`，本地网页配置热同步不受影响；`POSITION_FILE/CONFIG_FILE/PID_FILE` 随之切换。
- `DEFAULT_CONFIG` 增加 `web_url`，右键「打开网页面板 / 伙伴设置」读取它（分发版可在 `companion_config.json` 覆盖为云端地址）。
- 单实例进程身份校验适配打包：`_expected_image_token()` —— 冻结态期望进程映像名是 `小橘.exe`，脚本态仍是 `python`（否则打包后映像名不含 "python" 会导致单实例锁失效）。

**打包配置：**
| 文件 | 说明 |
|------|------|
| `desktop/companion.spec` | PyInstaller 单文件配置（`--onefile` 等价、`console=False` 无黑框、`hiddenimports` 显式带上 PIL.Image/ImageTk/ImageSequence、用 `SPECPATH` 定位脚本） |
| `package.json` | 新增 `companion:build` script（`python -m PyInstaller --noconfirm --distpath desktop/dist --workpath desktop/build desktop/companion.spec`） |
| `.gitignore` | 忽略 `desktop/dist/`、`desktop/build/` 打包产物 |

**构建 & 实测（PyInstaller 6.21.0 / Python 3.12.10）：**
- 产物 `desktop/dist/小橘.exe`，28.4 MB，单文件。
- 双击启动 → 顶层窗口 `小橘 · 桌面伙伴` **可见**，尺寸 170×190，落在屏幕右下（实测 rect `(1240,650)-(1410,840)`）✅
- PID 文件正确写到 `%APPDATA%\小橘\companion.pid` ✅
- 单实例锁对打包版生效：再启第二个实例时，子进程识别到映像名为 `小橘.exe` 的同类已在运行 → 直接退出，不新增常驻进程 ✅
- 默认 emoji 模式（🐱），不依赖任何外部图片资源，开箱即用。

**注意：** 右键菜单「打开网页面板 / 伙伴设置 / 退出」与脚本版同源代码，本轮未做 GUI 点击级验证；图片 / GIF 模式的内置资源回退（`resource_path`）留待 phase-2 完善。

**后续 phase-2（未开工）：** 网页加「下载桌面悬浮伙伴」按钮 + 分发版 `web_url` 指向云端 + 云端按用户同步配置，形成「云端配置 ↔ 本地浮窗」闭环。

**修改/新增文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | 冻结安全（FROZEN/resource_path/%APPDATA% 数据目录/web_url）+ 单实例映像名适配 |
| `desktop/companion.spec` | 新增 PyInstaller 打包配置 |
| `package.json` | 新增 `companion:build` script |
| `.gitignore` | 忽略 `desktop/dist/`、`desktop/build/` |

---

### 2026-06-27 #28 — 桌面伙伴升级：计时 + 复盘 + 自动记日历 + 换形象 + 默认改名「小H」

**诉求：**
- 「我想要这个悬浮伙伴能给我计时，显示时间等，我可以简短复盘给他，它可以记录到日历里」
- 计时方式「两种都要」（正计时 + 倒计时可切换）；「登录后自动记日历」
- 「这个不要叫小橘，全部默认改为小H，用户自定义后改为叫用户自定义的名字」

**默认改名「小橘」→「小H」（保留用户自定义优先）：**
- 浮窗：`DEFAULT_CONFIG["nickname"]="小H"`、窗口标题/退出菜单/数据目录 `%APPDATA%\小H\`、打包产物 `小H.exe`；`_nickname()` 始终优先取用户在 `companion_config.json` 里的自定义昵称。
- 网页/文档：`partner-settings-form.tsx`、`api/partner/config/route.ts`、`companion/page.tsx`、`schema.sql`（`partner_config.nickname DEFAULT '小H'`）、`companion-start.bat`、`DESIGN.md` 默认值同步改为「小H」。历史 DEVLOG 中的「小橘」字样保留不改（仅记录历史）。

**计时 / 复盘 / 记日历（`desktop/companion.py`，纯标准库 urllib 直连 Supabase REST）：**
- **点击弹出计时面板**：单击浮窗弹出 270×380 卡片（可拖动、✕ 关闭）。区分点击与拖拽——移动 >5px 判为拖窗并存位置，否则视为点击开面板。
- **两种计时**：面板内切换「倒计时 / 正计时」。倒计时预设 15/25/45/60 分钟；正计时从 0 起。开始 / 暂停 / 重置；面板顶部大号显示用时（mm:ss）+「现在 HH:MM:SS」实时时钟。
- **后台续表**：计时基于时间戳（`timer_started_at` + `timer_base_elapsed`），关掉面板继续走表；浮窗名字栏实时显示「⏱ mm:ss」。倒计时到点自动结算。
- **结束 → 复盘 → 写日历**：点「结束」弹复盘框「🎉 已专注 X 分钟 ·「标题」已记入今天的日历」+ 一句话收获文本框。投入插入 `time_entries`（`title/duration_minutes/pomodoro_count=分钟//25/tags`），复盘文字 PATCH 回该条 `note`。created_at 由服务端 now() 落到当天，网页日历即时可见。不足 30 秒不记。
- **登录**：未登录时点结束先弹邮箱 + 密码登录窗（`/auth/v1/token` 密码授权，存 access/refresh token + user_id 到 `%APPDATA%\小H\companion_auth.json`，临期 <60s 自动 refresh），登录成功后接着记录。右键菜单显示登录邮箱 / 退出登录。
- 网络请求走 daemon 线程，`root.after(0,...)` 回主线程刷新 UI，不卡窗口。

**右键「换形象…」/「改名…」：**
- 换形象：`filedialog` 选本地 png/jpg/jpeg/gif → 复制到 `%APPDATA%\小H\avatar.ext` → 即时切换为图片 / GIF 模式（gif 逐帧播放）并存配置。让打包版 exe 也能自定义形象（绕开「网页上传图片与 exe 数据目录不通」的问题）。
- 改名：`simpledialog` 改昵称 → 更新窗口标题 + 名字栏，覆盖默认「小H」。

**重新打包 & 实测（PyInstaller 6.21.0 / Python 3.12.10）：**
- 产物 `desktop/dist/小H.exe`，28.4 MB，单文件；旧 `小橘.exe` 已删除。
- 实测：顶层窗口「小H · 桌面伙伴」可见；单实例锁对打包版生效（二次启动仍只 1 个可见窗口，`_expected_image_token()` 按 exe 映像名校验有效）；默认名为「小H」。

**注意：** 登录 / 计时 / 复盘 / 换形象为 tkinter 桌面 GUI，无 DOM 无法自动化点击，依赖 `py_compile`（exit=0）+ 与网页 `focus-timer.tsx` 的写库契约一致（同写 `time_entries`，字段对齐）保证正确性，待用户运行 exe 实测交互。

**修改 / 新增文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | 计时面板（正/倒计时 + 当前时间）+ 复盘记日历 + Supabase urllib 登录/刷新/写 time_entries/补 note + 换形象/改名 + 点击vs拖拽 + 默认名小H |
| `desktop/companion.spec` | 产物名 `小H` |
| `src/components/partner-settings-form.tsx` | 默认昵称/文案「小橘」→「小H」 |
| `src/app/api/partner/config/route.ts` | `DEFAULTS.nickname` → 「小H」 |
| `src/app/companion/page.tsx` | 默认昵称 → 「小H」 |
| `supabase/schema.sql` | `partner_config.nickname DEFAULT '小H'` |
| `companion-start.bat` | 启动/退出文案 → 「小H」 |
| `DESIGN.md` | 面板示意 → 「小H」 |

---

### 2026-06-27 #29 — 点击改随机语句 + 网页一键下载悬浮窗 + 线上网址 breadog.top + 面板对齐

**诉求：**
- 「不要点一下或者移到这个悬浮窗上就是专注计时的窗口，点一下应该是随机语句」
- 「要在网页端能让用户一键装好能启动悬浮窗」+「网站访问者能直接下载」
- 「悬浮窗打开网页端指向的应该也是部署好的网页」→ 线上地址 `breadog.top`
- 「那个面板的文字没对齐」

**改动（`desktop/companion.py`）：**
- **点击改随机语句**：左键单击浮窗不再打开计时面板，改为从 `CLICK_PHRASES`（15 句）随机蹦一句气泡（显示 2.5s）。计时面板移到**右键菜单「⏱ 开始专注」**打开。悬停本就无绑定，确认不会触发面板。闲置气泡里「点我开始专注吧」改为「右键我能开始专注哦」。
- **计时面板对齐**：状态/账号两行原本一个用 `side=tk.BOTTOM` 钉底造成空隙、文字未左对齐；改为统一 `anchor="w"` + `fill=X` + 自动换行，顺序往下排，左边缘与输入框/按钮对齐。
- **线上网址**：`DEFAULT_WEB_PANEL_URL` 由 `http://localhost:3000` 改为 `https://breadog.top`（`DEFAULT_CONFIG.web_url` 随之默认指向线上；本地可在 `companion_config.json` 覆盖回 localhost）。

**网页一键下载（架构说明）：** 云端网站受浏览器安全限制**无法替访问者自动启动**本地 exe，所以是「一键下载 → 双击运行」。
- 把打包好的 `小H.exe` 复制到 `public/download/xiaoh.exe`（随 Vercel 部署，CDN 直发，约 28MB）。
- 「伙伴设置」页新增**下载卡片**：`⬇ 下载 (.exe)` 按钮，相对链接 `/download/xiaoh.exe` + `download="小H桌面伙伴.exe"`（任何域名通用，下载文件名友好）；卡片说明使用方式 + Windows SmartScreen「更多信息→仍要运行」+「登录后才同步日历」。
- 原 Card 0 的本地「启动/关闭悬浮窗」按钮保留（仅本机跑 Next.js 时有效）。

**其它 URL 同步：** `src/app/companion/page.tsx`、`desktop/main.js`（备选 Electron）里残留的 `life-panel-phi.vercel.app` → `breadog.top`。

**重新打包 & 验证：** `py_compile` exit=0；重打包 `小H.exe`（28.4MB，PyInstaller 6.21.0）并同步到 `public/download/xiaoh.exe`；dev server（:3005）`/partner` 返回 200，`/download/xiaoh.exe` HEAD 200（`application/octet-stream`，28.4MB）。

**待用户操作：** 提交并推送（含 `public/download/xiaoh.exe` 二进制）→ Vercel 重新部署后，`https://breadog.top` 上的下载按钮才对线上访问者生效。

**修改 / 新增文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | 点击→随机语句（CLICK_PHRASES）、面板状态/账号左对齐、默认网址 breadog.top |
| `src/components/partner-settings-form.tsx` | 新增「下载桌面悬浮伙伴」卡片 |
| `public/download/xiaoh.exe` | 新增打包产物（供网页直接下载，28.4MB） |
| `src/app/companion/page.tsx` | 打开网页 URL → breadog.top |
| `desktop/main.js` | 备选 Electron 打开网页 URL → breadog.top |

---

### 2026-06-27 #30 — 浮窗去小字 + 计时面板整体左对齐

**诉求：**
- 「启动的时候只要显示名字就行了底下的小字不要」
- 「还是没有把右键悬浮窗面板上字对齐」

**改动（`desktop/companion.py`）：**
- **去小字**：删除浮窗角色名下方的 `hint_label`（原「点我开始专注 · 右键菜单」）。现在浮窗自上而下只有：气泡 → 角色 → 名字，名字底下不再有第二行提示文字。
- **面板整体左对齐**：上一版只修了状态/账号行，但大号计时数字 `00:00` 与下方时钟仍是**居中**，与「正在做什么 / 状态 / 账号」的**左对齐**不一致，看起来仍没对齐。本次把 `p_time`、`p_clock` 也加 `anchor="w"` + `fill=X`，全部文字共用一条左边缘。
- **关闭按钮垂直居中**：header 的 `✕` 补 `pady=6`，与标题「⏱ 专注计时」同一基线。

**重新打包 & 验证：** `py_compile` exit=0；重打包 `小H.exe`（29.8MB，PyInstaller，19:54）并同步到 `public/download/xiaoh.exe`。

**待用户操作：** 提交并推送（含更新后的 `public/download/xiaoh.exe`）→ Vercel 重新部署后线上下载即为新版。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | 删除 hint_label；计时面板 time/clock 左对齐；关闭按钮 pady 垂直居中 |
| `public/download/xiaoh.exe` | 更新打包产物（29.8MB） |

---

### 2026-06-27 #31 — 右键菜单对齐 + 悬浮窗 AI 聊天（带记忆库）

**诉求：**
- 「换形象 / 打开网页面板 文字没对齐，和前面的表情有留空」
- 「让这个悬浮窗能连接大模型和我聊天，且能记住我所说的，即有记忆库」

**改动（`desktop/companion.py`）：**

1. **右键菜单对齐** —— 之前菜单项前缀的 emoji（🖼️ ⚙️ 🖥️ 等带变体选择符）在 Windows 原生菜单里宽度不一致，且后面空格数 1/2 不统一，导致文字参差、emoji 后留空。改为**去掉全部 emoji、纯文字**，所有菜单项共用一条左边缘，彻底对齐。

2. **AI 聊天 + 记忆库** —— 右键菜单新增「和我聊天」，打开一个聊天窗口：
   - **复用网页 AI 配置**：登录后从 Supabase `ai_settings` 表（RLS 保护）读取 provider / api_key / api_base / model，支持 DeepSeek / 通义千问 / 智谱 / 豆包 / OpenAI（OpenAI 兼容 `/chat/completions`）和 Anthropic（`/v1/messages`）。未登录或未配置会给出引导提示。
   - **网络请求在后台线程**（复用 `run_async`），UI 不卡；发送时显示「正在输入…」。
   - **记忆库（持久化）**：对话存本地 `%APPDATA%\小H\companion_chat.json`，重启后仍记得聊过的内容；每次请求带「长期记忆摘要 + 最近 24 条」。对话变长（>超过阈值）时后台调用模型把更早的内容**压缩进长期记忆要点**（`summarized_upto` 游标增量摘要，不重复、不丢历史）。系统提示里注入这段记忆，让它「记住你说过的事」。
   - 窗口顶部「清空记忆」可一键清空记录与记忆（带应用内确认框）。
   - 人设：以伙伴昵称（小H）温暖、口语化、简短地陪聊。

**新增本地文件（运行时生成）：** `%APPDATA%\小H\companion_chat.json`（聊天记录 + 记忆，不入库）。

**验证：** `py_compile` exit=0；dev 脚本启动 5s 无崩溃；重打包 `小H.exe`（29.8MB）并同步到 `public/download/xiaoh.exe`。

**前置条件：** 需先**登录**（右键登录），并在网页「设置 → AI 智能设置」里填好模型和 API Key，聊天才能调用模型。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | 右键菜单去 emoji 对齐；新增聊天窗口 + 记忆库 + 多厂商 LLM 调用 |
| `public/download/xiaoh.exe` | 更新打包产物（含聊天功能，29.8MB） |

---

### 2026-06-27 #32 — 修复聊天/登录/复盘窗口「打不了字」（键盘焦点）

**诉求：** 「现在无法打字聊天」——「和我聊天」窗口能打开，但点输入框也打不出字、键盘没反应。

**根因：** 主悬浮窗是 `overrideredirect(True)`（无边框、不在任务栏、Windows 不视其为"可激活窗口"）。它派生的子 Toplevel 在 Windows 上拿不到**操作系统级键盘焦点**——点击输入框只给了 Tk 内部焦点，但窗口本身没被系统"激活"，键盘事件不会送进来。`focus_set()` 仅请求 Tk 内部焦点，压不住这个问题。

**改动（`desktop/companion.py`）：**
- 新增 `_grab_keyboard(win, widget)` 辅助方法：`win.lift()` + `win.focus_force()` + `widget.focus_force()`，强制激活窗口并夺取键盘焦点；**立即 + `after(60)` + `after(200)` 各调一次**，避开"窗口尚未映射时 focus 被忽略"的时序竞争。
- 聊天窗口（`open_chat`）、登录窗口（`open_login`）、专注复盘窗口（`show_finish_frame`）的 `*.focus_set()` 全部改用 `_grab_keyboard(...)`。

**验证：** `py_compile` exit=0；重打包 `小H.exe`（29.8MB，21:04）并同步到 `public/download/xiaoh.exe`；新 exe 启动无崩溃（pid 存活）。键盘输入需用户在本机交互确认。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | 新增 `_grab_keyboard`；聊天/登录/复盘窗口强制夺取键盘焦点 |
| `public/download/xiaoh.exe` | 更新打包产物（含焦点修复，29.8MB） |

---

### 2026-06-27 #33 — 悬浮窗记忆库升级为 mem0 式「事实抽取 + 相关检索」

**诉求：** 「`https://github.com/mem0ai/mem0` 用这个仓库打造记忆库」。经评估三条路线（A 真·mem0 云后端代理 / B 本地 mem0 式记忆 / C 暂不动），用户选 **B 本地 mem0 式记忆（推荐）**——理由是「让用户能方便使用」：纯本地、零新依赖、不需要任何 API Key、不上云、exe 不变重，开箱即用。

**思路对齐 mem0 的核心范式（add + search），但全部用 Python 标准库实现，不嵌入 LLM/向量库：**
- **add（抽取离散事实）**：每轮对话后，后台用已配置的大模型把聊天里关于「用户本人」值得长期记住的信息，抽成一条条独立、自包含的中文事实（如「用户在备考研究生」），与已有记忆比对只产出新增/更新，去重合并进本地 fact store。取代旧的「把历史压缩成一坨摘要」。
- **search（按相关性检索注入）**：每次发消息时，用当前这句话做 query，对所有已记事实打相关性分，取 top-K 注入系统提示词，让模型"想起"最相关的几条，而不是把全部记忆一股脑塞进去。
- **检索打分无需向量库/embedding**：`_mem_tokens` 把字符串拆成「ASCII 词 + 中文单字 + 中文二元组」token 集合，query 与事实的 token 交集大小即相关分；分数为 0 时用最近的事实回填，保证基础上下文不丢。

**改动（`desktop/companion.py`）：**
- 新增 `FACT_EXTRACTION_INSTRUCTION`：指示模型严格只输出 JSON 数组形式的离散事实，无可记则输出 `[]`。
- `load_chat/save_chat` 改为存 `{messages, facts, summarized_upto}`；`facts` 为 `[{id,text,ts}]`。旧版单串 `memory` 摘要会经 `_facts_from_legacy_memory` 自动迁移成事实列表，老用户记忆不丢。
- 新增纯函数：`_mem_tokens` / `retrieve_facts`（search）/ `merge_facts`（add 去重合并，上限 200 条保留最近）/ `_norm_fact` / `_first_json_array` / `_parse_fact_list`（容错解析模型输出，兼容 ```json 围栏与杂散文本）。
- `_chat_maybe_extract` 取代 `_chat_maybe_summarize`：累计 ≥4 条新消息后后台抽取，解析失败不推进游标、下次重试。
- `_chat_system_prompt(query)` 改为按相关性注入检索到的事实；聊天窗口 header 新增「记得的事」入口（`_chat_show_memory` 只读查看已记事实，倒序最多 60 条），保留「清空记忆」。

**验证：** `py_compile` exit=0；编写临时单测覆盖 `_parse_fact_list` / `merge_facts` / `retrieve_facts` / 旧格式迁移共 13 项断言，全部 PASS（测试后已删除）；重打包 `小H.exe`（29,809,542 字节，21:18）并同步到 `public/download/xiaoh.exe`；新 exe 启动无崩溃。

**使用前提（沿用）：** 聊天/记忆需先登录，并在网页「设置 → AI 智能设置」配好模型与 API Key（事实抽取复用同一模型）。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | 记忆库改为 mem0 式 add+search；事实抽取/检索/去重/迁移/「记得的事」查看器 |
| `public/download/xiaoh.exe` | 更新打包产物（含 mem0 式记忆，29.8MB） |

---

### 2026-06-27 #34 — 悬浮窗三连修：打字焦点 / 启动崩溃 / 双窗口

**用户报的三个问题：**
1. 「还是打不了字」——聊天/登录/复盘窗口点了输入框仍无法输入。
2. 启动崩溃：`PermissionError: [Errno 13] ... '%APPDATA%\小H\companion.pid'`（写 PID 文件时直接挂掉）。
3. 单次启动竟弹出**两个**悬浮窗。

**根因串联：** 三个问题其实同源于「单实例守卫不可靠」。守卫此前依赖 `companion.pid` 文件——
- 它需要 `%APPDATA%\小H\companion.pid` **可写**，写失败就崩（问题 2）；
- 「先检查后写入」之间有时间窗，两次几乎同时的启动会双双通过检查 → 开出第二个窗口（问题 3）；
- 两个实例同时抢同一个 pid 文件，正是 `PermissionError`（文件被占用）的来源。

**改动（`desktop/companion.py`）：**
- **键盘焦点（问题 1）**：新增 `_win32_foreground(win)`，用 Win32 `AttachThreadInput`（把本线程输入队列附到当前前台线程，解除前台锁）+ `BringWindowToTop` + `SetForegroundWindow` + `SetActiveWindow` + `SetFocus` 强夺系统级前台；目标用 `GetAncestor(GA_ROOT)` 取顶层可激活窗口。`_grab_keyboard` 改为 `deiconify→lift→_win32_foreground→focus_force→focus_set`，并在 立即/`after(60)`/`after(200)`/`after(450)` 各跑一次；聊天输入框加 `<Button-1>` 点击重夺焦点。
- **启动崩溃（问题 2）**：`Companion.__init__` 写 PID 包 `try/except`——PID 仅供网页端探测/控制，写不进绝不能让伙伴崩。
- **双窗口（问题 3）**：单实例守卫改为 **Windows 命名内核互斥量**（`CreateMutexW` + `GetLastError()==ERROR_ALREADY_EXISTS(183)`）。互斥量由系统原子地只发给一个进程，不写磁盘、无"检查→写入"竞争窗，无论双击几次/谁启动都只活一个悬浮窗。PID 文件保留用于网页端启停探测（best-effort），并作为互斥量不可用时的兜底。

**验证：** `py_compile` exit=0；**清空 build/dist 后全新重打包** `小H.exe`（29,810,032 字节，22:29，与上版 29,812,051 字节不同→确为含新代码的全新构建）并同步到 `public/download/xiaoh.exe`。打字是否生效、是否只剩一个窗口需用户在本机单次启动交互确认。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | 新增 `_win32_foreground` 强夺前台；PID 写入 crash-safe；单实例守卫改为命名互斥量（PID 兜底） |
| `public/download/xiaoh.exe` | 更新打包产物（含三连修，29.8MB） |

---

### 2026-06-28 #35 — 打字焦点真正修复 + 聊天窗回退本地 + 可验证打包

**背景纠偏：** #34 自认为"焦点已修、互斥量已进 exe"，但用户实测：双击 `desktop/dist` 里的 exe，点「和我聊天」弹出的仍是**本地小窗口**——而当时源码的 `open_chat` 已经改成跳浏览器。两者矛盾说明 **#34 那几次"重打包"其实是空操作**：PyInstaller 缓存命中，exe 根本没含新代码。这也解释了"为什么前面怎么改都没用"——所有修复从未进过实际运行的 exe。

**两条主线：**
1. **让打包真正生效且可验证。** 加 `BUILD_TAG` 常量 + `--selftest` 入口：`小H.exe --selftest` 会把 `BUILD_TAG` 写到 exe 同目录的 `selftest.txt`。每次用 `--clean` 全新打包后，跑一次 `--selftest` 读文件比对，**用可执行结果证明 exe 确含最新源码**，不再靠"体积/时间戳变了"猜。
2. **聊天窗回退到本地 tkinter（去掉浏览器跳转）**，并修真正的焦点 bug。

**焦点真凶（关键技术修复）：** `_win32_foreground` 里所有 Win32 调用都**没声明 `argtypes/restype`**。64 位 Python 下 ctypes 默认把每个 `HWND` 当 32 位 `int`，**把真实的 64 位窗口句柄截断**，于是 `SetForegroundWindow/SetFocus/SetWindowPos` 全作用在垃圾句柄上、静默失败——这才是"点了输入框打不了字"的根因，而不是前台锁本身。
- 修法：为每个调用补全 `HWND=wintypes.HWND`（即 `c_void_p`）等签名；`GetWindowLongPtrW/SetWindowLongPtrW`（64 位指针宽度）带 `getattr` 兜底到 `*W`。
- 去掉 `keybd_event(Alt)` 模拟（有副作用）；`_grab_keyboard` 的重夺收敛到 idle/80/250/500ms，**删掉 1200/2800ms**（晚期重夺会在用户打字时把焦点抢走）。

**聊天窗：** `open_chat` 去掉 `webbrowser.open(...)` 跳转，恢复本地 tkinter 聊天窗；加"已开则 lift + 重夺焦点"短路，避免重复开窗。

**验证：** `py_compile` exit=0；`--clean` 全新打包（`Building EXE because EXE-00.toc is non existent`，29,814,504 字节）；`小H.exe --selftest` 写出 `selftest.txt == 2026-06-28-inapp-chat-focusfix-mutex`（= BUILD_TAG，**确认 exe 为最新源码**）；已同步到 `public/download/xiaoh.exe`。打字能否输入、是否单窗，仍需用户本机单次启动交互确认。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | `BUILD_TAG` + `--selftest`；`_win32_foreground` 补全 ctypes 签名修句柄截断、去 Alt；`_grab_keyboard` 收敛重夺时机；`open_chat` 回退本地聊天窗 + 已开短路 |
| `public/download/xiaoh.exe` | 重新打包同步（--clean 全新构建 + selftest 校验，29.8MB） |

---

### 2026-06-28 #36 — 下掉聊天功能 + 输入窗口改普通带标题栏窗口（彻底修打字）

**背景纠偏：** #35 自认为"补全 ctypes 签名修好句柄截断、打字应该好了"，但用户实测**仍然打不了字**。结合多轮反复，得出真正结论：聊天窗、专注面板、复盘窗都是 `overrideredirect(True)` 的**无边框窗口**——Win11 把这种窗口当成"气泡/提示"，**永远不允许它成为前台/活动窗口**。无论怎么用 `AttachThreadInput` / `SetForegroundWindow` 强夺，键盘事件都不会稳定送进去，**而且用户连"点一下窗口手动激活"这条退路都没有**（无边框窗点击也不会被系统激活）。ctypes 截断只是其中一环，不是根因。

**两件事：**
1. **彻底移除聊天功能**（用户决策："先不做聊天窗口，把这个功能先下掉"）：删掉菜单项「和我聊天」、整个聊天窗、所有 `_chat_*` 方法、`open_chat`、模块级 mem0/LLM plumbing（`AI_PROVIDERS`、`load_chat/save_chat/retrieve_facts/merge_facts` 等记忆事实库、`_http_post_json`、`supabase_get_ai_settings`、`llm_chat`），共删约 504 行。保留：专注计时 + 复盘记录 + 同步网页 + 登录。
2. **把需要打字的窗口改成带标题栏的普通窗口**（根治打字）：
   - `open_panel`（专注面板）：去掉 `overrideredirect(True)`，改 `title("⏱ 专注计时")` + `resizable(False)`，删掉自绘蓝色标题栏 + 拖拽逻辑（`_panel_press/_panel_motion`，已无引用），打开后 `_grab_keyboard` 把焦点落到「正在做什么」输入框。
   - `show_finish_frame`（复盘窗）：去掉 `overrideredirect(True)`，改 `title("复盘 · 记录收获")`。
   - 两个窗都加 `WM_DELETE_WINDOW` 协议，点系统关闭按钮时正确清空 `self.panel/finish_win`。
   - 登录窗本就是普通带标题栏窗口，保持不变。

**为什么这次能行：** 普通带标题栏窗口是系统认可的、可激活的应用窗口——即使程序化抢焦点失败，**用户也能直接点窗口/标题栏激活再打字**，这条退路是无边框窗口给不了的。`_win32_foreground/_grab_keyboard` 保留用于打开时自动置顶+落焦，对普通窗口无害。

**验证：** `py_compile` exit=0；`--clean` 全新打包（`Build complete!`，`小H.exe` 29,799,647 字节）；`小H.exe --selftest` 写出 `selftest.txt == 2026-06-28-decorated-input-windows-typing-fix`（= BUILD_TAG，**确认 exe 为最新源码**）；已同步到 `public/download/xiaoh.exe`。打字能否输入仍需用户本机交互确认（这次预期：面板/复盘窗会带系统标题栏，点输入框可直接打字）。

**皮肤/换形象与网页同步（回答用户提问）：** 当前换形象是**装包后用 exe 右键「换形象…」**选本地图片，写 `%APPDATA%\小H\companion_config.json`（纯本地）；网页「伙伴设置」改的存 Supabase `partner_config`。**两者目前互不相通**——exe 不会读网页配置，网页也读不到 exe 的本地图。若要"网页上改、悬浮窗自动同步"，需让 exe 定时拉取 Supabase `partner_config` 并下载图片落地（类似现在的登录 + time_entries 同步机制），属于下一步可做项，待用户确认范围。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | 删除聊天功能（约 504 行）；`open_panel`/`show_finish_frame` 去 `overrideredirect` 改普通带标题栏窗口；删 `_panel_press/_panel_motion`；加 `WM_DELETE_WINDOW`；面板自动落焦输入框；`BUILD_TAG` 更新 |
| `public/download/xiaoh.exe` | 重新打包同步（--clean 全新构建 + selftest 校验，29.8MB） |

---

### 2026-06-28 #37 — 碎碎念快记窗口 + 换形象统一为「桌面一套方案」

**用户诉求：** "要有一个窗口可以输入我的碎碎念，可以类似专注的形式多一个窗口，最好是有一个气泡我就能直接输入我的所想，然后直接同步至网页；换皮肤和换形象只要保留一套方案即可，让用户方便使用。" 经确认：外观只在悬浮窗右键改、碎碎念走右键菜单入口、网页端换形象那部分随之下掉。

**三件事：**
1. **新增「记点碎碎念」快记窗口**（仿专注面板的独立窗口）：右键菜单加「记点碎碎念」（在「开始专注」之上）→ `open_quicknote` 弹出带系统标题栏的普通装饰窗（橙色 `#ffb74d` 边框、`tk.Text(height=4)` 输入框）。输入想法后**回车直接保存**（`<Return>` 绑 `do_save` 并 `return "break"`；`<Shift-Return>` 留作换行），通过现有登录 token POST `/rest/v1/entries` 写 `{type:"text", content, source:"desktop"}`——**网页「笔记灵感库」即时可见**。未登录会提示先登录；保存成功后关窗并气泡提示「碎碎念已记下 ✨」。打开时 `_grab_keyboard` 自动落焦输入框。
2. **换形象统一为桌面一套方案**：把 `change_avatar` 从"只能选本地图片"升级为完整 chooser 窗口——3 列 **Emoji 预设网格**（9 个，与网页原预设一致，当前形象高亮）+ 底部「📁 选本地图片 / GIF…」。选 Emoji 走 `_pick_emoji`（设 `mode="emoji"`、清空 `image_path`）、选图走 `_pick_image_file`（复制到 `%APPDATA%\小H\avatar.<ext>`、设 image/gif 模式）。两者都 `save_config()` + `apply_config()` 即点即换、无需登录。这样换 emoji 与换图都收敛到桌面端，**网页不再承担外观编辑**。
3. **网页「伙伴设置」下掉全部外观编辑**：`partner-settings-form.tsx` 整体精简为三张卡——悬浮窗启停状态、下载（`/download/xiaoh.exe`，文案引导右键「记点碎碎念」「开始专注」）、以及「🎨 想换形象/皮肤？」说明卡（引导"在悬浮窗右键 →「换形象…」，即点即换、无需登录"）。删除预览/模式切换/Emoji 网格/上传/行为设置/保存条及相关 state 与 handler。

**验证：** `py_compile` exit=0；`node node_modules/typescript/bin/tsc --noEmit` exit=0（`npx` 被执行策略禁用，改直跑 tsc）；因用户正运行 `desktop/dist/小H.exe` 锁住文件，`--clean` 改 build 到 `desktop/dist_new`（`Build complete!`），`小H.exe --selftest` 写出 `selftest.txt == 2026-06-28-quicknote-desktop-skin-only`（= BUILD_TAG，**确认 exe 为最新源码**）；copy 到 `public/download/xiaoh.exe`（**29,802,391 字节 ≈ 29.8MB**）。碎碎念打字/回车同步、换形象 chooser（emoji + 本地图）仍需用户本机双击新 exe 实测。

**提醒：** `desktop/dist/小H.exe` 本地副本仍是旧版（被运行中进程锁定未覆盖）；测试请用 `public/download/xiaoh.exe` 的新版，或关闭运行中的小H后替换。线上下载更新需用户自行 git push + Vercel 重新部署。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `desktop/companion.py` | 新增 `AVATAR_PRESETS` + `supabase_insert_entry_note`；右键菜单加「记点碎碎念」；新增 `open_quicknote` 快记窗（回车写 entries source=desktop）；`change_avatar` 重写为 Emoji 网格 + 本地图 chooser，新增 `_pick_emoji`/`_pick_image_file`；`BUILD_TAG` 更新 |
| `src/components/partner-settings-form.tsx` | 下掉全部外观编辑（预览/模式/Emoji 网格/上传/行为/保存条），仅留启停 + 下载 + 换形象引导卡 |
| `public/download/xiaoh.exe` | 重新打包同步（--clean 构建到 dist_new 绕文件锁 + selftest 校验，29,802,391 字节） |

---

### 2026-06-28 #38 — 手机端：去掉伙伴栏 + 猫换小狗 + 自定义「添加到桌面」封面

**用户诉求：** "手机端不需要有伙伴栏"；"手机端能自定义这个添加到桌面的封面"（确认：上传自己的图片 + 概览首页加设置卡）；"把所有加载时和登录等界面的小猫 emoji 都换成小狗，换个可爱点的小狗"。

**三件事：**
1. **手机底部导航去掉「伙伴」**：`bottom-nav.tsx` 删掉 `/partner` 标签（手机底部现为 概览/笔记/计划/记账/统计 五项），清掉不再用的 `Settings` 图标导入。桌面端侧边栏仍保留伙伴设置入口。
2. **界面猫 emoji 全换小狗 🐶**：加载页、网页登录页、伙伴登录门、侧边栏头像、网页伙伴页（待机+展开）、桌面伙伴消息卡、伙伴设置状态文案里的 🐱 一律换成更可爱的 🐶。仅 `api/partner/config/route.ts` 的后端默认值不动（非界面，且与桌面端 `companion.py` 默认保持一致）。
3. **手机自定义「添加到桌面」封面**：概览首页新增 `AddToHomeCard` 设置卡——选一张图 → canvas 居中裁成 512×512 PNG → 上传到 Supabase Storage（复用 `uploadImage`/`entry_media` 公共桶）→ URL 存 `localStorage`（`homeIconUrl`）。新增客户端组件 `HomeScreenMeta`（挂在根 `layout.tsx`），读取该 URL 后向 `<head>` 注入 `apple-touch-icon`（iOS 添加到主屏幕用）、`icon`（安卓/标签）、`apple-mobile-web-app-*` meta、以及一份 blob 形式的 standalone manifest（安卓 Chrome）。改/清封面通过自定义事件 `homeicon:changed` 即时重注入。卡片内含 iOS/安卓添加步骤说明，并提示「iOS 改了封面要重新添加一次才生效」。

**实现要点 / 取舍：** 封面图永久存在 Supabase（公共 URL 稳定），选择记录用 `localStorage`（封面本就是按设备生效，免去新建数据库列/迁移）。注入走客户端组件而非 Next metadata，因为 Supabase 是前端 token 鉴权、服务端拿不到用户态，且本就是按设备自定义。

**验证：** `tsc --noEmit` exit=0（两次：去伙伴栏后、加封面功能后）；`next dev` 全部路由编译无报错；浏览器打开登录页确认 🐶 正常渲染、控制台无报错、`HomeScreenMeta` 全站挂载无异常。**未能本地验证**：上传到 Supabase Storage 的完整链路（需登录态 + 真机），以及 iOS/安卓「添加到主屏幕」用自定义封面（属真机行为）——这两步需用户登录后在手机上实测（eval 沙箱禁用 localStorage，无法在此驱动注入链路）。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/components/bottom-nav.tsx` | 删手机底部「伙伴」标签 + 清 `Settings` 导入 |
| `src/components/app-shell.tsx` / `auth-form.tsx` / `companion/companion-auth-gate.tsx` / `sidebar.tsx` / `companion/page.tsx` / `desktop-reflections.tsx` / `partner-settings-form.tsx` | 🐱 → 🐶 |
| `src/components/home-screen-meta.tsx` | 新增：按 `localStorage.homeIconUrl` 注入 apple-touch-icon / icon / manifest(blob) / iOS meta |
| `src/components/add-to-home-card.tsx` | 新增：概览首页「添加到桌面·自定义封面」卡（裁方形 + 上传 + 预览 + 移除 + 说明） |
| `src/app/layout.tsx` | 根布局挂载 `<HomeScreenMeta />` |
| `src/app/(main)/page.tsx` | 概览首页加入 `<AddToHomeCard />` |

### 2026-06-28 #39 — 小狗换柴犬全身 🐕 + 记账/灵感库分类支持用户自定义

**用户诉求：** "换个可爱点的小狗"（确认：换成 🐕 柴犬全身）；"给记账和灵感库的标签分类这种要能用户自定义板块"（确认：默认分类「完全可编辑」+「不要颜色」）。

**两件事：**
1. **全站小狗 🐶 → 🐕**：#38 换的圆脸 🐶 觉得不够可爱，统一换成柴犬全身 🐕。加载页、登录页 Logo、伙伴登录门、侧边栏头像、网页伙伴页、桌面复盘卡、伙伴设置文案共 11 处全部替换（Grep 确认无 🐶 残留）；后端默认值 `api/partner/config/route.ts` 仍不动。
2. **记账 / 笔记分类可自定义**：原来收支分类、笔记分类都是硬编码常量，现在像计划中心的「板块」一样可增删改。
   - **统一一张表** `user_categories`：用 `module`（`finance`/`entry`）+ `kind`（记账区分 `income`/`expense`，笔记为 NULL）区分，省去为每模块单独建表。`transactions.category` / `entries.category` 本就是自由字符串，分类表只维护「可选标签清单」，**删分类不影响历史记录**（旧值原样保留）。
   - **默认分类可编辑**：`useCategories` hook 首次进入发现该用户该模块空表时，把默认清单作为真实行 seed 进库，之后默认项也能改名/删除（对应「完全可编辑」）。
   - **不带颜色**：分类只存名字（对应「不要颜色」）。
   - **共享弹窗** `CategoryManager`：记账/笔记复用，列表内改名（onBlur/Enter 提交）、行内两步删除确认（满足项目「不用原生 confirm」约束）、底部新增。两页分类区都加了「管理分类」入口按钮。
   - **legacy 值保留**：picker 渲染时若当前选中分类已不在清单（被删/旧值），额外补一个 chip/option，编辑历史记录不丢原分类。

**实现要点 / 取舍：** seed-on-empty 让默认项可编辑；Next 默认 StrictMode 下 dev effect 双调用可能并发重复 seed，用 `seededForRef` 在判空后、insert 前同步置位规避（个人工具可接受残余风险）。

**验证：** `tsc --noEmit` exit=0；`next dev` 对 `/finance`、`/diary` 均「✓ Compiled」无报错；浏览器打开无应用层报错。**未能本地验证**：seed / 增删改的完整 Supabase 链路需登录态实跑——**用户须先在 Supabase SQL Editor 运行 `migrate-user-categories.sql`**，再登录真机/网页实测。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `supabase/migrate-user-categories.sql` | 新增：`user_categories` 表 + 索引 + RLS（需手动运行） |
| `src/types/database.ts` | 新增 `CategoryModule` / `CategoryKind` / `UserCategory` 类型 |
| `src/lib/use-categories.ts` | 新增：分类数据 hook（加载 / 首次 seed / add / rename / remove） |
| `src/components/category-manager.tsx` | 新增：共享分类管理弹窗 |
| `src/app/(main)/finance/page.tsx` | 接入自定义收支分类（去硬编码常量 + 管理入口 + legacy chip） |
| `src/app/(main)/diary/page.tsx` | 接入自定义笔记分类（去硬编码常量 + 管理入口 + legacy option） |
| 多处界面组件 | 🐶 → 🐕（共 11 处） |

### 2026-06-28 #40 — 修默认分类没导入 + 去掉数据统计板块 + 概览去掉桌面伙伴板块

**用户诉求：** "管理分类没有把默认的导入进去"；"目前不需要数据统计板块，直接不要这个板块"；"今日概览不需要来自桌面伙伴的板块"。

**1. 默认分类没导入（根因 + 修复）**：浏览器控制台显示对 Supabase 的请求是 `net::ERR_NAME_NOT_RESOLVED` / `ERR_INTERNET_DISCONNECTED`——也就是初始 `select` 因断网（或表不存在/RLS）直接失败。旧逻辑把「查询失败」当成「空表」，于是触发 seed 写默认分类，但 insert 同样失败；更糟的是 seed 前已经把 `seededForRef` 占住，导致**网络恢复后也不再补默认分类**。修复 `useCategories`：
- `select` 返回 `error` 时只打日志并 `setLoaded(true)` 返回，**不 seed**（避免把失败误判成空表）；
- seed 的 `insert` 若失败，**释放 `seededForRef`**（置回 null），下次加载可重试。
- 仍只在「确认为空数组」时才 seed，保留 StrictMode 防重复。
> 前提仍是：用户必须先在 Supabase 跑过 `migrate-user-categories.sql`，且网络能连到 Supabase；满足后首次进入即自动写入默认分类。

**2. 去掉「数据统计」板块**：删除 `/stats` 页面与目录，移除手机底部导航 + 桌面侧边栏的入口，并清掉两处未再使用的 `BarChart3` 导入。

**3. 今日概览去掉「桌面伙伴」板块**：首页 `(main)/page.tsx` 移除 `<DesktopReflections />` 渲染与导入，并删除已无人引用的 `desktop-reflections.tsx` 组件。

**验证：** `tsc --noEmit` exit=0（删页面后清掉 `.next/types` 里残留的 stats 生成桩）；dev server 重新编译 `/`、`/finance` 均 200 无报错（删除组件瞬间的 ModuleBuildError 为 HMR 过渡，重编译后消失）。**未能本地验证渲染态**：此沙箱当前连不上 Supabase（`ERR_INTERNET_DISCONNECTED`），登录态拉不起来，默认分类 seed/CRUD 仍需用户在能联网的环境登录后实测。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/lib/use-categories.ts` | 加固 seed：select 失败不 seed；insert 失败释放重试位 |
| `src/components/sidebar.tsx` / `bottom-nav.tsx` | 去 `/stats` 入口 + 清 `BarChart3` 导入 |
| `src/app/(main)/stats/page.tsx` | 删除（连同空目录） |
| `src/app/(main)/page.tsx` | 去掉 `<DesktopReflections />` 渲染与导入 |
| `src/components/desktop-reflections.tsx` | 删除（已无引用） |

### 2026-06-28 #41 — 日历日程规划改造 + 去掉提醒备忘 + 概览显示新建日程

**用户诉求：** "日历板块中可以记一笔是前一天的日程规划用不同颜色和当日专注来区分，点击可去专注或者划去或打勾可以已完成变成和专注结束后一样，专注结束/点完成就变成专注记录和完成记录，去除提醒和备忘板块，把新建日程显示在今日概览上。" 经确认三个设计点（均选推荐）：①数据用 `time_entries` 加 `status` 列实现；②划去 = 标记取消并划线保留（可恢复/删除），不直接删数据；③今日概览卡带操作按钮（去专注/完成/划去）。

**数据模型（核心）：** 给 `time_entries` 加一列 `status`——
- `planned` = 待完成的日程规划（琥珀/橙色，可去专注 / 打勾完成 / 划去）；
- `done` = 已完成的专注 / 记录（蓝色，旧逻辑）；
- `cancelled` = 已划去（灰色划线保留）。
- 旧数据 `status` 为 NULL，应用层一律视为 `done`（判别函数 `isPlanned/isCancelled/isDone`）。日程规划落到哪一天由 `created_at` 决定，因此**可记未来某天的规划**（提前安排）。

**四件事：**
1. **日历「记一笔」支持两态**：补记表单加「📌 日程规划（待做） / ✅ 已完成记录」切换。选中今天/未来默认当作日程规划（写 `status:"planned"`），过去默认当作已完成记录（`status:"done"`）。月历格用颜色区分：蓝色深浅 = 当天已完成专注时长；格子右上 `●` 橙点 = 当天有待完成的日程规划。当日详情拆成三段——「📌 待完成的日程规划」（琥珀卡）/「⏱ 已完成记录」（蓝卡，含复盘）/「🚫 已划去」（灰卡 line-through，可恢复/删除）。
2. **点击规划三动作**：每条日程规划卡带「去专注 / 完成 / 划去」按钮。去专注 → 跳「专注计时」并带入该规划；打勾完成 → `status:"done"`（即刻变成已完成记录）；划去 → `status:"cancelled"`（灰色划线保留，可恢复 `RotateCcw` 或彻底删除 `Trash2`，行内二次确认）。
3. **专注结束 = 把规划就地转成完成记录**：从规划点「去专注」时，把该 `planned` 行的 id 透传给 `FocusTimer`（`preselectPlan` + `planIdRef`）。专注结束 `finish()` 时，若来自规划则 **UPDATE 这一行**（`status:"done"` + 真实时长 + `created_at=now()`）而非新建——实现「专注结束就变成专注记录」，不产生重复条目。跨页（今日概览→专注）用 query 跳转 `/plan?focusPlan=<id>&t=<title>&n=<nodeId>`，plan 页用 `window.location.search` 读取后 `replaceState` 清 URL。
4. **去除「提醒 / 备忘」板块**：删除 `reminder-drawer.tsx` 组件及计划中心页头的「提醒 / 备忘」入口按钮与抽屉。计划中心 Tab 仍为 技能树 / 专注计时 / 日历。
5. **今日概览显示新建日程**：`ScheduleCard` 改为查询今日全部 `time_entries`，分「待完成的日程规划」（琥珀卡 + 去专注/完成/划去三按钮）与「已完成」（蓝色时间徽 + 标题 + 时长，只读）；`cancelled` 不在首页显示；空态「✨ 今天还没有安排～」。

**验证：** `node node_modules/typescript/bin/tsc --noEmit` exit=0；dev server 重新编译 `/plan`、`/` 均返回 200，无报错。**未能本地验证渲染/数据态**：此沙箱连不上 Supabase（`ERR_INTERNET_DISCONNECTED`），登录态与 CRUD（记规划 / 去专注转完成 / 划去恢复 / 概览操作）需用户在能联网的环境登录后实测。

**使用前需要做：** 在 Supabase SQL Editor 运行 `supabase/migrate-plan-schedule.sql`（给 `time_entries` 加 `status` 列）。不运行则「记一笔」选日程规划 / 打勾完成会报错（提示已内置）。

**修改 / 新增文件：**
| 文件 | 操作 |
|------|------|
| `supabase/migrate-plan-schedule.sql` | 新增：`ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS status TEXT`（需手动运行） |
| `src/types/database.ts` | 新增 `TimeEntryStatus`；`TimeEntry` 加 `status?` |
| `src/components/plan/plan-calendar.tsx` | 记一笔规划/记录切换 + 三动作（去专注/完成/划去）+ 恢复 + 颜色区分 + 三段当日详情 |
| `src/components/plan/focus-timer.tsx` | `preselectPlan`/`planIdRef`；`finish()` 来自规划则就地 UPDATE 转 done；今日列表只显示 done |
| `src/app/(main)/plan/page.tsx` | 去掉提醒抽屉；串联 `startFocusForPlan` + 读 query 跳转 |
| `src/components/schedule-card.tsx` | 今日规划带操作按钮 + 已完成只读；去专注跳 `/plan?focusPlan=` |
| `src/components/reminder-drawer.tsx` | 删除（去除提醒/备忘板块） |

---

### 2026-06-28 #42 — 实验室板块上线 + 智能题库（文档出题 / 自测 / 模拟卷 / 考试）+ 内测共享 API

**用户诉求：** "加一个灵感板块，里面可以内置很多我想做的小 demo 功能，我 2994811601@qq.com 为管理员账号，可以有很多内测小玩意儿，也可以设置里面内测板块其他用户的大模型 API 用我的。第一个功能：上传 word/txt 文档或文字，可以选择出多少道选择题/多选题/判断题进行自测，会解析并判断对错，还有出模拟卷功能和考试功能。" 经确认四个设计点（均选推荐）：①板块命名「实验室（Lab）」；②内测「全员可见 + 管理员开关 + 自有 Key 优先回退管理员 Key」；③文档支持「粘贴文字 + .txt + .docx」；④功能「自测 + 模拟卷 + 考试全做」。

**实验室框架：**
- 新增路由 `/lab`（实验室首页，demos 数组驱动，可继续扩展更多小工具）、`/lab/quiz`（智能题库）、`/lab/beta`（内测设置，仅管理员可见）。
- 侧边栏（记账后、伙伴设置前）+ 手机底栏（第 5 项）加「实验室」入口，图标 `FlaskConical`。
- **管理员仅按 email 判别**（`src/lib/admin.ts` 的 `ADMIN_EMAIL`/`isAdmin`），**密码绝不硬编码**。

**内测共享 API（Key 不下发前端）：**
- 管理员在 `/lab/beta` 有总开关「把我的 API 借给大家用」，写入 `beta_config`。
- 服务端 `resolveAIConfig`（`src/lib/ai-server.ts`，service-role 绕过 RLS）：**用户自有 Key 优先** → 否则当 `beta_config.share_api_enabled` 为真且校验 `admin_user_id` 邮箱确为管理员时，回退用管理员 Key（`usedAdmin:true`）。Key 仅在服务端使用，绝不下发前端。
- RLS 双保险：`beta_config` 读限 `authenticated`（仅布尔不含 Key），写限 `auth.uid()=admin_user_id AND email=管理员邮箱`。

**智能题库（第一个内测工具）：**
1. **录入与配置**：文本域粘贴 + 上传 `.txt`（`file.text()`）/ `.docx`（`mammoth/mammoth.browser` 浏览器端 `extractRawText`）；三个数字框选单选/多选/判断题数（0~30，默认 5/0/0）。
2. **AI 出题**：前端取 `session.access_token` → `POST /api/lab/quiz/generate`；服务端 `generateQuizJSON` 调用 LLM（OpenAI 兼容用 `response_format:json_object`，anthropic 用 `/v1/messages`），返回**带正确答案下标 + 解析**的规范化题目（判断题 options 固定 `["正确","错误"]`，单选/判断 answer 取 1 个，越界/重复过滤）。
3. **本地判分**（不再额外调 AI）：`gradeQuestion` 排序后数组完全相等即对。自测模式每题「查看解析」即时显示 ✅/❌ + 正确项高亮 + explanation；考试模式顶部倒计时（题数 ×1.5 分钟，到点自动交卷），过程不显示对错，交卷后统一计分 + 逐题回顾。
4. **模拟卷**：出题后可「保存为模拟卷」（存 `quiz_papers`，含题目 JSONB + 三类题数），「我的模拟卷」列表可复用做自测/考试，**删除走应用内行内二次确认**（不用 `window.confirm`）。
5. **作答记录**：自测/考试交卷写 `quiz_attempts`（mode/score/total/answers，考试附 duration）。

**验证：** `node node_modules/typescript/bin/tsc --noEmit` exit=0；dev server 编译 `/lab`、`/lab/quiz`、`/lab/beta` 均返回 200，无报错。**未能本地验证联网 AI 出题与 CRUD**：需用户在能联网且已登录的环境，并先跑迁移后实测。

**使用前需要做：** 在 Supabase SQL Editor 运行 `supabase/migrate-lab-quiz.sql`（建 `beta_config` / `quiz_papers` / `quiz_attempts` 三表，IF NOT EXISTS + RLS）。另需保证管理员账号在「AI 智能设置」配置了可用的 API Key，内测共享才有 Key 可借。

**修改 / 新增文件：**
| 文件 | 操作 |
|------|------|
| `supabase/migrate-lab-quiz.sql` | 新增：三表迁移（需手动运行） |
| `src/types/database.ts` | 新增 `BetaConfig`/`QuizQuestion`/`QuizPaper`/`QuizAttempt` 等类型 |
| `src/lib/admin.ts` | 新增：`ADMIN_EMAIL` + `isAdmin`（仅 email 判别） |
| `src/lib/doc-extract.ts` | 新增：`extractText`（.docx → mammoth，其它 → file.text） |
| `src/types/mammoth.d.ts` | 新增：mammoth.browser ambient 声明 |
| `src/lib/ai-server.ts` | 新增：`resolveAIConfig`（共享回退）+ `generateQuizJSON`（出题+规范化） |
| `src/app/api/lab/quiz/generate/route.ts` | 新增：出题 API（service-role 鉴权） |
| `src/app/(main)/lab/page.tsx` | 新增：实验室首页（demos + 管理员入口） |
| `src/app/(main)/lab/beta/page.tsx` | 新增：内测设置（isAdmin gate + 共享开关） |
| `src/app/(main)/lab/quiz/page.tsx` | 新增：智能题库薄壳页 |
| `src/components/lab/quiz-tool.tsx` | 新增：录入配置/操作区/我的模拟卷列表 |
| `src/components/lab/quiz-runner.tsx` | 新增：自测/考试答题器 + 本地判分 + 写 quiz_attempts |
| `src/components/sidebar.tsx` / `src/components/bottom-nav.tsx` | 加「实验室」入口 |
| `package.json` | 加依赖 `mammoth ^1.12.0` |

---

### 2026-06-28 #43 — 智能题库增强：抽题组卷（勾选 / 随机抽题 → 组小卷 / 自测 / 考试）

**用户诉求：** "最好是通过一份资料能直接有一个题库，可以选择从中选择几道题抽出来进行组卷或自测。" 即：一份资料生成题量稍大的题库，再从中抽几道题组卷或自测/考试。经确认两个设计点（均选推荐）：①抽题方式「勾选 + 随机都支持」；②题库存储「复用现有模拟卷列表」（大题库也存进 `quiz_papers`，从中抽题组小卷，**不新建表 / 不加迁移**）。

**做法：**
- `quiz-tool` 状态机由三阶段扩展为四阶段：`config | ready | select | running`，新增 `select`（抽题组卷）阶段。
- 入口两处：①出题后「操作区」加「抽题组卷」按钮 → `openPicker(questions, null, "ready")`；②「我的模拟卷」每张卡加「抽题」按钮 → `openPicker(paper.questions, paper.id, "config")`。返回时回到各自来源阶段。
- 新增 `QuizPicker` 组件（`src/components/lab/quiz-picker.tsx`）：
  - **手动勾选**：题目列表逐题点选（`Set<string>` 存 id，保留题库原顺序），全选 / 清空工具条 + 实时已选统计。
  - **随机抽取**：三个数字框分别填单/多/判抽取数（上限=题库各类可用数），按类型 Fisher-Yates 洗牌后抽取，覆盖当前勾选。
  - **三个出口**：自测选中题 / 考试选中题（复用 `QuizRunner`，考试限时按选中题数 ×1.5 分钟）/ 组卷（`insert quiz_papers` 存为新模拟卷，可自定义卷名）。未选题时三按钮禁用。
- `quiz-tool` 抽出 `insertPaper(qs, title)` 复用于「保存为模拟卷」与 picker 组卷；`handleSavePaper` 改为调用它。
- `ready` 阶段补提示文案：多出几道题即可攒成大题库，再从里面抽小卷。

**验证：** `node node_modules/typescript/bin/tsc --noEmit` exit=0；dev server 编译 `/lab/quiz` 返回 200。本地判分 / 复用 `QuizRunner` 逻辑不变，无需新迁移。

**修改 / 新增文件：**
| 文件 | 操作 |
|------|------|
| `src/components/lab/quiz-picker.tsx` | 新增：抽题组卷面板（勾选 + 随机抽取 → 自测 / 考试 / 组卷） |
| `src/components/lab/quiz-tool.tsx` | 修改：加 `select` 阶段 + `openPicker`/`insertPaper`；ready 区与模拟卷卡加入口按钮 |

---

### 2026-06-28 #44 — 今日概览精简 + 晨间简报卡（今日大事 / 金融指数 / 微博热搜）

**用户诉求：** ①今日日程只有"安排了日程规划"时才在今日概览显示；②今日概览去掉番茄钟和"今天学到了什么"；③给今日概览加一个每日晨间信息推送，能抓网上的今日大事/金融/新闻。

**精简今日概览：**
- `src/app/(main)/page.tsx` 移除 `PomodoroCard` 与 `QuickReflection`，改为单列堆叠。
- `schedule-card.tsx`：`planned.length === 0`（含 loading）时整卡 `return null`，去掉"今天还没有安排～"空态——只有存在待完成日程规划才显示。

**晨间简报（页面内拉取式，无需 cron/工作流）：** 经确认推送形式选「页面内晨间简报卡」，内容选 今日大事(60秒) / 金融指数 / 微博热搜，暂不加 AI 寄语。
- 服务端路由 `src/app/api/morning/briefing/route.ts`（`revalidate=1800`）打开首页时由服务器并行拉取三源（`Promise.allSettled`，单源失败不影响整卡），各源 `fetch` 自带缓存，绕开浏览器跨域/防盗链：
  - 今日大事 → `60s.viki.moe/v2/60s`（news[] + date/tip/lunar/weekday）
  - 金融指数 → 新浪 `hq.sinajs.cn`（带 Referer，latin1 解析数字字段，名称本地硬编码，规避 GBK）：上证/深证/创业板，算涨跌幅
  - 微博热搜 → `60s.viki.moe/v2/weibo`（取前 10）
- 客户端卡 `src/components/morning-briefing.tsx`：渐变卡头（🌅 + 日期/星期/农历 + 刷新），当天首开自动展开、之后默认收起（localStorage 记当天已看），收起时露一句 tip 预览；金融指数涨红跌绿、今日大事可"查看全部 15 条"、热搜可点链接。

**验证：** `tsc --noEmit` exit=0；`/` 返回 200；`/api/morning/briefing` 返回 200，实测 finance(3 指数含涨跌幅) / hot(10 条) / news(15 条) 均正常。三源均为第三方公开免费接口，已做单源失败兜底。

**修改 / 新增文件：**
| 文件 | 操作 |
|------|------|
| `src/app/api/morning/briefing/route.ts` | 新增：晨间简报聚合 API（60秒 / 新浪行情 / 微博热搜 + 缓存 + 兜底） |
| `src/components/morning-briefing.tsx` | 新增：晨间简报卡（可展开/收起 + 三块内容） |
| `src/app/(main)/page.tsx` | 修改：移除番茄钟/快捷复盘，加入晨间简报卡 |
| `src/components/schedule-card.tsx` | 修改：无待完成日程时不显示 |

---

### 2026-06-28 #45 — 晨间简报：金融指数 → GitHub 热门新仓库

**用户诉求：** 金融指数先不要，换成 GitHub 最新热度仓库概览。

**改动：**
- `src/app/api/morning/briefing/route.ts`：移除 `getFinance`（新浪行情），新增 `getGithub`——用 GitHub 官方 Search API `api.github.com/search/repositories?q=created:>近7天&sort=stars&order=desc&per_page=8`（带 `User-Agent` + `Accept: application/vnd.github+json`），取近一周新建、star 最高的 8 个仓库（名称/star 数/语言/简介/链接）。`GET` 返回结构由 `{ sixty, finance, hot }` 改为 `{ sixty, github, hot }`。
- `src/components/morning-briefing.tsx`：金融块替换为「GitHub 热门新仓库」块——序号（前 3 金色）+ 仓库名链接 + ⭐ star 数（`formatStars`，≥1000 显示 k），第二行显示语言（蓝）· 简介。类型 `Fin`→`Repo`、`Briefing.finance`→`github`、图标 `Github`（lucide-react 已不导出）→ `GitBranch`。

**验证：** `tsc --noEmit` exit=0；`/api/morning/briefing` 返回 200，本机（国内网络）`github` 为 `null` 属正常——api.github.com 被墙；线上 Vercel（美国）可正常拉取。已做"拉不到则不显示该块"兜底。今日大事 / 微博热搜 仍正常。

---

### 2026-06-28 #46 — 晨间简报：今日大事置顶 + 新增科技/金融领域新闻 + 板块重排

**用户诉求：** 把今日大事放最前面，加一个科技领域新闻，再放金融领域新闻，再放热搜，再放仓库。

**改动：**
- `src/app/api/morning/briefing/route.ts`：新增两个数据源——
  - `getTech()` → `60s.viki.moe/v2/it-news`（IT之家实时科技新闻），取前 6（标题 + 链接）。
  - `getFinanceNews()` → 新浪滚动新闻 `feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516`（lid=2516 财经，带 `Referer: finance.sina.com.cn`），取前 6（标题 + 链接）。
  - `GET` 并行拉取并按目标顺序返回 `{ sixty, tech, finance, hot, github }`。
- `src/components/morning-briefing.tsx`：新增 `type News`、`Briefing` 加 `tech`/`finance`，导入图标 `Cpu`（科技）/`TrendingUp`（金融）；JSX 五块重排为 **今日大事 → 科技领域 → 金融领域 → 微博热搜 → GitHub 热门新仓库**。科技块标题/链接 hover 蓝 `#1565c0`，金融块绿 `#2e7d32`。

**验证：** `tsc --noEmit` exit=0；`/api/morning/briefing` 返回 200，`keys=sixty,tech,finance,hot,github`，计数 sixty.news=15 / tech=6 / finance=6 / hot=10 / github=null（本机墙，线上正常）。

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/app/api/morning/briefing/route.ts` | 修改：新增 `getTech`(it-news) / `getFinanceNews`(新浪滚动)，重排返回顺序 |
| `src/components/morning-briefing.tsx` | 修改：新增科技/金融两块，板块重排 |

---

### 2026-06-28 #47 — 天气支持手动设置城市（修复 IP 定位到北京）

**用户诉求：** "我不是北京的但天气显示是北京的"。原因：天气走 viki `/v2/weather` 的 IP 自动定位，部分用户 IP 被解析到北京。

**改动（`src/components/greeting-bar.tsx`）：**
- 表头天气区改为可点击：点击弹出城市输入框（Enter 保存 / Esc 取消），保存的城市写入 `localStorage["weather-city"]`。
- 拉取逻辑 `loadWeather(city)`：有手动城市则按 `/v2/weather?query=城市` 查（实测 `?query=上海` 返回上海市），否则保持 `/v2/weather` 按真实 IP 自动定位。
- 无城市且未定位到天气时显示「设置城市」按钮。

**验证：** `tsc --noEmit` exit=0；viki `?query=上海` 实测 200（上海市 / 26° / 多云）。城市持久化到 localStorage，刷新后保持。

---

### 2026-06-29 #48 — 修复笔记灵感库搜索只能输入一个字

**用户诉求：** "笔记区搜索无法进行完整搜索，只能输入第一个字母"。

**根因（`src/app/(main)/diary/page.tsx`）：** 页面顶部 `if (loading) return <加载中...>` 会在 `loading` 为真时用整页 spinner 替换包括搜索框在内的全部内容。每敲一个字 → `setSearchQuery` 触发 `loadEntries` → `setLoading(true)` → 搜索框被卸载 → 数据回来后 `setLoading(false)` 重新挂载，焦点丢失，因此只能输一个字。

**改动：**
- 新增 `loaded` 状态，整页 spinner 改为 `if (loading && !loaded)`——只在首次加载时整页 loading，之后刷新数据保持布局与搜索框挂载，焦点不丢。
- 搜索加 300ms 防抖：新增 `debouncedSearch`，输入即时更新 `searchQuery`，查询用防抖值，避免每次按键都打 DB 及结果乱序。

**验证：** `tsc --noEmit` exit=0。（本机 dev server 启动失败，未做浏览器实测；逻辑层面焦点不再因整页卸载而丢失。）

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/app/(main)/diary/page.tsx` | 修改：整页 loading 仅首次触发 + 搜索防抖 |

---

### 2026-06-29 #49 — 笔记灵感库防误触：单击看详情 + 追记/评论

**用户诉求：** "笔记灵感库这里不要点一下直接就进入编辑界面了，特别容易误触，最好是可以对之前的笔记进行评论，也可以进行修改，但都不容易误触"。

**改动：**
- **防误触**：去掉时间轴卡片 / 瀑布流卡片外层 `onClick={startEdit}`（单击即进编辑是误触源），改为单击打开**只读详情弹窗** `EntryDetailModal`——完整展示内容/图片/链接/标签/分类，不可直接改动。
- **修改**：详情弹窗内提供显式「编辑」按钮 → 进入原编辑面板；需主动点按钮才能改，避免误触。
- **删除**：详情内删除按钮带**组件内二次确认**（点删除→显示"确定删除？"+取消/确认删除），不走 `window.confirm`（IDE webview 会自动确认导致误删）。
- **评论 / 追记**：新增 `entry_comments` 表（一对多，RLS 仅本人可读写）。详情弹窗底部为追记区：列表按时间正序显示历史追记（可单条删除），底部输入框 Enter 发送、Shift+Enter 换行。原笔记内容不变，追记独立沉淀后续想法。

**新增文件：**
| 文件 | 说明 |
|------|------|
| `supabase/migrate-entry-comments.sql` | 建 entry_comments 表 + 索引 + RLS |

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/types/database.ts` | 新增 `EntryComment` 接口 |
| `src/app/(main)/diary/page.tsx` | 卡片单击改为打开只读详情；新增 `EntryDetailModal`（编辑/删除二次确认/追记评论 CRUD） |

**上线前需做：** 在 Supabase SQL Editor 运行 `supabase/migrate-entry-comments.sql`。

**验证：** `tsc --noEmit` exit=0。

---

### 2026-06-29 #50 — 「添加到桌面」收起为概览页小入口

**用户诉求：** "添加到桌面这个功能能放一个稍微隐蔽的位置，一直放在今日概览不太好看"；后续："不再显示就找不到了再想改咋办，而且不要叫我的小窝，改成人生面板"。

**改动（`src/components/add-to-home-card.tsx`）：**
- 默认**收起态**：今日概览底部只露一行不显眼的小入口「📱 把人生面板添加到手机桌面 · 自定义封面 ›」，点一下才展开完整卡片。手机/电脑都能找到。
- 展开态右上角加「收起」箭头可随时收回；**小入口始终保留**，不会永久消失（不做「不再显示」，避免之后找不到无法再改）。
- 上传封面 / 换图 / 移除等原逻辑不变。

**品牌名统一（`src/components/sidebar.tsx`）：** 侧边栏 Logo「🌸 我的小窝」→「🌸 人生面板」。（手机「添加到桌面」的 App 名 `home-screen-meta.tsx` 早已是「人生面板」。）

**修改文件：**
| 文件 | 操作 |
|------|------|
| `src/components/add-to-home-card.tsx` | 默认收起为小入口 + 可展开/收起（保留入口，不永久隐藏）+ 文案改「人生面板」 |
| `src/components/sidebar.tsx` | Logo 改「人生面板」 |

**验证：** `tsc --noEmit` exit=0。

---

### 2026-06-29 #51 — 记账图表（月/年柱状图 + 分类扇形图）

**用户诉求：** "给记账搞个月份的柱状图，年份的柱状图，有扇形图也不错"。

**实现（无图表库，纯 CSS 柱状图 + conic-gradient 扇形图）：**
- **本月每日柱状图**：当前筛选月份按「日」聚合，每天一根**按分类堆叠**的柱子，看当月哪几天花得多、花在哪。
- **本年每月柱状图**：筛选月份所在整年的 12 个月，每月并排「收入 / 支出」两根**按分类堆叠**的柱（左收右支），当前月份的月份标签高亮。
- **分类扇形图**：本月按分类占比的环形图（conic-gradient + 中心镂空显示合计），右侧图例列出分类、占比、金额。
- **统一分类配色**：建立稳定的「分类 → 颜色」映射（按 kind 分别对整年分类排序固定取色），同一分类在每日柱 / 每月柱 / 扇形图里颜色一致。
- 顶部「支出 / 收入」切换：联动「每日柱状图 + 分类扇形图」；每月柱状图固定同时展示收支。
- 各图均有空状态提示。

**数据加载调整（`src/app/(main)/finance/page.tsx`）：**
- 年柱状图需要整年数据：`loadTransactions` 从「只查当月」改为「查筛选月份所在整年」，存入 `yearTx`。
- 当月流水改为从 `yearTx` 派生（`useMemo` 按 `filterMonth` 过滤），汇总卡片与账本列表逻辑不变。

**新增/修改文件：**
| 文件 | 操作 |
|------|------|
| `src/components/finance-charts.tsx` | 新增：三张图表组件（每日柱 / 每月柱 / 分类环形） |
| `src/app/(main)/finance/page.tsx` | 改为加载整年数据 + 派生当月 + 接入 `<FinanceCharts>` |

**验证：** `tsc --noEmit` exit=0。

---

### 2026-06-29 #52 — 用户管理 + 内测白名单（控制实验室访问 & 共享 API）

**用户诉求：** "我想要知道哪些用户登了我的网站，可以给他们安排内测的权限"。确认范围：① 用应用内管理页查看用户；② 内测白名单**同时**控制「实验室访问」与「共享 API Key 使用」。

**实现：**
- **新增白名单表 `beta_users`**（`supabase/migrate-beta-users.sql`）：每个被授权用户一行，`user_id` 唯一引用 `auth.users(... ON DELETE CASCADE)`。RLS：登录用户只能读到「自己是否在白名单」一行用于前端 gating；管理员邮箱可读全部 + 增删（实际写操作走服务端 service-role）。
- **管理后台 API `/api/admin/users`**（service-role + 校验 caller email === 管理员邮箱）：
  - `GET`：枚举全部注册用户（分页 `auth.admin.listUsers`），返回邮箱 / 注册时间 / 最近登录时间 + 是否在白名单，按最近登录倒序。
  - `POST`：`{ userId, enabled }` 切换某用户内测状态（开 → upsert `beta_users`，关 → delete）。
- **用户管理页 `/lab/users`**（仅管理员可见）：列出所有用户，每人一个「内测」开关（乐观更新 + 失败回滚），顶部显示总数 / 已开通数 + 刷新。入口加在实验室首页右上「用户管理」按钮（紧邻「内测设置」）。
- **实验室访问 gating（`src/app/(main)/lab/layout.tsx` 新增 client 布局）**：非管理员且不在白名单的用户访问 `/lab` 及任意子页，统一显示「实验室正在内测中」提示，不再能进入题库等功能。
- **共享 Key 白名单校验（`src/lib/ai-server.ts` 的 `resolveAIConfig`）**：在回退使用管理员共享 Key 前，校验请求者在 `beta_users` 或为管理员本人，否则返回 `null`（此前只要开了共享，任何登录用户都能蹭管理员 Key）。

**新增/修改文件：**
| 文件 | 操作 |
|------|------|
| `supabase/migrate-beta-users.sql` | 新增：`beta_users` 白名单表 + RLS |
| `src/app/api/admin/users/route.ts` | 新增：列用户 / 切换内测（service-role + 管理员校验） |
| `src/app/(main)/lab/users/page.tsx` | 新增：用户管理页（列表 + 内测开关） |
| `src/app/(main)/lab/layout.tsx` | 新增：非白名单非管理员 gating 实验室访问 |
| `src/app/(main)/lab/page.tsx` | 实验室首页加「用户管理」入口 |
| `src/lib/ai-server.ts` | `resolveAIConfig` 加 `beta_users` 白名单校验 |
| `src/types/database.ts` | 新增 `BetaUser` / `AdminUserRow` 类型 |

**上线前需做：** 在 Supabase SQL Editor 运行 `supabase/migrate-beta-users.sql`（以及尚未执行的 `supabase/migrate-entry-comments.sql`）。

**验证：** `tsc --noEmit` exit=0。

---

### 2026-06-29 #53 — 笔记私密隐藏（防尴尬 · 整天/单条 + 显示开关）

**用户诉求：** "可以选择将某一天我的笔记进行隐藏，即表面上看不到我写的什么，防止写了一些私密的我每次看都很尴尬"。确认范围：① 隐藏粒度「整天 + 单条都支持」；② 查看方式「一个『显示』开关」（无需密码，默认隐藏）。

**实现：**
- **新增字段 `entries.is_private`**（`supabase/migrate-entry-private.sql`，`BOOLEAN NOT NULL DEFAULT false` + 索引）。
- **默认遮罩**：私密笔记在时间轴 / 瀑布流里只显示一张虚线「🔒 这条笔记已隐藏」占位卡片，不展示任何内容 / 图片 / 标签，且不可点开。
- **一个全局「显示私密」开关**：仅当存在私密笔记时出现在标题栏（`显示私密 (N)` ↔ `隐藏私密`）。打开后私密笔记临时按正常卡片显示（带「🔒 私密（仅你可见）」标记），刷新页面后自动恢复隐藏。无需密码。
- **单条切换**：笔记详情弹窗底部新增「设为私密 / 取消私密」按钮。
- **整天批量**：时间轴每个日期标题右侧新增「🔒 隐藏这天 / 🔓 取消隐藏」，一键把那天全部笔记设为/取消私密（按 `user_id + entry_date` 批量更新，含未加载的）。
- 切换均**乐观更新**本地状态，编辑/新建逻辑不动（`is_private` 默认 false 且不被编辑保存覆盖）。

**新增/修改文件：**
| 文件 | 操作 |
|------|------|
| `supabase/migrate-entry-private.sql` | 新增：`entries.is_private` 字段 + 索引 |
| `src/types/database.ts` | `Entry` 加 `is_private?` |
| `src/app/(main)/diary/page.tsx` | 显示私密开关 + 单条/整天切换 + 卡片遮罩占位 + 详情私密按钮 |

**上线前需做：** 在 Supabase SQL Editor 运行 `supabase/migrate-entry-private.sql`。

**验证：** `tsc --noEmit` exit=0。

---

### 2026-06-29 #54 — 单条解除隐藏修复 + 内测/共享 API 权限拆分 + 内测设置并入用户管理

**用户诉求：** "没办法单条解除隐藏；用户管理和 api 权限要分开来，即可以选择给用户开通内测也可以选择给不给他共享 api，把那个内测设置直接和用户管理合并一下"。

**实现：**
- **修复单条解除隐藏**：私密笔记被遮罩后无法点开、只能开全局「显示私密」。现给虚线占位卡片右侧加「🔓 取消隐藏」按钮，直接调 `togglePrivate` 解除单条私密（时间轴 + 瀑布流两种卡片都加）。
- **内测 / 共享 API 拆成两个独立权限**（推翻 #52 的合并设计）：`beta_users` 由「一行 = 完整内测」改为两个独立布尔列 `lab_access`（可访问实验室）、`share_api`（可借用共享 Key），每个用户可分别开关。
  - 迁移用 default-true-then-false 技巧：`ADD COLUMN ... NOT NULL DEFAULT true` 把旧白名单行回填为 true（保留原完整内测行为），再 `ALTER COLUMN ... SET DEFAULT false` 让之后新行默认不授予、按需逐项开通。幂等可重跑。
  - `/api/admin/users` GET 返回每用户 `labAccess` / `shareApi`；POST 改为 `{ userId, field, enabled }` 按字段 upsert（只更新该列，新行另一列取默认 false，旧行另一列保留原值）。
  - gating 同步拆分：`lab/layout.tsx` 查 `lab_access`；`ai-server.ts` 的 `resolveAIConfig` 查 `share_api`。
- **内测设置并入用户管理**：删除独立的 `/lab/beta` 页，把全局「把我的 API 借给大家用」总开关搬到 `/lab/users` 顶部（写 `beta_config.share_api_enabled`）。用户列表每人两个开关：「内测」(lab_access) + 「共享 API」(share_api)，乐观更新 + 失败回滚。总开关关闭时给出提示（即使勾了某人共享 API 也暂不可用）。实验室首页移除「内测设置」入口，仅保留「用户管理」。

**新增/修改文件：**
| 文件 | 操作 |
|------|------|
| `supabase/migrate-beta-users.sql` | `beta_users` 加 `lab_access` / `share_api` 两列（default-true-then-false 回填） |
| `src/types/database.ts` | `BetaUser` 加两列；`AdminUserRow` 把 `isBeta` 换成 `labAccess` / `shareApi` |
| `src/app/api/admin/users/route.ts` | GET 返回两标志；POST 改为按 `field` 切换单项权限 |
| `src/app/(main)/lab/users/page.tsx` | 顶部并入全局共享总开关；每用户两个独立开关 |
| `src/app/(main)/lab/beta/page.tsx` | 删除（合并进用户管理） |
| `src/app/(main)/lab/page.tsx` | 移除「内测设置」入口 |
| `src/app/(main)/lab/layout.tsx` | gating 改查 `lab_access` |
| `src/lib/ai-server.ts` | `resolveAIConfig` 改查 `share_api` |
| `src/app/(main)/diary/page.tsx` | 私密占位卡片加「取消隐藏」按钮 |

**上线前需做：** 在 Supabase SQL Editor **重跑** `supabase/migrate-beta-users.sql`（加两列）；尚未执行的 `supabase/migrate-entry-private.sql`（#53）也要跑。

**验证：** `tsc --noEmit` exit=0。

---

### 2026-06-29 #55 — 管理员重置用户密码 + 意见反馈（用户提交 · 管理员回复）

**用户诉求：** "可以看到用户登录密码吗，要是用户忘记登录密码怎么办"（→ 加重置密码）；"用户能给管理账号提意见和反馈，加一个这个页面"。

**说明：** 密码以 bcrypt 哈希存储、明文不可见（含 service-role 也拿不到），故改为「管理员代设新密码」方案，绕开国内不稳的邮件链路。

**实现：**
- **管理员重置密码**：`/api/admin/users` 新增 `PATCH { userId, password }`，service-role 调 `auth.admin.updateUserById(userId, { password })`（服务端校验管理员身份 + 密码≥6 位）。用户管理页每行加「🔑 重置密码」按钮 → 应用内弹窗（非浏览器原生）输入新密码 → 成功后弹窗回显新密码，便于线下转告。
- **意见反馈（双向）**：新建 `feedback` 表。用户在 `/feedback` 提交建议/Bug，并看到自己的历史反馈与管理员回复（待回复/已回复状态）。管理员在 `/lab/feedback`「反馈箱」查看全部反馈（含提交者邮箱）、逐条回复，顶部显示待回复数。入口：用户侧在侧边栏底部用户区加「💌 意见反馈」图标；管理员侧在实验室首页加「反馈箱」入口。
  - 权限：`feedback` RLS —— 用户只能读/写自己的（`auth.uid() = user_id`），管理员邮箱可读写全部；管理员列表/回复走 `/api/admin/feedback`（service-role）。
- **重构**：把 `requireAdmin` / `listAllUsers` 抽到 `src/lib/admin-server.ts` 共享给 users / feedback 两个管理 API。

**新增/修改文件：**
| 文件 | 操作 |
|------|------|
| `supabase/migrate-feedback.sql` | 新建 `feedback` 表 + RLS（用户读写自己 / 管理员全权） |
| `src/lib/admin-server.ts` | 新增：共享 `requireAdmin` + `listAllUsers` |
| `src/app/api/admin/users/route.ts` | 改用共享 helper；新增 `PATCH` 重置密码 |
| `src/app/api/admin/feedback/route.ts` | 新增：GET 列出反馈 / POST 回复 |
| `src/app/(main)/feedback/page.tsx` | 新增：用户提交 + 历史 + 查看回复 |
| `src/app/(main)/lab/feedback/page.tsx` | 新增：管理员反馈箱（查看 + 回复） |
| `src/app/(main)/lab/users/page.tsx` | 每行加「重置密码」按钮 + 应用内弹窗 |
| `src/app/(main)/lab/page.tsx` | 实验室首页加「反馈箱」入口 |
| `src/components/sidebar.tsx` | 侧边栏底部用户区加「意见反馈」入口 |
| `src/types/database.ts` | 新增 `Feedback` / `AdminFeedbackRow` |

**上线前需做：** 在 Supabase SQL Editor 运行 `supabase/migrate-feedback.sql`。

**已知限制：** 反馈入口在桌面侧边栏底部用户区；移动端无用户/设置区（仅底部 5 Tab），暂只能通过 `/feedback` 网址访问，需要的话再补移动端入口。

**验证：** `tsc --noEmit` exit=0。

---

### 2026-06-29 #56 — 统一「设置」中心（桌面 + 移动端）

**用户诉求：** "给两个端都搞个设置区，包含添加到屏幕页面的设置，反馈入口，以及连接 ai 大模型的入口，都整理到设置里"。

**实现：**
- 新建设置中心 `/settings`，集中三项入口/设置：
  - **连接 AI 大模型** → `/settings/ai`
  - **意见反馈** → `/feedback`
  - **伙伴设置** → `/partner`
  - **添加到屏幕**：直接内嵌 `AddToHomeCard`（默认展开），在设置页即可上传/更换/移除主屏幕封面。
- **两端都有入口**：
  - 桌面侧边栏：把原「AI 智能设置」「伙伴设置」两项合并为单个「⚙️ 设置」导航项（二者改为设置中心内的卡片）；移除上一版加在侧边栏底部用户区的「意见反馈」小图标（已并入设置）。
  - 移动端底部导航：新增第 6 个 Tab「设置」（此前移动端无设置/用户区，反馈/AI 入口均不可达，现已解决）。
- **概览页瘦身**：移除概览页底部的「添加到屏幕」小入口（迁入设置中心，仍永久可达、可改封面）。

**新增/修改文件：**
| 文件 | 操作 |
|------|------|
| `src/app/(main)/settings/page.tsx` | 新增：设置中心（AI / 反馈 / 伙伴 链接卡 + 内嵌添加到屏幕卡） |
| `src/components/add-to-home-card.tsx` | 加 `defaultExpanded` 入参（设置页默认展开） |
| `src/app/(main)/page.tsx` | 概览页移除 `<AddToHomeCard />` |
| `src/components/sidebar.tsx` | 导航合并为「设置」；移除底部反馈小图标 |
| `src/components/bottom-nav.tsx` | 移动端新增「设置」Tab（共 6 个） |

**验证：** `tsc --noEmit` exit=0（无新增数据库迁移）。

---

### 2026-06-29 #57 — 设置中心细化（移动端隐藏伙伴 · 子页统一 · 返回键 · 去折叠）

**用户诉求（多轮）：** "手机端不需要有伙伴设置"；"把添加到桌面的形态和意见反馈和连接大模型一样"（统一为跳转卡片）；"都要有一个返回键能返回设置主页面"；"添加到桌面那个就不需要收起了"。

**实现：**
- **移动端隐藏伙伴设置**：桌面悬浮伙伴只在本机可用，移动端无意义。设置中心「伙伴设置」卡片改为 `hidden md:flex`，仅桌面显示。
- **添加到桌面改为独立子页**：与 AI / 反馈 一致，设置中心改为链接卡 → 跳转新建子页 `/settings/home-screen`（内嵌 `AddToHomeCard`）。
- **返回键**：新建 `BackToSettings` 组件（「← 返回设置」），加到 `/settings/ai`、`/settings/home-screen`、`/feedback`、`/partner` 四个子页顶部。
- **去掉折叠**：`AddToHomeCard` 移除收起/展开逻辑（独立子页后多余），进入即完整卡片；同步移除 `defaultExpanded` 入参。

**新增/修改文件：**
| 文件 | 操作 |
|------|------|
| `src/components/back-to-settings.tsx` | 新增：返回设置主页的小链接 |
| `src/app/(main)/settings/home-screen/page.tsx` | 新增：添加到桌面独立子页 |
| `src/app/(main)/settings/page.tsx` | 伙伴设置卡 `hidden md:flex`；添加到桌面改为链接卡 |
| `src/components/add-to-home-card.tsx` | 移除折叠逻辑与 `defaultExpanded` 入参 |
| `src/app/(main)/settings/ai/page.tsx` · `partner/page.tsx` · `feedback/page.tsx` | 顶部加返回键 |

**验证：** `tsc --noEmit` exit=0（无新增数据库迁移）。
