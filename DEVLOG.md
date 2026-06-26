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

### 2026-06-26 #11 — Vercel 部署成功 ✅

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
