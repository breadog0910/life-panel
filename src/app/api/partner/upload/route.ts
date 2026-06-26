import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(process.cwd(), "public", "companion");
const DESKTOP_DIR = join(process.cwd(), "desktop");
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string) || "image";

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "文件过大，限制 5MB" },
        { status: 400 }
      );
    }

    // Validate type
    const validImages = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const validGifs = ["image/gif"];
    const allowed =
      mode === "gif" ? validGifs : [...validImages, ...validGifs];

    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            mode === "gif"
              ? "请上传 GIF 动图"
              : "请上传 PNG / JPG / WebP / GIF 图片",
        },
        { status: 400 }
      );
    }

    // Ensure directories exist
    for (const d of [PUBLIC_DIR, DESKTOP_DIR]) {
      if (!existsSync(d)) mkdirSync(d, { recursive: true });
    }

    // Determine filename
    const isGif = file.type === "image/gif" || mode === "gif";
    const filename = isGif ? "companion_animation.gif" : "companion_image.png";

    const buffer = Buffer.from(await file.arrayBuffer());

    // Write to public/companion/ for web preview
    writeFileSync(join(PUBLIC_DIR, filename), buffer);
    // Write to desktop/ for Python companion
    writeFileSync(join(DESKTOP_DIR, filename), buffer);

    // Clean up the other file type to avoid stale cache
    const otherFilename = isGif ? "companion_image.png" : "companion_animation.gif";
    for (const d of [PUBLIC_DIR, DESKTOP_DIR]) {
      const otherPath = join(d, otherFilename);
      if (existsSync(otherPath)) {
        try { unlinkSync(otherPath); } catch { /* ok */ }
      }
    }

    return NextResponse.json({
      success: true,
      image_path: filename,
      size: file.size,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "上传失败", detail: String(err) },
      { status: 500 }
    );
  }
}
