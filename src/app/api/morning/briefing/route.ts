import { NextResponse } from "next/server";

// 30 分钟缓存，打开首页时按需拉取，不需要定时任务/cron
export const revalidate = 1800;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) personal-panel";

async function fetchTimeout(
  url: string,
  init: RequestInit & { next?: { revalidate: number } } = {},
  ms = 6000
) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function getSixty() {
  const r = await fetchTimeout("https://60s.viki.moe/v2/60s", {
    headers: { "User-Agent": UA },
    next: { revalidate: 1800 },
  });
  const j = await r.json();
  const d = j?.data;
  if (!d || !Array.isArray(d.news)) return null;
  return {
    date: typeof d.date === "string" ? d.date : null,
    weekday: typeof d.day_of_week === "string" ? d.day_of_week : null,
    lunar: typeof d.lunar_date === "string" ? d.lunar_date : null,
    tip: typeof d.tip === "string" ? d.tip : null,
    news: (d.news as unknown[]).filter((s): s is string => typeof s === "string"),
  };
}

async function getGithub() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
    `created:>${since}`
  )}&sort=stars&order=desc&per_page=8`;
  const r = await fetchTimeout(url, {
    headers: { "User-Agent": UA, Accept: "application/vnd.github+json" },
    next: { revalidate: 1800 },
  });
  const j = await r.json();
  const items = Array.isArray(j?.items) ? j.items : null;
  if (!items) return null;
  const out = items
    .filter((x: { full_name?: unknown }) => x && typeof x.full_name === "string")
    .slice(0, 8)
    .map(
      (x: {
        full_name: string;
        stargazers_count?: number;
        language?: string | null;
        description?: string | null;
        html_url?: string;
      }) => ({
        name: x.full_name,
        stars: typeof x.stargazers_count === "number" ? x.stargazers_count : 0,
        lang: typeof x.language === "string" ? x.language : null,
        desc: typeof x.description === "string" ? x.description : null,
        url: typeof x.html_url === "string" ? x.html_url : null,
      })
    );
  return out.length ? out : null;
}

async function getTech() {
  const r = await fetchTimeout("https://60s.viki.moe/v2/it-news", {
    headers: { "User-Agent": UA },
    next: { revalidate: 1800 },
  });
  const j = await r.json();
  const arr = Array.isArray(j?.data) ? j.data : null;
  if (!arr) return null;
  const out = arr
    .filter((x: { title?: unknown }) => x && typeof x.title === "string")
    .slice(0, 6)
    .map((x: { title: string; link?: string }) => ({
      title: x.title,
      url: typeof x.link === "string" ? x.link : null,
    }));
  return out.length ? out : null;
}

async function getFinanceNews() {
  const r = await fetchTimeout(
    "https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&num=8&page=1",
    {
      headers: { "User-Agent": UA, Referer: "https://finance.sina.com.cn/" },
      next: { revalidate: 1800 },
    }
  );
  const j = await r.json();
  const arr = Array.isArray(j?.result?.data) ? j.result.data : null;
  if (!arr) return null;
  const out = arr
    .filter((x: { title?: unknown }) => x && typeof x.title === "string")
    .slice(0, 6)
    .map((x: { title: string; url?: string }) => ({
      title: x.title,
      url: typeof x.url === "string" ? x.url : null,
    }));
  return out.length ? out : null;
}

async function getHot() {
  const r = await fetchTimeout("https://60s.viki.moe/v2/weibo", {
    headers: { "User-Agent": UA },
    next: { revalidate: 1800 },
  });
  const j = await r.json();
  const arr = Array.isArray(j?.data) ? j.data : null;
  if (!arr) return null;
  const out = arr
    .filter((x: { title?: unknown }) => x && typeof x.title === "string")
    .slice(0, 10)
    .map((x: { title: string; hot_value?: number; link?: string }) => ({
      title: x.title,
      hot: typeof x.hot_value === "number" ? x.hot_value : null,
      link: typeof x.link === "string" ? x.link : null,
    }));
  return out.length ? out : null;
}

export async function GET() {
  const [sixty, tech, finance, hot, github] = await Promise.allSettled([
    getSixty(),
    getTech(),
    getFinanceNews(),
    getHot(),
    getGithub(),
  ]);
  const val = <T,>(r: PromiseSettledResult<T>) =>
    r.status === "fulfilled" ? r.value : null;
  return NextResponse.json({
    sixty: val(sixty),
    tech: val(tech),
    finance: val(finance),
    hot: val(hot),
    github: val(github),
  });
}
