import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.cwd(), "desktop", "companion_config.json");

const DEFAULTS = {
  mode: "emoji",
  character: "🐱",
  character_id: "cat",
  nickname: "小H",
  breathing_enabled: true,
  bubble_enabled: true,
  image_path: "",
};

function readConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, "utf-8");
      return { ...DEFAULTS, ...JSON.parse(raw) };
    }
  } catch {
    // fall through
  }
  return { ...DEFAULTS };
}

function writeConfig(data: Record<string, unknown>) {
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// GET — return current config
export async function GET() {
  try {
    const config = readConfig();
    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json(
      { error: "读取配置失败", detail: String(err) },
      { status: 500 }
    );
  }
}

// POST — save config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = readConfig();
    const merged = {
      ...current,
      mode: body.mode ?? current.mode,
      character: body.character ?? current.character,
      character_id: body.character_id ?? current.character_id,
      nickname: body.nickname ?? current.nickname,
      breathing_enabled:
        body.breathing_enabled ?? current.breathing_enabled,
      bubble_enabled: body.bubble_enabled ?? current.bubble_enabled,
      image_path: body.image_path ?? current.image_path,
    };

    // If mode is image/gif but image_path is empty, keep the old one
    if ((merged.mode === "image" || merged.mode === "gif") && !merged.image_path) {
      merged.image_path = current.image_path;
    }

    writeConfig(merged);

    // Optionally sync to Supabase if user-id header present
    const userId = request.headers.get("x-user-id");
    if (userId) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.from("partner_config").upsert({
          user_id: userId,
          character_id: merged.character_id,
          nickname: merged.nickname,
          skin: merged.mode,
        });
      } catch {
        // Supabase sync is best-effort
      }
    }

    return NextResponse.json({ success: true, data: merged });
  } catch (err) {
    return NextResponse.json(
      { error: "保存配置失败", detail: String(err) },
      { status: 400 }
    );
  }
}
