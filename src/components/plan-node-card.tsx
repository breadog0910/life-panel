"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { PlanNodeType, PlanNodeStatus } from "@/types/database";

export interface PlanNodeData {
  title: string;
  node_type: PlanNodeType;
  progress: number;
  status: PlanNodeStatus;
  deadline?: string;
  totalMinutes?: number;
  color?: string | null;
  categoryName?: string | null;
  hasChildren?: boolean;
  collapsed?: boolean;
  hiddenCount?: number;
  onToggleCollapse?: () => void;
  [key: string]: unknown;
}

const TYPE_STYLE: Record<
  PlanNodeType,
  { emoji: string; ring: string; bg: string; bar: string; label: string }
> = {
  wish: { emoji: "🌟", ring: "#f0b429", bg: "from-[#fff8e1] to-[#ffecb3]", bar: "#f0b429", label: "愿望" },
  goal: { emoji: "🎯", ring: "#42a5f5", bg: "from-[#e3f2fd] to-[#bbdefb]", bar: "#42a5f5", label: "目标" },
  task: { emoji: "✅", ring: "#66bb6a", bg: "from-[#e8f5e9] to-[#c8e6c9]", bar: "#66bb6a", label: "任务" },
};

const STATUS_DOT: Record<PlanNodeStatus, string> = {
  active: "bg-[#42a5f5]",
  completed: "bg-[#66bb6a]",
  abandoned: "bg-[#cfd8dc]",
};

export default function PlanNodeCard({ data, selected }: NodeProps) {
  const d = data as PlanNodeData;
  const style = TYPE_STYLE[d.node_type];
  const accent = d.color || style.ring; // 优先用自定义/板块色

  return (
    <div
      className={`relative rounded-xl border-2 bg-gradient-to-br ${style.bg} px-3 py-2.5 shadow-sm transition-all ${
        selected ? "ring-2 ring-[#1e88e5] ring-offset-2 scale-105" : ""
      } ${d.status === "abandoned" ? "opacity-50" : ""}`}
      style={{ width: d.node_type === "wish" ? 200 : 170, borderColor: accent }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#90a4ae] !w-2 !h-2" />

      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{style.emoji}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 text-[#5c6b7a] font-medium">
          {style.label}
        </span>
        {d.categoryName && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium truncate max-w-[60px]"
            style={{ backgroundColor: accent }}
          >
            {d.categoryName}
          </span>
        )}
        <span className={`ml-auto size-2 rounded-full ${STATUS_DOT[d.status]}`} />
      </div>

      <div
        className={`font-semibold text-[#1a3a5c] leading-snug ${
          d.node_type === "wish" ? "text-sm" : "text-xs"
        } ${d.status === "completed" ? "line-through opacity-60" : ""}`}
      >
        {d.title}
      </div>

      {/* 进度条 */}
      <div className="mt-2">
        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${d.progress}%`, backgroundColor: accent }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-[#5c6b7a]">{d.progress}%</span>
        {typeof d.totalMinutes === "number" && d.totalMinutes > 0 && (
          <span className="text-[10px] text-[#42a5f5]">⏱ {d.totalMinutes}分</span>
        )}
        {d.deadline && (
          <span className="text-[10px] text-[#90a4ae]">
            📅 {new Date(d.deadline).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[#90a4ae] !w-2 !h-2" />

      {/* 折叠/展开子树按钮 */}
      {d.hasChildren && (
        <button
          className="nodrag nopan absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white border shadow-sm text-[10px] text-[#5c6b7a] hover:bg-[#f5f9ff] transition-colors"
          style={{ borderColor: accent }}
          onClick={(e) => {
            e.stopPropagation();
            d.onToggleCollapse?.();
          }}
          title={d.collapsed ? "展开子树" : "收起子树"}
        >
          {d.collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
          {d.collapsed && d.hiddenCount ? d.hiddenCount : ""}
        </button>
      )}
    </div>
  );
}
