// 日记
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
export interface TimeEntry {
  id: string;
  user_id: string;
  title: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  pomodoro_count?: number;
  tags?: string[];
  created_at: string;
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
