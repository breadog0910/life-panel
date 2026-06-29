"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { uploadImage } from "@/lib/storage";
import { HOME_ICON_KEY, HOME_ICON_EVENT } from "@/components/home-screen-meta";
import { Smartphone, ImagePlus, Trash2, Check } from "lucide-react";

// 把任意图片画进 512×512 画布（居中裁切）导出为 PNG，做出方形图标
async function toSquarePng(file: File, size = 512): Promise<File> {
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("读取图片失败"));
    r.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("解析图片失败"));
    i.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画布不可用");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("导出图片失败"))), "image/png", 0.92)
  );
  return new File([blob], "home-icon.png", { type: "image/png" });
}

export default function AddToHomeCard() {
  const { user } = useAuth();
  const [iconUrl, setIconUrl] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(HOME_ICON_KEY);
    } catch {
      return null;
    }
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const persist = (url: string | null) => {
    try {
      if (url) localStorage.setItem(HOME_ICON_KEY, url);
      else localStorage.removeItem(HOME_ICON_KEY);
    } catch {
      /* ignore */
    }
    setIconUrl(url);
    window.dispatchEvent(new Event(HOME_ICON_EVENT));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!user) {
      setError("请先登录再上传封面");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const png = await toSquarePng(file);
      const { url } = await uploadImage(png, user.id);
      persist(url);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-card p-5 border border-[#e3f2fd]">
      <h3 className="font-semibold text-[#1565c0] text-sm flex items-center gap-2 mb-1">
        <Smartphone className="size-4" /> 添加到桌面 · 自定义封面
      </h3>
      <p className="text-[11px] text-[#90a4ae] mb-4 leading-relaxed">
        上传一张图片当作把网页「添加到主屏幕」后的图标，自动裁成方形。
      </p>

      <div className="flex items-center gap-4">
        <div className="size-16 rounded-2xl border border-[#e3f2fd] bg-[#f5f9ff] overflow-hidden flex items-center justify-center shrink-0">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="封面预览" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🐕</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                uploading
                  ? "bg-[#e3f2fd] text-[#90a4ae] cursor-wait"
                  : "bg-[#42a5f5] text-white hover:bg-[#1e88e5]"
              }`}
            >
              <ImagePlus className="size-3.5" />
              {uploading ? "上传中…" : iconUrl ? "换一张" : "上传封面"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleFile}
              />
            </label>

            {iconUrl && (
              <button
                onClick={() => persist(null)}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#90a4ae] hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="size-3.5" /> 移除
              </button>
            )}

            {justSaved && (
              <span className="inline-flex items-center gap-1 text-xs text-green-500">
                <Check className="size-3.5" /> 已保存
              </span>
            )}
          </div>

          {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-[#f5f9ff] border border-[#e3f2fd] p-3 text-[11px] text-[#5c8dc9] leading-relaxed">
        <p className="font-medium text-[#1565c0] mb-1">怎么添加到桌面？</p>
        <p>iPhone：Safari 打开本站 → 点底部「分享」→「添加到主屏幕」。</p>
        <p>安卓：Chrome 右上角菜单 →「添加到主屏幕 / 安装应用」。</p>
        <p className="text-[#90a4ae] mt-1">
          提示：iOS 是添加那一刻才抓封面，改了封面要重新添加一次才生效。
        </p>
      </div>
    </div>
  );
}
