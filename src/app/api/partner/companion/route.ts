import { NextResponse } from "next/server";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { execSync, spawn } from "child_process";

const DESKTOP_DIR = join(process.cwd(), "desktop");
const PID_FILE = join(DESKTOP_DIR, "companion.pid");

function isCompanionAlive(): { running: boolean; pid?: number } {
  if (!existsSync(PID_FILE)) return { running: false };

  let pid: number;
  try {
    pid = parseInt(readFileSync(PID_FILE, "utf-8").trim(), 10);
  } catch {
    return { running: false };
  }

  if (isNaN(pid)) return { running: false };

  // Check if process exists via tasklist
  try {
    execSync(`tasklist /FI "PID eq ${pid}" 2>NUL | findstr "${pid}"`, {
      stdio: "ignore",
      windowsHide: true,
    });
    return { running: true, pid };
  } catch {
    // Process not found — clean stale PID
    try {
      unlinkSync(PID_FILE);
    } catch { /* ok */ }
    return { running: false };
  }
}

// GET — check if companion is running
export async function GET() {
  const status = isCompanionAlive();
  return NextResponse.json(status);
}

// POST — start or stop the companion
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action: "start" | "stop" = body.action;

    if (action === "stop") {
      const current = isCompanionAlive();
      if (current.pid) {
        try {
          execSync(`taskkill /F /PID ${current.pid}`, {
            stdio: "ignore",
            windowsHide: true,
          });
        } catch { /* already dead */ }
        try { unlinkSync(PID_FILE); } catch { /* ok */ }
      }
      return NextResponse.json({ running: false });
    }

    if (action === "start") {
      // Kill existing if any
      const current = isCompanionAlive();
      if (current.pid) {
        try {
          execSync(`taskkill /F /PID ${current.pid}`, {
            stdio: "ignore",
            windowsHide: true,
          });
        } catch { /* ok */ }
        try { unlinkSync(PID_FILE); } catch { /* ok */ }
      }

      const scriptPath = join(DESKTOP_DIR, "companion.py");
      spawn("pythonw", [scriptPath], {
        cwd: DESKTOP_DIR,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });

      return NextResponse.json({ running: true, starting: true });
    }

    return NextResponse.json(
      { error: "无效操作，请用 'start' 或 'stop'" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "操作失败", detail: String(err) },
      { status: 500 }
    );
  }
}
