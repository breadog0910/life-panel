"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type EdgeProps,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Trash2, Save, X, Timer, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { PlanNode, PlanNodeType, PlanNodeStatus, PlanCategory } from "@/types/database";
import PlanNodeCard, { type PlanNodeData } from "@/components/plan-node-card";

const TYPE_LABELS: Record<PlanNodeType, string> = {
  wish: "🌟 愿望",
  goal: "🎯 目标",
  task: "✅ 任务",
};

const STATUS_LABELS: Record<PlanNodeStatus, string> = {
  active: "进行中",
  completed: "已完成",
  abandoned: "已放弃",
};

const COLOR_PALETTE = [
  "#42a5f5", "#66bb6a", "#f0b429", "#ef5350", "#ab47bc",
  "#26c6da", "#ff7043", "#8d6e63", "#ec407a", "#78909c",
];

const nodeTypes = { planNode: PlanNodeCard };

interface DeletableEdgeData {
  onDelete?: () => void;
  [key: string]: unknown;
}

// 自定义连线：选中后中点出现 × 按钮，点击才删除（避免误点直接删除）
function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const d = data as DeletableEdgeData | undefined;
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? "#ef5350" : ((style?.stroke as string) || "#90caf9"),
          strokeWidth: selected ? 3 : 2,
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <button
            className="nodrag nopan flex items-center justify-center size-5 rounded-full bg-[#ef5350] text-white text-sm leading-none shadow hover:bg-[#e53935] transition-colors"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            onClick={(e) => {
              e.stopPropagation();
              d?.onDelete?.();
            }}
            title="删除这条连线"
          >
            ×
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { deletable: DeletableEdge };

interface DbEdge {
  id: string;
  source: string;
  target: string;
}

