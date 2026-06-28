"use client";

import { useEffect, useState } from "react";
import {
  Sunrise,
  RefreshCw,
  ChevronDown,
  GitBranch,
  Star,
  Flame,
  Newspaper,
  Cpu,
  TrendingUp,
} from "lucide-react";

type Sixty = {
  date: string | null;
  weekday: string | null;
  lunar: string | null;
  tip: string | null;
  news: string[];
};
type News = { title: string; url: string | null };
type Repo = {
  name: string;
  stars: number;
  lang: string | null;
  desc: string | null;
  url: string | null;
};
type Hot = { title: string; hot: number | null; link: string | null };
type Briefing = {
  sixty: Sixty | null;
  tech: News[] | null;
  finance: News[] | null;
  hot: Hot[] | null;
  github: Repo[] | null;
};

const todayKey = () => new Date().toLocaleDateString("zh-CN");

function formatHot(n: number | null): string {
  if (!n) return "";
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return String(n);
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function MorningBriefing() {
  const [data, setData] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
  const [showAllNews, setShowAllNews] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/morning/briefing");
      setData((await r.json()) as Briefing);
    } catch {
      setData({ sixty: null, tech: null, finance: null, hot: null, github: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 当天第一次打开自动展开，之后默认收起
    try {
      const seen = localStorage.getItem("morning-briefing-seen");
      const today = todayKey();
      if (seen === today) setOpen(false);
      else localStorage.setItem("morning-briefing-seen", today);
    } catch {
      /* localStorage 不可用时保持展开 */
    }
    load();
  }, []);

  const sixty = data?.sixty ?? null;
  const tech = data?.tech ?? null;
  const finance = data?.finance ?? null;
  const hot = data?.hot ?? null;
  const github = data?.github ?? null;

  const dateLabel = (() => {
    const d = new Date();
    const base = `${d.getMonth() + 1}月${d.getDate()}日`;
    const wk = sixty?.weekday ? ` ${sixty.weekday}` : "";
    const lunar = sixty?.lunar ? ` · ${sixty.lunar}` : "";
    return `${base}${wk}${lunar}`;
  })();

  return (
    <div className="bg-gradient-to-br from-[#fff8e1] to-[#e3f2fd] rounded-card p-5 border border-[#ffe082]">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          <Sunrise className="size-5 text-[#f59e0b]" />
          <div>
            <div className="font-semibold text-[#1565c0] text-sm">🌅 晨间简报</div>
            <div className="text-[11px] text-[#90a4ae]">{dateLabel}</div>
          </div>
          <ChevronDown
            className={`size-4 text-[#90a4ae] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs text-[#42a5f5] hover:text-[#1e88e5] flex items-center gap-1 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> 刷新
        </button>
      </div>

      {/* 收起态：显示一句话 tip 作为预览 */}
      {!open && sixty?.tip && (
        <p className="mt-2 text-xs text-[#5c8dc9] italic line-clamp-2">「{sixty.tip}」</p>
      )}

      {open && (
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="text-center py-4 text-sm text-[#90a4ae]">加载中...</div>
          ) : !sixty && !tech && !finance && !hot && !github ? (
            <div className="text-center py-4 text-sm text-[#90a4ae]">
              暂时拉取不到外部信息，稍后刷新试试～
            </div>
          ) : (
            <>
              {/* 今日大事（60秒） */}
              {sixty && sixty.news.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#1a3a5c] mb-2">
                    <Newspaper className="size-3.5 text-[#1565c0]" /> 今日大事
                  </div>
                  <ol className="space-y-1.5">
                    {(showAllNews ? sixty.news : sixty.news.slice(0, 6)).map((n, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[#1a3a5c] leading-relaxed">
                        <span className="shrink-0 text-[#90a4ae] font-medium">{i + 1}.</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ol>
                  {sixty.news.length > 6 && (
                    <button
                      onClick={() => setShowAllNews((v) => !v)}
                      className="mt-1.5 text-[11px] text-[#42a5f5] hover:text-[#1e88e5] transition-colors"
                    >
                      {showAllNews ? "收起" : `查看全部 ${sixty.news.length} 条`}
                    </button>
                  )}
                  {sixty.tip && (
                    <p className="mt-2 text-[11px] text-[#5c8dc9] italic">「{sixty.tip}」</p>
                  )}
                </div>
              )}

              {/* 科技领域新闻 */}
              {tech && tech.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#1a3a5c] mb-2">
                    <Cpu className="size-3.5 text-[#1565c0]" /> 科技领域
                  </div>
                  <ol className="space-y-1.5">
                    {tech.map((n, i) => (
                      <li key={i} className="flex gap-2 text-xs">
                        <span className="shrink-0 text-[#90a4ae] font-medium">{i + 1}.</span>
                        {n.url ? (
                          <a
                            href={n.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1a3a5c] hover:text-[#1565c0] transition-colors leading-relaxed"
                          >
                            {n.title}
                          </a>
                        ) : (
                          <span className="text-[#1a3a5c] leading-relaxed">{n.title}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* 金融领域新闻 */}
              {finance && finance.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#1a3a5c] mb-2">
                    <TrendingUp className="size-3.5 text-[#2e7d32]" /> 金融领域
                  </div>
                  <ol className="space-y-1.5">
                    {finance.map((n, i) => (
                      <li key={i} className="flex gap-2 text-xs">
                        <span className="shrink-0 text-[#90a4ae] font-medium">{i + 1}.</span>
                        {n.url ? (
                          <a
                            href={n.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1a3a5c] hover:text-[#2e7d32] transition-colors leading-relaxed"
                          >
                            {n.title}
                          </a>
                        ) : (
                          <span className="text-[#1a3a5c] leading-relaxed">{n.title}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* 微博热搜 */}
              {hot && hot.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#1a3a5c] mb-2">
                    <Flame className="size-3.5 text-[#ef5350]" /> 微博热搜
                  </div>
                  <ol className="space-y-1.5">
                    {hot.slice(0, 8).map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs">
                        <span
                          className={`shrink-0 w-4 text-center font-bold ${
                            i < 3 ? "text-[#ef5350]" : "text-[#90a4ae]"
                          }`}
                        >
                          {i + 1}
                        </span>
                        {h.link ? (
                          <a
                            href={h.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1a3a5c] hover:text-[#1565c0] truncate flex-1 transition-colors"
                          >
                            {h.title}
                          </a>
                        ) : (
                          <span className="text-[#1a3a5c] truncate flex-1">{h.title}</span>
                        )}
                        {h.hot && (
                          <span className="shrink-0 text-[10px] text-[#90a4ae]">
                            {formatHot(h.hot)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* GitHub 热门新仓库 */}
              {github && github.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#1a3a5c] mb-2">
                    <GitBranch className="size-3.5 text-[#1565c0]" /> GitHub 热门新仓库
                  </div>
                  <ol className="space-y-2">
                    {github.map((repo, i) => (
                      <li key={i} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`shrink-0 w-4 text-center font-bold ${
                              i < 3 ? "text-[#f59e0b]" : "text-[#90a4ae]"
                            }`}
                          >
                            {i + 1}
                          </span>
                          {repo.url ? (
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1565c0] hover:underline font-medium truncate flex-1"
                            >
                              {repo.name}
                            </a>
                          ) : (
                            <span className="text-[#1565c0] font-medium truncate flex-1">
                              {repo.name}
                            </span>
                          )}
                          <span className="shrink-0 flex items-center gap-0.5 text-[#f59e0b]">
                            <Star className="size-3 fill-current" /> {formatStars(repo.stars)}
                          </span>
                        </div>
                        {(repo.lang || repo.desc) && (
                          <div className="pl-6 text-[#90a4ae] truncate">
                            {repo.lang && <span className="text-[#42a5f5]">{repo.lang}</span>}
                            {repo.lang && repo.desc && " · "}
                            {repo.desc}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
