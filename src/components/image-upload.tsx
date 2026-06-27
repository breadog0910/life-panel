"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, onUploadingChange, maxImages = 9 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArray.length === 0) return;

      const remaining = maxImages - images.length;
      const toUpload = fileArray.slice(0, remaining);
      if (toUpload.length === 0) return;

      setUploading(true);
      try {
        const { uploadImages } = await import("@/lib/storage");
        const { useAuth } = await import("@/lib/auth-context");
        // 动态获取 user - 这里通过自定义事件或从上层传
        // 简化：直接通过 supabase auth 获取
        const { supabase } = await import("@/lib/supabase");
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error("未登录");

        const urls = await uploadImages(toUpload, userId);
        onChange([...images, ...urls]);
      } catch (err) {
        console.error("上传失败:", err);
        alert("图片上传失败，请重试");
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, onChange]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (e.clipboardData?.files.length) {
        handleFiles(e.clipboardData.files);
      }
    },
    [handleFiles]
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* 已上传图片 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square">
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(i);
                }}
                className="absolute top-1 right-1 size-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {images.length < maxImages && (
            <button
              onClick={handleClick}
              disabled={uploading}
              className="aspect-square border-2 border-dashed border-[#e3f2fd] rounded-lg flex flex-col items-center justify-center text-[#90a4ae] hover:border-[#42a5f5] hover:text-[#42a5f5] transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <PlusIcon />
              )}
            </button>
          )}
        </div>
      )}

      {/* 上传区域（无图片时显示） */}
      {images.length === 0 && (
        <div
          onClick={handleClick}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-[#42a5f5] bg-[#f0f6ff]"
              : "border-[#e3f2fd] hover:border-[#42a5f5]"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-8 text-[#42a5f5] animate-spin" />
              <p className="text-sm text-[#5c8dc9]">上传中...</p>
            </div>
          ) : (
            <>
              <Upload className="size-8 mx-auto text-[#90a4ae] mb-2" />
              <p className="text-sm text-[#5c8dc9]">
                点击或拖拽图片到这里上传
              </p>
              <p className="text-xs text-[#b0bec5] mt-1">
                最多 {maxImages} 张 · 支持粘贴截图
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// 占位导出，避免未使用警告
export const _imagePlaceholder = ImageIcon;