export default function SkillTree({
  onStartTimer,
}: {
  onStartTimer: (nodeId: string, title: string) => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const dbNodesRef = useRef<PlanNode[]>([]);
  const dbEdgesRef = useRef<DbEdge[]>([]);
  const hasEdgeTableRef = useRef(false);
  const edgeDeleteRef = useRef<(edge: { id: string; source: string; target: string }) => void>(() => {});
  const minutesRef = useRef<Record<string, number>>({});
  const [categories, setCategories] = useState<PlanCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState<PlanNodeType>("goal");
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState<PlanNodeStatus>("active");
  const [editDeadline, setEditDeadline] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editColor, setEditColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 新建板块
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(COLOR_PALETTE[0]);

  const selectedNode = useMemo(
    () => dbNodesRef.current.find((n) => n.id === selectedId) || null,
    [selectedId, loading]
  );

  // 计算被折叠隐藏的节点（基于连线图，支持多父/多连）
  const computeHidden = useCallback((rows: PlanNode[], dbEdges: DbEdge[]) => {
    const childrenMap: Record<string, string[]> = {};
    const incoming: Record<string, number> = {};
    dbEdges.forEach((e) => {
      (childrenMap[e.source] ||= []).push(e.target);
      incoming[e.target] = (incoming[e.target] || 0) + 1;
    });

    const collapsed = new Set(rows.filter((n) => n.collapsed).map((n) => n.id));

    // 从「根」（无入边的节点）出发可见，遇到折叠节点则不再下探其子节点
    const roots = rows.filter((n) => !incoming[n.id]).map((n) => n.id);
    const visible = new Set<string>();
    const stack = [...roots];
    while (stack.length) {
      const id = stack.pop() as string;
      if (visible.has(id)) continue;
      visible.add(id);
      if (collapsed.has(id)) continue;
      (childrenMap[id] || []).forEach((c) => {
        if (!visible.has(c)) stack.push(c);
      });
    }

    // 折叠节点的下游里、且没有别的可见路径能到达的，判定为隐藏
    const hidden = new Set<string>();
    collapsed.forEach((cid) => {
      const st = [...(childrenMap[cid] || [])];
      const seen = new Set<string>();
      while (st.length) {
        const id = st.pop() as string;
        if (seen.has(id)) continue;
        seen.add(id);
        if (!visible.has(id)) hidden.add(id);
        (childrenMap[id] || []).forEach((c) => st.push(c));
      }
    });

    // 每个节点「因折叠而隐藏的后代数量」（用于 +N 提示）
    const hiddenDescCount: Record<string, number> = {};
    rows.forEach((n) => {
      const st = [...(childrenMap[n.id] || [])];
      const seen = new Set<string>();
      let cnt = 0;
      while (st.length) {
        const id = st.pop() as string;
        if (seen.has(id)) continue;
        seen.add(id);
        if (hidden.has(id)) cnt += 1;
        (childrenMap[id] || []).forEach((c) => st.push(c));
      }
      hiddenDescCount[n.id] = cnt;
    });

    return { hidden, childrenMap, descCount: hiddenDescCount };
  }, []);

  const toggleCollapse = useCallback(async (nodeId: string) => {
    const row = dbNodesRef.current.find((n) => n.id === nodeId);
    if (!row) return;
    const next = !row.collapsed;
    row.collapsed = next;
    await supabase.from("plan_nodes").update({ collapsed: next }).eq("id", nodeId);
    rebuild();
  }, []); // rebuild defined below via ref

  const rebuildRef = useRef<() => void>(() => {});

  const buildFlow = useCallback(
    (
      rows: PlanNode[],
      minutes: Record<string, number>,
      cats: PlanCategory[],
      activeCat: string | null,
      dbEdges: DbEdge[]
    ) => {
      const { hidden, childrenMap, descCount } = computeHidden(rows, dbEdges);
      const catMap: Record<string, PlanCategory> = {};
      cats.forEach((c) => (catMap[c.id] = c));

      const flowNodes: Node[] = rows
        .filter((n) => !hidden.has(n.id))
        .map((n) => {
          const cat = n.category_id ? catMap[n.category_id] : undefined;
          const color = n.color || cat?.color || null;
          const dim = activeCat && n.category_id !== activeCat;
          return {
            id: n.id,
            type: "planNode",
            position: { x: n.pos_x, y: n.pos_y },
            style: dim ? { opacity: 0.2 } : undefined,
            data: {
              title: n.title,
              node_type: n.node_type,
              progress: n.progress,
              status: n.status,
              deadline: n.deadline,
              totalMinutes: minutes[n.id] || 0,
              color,
              categoryName: cat?.name || null,
              hasChildren: (childrenMap[n.id]?.length || 0) > 0,
              collapsed: n.collapsed,
              hiddenCount: descCount[n.id] || 0,
              onToggleCollapse: () => toggleCollapse(n.id),
            } as PlanNodeData,
          };
        });

      const flowEdges: Edge[] = dbEdges
        .filter((e) => !hidden.has(e.source) && !hidden.has(e.target))
        .map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: "deletable",
          animated: true,
          style: { stroke: "#90caf9", strokeWidth: 2 },
          data: {
            onDelete: () => edgeDeleteRef.current({ id: e.id, source: e.source, target: e.target }),
          },
        }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    },
    [computeHidden, setNodes, setEdges, toggleCollapse]
  );

  const loadNodes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: rows }, { data: cats }, { data: times }, edgeRes] = await Promise.all([
      supabase.from("plan_nodes").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      supabase.from("plan_categories").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      supabase.from("time_entries").select("node_id, duration_minutes").eq("user_id", user.id).not("node_id", "is", null),
      supabase.from("plan_edges").select("*").eq("user_id", user.id),
    ]);

    const minutes: Record<string, number> = {};
    (times || []).forEach((t: { node_id: string | null; duration_minutes: number | null }) => {
      if (t.node_id) minutes[t.node_id] = (minutes[t.node_id] || 0) + (t.duration_minutes || 0);
    });

    dbNodesRef.current = (rows as PlanNode[]) || [];
    minutesRef.current = minutes;

    // plan_edges 可用则以它为准；否则回退到旧的 parent_id 派生连线
    let dbEdges: DbEdge[];
    if (!edgeRes.error && edgeRes.data) {
      hasEdgeTableRef.current = true;
      dbEdges = (edgeRes.data as { id: string; source_id: string; target_id: string }[]).map((e) => ({
        id: e.id,
        source: e.source_id,
        target: e.target_id,
      }));
    } else {
      hasEdgeTableRef.current = false;
      dbEdges = (dbNodesRef.current || [])
        .filter((n) => n.parent_id)
        .map((n) => ({ id: `pid-${n.id}`, source: n.parent_id as string, target: n.id }));
    }
    dbEdgesRef.current = dbEdges;

    const catList = (cats as PlanCategory[]) || [];
    setCategories(catList);
    buildFlow(dbNodesRef.current, minutes, catList, activeCategory, dbEdges);
    setLoading(false);
  }, [user, buildFlow, activeCategory]);

  // rebuild 使用最新引用
  rebuildRef.current = () =>
    buildFlow(dbNodesRef.current, minutesRef.current, categories, activeCategory, dbEdgesRef.current);
  const rebuild = useCallback(() => rebuildRef.current(), []);

  useEffect(() => {
    loadNodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 切换板块筛选时重建
  useEffect(() => {
    if (!loading) buildFlow(dbNodesRef.current, minutesRef.current, categories, activeCategory, dbEdgesRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // 选中节点时填充表单
  useEffect(() => {
    const n = dbNodesRef.current.find((x) => x.id === selectedId);
    if (n) {
      setEditTitle(n.title);
      setEditDesc(n.description || "");
      setEditType(n.node_type);
      setEditProgress(n.progress);
      setEditStatus(n.status);
      setEditDeadline(n.deadline || "");
      setEditCategoryId(n.category_id || null);
      setEditColor(n.color || null);
    }
    setNewCatOpen(false);
  }, [selectedId]);

  const onNodeDragStop = useCallback(async (_: unknown, node: Node) => {
    await supabase.from("plan_nodes").update({ pos_x: node.position.x, pos_y: node.position.y }).eq("id", node.id);
    const row = dbNodesRef.current.find((n) => n.id === node.id);
    if (row) {
      row.pos_x = node.position.x;
      row.pos_y = node.position.y;
    }
  }, []);

  const onConnect = useCallback(
    async (conn: Connection) => {
      if (!user || !conn.source || !conn.target || conn.source === conn.target) return;
      // 去重：已存在该连线则忽略
      if (dbEdgesRef.current.some((e) => e.source === conn.source && e.target === conn.target)) return;
      if (hasEdgeTableRef.current) {
        await supabase
          .from("plan_edges")
          .insert({ user_id: user.id, source_id: conn.source, target_id: conn.target });
      } else {
        // 回退：旧模型只能记一个父
        await supabase.from("plan_nodes").update({ parent_id: conn.source }).eq("id", conn.target);
      }
      loadNodes();
    },
    [user, loadNodes]
  );

  const removeEdge = useCallback(
    async (edge: { id: string; source: string; target: string }) => {
      if (hasEdgeTableRef.current && !edge.id.startsWith("pid-")) {
        await supabase.from("plan_edges").delete().eq("id", edge.id);
      } else {
        // 回退：旧模型清掉子节点的 parent_id
        await supabase.from("plan_nodes").update({ parent_id: null }).eq("id", edge.target);
      }
      loadNodes();
    },
    [loadNodes]
  );
  // 让自定义连线的 × 按钮拿到最新的删除逻辑
  edgeDeleteRef.current = removeEdge;

  // 键盘删除选中连线（需先选中再按删除键，属显式操作）
  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      deleted.forEach((edge) => removeEdge({ id: edge.id, source: edge.source, target: edge.target }));
    },
    [removeEdge]
  );

  const onNodeClick = useCallback((_: unknown, node: Node) => setSelectedId(node.id), []);

  const addRoot = async (type: PlanNodeType) => {
    if (!user) return;
    const { data } = await supabase
      .from("plan_nodes")
      .insert({
        user_id: user.id,
        title: type === "wish" ? "我的人生愿望" : "新目标",
        node_type: type,
        pos_x: 250 + Math.random() * 100,
        pos_y: 80 + Math.random() * 60,
      })
      .select()
      .single();
    await loadNodes();
    if (data) setSelectedId((data as PlanNode).id);
  };

  const addChild = async () => {
    if (!user || !selectedNode) return;
    const childType: PlanNodeType = selectedNode.node_type === "wish" ? "goal" : "task";
    const { data } = await supabase
      .from("plan_nodes")
      .insert({
        user_id: user.id,
        parent_id: selectedNode.id,
        title: childType === "goal" ? "子目标" : "具体任务",
        node_type: childType,
        category_id: selectedNode.category_id || null,
        pos_x: selectedNode.pos_x + (Math.random() * 200 - 100),
        pos_y: selectedNode.pos_y + 140,
      })
      .select()
      .single();
    if (data && hasEdgeTableRef.current) {
      await supabase
        .from("plan_edges")
        .insert({ user_id: user.id, source_id: selectedNode.id, target_id: (data as PlanNode).id });
    }
    await loadNodes();
    if (data) setSelectedId((data as PlanNode).id);
  };

  const handleSave = async () => {
    if (!selectedId || !editTitle.trim()) return;
    setSaving(true);
    await supabase
      .from("plan_nodes")
      .update({
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        node_type: editType,
        progress: editProgress,
        status: editStatus,
        deadline: editDeadline || null,
        category_id: editCategoryId,
        color: editColor,
      })
      .eq("id", selectedId);
    setSaving(false);
    await loadNodes();
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("确定删除该节点？其子节点也会一并删除。")) return;
    await supabase.from("plan_nodes").delete().eq("id", selectedId);
    setSelectedId(null);
    loadNodes();
  };

  const handleCreateCategory = async () => {
    if (!user || !newCatName.trim()) return;
    const { data } = await supabase
      .from("plan_categories")
      .insert({ user_id: user.id, name: newCatName.trim(), color: newCatColor })
      .select()
      .single();
    if (data) {
      const cat = data as PlanCategory;
      setCategories((prev) => [...prev, cat]);
      setEditCategoryId(cat.id);
    }
    setNewCatName("");
    setNewCatOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* 工具栏 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[#90a4ae] flex items-center gap-1">
            <Tag className="size-3" /> 板块
          </span>
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              activeCategory === null ? "bg-[#42a5f5] text-white" : "bg-[#f5f9ff] text-[#5c8dc9] hover:bg-[#e3f2fd]"
            }`}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
              className="text-xs px-2.5 py-1 rounded-full transition-all text-white"
              style={{ backgroundColor: c.color, opacity: activeCategory && activeCategory !== c.id ? 0.4 : 1 }}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => addRoot("wish")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium bg-[#f0b429] text-white hover:bg-[#e0a000] transition-colors"
          >
            <Plus className="size-4" /> 愿望
          </button>
          <button
            onClick={() => addRoot("goal")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
          >
            <Plus className="size-4" /> 目标
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        {/* 画布 */}
        <div
          className="flex-1 bg-white rounded-card border border-[#e3f2fd] overflow-hidden"
          style={{ height: "calc(100vh - 220px)", minHeight: 460 }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full text-[#90a4ae] text-sm">加载中...</div>
          ) : nodes.length === 0 && dbNodesRef.current.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#90a4ae] text-sm gap-2">
              <span className="text-3xl">🌟</span>
              <span>还没有任何节点</span>
              <span className="text-xs">点击右上角「愿望」或「目标」开始规划你的人生技能树</span>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeDragStop={onNodeDragStop}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgesDelete={onEdgesDelete}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#e3f2fd" gap={20} />
              <Controls />
              <MiniMap
                nodeColor={(n) => {
                  const t = (n.data as PlanNodeData)?.node_type;
                  const c = (n.data as PlanNodeData)?.color;
                  return c || (t === "wish" ? "#f0b429" : t === "goal" ? "#42a5f5" : "#66bb6a");
                }}
                className="!bg-[#f5f9ff]"
              />
            </ReactFlow>
          )}
        </div>

        {/* 侧边详情面板 */}
        {selectedNode && (
          <div
            className="w-72 bg-white rounded-card border border-[#e3f2fd] p-4 space-y-3 shrink-0 overflow-y-auto"
            style={{ height: "calc(100vh - 220px)", minHeight: 460 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1565c0] text-sm">节点详情</h3>
              <button onClick={() => setSelectedId(null)} className="text-[#90a4ae] hover:text-[#666]">
                <X className="size-4" />
              </button>
            </div>

            {/* 去计时 */}
            <button
              onClick={() => onStartTimer(selectedNode.id, selectedNode.title)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
            >
              <Timer className="size-4" /> 去专注计时
            </button>
            {(minutesRef.current[selectedNode.id] || 0) > 0 && (
              <div className="text-[11px] text-[#42a5f5] text-center">
                已累计投入 {minutesRef.current[selectedNode.id]} 分钟
              </div>
            )}

            {/* 标题 */}
            <div>
              <label className="text-xs text-[#90a4ae] mb-1 block">标题</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
              />
            </div>

            {/* 类型 */}
            <div>
              <label className="text-xs text-[#90a4ae] mb-1 block">类型</label>
              <div className="flex gap-1">
                {(["wish", "goal", "task"] as PlanNodeType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setEditType(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      editType === t ? "bg-[#e3f2fd] text-[#1565c0]" : "bg-[#f5f9ff] text-[#90a4ae]"
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* 板块 */}
            <div>
              <label className="text-xs text-[#90a4ae] mb-1 block">板块</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setEditCategoryId(null)}
                  className={`text-xs px-2 py-1 rounded-full transition-all ${
                    editCategoryId === null ? "bg-[#e3f2fd] text-[#1565c0]" : "bg-[#f5f9ff] text-[#90a4ae]"
                  }`}
                >
                  无
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setEditCategoryId(c.id)}
                    className="text-xs px-2 py-1 rounded-full text-white transition-all"
                    style={{ backgroundColor: c.color, outline: editCategoryId === c.id ? "2px solid #1e88e5" : "none", outlineOffset: 1 }}
                  >
                    {c.name}
                  </button>
                ))}
                <button
                  onClick={() => setNewCatOpen(!newCatOpen)}
                  className="text-xs px-2 py-1 rounded-full bg-[#f5f9ff] text-[#42a5f5] hover:bg-[#e3f2fd] transition-colors"
                >
                  + 新建
                </button>
              </div>
              {newCatOpen && (
                <div className="mt-2 p-2 rounded-lg bg-[#f5f9ff] border border-[#e3f2fd] space-y-2">
                  <input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="板块名，如 学习"
                    className="w-full border border-[#e3f2fd] rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.map((col) => (
                      <button
                        key={col}
                        onClick={() => setNewCatColor(col)}
                        className="size-5 rounded-full transition-transform"
                        style={{ backgroundColor: col, outline: newCatColor === col ? "2px solid #1e88e5" : "none", outlineOffset: 1, transform: newCatColor === col ? "scale(1.15)" : "none" }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleCreateCategory}
                    disabled={!newCatName.trim()}
                    className="w-full py-1.5 rounded-full text-xs font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
                  >
                    创建板块
                  </button>
                </div>
              )}
            </div>

            {/* 自定义颜色 */}
            <div>
              <label className="text-xs text-[#90a4ae] mb-1 block">节点颜色（覆盖板块色）</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setEditColor(null)}
                  className={`text-xs px-2 py-1 rounded-full transition-all ${
                    editColor === null ? "bg-[#e3f2fd] text-[#1565c0]" : "bg-[#f5f9ff] text-[#90a4ae]"
                  }`}
                >
                  默认
                </button>
                {COLOR_PALETTE.map((col) => (
                  <button
                    key={col}
                    onClick={() => setEditColor(col)}
                    className="size-6 rounded-full transition-transform"
                    style={{ backgroundColor: col, outline: editColor === col ? "2px solid #1e88e5" : "none", outlineOffset: 1, transform: editColor === col ? "scale(1.15)" : "none" }}
                  />
                ))}
              </div>
            </div>

            {/* 描述 */}
            <div>
              <label className="text-xs text-[#90a4ae] mb-1 block">描述</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="具体计划..."
                className="w-full border border-[#e3f2fd] rounded-lg p-2 text-sm resize-none h-14 focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
              />
            </div>

            {/* 进度 */}
            <div>
              <label className="text-xs text-[#90a4ae] mb-1 block">进度: {editProgress}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={editProgress}
                onChange={(e) => setEditProgress(Number(e.target.value))}
                className="w-full accent-[#42a5f5]"
              />
            </div>

            {/* 状态 */}
            <div>
              <label className="text-xs text-[#90a4ae] mb-1 block">状态</label>
              <div className="flex gap-1">
                {(["active", "completed", "abandoned"] as PlanNodeStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditStatus(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      editStatus === s ? "bg-[#e3f2fd] text-[#1565c0]" : "bg-[#f5f9ff] text-[#90a4ae]"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* 截止日期 */}
            <div>
              <label className="text-xs text-[#90a4ae] mb-1 block">截止日期</label>
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
              />
            </div>

            {/* 操作 */}
            <button
              onClick={handleSave}
              disabled={!editTitle.trim() || saving}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
            >
              <Save className="size-3.5" /> {saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={addChild}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#e8f5e9] text-[#2e7d32] hover:bg-[#c8e6c9] transition-colors"
            >
              <Plus className="size-3.5" /> 添加子节点
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="size-3.5" /> 删除节点
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-[#90a4ae] px-1">
        💡 拖动节点调整位置；从节点底部圆点拖到其他节点顶部即可建立连线，一个节点可连多个、也可被多个连入；想删连线先单击选中它（变红），再点中间的 × 删除；点节点底部箭头一键收起/展开子树；点节点编辑详情或去计时。
      </p>
    </div>
  );
}
