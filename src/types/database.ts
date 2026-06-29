// 笔记灵感库（合并 diary + reflection）
export type EntryType = "text" | "image" | "link" | "video" | "note";
export type EntrySource = "desktop" | "web" | "mobile";

export interface Entry {
  id: string;
  user_id: string;
  type: EntryType;
  title?: string;
  content?: string;
  media_urls?: string[];
  link_url?: string;
  link_title?: string;
  link_description?: string;
  link_favicon?: string;
  mood?: "😊" | "😐" | "😢" | "😡";
  weather?: string;
  tags?: string[];
  category?: string;
  source: EntrySource;
  ai_summary?: string;
  ai_tags?: string[];
  ai_category?: string;
  is_private?: boolean;
  entry_date: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// 笔记追记 / 评论
export interface EntryComment {
  id: string;
  entry_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// AI 设置
export type AIProvider = "deepseek" | "qwen" | "glm" | "doubao" | "openai" | "anthropic";

export interface AISettings {
  id: string;
  user_id: string;
  provider: AIProvider;
  api_key?: string;
  api_base?: string;
  model?: string;
  auto_tag_enabled: boolean;
  auto_category_enabled: boolean;
  auto_summary_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// 日记（旧表，保留兼容）
export interface Diary {
  id: string;
  user_id: string;
  date: string;
  mood: "😊" | "😐" | "😢" | "😡";
  content: string;
  weather?: string;
  image_url?: string;
  tags?: string[];
  created_at: string;
}

// 时间安排 & 计时
// planned = 待完成的日程规划；done = 已完成专注/记录；cancelled = 划去（旧数据 null 视为 done）
export type TimeEntryStatus = "planned" | "done" | "cancelled";

export interface TimeEntry {
  id: string;
  user_id: string;
  title: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  pomodoro_count?: number;
  tags?: string[];
  node_id?: string;
  note?: string;
  status?: TimeEntryStatus | null;
  created_at: string;
}

// 计划中心 — 技能树节点
export type PlanNodeType = "wish" | "goal" | "task";
export type PlanNodeStatus = "active" | "completed" | "abandoned";

export interface PlanCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface PlanEdge {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  created_at: string;
}

export interface PlanNode {
  id: string;
  user_id: string;
  parent_id?: string | null;
  title: string;
  description?: string;
  node_type: PlanNodeType;
  progress: number;
  status: PlanNodeStatus;
  deadline?: string;
  pos_x: number;
  pos_y: number;
  color?: string;
  category_id?: string | null;
  collapsed?: boolean;
  created_at: string;
  updated_at: string;
}

// 复盘
export interface Reflection {
  id: string;
  user_id: string;
  content: string;
  mood: "😊" | "😐" | "😢" | "😡";
  source: "desktop" | "web";
  time_entry_id?: string;
  created_at: string;
}

// 记账
export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  note?: string;
  date: string;
  created_at: string;
}

// 目标
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  progress: number;
  deadline?: string;
  status: "active" | "completed" | "abandoned";
  created_at: string;
}

// 提醒
export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  trigger_time: string;
  repeat_rule: "daily" | "weekly" | "none";
  enabled: boolean;
  created_at: string;
}

// 悬浮伙伴设置
export interface PartnerConfig {
  id: string;
  user_id: string;
  character_id: string;
  nickname: string;
  skin: string;
  position_x: number;
  position_y: number;
}

// 用户自定义分类/板块（记账 + 笔记灵感库）
export type CategoryModule = "finance" | "entry";
export type CategoryKind = "income" | "expense";

export interface UserCategory {
  id: string;
  user_id: string;
  module: CategoryModule;
  kind?: CategoryKind | null;
  name: string;
  sort_order: number;
  created_at: string;
}

// 实验室 —— 内测共享配置
export interface BetaConfig {
  id: string;
  admin_user_id: string;
  share_api_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// 实验室 —— 内测白名单成员（两个独立权限）
export interface BetaUser {
  id: string;
  user_id: string;
  lab_access: boolean;
  share_api: boolean;
  created_at: string;
}

// 管理后台 —— 用户列表项
export interface AdminUserRow {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  labAccess: boolean;
  shareApi: boolean;
}

// 意见反馈
export interface Feedback {
  id: string;
  user_id: string;
  content: string;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
}

// 管理后台 —— 反馈列表项（含提交者邮箱）
export interface AdminFeedbackRow extends Feedback {
  email: string | null;
}

// 实验室 —— 智能题库
export type QuizQuestionType = "single" | "multiple" | "judge";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options: string[];          // 判断题为 ["正确", "错误"]
  answer: number[];           // 正确选项下标；单选/判断长度为 1
  explanation: string;
}

export interface QuizPaper {
  id: string;
  user_id: string;
  title: string;
  questions: QuizQuestion[];
  single_count: number;
  multiple_count: number;
  judge_count: number;
  created_at: string;
}

export type QuizMode = "selftest" | "exam";

export interface QuizAttempt {
  id: string;
  user_id: string;
  paper_id?: string | null;
  mode: QuizMode;
  answers: number[][];        // 每题用户选择的下标数组
  score: number;
  total: number;
  duration_seconds?: number | null;
  created_at: string;
}
