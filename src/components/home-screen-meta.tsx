"use client";

import { useEffect } from "react";

export const HOME_ICON_KEY = "homeIconUrl";
export const HOME_ICON_EVENT = "homeicon:changed";

function applyIcon(url: string | null) {
  if (typeof document === "undefined") return;
  const head = document.head;

  // 清掉上一次注入的标签，避免重复
  head.querySelectorAll("[data-homeicon]").forEach((el) => el.remove());

  if (!url) return;

  const add = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElement(tag);
    el.setAttribute("data-homeicon", "1");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    head.appendChild(el);
  };

  // iOS：添加到主屏幕时读取这个
  add("link", { rel: "apple-touch-icon", href: url });
  // 浏览器标签 / 安卓
  add("link", { rel: "icon", href: url });
  // iOS 独立窗口 + 标题
  add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
  add("meta", { name: "apple-mobile-web-app-title", content: "人生面板" });
  add("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" });

  // 安卓 Chrome：动态 manifest（用 blob URL 挂上去）
  const manifest = {
    name: "人生面板",
    short_name: "人生面板",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f9ff",
    theme_color: "#42a5f5",
    icons: [
      { src: url, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: url, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/manifest+json",
  });
  add("link", { rel: "manifest", href: URL.createObjectURL(blob) });
}

/** 把保存在 localStorage 里的自定义封面注入 <head>，让手机「添加到桌面」用它。 */
export default function HomeScreenMeta() {
  useEffect(() => {
    const read = () => {
      try {
        applyIcon(localStorage.getItem(HOME_ICON_KEY));
      } catch {
        /* localStorage 不可用时忽略 */
      }
    };
    read();
    window.addEventListener(HOME_ICON_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(HOME_ICON_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return null;
}
