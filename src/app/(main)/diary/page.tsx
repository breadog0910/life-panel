"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  X,
  LayoutGrid,
  List,
  Search,
  Filter,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Settings2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Entry, EntryType } from "@/types/database";
import { ImageUpload } from "@/components/image-upload";
import { useCategories, type CategorySeed } from "@/lib/use-categories";
import CategoryManager from "@/components/category-manager";

const moods = [
  { emoji: "😊", label: "开心" },
  { emoji: "😐", label: "平常" },
  { emoji: "😢", label: "低落" },
  { emoji: "😡", label: "生气" },
];

const typeFilters: { key: EntryType | "all"; label: string; icon: any }[] = [
  { key: "all", label: "全部", icon: BookOpen },
  { key: "text", label: "文字", icon: FileText },
  { key: "image", label: "图片", icon: ImageIcon },
  { key: "link", label: "链接", icon: LinkIcon },
];

const ENTRY_SEEDS: CategorySeed[] = ["工作", "学习", "生活", "灵感", "心情", "其他"].map(
  (name) => ({ kind: null, name })
);

export default function DiaryPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"timeline" | "masonry">("timeline");
  const [typeFilter, setTypeFilter] = useState<EntryType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    categories: userCategories,
    add: addCategory,
    rename: renameCategory,
    remove: removeCategory,
  } = useCategories("entry", ENTRY_SEEDS);
  const [managerOpen, setManagerOpen] = useState(false);

  // 新建/编辑状态
  const [editing, setEditing] = useState(false);
  const [editEntry, setEditEntry] = useState<Partial<Entry>>({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // 标签输入
  const [tagInput, setTagInput] = useState("");
  const addTag = () => {
    if (!tagInput.trim()) return;
    const current = editEntry.tags || [];
    if (current.includes(tagInput.trim())) {
      setTagInput("");
      return;
    }
    setEditEntry({ ...editEntry, tags: [...current, tagInput.trim()] });
    setTagInput("");
  };
  const removeTag = (tag: string) => {
    setEditEntry({
      ...editEntry,
      tags: (editEntry.tags || []).filter((t) => t !== tag),
    });
  };

  // 加载列表
  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("entries")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (typeFilter !== "all") {
      query = query.eq("type", typeFilter);
    }
    if (selectedCategory) {
      query = query.eq("category", selectedCategory);
    }
    if (searchQuery.trim()) {
      query = query.or(
        `content.ilike.%${searchQuery.trim()}%,title.ilike.%${searchQuery.trim()}%,tags.cs.{${searchQuery.trim()}}`
      );
    }

    const { data } = await query;
    if (data) setEntries(data as Entry[]);
    setLoading(false);
  }, [user, typeFilter, selectedCategory, searchQuery]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // 按日期分组（时间轴视图用）
  const groupedByDate = entries.reduce<Record<string, Entry[]>>((acc, entry) => {
    (acc[entry.entry_date] ??= []).push(entry);
    return acc;
  }, {});

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  // 新建
  const startNew = (type: EntryType = "text") => {
    setEditEntry({
      type,
      content: "",
      mood: undefined, // 不强制填写心情
      tags: [],
      entry_date: new Date().toISOString().slice(0, 10),
    });
    setEditing(true);
    setTagInput("");
  };

  // 编辑
  const startEdit = (entry: Entry) => {
    setEditEntry(entry);
    setEditing(true);
    setTagInput("");
  };

  // 保存
  const handleSave = async () => {
    if (!user) return;
    const hasContent = editEntry.content?.trim() ||
      editEntry.media_urls?.length ||
      editEntry.link_url;
    if (!hasContent) return;

    setSaving(true);

    if (editEntry.id) {
      await supabase
        .from("entries")
        .update({
          title: editEntry.title,
          content: editEntry.content,
          type: editEntry.type || "text",
          mood: editEntry.mood,
          tags: editEntry.tags,
          category: editEntry.category,
          media_urls: editEntry.media_urls,
          link_url: editEntry.link_url,
          link_title: editEntry.link_title,
          link_description: editEntry.link_description,
          entry_date: editEntry.entry_date,
        })
        .eq("id", editEntry.id);
    } else {
      await supabase.from("entries").insert({
        user_id: user.id,
        type: editEntry.type || "text",
        title: editEntry.title,
        content: editEntry.content,
        mood: editEntry.mood,
        tags: editEntry.tags,
        category: editEntry.category,
        media_urls: editEntry.media_urls,
        link_url: editEntry.link_url,
        link_title: editEntry.link_title,
        link_description: editEntry.link_description,
        source: "web",
        entry_date: editEntry.entry_date,
      });
    }

    setSaving(false);
    setEditing(false);
    setEditEntry({});
    loadEntries();
  };

  // 删除
  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await supabase
      .from("entries")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    loadEntries();
  };

  // AI 智能整理
  const runAI = async () => {
    if (!editEntry.content?.trim() || !user) return;
    setAiLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editEntry.content }),
      });
      const data = await res.json();
      if (data.success) {
        setEditEntry({
          ...editEntry,
          tags: [...new Set([...(editEntry.tags || []), ...(data.tags || [])])],
          category: editEntry.category || data.category,
          ai_tags: data.tags,
          ai_category: data.category,
          ai_summary: data.summary,
        });
      } else {
        alert(data.error || "AI 处理失败");
      }
    } catch {
      // AI 失败不阻塞
    }
    setAiLoading(false);
  };

  // 链接预览获取
  const linkInputRef = useRef<HTMLInputElement>(null);
  const fetchLinkPreview = async () => {
    const url = editEntry.link_url;
    if (!url) return;
    try {
      const res = await fetch(`/api/link/preview?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.success) {
        setEditEntry({
          ...editEntry,
          link_title: data.title || editEntry.link_title,
          link_description: data.description || editEntry.link_description,
          link_favicon: data.favicon,
        });
      }
    } catch {
      // ignore
    }
  };

  // 获取所有分类（用户自定义 + 已有笔记里出现过的）
  const allCategories = Array.from(
    new Set([
      ...userCategories.map((c) => c.name),
      ...(entries.map((e) => e.category).filter(Boolean) as string[]),
    ])
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#90a4ae] text-sm">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1565c0] flex items-center gap-2">
          <BookOpen className="size-5" /> 📔 笔记灵感库
        </h2>
        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex bg-[#f0f6ff] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("timeline")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "timeline"
                  ? "bg-white text-[#1565c0] shadow-sm"
                  : "text-[#90a4ae] hover:text-[#5c8dc9]"
              }`}
              title="时间轴视图"
            >
              <List className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("masonry")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "masonry"
                  ? "bg-white text-[#1565c0] shadow-sm"
                  : "text-[#90a4ae] hover:text-[#5c8dc9]"
              }`}
              title="瀑布流视图"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
          {/* 新建按钮 */}
          <div className="relative group">
            <button
              onClick={() => startNew("text")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
            >
              <Plus className="size-4" /> 新建
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-[#e3f2fd] rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
              <button
                onClick={() => startNew("text")}
                className="w-full px-3 py-2 text-left text-sm text-[#1a3a5c] hover:bg-[#f5f9ff] flex items-center gap-2"
              >
                <FileText className="size-4 text-[#5c8dc9]" /> 文字笔记
              </button>
              <button
                onClick={() => startNew("image")}
                className="w-full px-3 py-2 text-left text-sm text-[#1a3a5c] hover:bg-[#f5f9ff] flex items-center gap-2"
              >
                <ImageIcon className="size-4 text-[#5c8dc9]" /> 图片收藏
              </button>
              <button
                onClick={() => startNew("link")}
                className="w-full px-3 py-2 text-left text-sm text-[#1a3a5c] hover:bg-[#f5f9ff] flex items-center gap-2"
              >
                <LinkIcon className="size-4 text-[#5c8dc9]" /> 链接收藏
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-card border border-[#e3f2fd] p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 搜索 */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#90a4ae]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索内容、标签..."
              className="w-full border border-[#e3f2fd] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
            />
          </div>
          {/* 类型筛选 */}
          <div className="flex gap-1">
            {typeFilters.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    typeFilter === f.key
                      ? "bg-[#e3f2fd] text-[#1565c0]"
                      : "bg-[#f5f9ff] text-[#90a4ae] hover:bg-[#e3f2fd] hover:text-[#5c8dc9]"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        {/* 分类筛选 */}
        {allCategories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="size-3.5 text-[#90a4ae]" />
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${
                selectedCategory === null
                  ? "bg-[#42a5f5] text-white"
                  : "bg-[#f5f9ff] text-[#90a4ae] hover:bg-[#e3f2fd]"
              }`}
            >
              全部分类
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded-full text-xs transition-colors ${
                  selectedCategory === cat
                    ? "bg-[#42a5f5] text-white"
                    : "bg-[#f5f9ff] text-[#90a4ae] hover:bg-[#e3f2fd]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 编辑面板 */}
      {editing && (
        <div className="bg-white rounded-card border border-[#42a5f5]/30 p-5 space-y-4 shadow-lg shadow-[#42a5f5]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#1565c0]">
                {editEntry.id ? "编辑笔记" : "新建笔记"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#e3f2fd] text-[#1565c0]">
                {editEntry.type === "image" ? "🖼️ 图片" : editEntry.type === "link" ? "🔗 链接" : "📝 文字"}
              </span>
            </div>
            <button
              onClick={() => {
                setEditing(false);
                setEditEntry({});
              }}
              className="text-[#90a4ae] hover:text-[#666]"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* 日期 */}
          <div>
            <label className="text-xs text-[#90a4ae] mb-1.5 block">日期</label>
            <input
              type="date"
              value={editEntry.entry_date || ""}
              onChange={(e) => setEditEntry({ ...editEntry, entry_date: e.target.value })}
              className="border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
            />
          </div>

          {/* 心情选择 */}
          <div>
            <label className="text-xs text-[#90a4ae] mb-1.5 block">心情（可选）</label>
            <div className="flex gap-2 items-center">
              {/* 不选择按钮 */}
              <button
                onClick={() => setEditEntry({ ...editEntry, mood: undefined })}
                className={`text-sm px-2 py-1 rounded-lg transition-all border ${
                  !editEntry.mood
                    ? "bg-[#e3f2fd] border-[#42a5f5] text-[#1565c0]"
                    : "border-[#e3f2fd] text-[#90a4ae] hover:border-[#bbdefb]"
                }`}
              >
                不选
              </button>
              {moods.map((m) => (
                <button
                  key={m.emoji}
                  onClick={() => setEditEntry({ ...editEntry, mood: m.emoji as Entry["mood"] })}
                  className={`text-2xl px-2 py-1 rounded-lg transition-all ${
                    editEntry.mood === m.emoji
                      ? "bg-[#e3f2fd] scale-110"
                      : "opacity-50 hover:opacity-80"
                  }`}
                  title={m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 链接类型 */}
          {editEntry.type === "link" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">链接地址</label>
                <div className="flex gap-2">
                  <input
                    ref={linkInputRef}
                    value={editEntry.link_url || ""}
                    onChange={(e) => setEditEntry({ ...editEntry, link_url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                    onBlur={fetchLinkPreview}
                  />
                  <button
                    onClick={fetchLinkPreview}
                    className="px-3 py-2 rounded-lg bg-[#e3f2fd] text-[#1565c0] text-sm hover:bg-[#bbdefb]"
                  >
                    获取预览
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">标题</label>
                <input
                  value={editEntry.link_title || ""}
                  onChange={(e) => setEditEntry({ ...editEntry, link_title: e.target.value })}
                  placeholder="链接标题"
                  className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                />
              </div>
              <div>
                <label className="text-xs text-[#90a4ae] mb-1.5 block">描述</label>
                <textarea
                  value={editEntry.link_description || ""}
                  onChange={(e) => setEditEntry({ ...editEntry, link_description: e.target.value })}
                  placeholder="链接描述"
                  className="w-full border border-[#e3f2fd] rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
                />
              </div>
            </div>
          )}

          {/* 图片类型 */}
          {editEntry.type === "image" && (
            <div>
              <label className="text-xs text-[#90a4ae] mb-1.5 block">图片</label>
              <ImageUpload
                images={editEntry.media_urls || []}
                onChange={(urls) => setEditEntry({ ...editEntry, media_urls: urls })}
                maxImages={9}
              />
            </div>
          )}

          {/* 文字内容 */}
          <div>
            <label className="text-xs text-[#90a4ae] mb-1.5 block">
              {editEntry.type === "text" ? "内容" : "备注"}
            </label>
            <textarea
              value={editEntry.content || ""}
              onChange={(e) => setEditEntry({ ...editEntry, content: e.target.value })}
              placeholder={editEntry.type === "text" ? "记录点什么..." : "添加备注..."}
              className="w-full border border-[#e3f2fd] rounded-lg p-3 text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
              autoFocus
            />
          </div>

          {/* 标签 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#90a4ae]">标签</label>
              <button
                onClick={runAI}
                disabled={aiLoading}
                className="text-xs text-[#42a5f5] hover:text-[#1e88e5] flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="size-3" />
                {aiLoading ? "AI整理中..." : "AI 智能标签"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(editEntry.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e3f2fd] text-[#1565c0] text-xs"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="输入标签..."
                className="flex-1 border border-[#e3f2fd] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
              />
              <button
                onClick={addTag}
                className="px-3 py-1.5 rounded-lg bg-[#e3f2fd] text-[#42a5f5] text-xs hover:bg-[#bbdefb]"
              >
                添加
              </button>
            </div>
          </div>

          {/* 分类 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#90a4ae]">分类</label>
              <button
                onClick={() => setManagerOpen(true)}
                className="text-xs text-[#42a5f5] hover:text-[#1e88e5] flex items-center gap-1"
              >
                <Settings2 className="size-3" /> 管理分类
              </button>
            </div>
            <div className="relative">
              <select
                value={editEntry.category || ""}
                onChange={(e) => setEditEntry({ ...editEntry, category: e.target.value || undefined })}
                className="w-full border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30 appearance-none bg-white pr-8"
              >
                <option value="">未分类</option>
                {userCategories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                {editEntry.category && !userCategories.some((c) => c.name === editEntry.category) && (
                  <option value={editEntry.category}>{editEntry.category}</option>
                )}
              </select>
              <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#90a4ae] pointer-events-none" />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 justify-end">
            {editEntry.id && (
              <button
                onClick={() => handleDelete(editEntry.id!)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="size-3.5" /> 删除
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors"
            >
              <Save className="size-3.5" />
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      {/* 时间轴视图 */}
      {viewMode === "timeline" && !editing && (
        <div className="space-y-6">
          {Object.entries(groupedByDate).length === 0 ? (
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📔</div>
                <p className="text-sm text-[#90a4ae] mb-4">还没有笔记，开始记录吧～</p>
                <button
                  onClick={() => startNew("text")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
                >
                  <Plus className="size-4" /> 写点什么
                </button>
              </div>
            </div>
          ) : (
            Object.entries(groupedByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, dayEntries]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-[#1565c0]">
                      {formatDate(date)}
                    </span>
                    <span className="text-xs text-[#90a4ae]">{dayEntries.length} 条</span>
                  </div>
                  <div className="space-y-2">
                    {dayEntries.map((entry) => (
                      <EntryCardTimeline
                        key={entry.id}
                        entry={entry}
                        onEdit={() => startEdit(entry)}
                      />
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* 瀑布流视图 */}
      {viewMode === "masonry" && !editing && (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-3 space-y-3">
          {entries.length === 0 ? (
            <div className="bg-white rounded-card border border-[#e3f2fd] p-5">
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📔</div>
                <p className="text-sm text-[#90a4ae] mb-4">还没有笔记</p>
                <button
                  onClick={() => startNew("text")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] transition-colors"
                >
                  <Plus className="size-4" /> 开始记录
                </button>
              </div>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="break-inside-avoid">
                <EntryCardMasonry
                  entry={entry}
                  onEdit={() => startEdit(entry)}
                />
              </div>
            ))
          )}
        </div>
      )}

      {managerOpen && (
        <CategoryManager
          title="管理笔记分类"
          categories={userCategories}
          onAdd={async (name) => {
            await addCategory(name);
          }}
          onRename={async (id, name) => {
            const c = userCategories.find((x) => x.id === id);
            await renameCategory(id, name);
            if (c && editEntry.category === c.name) setEditEntry((p) => ({ ...p, category: name }));
          }}
          onRemove={async (id) => {
            const c = userCategories.find((x) => x.id === id);
            await removeCategory(id);
            if (c && editEntry.category === c.name) setEditEntry((p) => ({ ...p, category: undefined }));
          }}
          onClose={() => setManagerOpen(false)}
        />
      )}
    </div>
  );
}

// 时间轴卡片
function EntryCardTimeline({ entry, onEdit }: { entry: Entry; onEdit: () => void }) {
  const typeIcon = entry.type === "image" ? "🖼️" : entry.type === "link" ? "🔗" : "📝";

  return (
    <div
      onClick={onEdit}
      className="bg-white rounded-card border border-[#e3f2fd] p-4 hover:border-[#42a5f5]/30 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-12 text-center">
          <div className="text-2xl">{entry.mood || typeIcon}</div>
          <div className="text-[10px] text-[#90a4ae] mt-0.5">
            {new Date(entry.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {/* 链接卡片 */}
          {entry.type === "link" && entry.link_url && (
            <div className="mb-2 flex items-start gap-3 p-3 bg-[#f5f9ff] rounded-lg border border-[#e3f2fd]">
              {entry.link_favicon && (
                <img src={entry.link_favicon} alt="" className="size-5 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#1a3a5c] truncate">
                  {entry.link_title || entry.link_url}
                </div>
                {entry.link_description && (
                  <p className="text-xs text-[#90a4ae] line-clamp-2 mt-0.5">
                    {entry.link_description}
                  </p>
                )}
                <div className="text-[10px] text-[#5c8dc9] mt-1 truncate flex items-center gap-1">
                  <ExternalLink className="size-3" />
                  {entry.link_url}
                </div>
              </div>
            </div>
          )}

          {/* 图片 */}
          {entry.type === "image" && entry.media_urls?.length && (
            <div className="mb-2 grid grid-cols-2 gap-1">
              {entry.media_urls.slice(0, 4).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="rounded-lg w-full h-24 object-cover"
                />
              ))}
            </div>
          )}

          {/* 文字内容 */}
          {entry.content && (
            <p className="text-sm text-[#1a3a5c] leading-relaxed line-clamp-3">
              {entry.content}
            </p>
          )}

          {/* 标签 */}
          {(entry.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.tags?.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded bg-[#f0f6ff] text-[#5c8dc9] text-[10px]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 分类 */}
          {entry.category && (
            <div className="mt-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fff9c4] text-[#f9a825]">
                {entry.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 瀑布流卡片
function EntryCardMasonry({ entry, onEdit }: { entry: Entry; onEdit: () => void }) {
  const typeIcon = entry.type === "image" ? "🖼️" : entry.type === "link" ? "🔗" : "📝";

  return (
    <div
      onClick={onEdit}
      className="bg-white rounded-card border border-[#e3f2fd] p-3 hover:border-[#42a5f5]/30 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* 图片 */}
      {entry.type === "image" && entry.media_urls?.[0] && (
        <img
          src={entry.media_urls[0]}
          alt=""
          className="rounded-lg w-full mb-2 object-cover"
        />
      )}

      {/* 链接预览 */}
      {entry.type === "link" && entry.link_url && (
        <div className="mb-2 p-2.5 bg-[#f5f9ff] rounded-lg border border-[#e3f2fd]">
          {entry.link_favicon && (
            <img src={entry.link_favicon} alt="" className="size-4 mb-1" />
          )}
          <div className="text-xs font-medium text-[#1a3a5c] line-clamp-2">
            {entry.link_title || entry.link_url}
          </div>
          {entry.link_description && (
            <p className="text-[10px] text-[#90a4ae] line-clamp-2 mt-1">
              {entry.link_description}
            </p>
          )}
        </div>
      )}

      {/* 心情图标 */}
      <div className="text-xl mb-1">{entry.mood || typeIcon}</div>

      {/* 文字内容 */}
      {entry.content && (
        <p className="text-sm text-[#1a3a5c] leading-relaxed line-clamp-6">
          {entry.content}
        </p>
      )}

      {/* 底部信息 */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e3f2fd]">
        <span className="text-[10px] text-[#90a4ae]">
          {new Date(entry.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
        </span>
        {entry.category && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fff9c4] text-[#f9a825]">
            {entry.category}
          </span>
        )}
      </div>

      {/* 标签 */}
      {(entry.tags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded bg-[#f0f6ff] text-[#5c8dc9] text-[10px]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
