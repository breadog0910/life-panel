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
