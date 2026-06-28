"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { UserCategory } from "@/types/database";

interface CategoryManagerProps {
  title: string;
  categories: UserCategory[];
  onAdd: (name: string) => void | Promise<void>;
  onRename: (id: string, name: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  onClose: () => void;
}

function CategoryRow({
  category,
  onRename,
  onRemove,
}: {
  category: UserCategory;
  onRename: (id: string, name: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
}) {
  const [name, setName] = useState(category.name);
  const [confirming, setConfirming] = useState(false);

  const commit = () => {
    const t = name.trim();
    if (!t) {
      setName(category.name);
      return;
    }
    if (t !== category.name) onRename(category.id, t);
  };

  if (confirming) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
        <span className="text-xs text-red-500 truncate">删除「{category.name}」？</span>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onRemove(category.id)}
            className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            删除
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs px-2 py-1 rounded-lg bg-white text-[#90a4ae] border border-[#e3f2fd] hover:bg-[#f5f9ff] transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="flex-1 border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
      />
      <button
        onClick={() => setConfirming(true)}
        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
        title="删除"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export default function CategoryManager({
  title,
  categories,
  onAdd,
  onRename,
  onRemove,
  onClose,
}: CategoryManagerProps) {
  const [newName, setNewName] = useState("");

  const handleAdd = async () => {
    const t = newName.trim();
    if (!t) return;
    await onAdd(t);
    setNewName("");
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white rounded-card border border-[#e3f2fd] shadow-xl z-50 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e3f2fd]">
          <h3 className="font-semibold text-[#1565c0] text-sm">{title}</h3>
          <button onClick={onClose} className="text-[#90a4ae] hover:text-[#666]">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {categories.length === 0 ? (
            <div className="text-center py-6 text-sm text-[#90a4ae]">还没有分类，在下方添加一个</div>
          ) : (
            categories.map((c) => (
              <CategoryRow key={c.id} category={c} onRename={onRename} onRemove={onRemove} />
            ))
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#e3f2fd]">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="新分类名，如 旅行"
              className="flex-1 border border-[#e3f2fd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#42a5f5]/30"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#42a5f5] text-white hover:bg-[#1e88e5] disabled:opacity-40 transition-colors shrink-0"
            >
              <Plus className="size-4" /> 添加
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
