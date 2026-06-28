"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { CategoryModule, CategoryKind, UserCategory } from "@/types/database";

export interface CategorySeed {
  kind: CategoryKind | null;
  name: string;
}

// 用户自定义分类：加载 / 首次空表写入默认 / 新增 / 重命名 / 删除
export function useCategories(module: CategoryModule, seeds: CategorySeed[]) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  const seedsRef = useRef(seeds);
  const seededForRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("module", module)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    // 查询失败（断网 / 表不存在 / RLS）时不要 seed：否则会误判为空表，
    // 写入失败后还把 seededForRef 占住，导致网络恢复后也不再补默认分类。
    if (error) {
      console.warn("[useCategories] 加载分类失败：", error.message);
      setLoaded(true);
      return;
    }

    let list = (data as UserCategory[]) || [];

    // 首次进入：确认为空表才写入默认分类（每个用户/模块只 seed 一次，避免 StrictMode 重复）
    if (list.length === 0 && seedsRef.current.length > 0 && seededForRef.current !== user.id) {
      seededForRef.current = user.id;
      const rows = seedsRef.current.map((s, i) => ({
        user_id: user.id,
        module,
        kind: s.kind,
        name: s.name,
        sort_order: i,
      }));
      const { data: inserted, error: seedErr } = await supabase
        .from("user_categories")
        .insert(rows)
        .select();
      if (seedErr) {
        // 写入失败（多为断网）→ 释放占位，下次加载可重试
        console.warn("[useCategories] 写入默认分类失败：", seedErr.message);
        seededForRef.current = null;
      } else {
        list = ((inserted as UserCategory[]) || []).sort((a, b) => a.sort_order - b.sort_order);
      }
    }

    setCategories(list);
    setLoaded(true);
  }, [user, module]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (name: string, kind: CategoryKind | null = null): Promise<UserCategory | null> => {
      const trimmed = name.trim();
      if (!user || !trimmed) return null;
      // 同 kind 下重名直接复用
      const dup = categories.find((c) => c.name === trimmed && (c.kind ?? null) === (kind ?? null));
      if (dup) return dup;
      const { data } = await supabase
        .from("user_categories")
        .insert({ user_id: user.id, module, kind, name: trimmed, sort_order: categories.length })
        .select()
        .single();
      if (!data) return null;
      const cat = data as UserCategory;
      setCategories((prev) => [...prev, cat]);
      return cat;
    },
    [user, module, categories]
  );

  const rename = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await supabase.from("user_categories").update({ name: trimmed }).eq("id", id);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await supabase.from("user_categories").delete().eq("id", id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, loaded, add, rename, remove };
}
