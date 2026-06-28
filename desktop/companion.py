"""
小H 🐱 — 桌面透明悬浮伙伴

纯 Python 标准库 + Pillow（GIF 帧播放）。
支持三种角色模式：Emoji 预设 / 自定义图片 / GIF 动图。
点击弹出专注计时面板（正/倒计时），结束后写一句复盘并记入网页日历。
通过 companion_config.json 热加载设置；登录态存 companion_auth.json。
"""

import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
import webbrowser
import random
import json
import os
import re
import sys
import time
import shutil
import threading
import urllib.request
import urllib.error
import urllib.parse

# 打包校验标记：每次构建前手动改这里，构建后用 `小H.exe --selftest` 写出此值，
# 即可确认 dist 里的 exe 真的是最新源码（之前出现过 PyInstaller 缓存导致重打包是空操作）。
BUILD_TAG = "2026-06-28-quicknote-desktop-skin-only"

# ── Config ────────────────────────────────────────────
# 默认网页面板地址；打包分发时可在 companion_config.json 用 "web_url" 覆盖为云端地址
DEFAULT_WEB_PANEL_URL = "https://breadog.top"

# Supabase（与网页同库；anon/publishable key 可公开嵌入分发）
SUPABASE_URL = "https://meyatacfvwhzdlpogwoe.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_ExFkDxuZb7U09rbiA2fKzQ_amJFtzCz"

YH = "Microsoft YaHei"

# 是否为 PyInstaller 打包后的可执行文件
FROZEN = getattr(sys, "frozen", False)

# 打包后 __file__ 指向解压目录，BASE_DIR 应取 exe 所在目录
if FROZEN:
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)  # project root
IMAGE_DIR = os.path.join(PROJECT_DIR, "public", "companion")  # images served by Next.js


def resource_path(name):
    """定位随程序打包的只读资源（开发态在 desktop/，打包后在 _MEIPASS 解压目录）。"""
    base = getattr(sys, "_MEIPASS", BASE_DIR)
    return os.path.join(base, name)


# 可写数据目录：打包后写入 %APPDATA%\小H\（exe 所在目录可能只读）；
# 开发态仍写在 desktop/，本地网页面板的配置热同步因此不受影响。
if FROZEN:
    DATA_DIR = os.path.join(os.environ.get("APPDATA") or os.path.expanduser("~"), "小H")
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
    except Exception:
        DATA_DIR = BASE_DIR
else:
    DATA_DIR = BASE_DIR

POSITION_FILE = os.path.join(DATA_DIR, "companion_position.json")
CONFIG_FILE = os.path.join(DATA_DIR, "companion_config.json")
PID_FILE = os.path.join(DATA_DIR, "companion.pid")
AUTH_FILE = os.path.join(DATA_DIR, "companion_auth.json")

TRANSPARENT_COLOR = "#010101"  # magic transparency key

DEFAULT_CONFIG = {
    "mode": "emoji",
    "character": "🐱",
    "character_id": "cat",
    "nickname": "小H",
    "breathing_enabled": True,
    "bubble_enabled": True,
    "image_path": "",
    "web_url": DEFAULT_WEB_PANEL_URL,
}

# 换形象用的 Emoji 预设（与网页一致，桌面端就是唯一一套方案）
AVATAR_PRESETS = [
    ("cat", "🐱", "小H"),
    ("dog", "🐶", "旺财"),
    ("rabbit", "🐰", "小白"),
    ("panda", "🐼", "团团"),
    ("fox", "🦊", "小狐"),
    ("frog", "🐸", "呱呱"),
    ("cat2", "😺", "咪咪"),
    ("bear", "🐻", "憨憨"),
    ("penguin", "🐧", "豆豆"),
]

IDLE_PHRASES = [
    "今天也要加油呀～",
    "记得休息一下哦",
    "喝点水吧 💧",
    "摸摸头～",
    "右键我能开始专注哦 ⏱",
    "累了吗？放松一下",
    "你真棒！✨",
    "今天过得怎么样？",
]

# 点击我时随机蹦出的一句话
CLICK_PHRASES = [
    "嗨～你来啦！",
    "戳我干嘛呀 😆",
    "在的在的！",
    "需要我陪你专注吗？右键我 ⏱",
    "今天也辛苦啦～",
    "深呼吸，慢慢来 🌿",
    "你已经很努力了！",
    "要不要喝口水？💧",
    "我一直都在哦 💙",
    "歇会儿也没关系的～",
    "相信你可以的！✨",
    "别久坐，起来动一动～",
    "记得抬头看看远方 👀",
    "今天的你也很棒！",
    "嘿，保持微笑呀 🙂",
]


# ── Position / config persistence ─────────────────────

def load_position():
    try:
        if os.path.exists(POSITION_FILE):
            with open(POSITION_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("x", -1), data.get("y", -1)
    except Exception:
        pass
    return -1, -1

def save_position(x, y):
    try:
        with open(POSITION_FILE, "w", encoding="utf-8") as f:
            json.dump({"x": x, "y": y}, f)
    except Exception:
        pass

def load_config():
    """Load config from JSON file. Merge with defaults so missing keys don't crash."""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {**DEFAULT_CONFIG, **data}
    except Exception:
        pass
    return {**DEFAULT_CONFIG}

# ── Auth persistence ──────────────────────────────────

def load_auth():
    try:
        if os.path.exists(AUTH_FILE):
            with open(AUTH_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return None

def save_auth(data):
    try:
        with open(AUTH_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
    except Exception:
        pass

def clear_auth():
    try:
        if os.path.exists(AUTH_FILE):
            os.remove(AUTH_FILE)
    except Exception:
        pass

# ── Supabase REST (stdlib urllib only) ────────────────

def _api(method, path, headers=None, payload=None, query=None):
    """Low-level Supabase request. Returns (status, parsed_json|None, err_msg|None)."""
    url = SUPABASE_URL + path
    if query:
        url += "?" + urllib.parse.urlencode(query)
    h = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}
    if headers:
        h.update(headers)
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8")
            parsed = json.loads(body) if body else None
            return resp.status, parsed, None
    except urllib.error.HTTPError as e:
        try:
            ej = json.loads(e.read().decode("utf-8"))
            msg = (
                ej.get("msg")
                or ej.get("message")
                or ej.get("error_description")
                or ej.get("error")
                or str(e)
            )
        except Exception:
            msg = str(e)
        return e.code, None, msg
    except Exception as e:
        return 0, None, "网络错误：" + str(e)


def supabase_login(email, password):
    status, data, err = _api(
        "POST",
        "/auth/v1/token",
        query={"grant_type": "password"},
        payload={"email": email, "password": password},
    )
    if err:
        return False, err
    if not data or "access_token" not in data:
        return False, "登录失败"
    user = data.get("user") or {}
    save_auth({
        "access_token": data["access_token"],
        "refresh_token": data.get("refresh_token"),
        "user_id": user.get("id"),
        "email": user.get("email") or email,
        "expires_at": time.time() + data.get("expires_in", 3600),
    })
    return True, None


def supabase_refresh():
    auth = load_auth()
    if not auth or not auth.get("refresh_token"):
        return False
    status, data, err = _api(
        "POST",
        "/auth/v1/token",
        query={"grant_type": "refresh_token"},
        payload={"refresh_token": auth["refresh_token"]},
    )
    if err or not data or "access_token" not in data:
        return False
    auth["access_token"] = data["access_token"]
    auth["refresh_token"] = data.get("refresh_token", auth["refresh_token"])
    auth["expires_at"] = time.time() + data.get("expires_in", 3600)
    user = data.get("user") or {}
    if user.get("id"):
        auth["user_id"] = user["id"]
    save_auth(auth)
    return True


def _ensure_token():
    """Return (access_token, user_id) refreshing if near expiry; (None, None) if logged out."""
    auth = load_auth()
    if not auth or not auth.get("access_token"):
        return None, None
    if auth.get("expires_at", 0) - time.time() < 60:
        if supabase_refresh():
            auth = load_auth()
        else:
            return None, None
    return auth.get("access_token"), auth.get("user_id")


def supabase_insert_entry(title, minutes):
    """Insert a focus session into time_entries → shows up in the web calendar."""
    token, user_id = _ensure_token()
    if not token or not user_id:
        return False, None, "未登录"
    payload = {
        "user_id": user_id,
        "title": title or "专注",
        "duration_minutes": minutes,
        "pomodoro_count": minutes // 25,
        "tags": [],
    }
    status, data, err = _api(
        "POST",
        "/rest/v1/time_entries",
        headers={"Authorization": "Bearer " + token, "Prefer": "return=representation"},
        payload=payload,
    )
    if err:
        return False, None, err
    entry_id = None
    if isinstance(data, list) and data:
        entry_id = data[0].get("id")
    return True, entry_id, None


def supabase_update_note(entry_id, note):
    token, user_id = _ensure_token()
    if not token:
        return False, "未登录"
    status, data, err = _api(
        "PATCH",
        "/rest/v1/time_entries",
        headers={"Authorization": "Bearer " + token},
        payload={"note": note},
        query={"id": "eq." + str(entry_id)},
    )
    if err:
        return False, err
    return True, None


def supabase_insert_entry_note(content):
    """把一条碎碎念写进 entries（笔记灵感库）→ 网页笔记里能看到；source 标记为 desktop。"""
    token, user_id = _ensure_token()
    if not token or not user_id:
        return False, "未登录"
    status, data, err = _api(
        "POST",
        "/rest/v1/entries",
        headers={"Authorization": "Bearer " + token},
        payload={
            "user_id": user_id,
            "type": "text",
            "content": content,
            "source": "desktop",
        },
    )
    if err:
        return False, err
    return True, None

# ── Main companion class ──────────────────────────────

class Companion:
    def __init__(self):
        self.config = load_config()

        # Write PID so web panel can detect & control us.
        # Best-effort only: a locked/contended file (e.g. another instance starting
        # at the same moment) must never crash the companion.
        try:
            with open(PID_FILE, "w") as f:
                f.write(str(os.getpid()))
        except Exception:
            pass

        self.root = tk.Tk()
        self.root.title(self._nickname() + " · 桌面伙伴")

        # ── Hidden anchor window ─────────────────────────
        # Windows 10/11 deny SetForegroundWindow to any process whose ONLY
        # windows are overrideredirect.  We create a tiny normal Toplevel
        # (invisible but technically mapped) so the OS believes this process
        # has a "real" window and allows keyboard focus on every popup.
        self._anchor = tk.Toplevel(self.root)
        self._anchor.geometry("1x1+-100+-100")
        self._anchor.attributes("-alpha", 0.0)       # invisible
        self._anchor.overrideredirect(False)
        # ──────────────────────────────────────────────────

        # ── Window attributes ──────────────────────────
        self.root.overrideredirect(True)
        self.root.wm_attributes("-transparentcolor", TRANSPARENT_COLOR)
        self.root.wm_attributes("-topmost", True)
        self.root.configure(bg=TRANSPARENT_COLOR)

        # ── Size & position ────────────────────────────
        self.W = 170
        self.H = 190
        saved_x, saved_y = load_position()
        if saved_x >= 0 and saved_y >= 0:
            self.root.geometry(f"{self.W}x{self.H}+{saved_x}+{saved_y}")
        else:
            sw = self.root.winfo_screenwidth()
            sh = self.root.winfo_screenheight()
            self.root.geometry(f"{self.W}x{self.H}+{sw - self.W - 30}+{sh - self.H - 60}")

        # ── Bubble label ───────────────────────────────
        self.bubble_frame = tk.Frame(self.root, bg=TRANSPARENT_COLOR)
        self.bubble_frame.pack(side=tk.TOP, pady=(8, 0))

        self.bubble_label = tk.Label(
            self.bubble_frame,
            text="",
            font=(YH, 10),
            bg="#FFFFFF",
            fg="#1a3a5c",
            wraplength=130,
            justify=tk.CENTER,
            padx=8,
            pady=4,
            relief=tk.SOLID,
            bd=0,
        )
        self.bubble_label.pack_forget()
        self.bubble_timer_id = None
        self.bubble_phrase_showing = False

        # ── Character display area ─────────────────────
        self.char_frame = tk.Frame(self.root, bg=TRANSPARENT_COLOR)
        self.char_frame.pack(pady=(4, 0))

        self.char_label = tk.Label(
            self.char_frame,
            bg=TRANSPARENT_COLOR,
            cursor="hand2",
        )
        self.char_label.pack()

        # ── Name (also shows live timer while running) ──
        self.name_label = tk.Label(
            self.root,
            text=self._nickname(),
            font=(YH, 9),
            bg=TRANSPARENT_COLOR,
            fg="#90a4ae",
            cursor="hand2",
        )
        self.name_label.pack(pady=(0, 4))

        # ── GIF state (only used in gif mode) ──────────
        self._gif_frames = []
        self._gif_idx = 0
        self._gif_after_id = None
        self._gif_delay = 80  # ms between frames

        # ── PhotoImage references (prevent GC) ─────────
        self._photo_ref = None
        self._breath_after = None
        self._bubble_timer = None
        self._config_watcher = None
        self._breath_scale_idx = 0

        # ── Drag vs click state ────────────────────────
        self._press_x = 0
        self._press_y = 0
        self._win_x = 0
        self._win_y = 0
        self._dragging = False
        self._name_overridden = False

        # ── Timer state (timestamp-based, survives panel close) ──
        self.timer_mode = "countdown"        # "countup" | "countdown"
        self.timer_countdown_min = 25
        self.timer_running = False
        self.timer_started_at = None         # epoch seconds
        self.timer_base_elapsed = 0          # accumulated seconds (paused)
        self.timer_title = ""
        self.last_entry_id = None
        self._pending_record = None

        # ── Window refs ────────────────────────────────
        self.panel = None
        self.login_win = None
        self.finish_win = None
        self.quicknote_win = None
        self._qn_text = None
        self.avatar_win = None
        self.p_widgets = {}

        # ── Apply initial mode ─────────────────────────
        self.apply_config()

        # ── Events ─────────────────────────────────────
        self._bind_events()

        # ── Start services ─────────────────────────────
        self.schedule_bubble()
        self.watch_config()
        self._tick()

        self.root.mainloop()

    # ── Helpers ─────────────────────────────────────────

    def _nickname(self):
        return self.config.get("nickname") or "小H"

    # ── Bind mouse events ──────────────────────────────

    def _bind_events(self):
        # Bind on root → fires for clicks on all child labels too (bindtags).
        self.root.bind("<Button-1>", self.on_press)
        self.root.bind("<B1-Motion>", self.on_motion)
        self.root.bind("<ButtonRelease-1>", self.on_release)
        self.root.bind("<Button-3>", self.on_right_click)

    # ── Apply config (all modes) ──────────────────────

    def apply_config(self):
        """Update the UI according to current config."""
        cfg = self.config
        mode = cfg.get("mode", "emoji")

        # Stop any running GIF animation
        self._stop_gif()

        # Update name (unless timer is overriding it)
        if not self._name_overridden:
            self.name_label.configure(text=self._nickname())

        if mode == "emoji":
            self._apply_emoji_mode(cfg)
        elif mode == "gif":
            self._apply_gif_mode(cfg)
        else:
            self._apply_image_mode(cfg)

    # ── Media path resolution ─────────────────────────

    def _resolve_media(self, image_path):
        """Find the actual file: absolute path, then BASE_DIR / public / DATA_DIR."""
        if not image_path:
            return ""
        candidates = []
        if os.path.isabs(image_path):
            candidates.append(image_path)
        candidates.append(os.path.join(BASE_DIR, image_path))
        candidates.append(os.path.join(IMAGE_DIR, image_path))
        candidates.append(os.path.join(DATA_DIR, image_path))
        for c in candidates:
            if c and os.path.exists(c):
                return c
        return ""

    # ── Emoji mode ────────────────────────────────────

    def _apply_emoji_mode(self, cfg):
        char = cfg.get("character", "🐱")
        self.char_label.configure(
            text=char,
            image="",
            font=("Segoe UI Emoji", 68),
        )
        self._photo_ref = None
        self.root.geometry(f"{self.W}x{self.H}")

        if cfg.get("breathing_enabled", True):
            self.animate_breathe()
        else:
            self._stop_breathe()
            self.char_label.configure(font=("Segoe UI Emoji", 68))

    # ── Image mode (static PNG/JPG) ───────────────────

    def _apply_image_mode(self, cfg):
        self._stop_breathe()
        full_path = self._resolve_media(cfg.get("image_path", ""))

        if full_path:
            try:
                from PIL import Image, ImageTk
                pil_img = Image.open(full_path)
                pil_img = pil_img.resize((120, 120), Image.LANCZOS)
                img = ImageTk.PhotoImage(pil_img)
                self._photo_ref = img
                self.char_label.configure(image=img, text="", font=("Segoe UI Emoji", 1))
            except Exception:
                self._fallback_emoji()
        else:
            self.char_label.configure(text="🖼️", image="", font=("Segoe UI Emoji", 48))
            self._photo_ref = None

        if cfg.get("breathing_enabled", True):
            self.animate_breathe()
        else:
            self._stop_breathe()

    # ── GIF mode ──────────────────────────────────────

    def _apply_gif_mode(self, cfg):
        self._stop_breathe()
        self._stop_gif()

        full_path = self._resolve_media(cfg.get("image_path", ""))

        if full_path and full_path.lower().endswith(".gif"):
            try:
                from PIL import Image, ImageSequence, ImageTk

                pil_img = Image.open(full_path)
                frames = []
                for frame in ImageSequence.Iterator(pil_img):
                    f = frame.convert("RGBA")
                    f = f.resize((120, 120), Image.LANCZOS)
                    frames.append(ImageTk.PhotoImage(f))

                if frames:
                    self._gif_frames = frames
                    self._gif_idx = 0
                    self._gif_delay = max(40, pil_img.info.get("duration", 80))
                    self.char_label.configure(
                        image=frames[0], text="", font=("Segoe UI Emoji", 1)
                    )
                    self._photo_ref = frames[0]
                    self._play_gif_frame()
                    return
            except Exception:
                pass

        # Fallback: try as static image
        self.char_label.configure(text="🎞️", image="", font=("Segoe UI Emoji", 48))
        self._photo_ref = None

    def _play_gif_frame(self):
        if not self._gif_frames:
            return
        self._gif_idx = (self._gif_idx + 1) % len(self._gif_frames)
        frame = self._gif_frames[self._gif_idx]
        self._photo_ref = frame
        try:
            self.char_label.configure(image=frame)
        except tk.TclError:
            return
        self._gif_after_id = self.root.after(self._gif_delay, self._play_gif_frame)

    def _stop_gif(self):
        if self._gif_after_id is not None:
            self.root.after_cancel(self._gif_after_id)
            self._gif_after_id = None
        self._gif_frames = []
        self._gif_idx = 0

    # ── Fallback ──────────────────────────────────────

    def _fallback_emoji(self):
        self.char_label.configure(
            text=self.config.get("character", "🐱"),
            image="",
            font=("Segoe UI Emoji", 68),
        )
        self._photo_ref = None

    # ── Breathing animation ───────────────────────────

    def _stop_breathe(self):
        if self._breath_after is not None:
            self.root.after_cancel(self._breath_after)
            self._breath_after = None

    def animate_breathe(self):
        if not self.config.get("breathing_enabled", True):
            self._stop_breathe()
            return
        if self.config.get("mode") == "gif":
            return
        mode = self.config.get("mode", "emoji")
        if mode not in ("emoji", "image"):
            return

        if mode == "image":
            sizes = [0.96, 0.98, 1.0, 1.02, 1.0, 0.98]
            scale = sizes[self._breath_scale_idx % len(sizes)]
            self._breath_scale_idx += 1
            try:
                self.char_label.configure(font=("Segoe UI Emoji", max(1, int(68 * scale))))
            except tk.TclError:
                pass
        else:
            sizes = [64, 66, 68, 70, 72, 70, 68, 66]
            size = sizes[self._breath_scale_idx % len(sizes)]
            self._breath_scale_idx += 1
            try:
                self.char_label.configure(font=("Segoe UI Emoji", size))
            except tk.TclError:
                pass

        self._breath_after = self.root.after(250, self.animate_breathe)

    # ── Speech bubbles ─────────────────────────────────

    def schedule_bubble(self):
        if not self.config.get("bubble_enabled", True):
            return
        delay = random.randint(8000, 20000)
        self._bubble_timer = self.root.after(delay, self.show_bubble)

    def show_bubble(self):
        if not self.config.get("bubble_enabled", True):
            return
        if self.timer_running:
            self.schedule_bubble()
            return
        phrase = random.choice(IDLE_PHRASES)
        self.bubble_label.configure(text=phrase)
        self.bubble_label.pack(side=tk.TOP, pady=(8, 0))
        self.bubble_phrase_showing = True
        self.root.after(3500, self.hide_bubble)

    def hide_bubble(self):
        if not self.bubble_phrase_showing:
            return
        self.bubble_phrase_showing = False
        self.bubble_label.pack_forget()
        self.schedule_bubble()

    def _flash_bubble(self, text, ms=1500):
        if self._bubble_timer:
            self.root.after_cancel(self._bubble_timer)
        if self.bubble_phrase_showing:
            self.bubble_phrase_showing = False
            self.bubble_label.pack_forget()
        self.bubble_label.configure(text=text)
        self.bubble_label.pack(side=tk.TOP, pady=(8, 0))
        self.bubble_phrase_showing = True
        self.root.after(ms, self.hide_bubble)

    # ── Press / drag / click ──────────────────────────

    def on_press(self, event):
        self._press_x = event.x_root
        self._press_y = event.y_root
        self._win_x = self.root.winfo_x()
        self._win_y = self.root.winfo_y()
        self._dragging = False

    def on_motion(self, event):
        dx = event.x_root - self._press_x
        dy = event.y_root - self._press_y
        if not self._dragging and (abs(dx) > 5 or abs(dy) > 5):
            self._dragging = True
        if self._dragging:
            self.root.geometry(f"+{self._win_x + dx}+{self._win_y + dy}")

    def on_release(self, event):
        if self._dragging:
            save_position(self.root.winfo_x(), self.root.winfo_y())
            self._dragging = False
        else:
            self._flash_bubble(random.choice(CLICK_PHRASES), ms=2500)

    # ── Right-click menu (rebuilt to reflect login state) ──

    def on_right_click(self, event):
        # Plain text labels (no emoji) so every item shares one left edge.
        menu = tk.Menu(self.root, tearoff=0, font=(YH, 10))
        menu.add_command(label="记点碎碎念", command=self.open_quicknote)
        menu.add_command(label="开始专注", command=self.open_panel)
        menu.add_separator()
        menu.add_command(label="换形象…", command=self.change_avatar)
        menu.add_command(label="改名…", command=self.rename)
        menu.add_separator()
        auth = load_auth()
        if auth and auth.get("email"):
            menu.add_command(label=auth["email"], state="disabled")
            menu.add_command(label="退出登录", command=self.logout)
        else:
            menu.add_command(label="登录（记入日历）", command=lambda: self.open_login())
        menu.add_separator()
        menu.add_command(label="打开网页面板", command=self.open_web)
        menu.add_command(label="伙伴设置", command=self.open_settings)
        menu.add_separator()
        menu.add_command(label="退出 " + self._nickname(), command=self.quit)
        try:
            menu.tk_popup(event.x_root, event.y_root)
        finally:
            menu.grab_release()

    def open_web(self):
        webbrowser.open(self.config.get("web_url") or DEFAULT_WEB_PANEL_URL)

    def open_settings(self):
        base = self.config.get("web_url") or DEFAULT_WEB_PANEL_URL
        webbrowser.open(f"{base}/partner")

    # ── Config save ───────────────────────────────────

    def save_config(self):
        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
            self._config_mtime = os.path.getmtime(CONFIG_FILE)
        except Exception:
            pass

    # ── Change avatar (emoji preset or local image) ──

    def change_avatar(self):
        """换形象唯一入口：Emoji 预设网格 + 选本地图片/GIF，即点即换、无需登录。"""
        if self.avatar_win is not None and self.avatar_win.winfo_exists():
            self.avatar_win.lift()
            return
        win = tk.Toplevel(self.root)
        self.avatar_win = win
        win.title("换形象")
        win.wm_attributes("-topmost", True)
        win.resizable(False, False)
        win.configure(bg="#ffffff")
        px = max(10, self.root.winfo_x() - 110)
        py = max(10, self.root.winfo_y() - 180)
        win.geometry(f"320x300+{px}+{py}")

        def close_av():
            win.destroy()
            self.avatar_win = None

        win.protocol("WM_DELETE_WINDOW", close_av)

        body = tk.Frame(win, bg="#ffffff")
        body.pack(fill=tk.BOTH, expand=True, padx=14, pady=12)

        tk.Label(body, text="🎨 选个形象", bg="#ffffff", fg="#1565c0",
                 font=(YH, 12, "bold")).pack(anchor="w")
        tk.Label(body, text="点一下即换 · 也可以选自己的图片/GIF", bg="#ffffff",
                 fg="#90a4ae", font=(YH, 8)).pack(anchor="w", pady=(2, 8))

        grid = tk.Frame(body, bg="#ffffff")
        grid.pack(fill=tk.X)
        cur_id = self.config.get("character_id")
        for i, (cid, emoji, name) in enumerate(AVATAR_PRESETS):
            selected = (self.config.get("mode") == "emoji" and cid == cur_id)
            cell = tk.Button(
                grid, text=emoji, font=("Segoe UI Emoji", 22),
                bg="#e3f2fd" if selected else "#f5f9ff",
                activebackground="#bbdefb", relief=tk.FLAT, cursor="hand2",
                width=2, command=lambda c=cid, e=emoji: self._pick_emoji(c, e, close_av),
            )
            cell.grid(row=i // 3, column=i % 3, padx=4, pady=4, sticky="nsew")
        for c in range(3):
            grid.columnconfigure(c, weight=1)

        tk.Button(
            body, text="📁 选本地图片 / GIF…", font=(YH, 9),
            bg="#42a5f5", fg="#ffffff", relief=tk.FLAT, cursor="hand2",
            command=lambda: self._pick_image_file(close_av),
        ).pack(fill=tk.X, pady=(10, 0))

    def _pick_emoji(self, cid, emoji, close):
        self.config["mode"] = "emoji"
        self.config["character"] = emoji
        self.config["character_id"] = cid
        self.config["image_path"] = ""
        self.save_config()
        self.apply_config()
        close()
        self._flash_bubble("换好啦～ ✨")

    def _pick_image_file(self, close):
        path = filedialog.askopenfilename(
            title="选择图片或 GIF",
            filetypes=[("图片/动图", "*.png *.jpg *.jpeg *.gif"), ("所有文件", "*.*")],
        )
        if not path:
            return
        ext = os.path.splitext(path)[1].lower()
        if ext not in (".png", ".jpg", ".jpeg", ".gif"):
            messagebox.showwarning("不支持的格式", "请选择 PNG / JPG / GIF 文件")
            return
        try:
            dest = os.path.join(DATA_DIR, "avatar" + ext)
            if os.path.abspath(path) != os.path.abspath(dest):
                shutil.copyfile(path, dest)
        except Exception:
            dest = path  # fall back to using the original path in place
        self.config["mode"] = "gif" if ext == ".gif" else "image"
        self.config["image_path"] = dest
        self.save_config()
        self.apply_config()
        close()
        self._flash_bubble("换好啦～ ✨")

    # ── Rename ────────────────────────────────────────

    def rename(self):
        new = simpledialog.askstring("改名", "给我起个名字吧：", initialvalue=self._nickname())
        if new is None:
            return
        new = new.strip()
        if not new:
            return
        self.config["nickname"] = new
        self.save_config()
        self.root.title(new + " · 桌面伙伴")
        if not self._name_overridden:
            self.name_label.configure(text=new)
        self._flash_bubble("我叫 " + new + " 啦～")

    # ── Async helper (run network off the UI thread) ──

    def run_async(self, fn, on_done):
        def worker():
            try:
                res = fn()
            except Exception as e:
                res = (False, None, str(e))
            try:
                self.root.after(0, lambda: on_done(res))
            except Exception:
                pass
        threading.Thread(target=worker, daemon=True).start()

    # ── Login window ──────────────────────────────────

    def open_login(self, after=None):
        if self.login_win is not None and self.login_win.winfo_exists():
            self.login_win.lift()
            return
        win = tk.Toplevel(self.root)
        self.login_win = win
        win.title("登录")
        win.configure(bg="#ffffff")
        win.wm_attributes("-topmost", True)
        win.resizable(False, False)
        try:
            win.geometry("300x220+%d+%d" % (self.root.winfo_x() - 70, self.root.winfo_y() - 120))
        except Exception:
            pass

        tk.Label(win, text="登录后专注会记入网页日历", bg="#ffffff", fg="#1a3a5c",
                 font=(YH, 10, "bold")).pack(pady=(16, 8))
        tk.Label(win, text="邮箱", bg="#ffffff", fg="#5c8dc9", font=(YH, 9)).pack(anchor="w", padx=24)
        email_e = tk.Entry(win, font=(YH, 10), width=28)
        email_e.pack(padx=24, pady=(0, 6))
        tk.Label(win, text="密码", bg="#ffffff", fg="#5c8dc9", font=(YH, 9)).pack(anchor="w", padx=24)
        pwd_e = tk.Entry(win, font=(YH, 10), width=28, show="•")
        pwd_e.pack(padx=24, pady=(0, 8))
        status = tk.Label(win, text="", bg="#ffffff", fg="#e57373", font=(YH, 8))
        status.pack()

        def do_login():
            email = email_e.get().strip()
            pwd = pwd_e.get()
            if not email or not pwd:
                status.configure(text="请输入邮箱和密码")
                return
            status.configure(text="登录中…", fg="#90a4ae")
            btn.configure(state="disabled")

            def done(res):
                ok, err = res
                if ok:
                    if win.winfo_exists():
                        win.destroy()
                    self._flash_bubble("登录成功 ✨")
                    if after:
                        after()
                else:
                    if win.winfo_exists():
                        status.configure(text="登录失败：" + (err or ""), fg="#e57373")
                        btn.configure(state="normal")

            self.run_async(lambda: supabase_login(email, pwd), done)

        btn = tk.Button(win, text="登录", font=(YH, 10), bg="#42a5f5", fg="#ffffff",
                        relief=tk.FLAT, width=12, cursor="hand2", command=do_login)
        btn.pack(pady=6)
        pwd_e.bind("<Return>", lambda e: do_login())
        self._grab_keyboard(win, email_e, add_appwindow=True)

    def logout(self):
        clear_auth()
        self._flash_bubble("已退出登录")

    def _win32_foreground(self, win, add_appwindow=False):
        """Seize OS keyboard focus on Windows for an overrideredirect popup.

        Win 10/11 deny SetForegroundWindow to a process whose only window is
        overrideredirect (no taskbar entry → "never foreground"). Two things matter:

        1.  Every Win32 call below MUST declare argtypes/restype. On 64-bit Python,
            ctypes otherwise treats each HWND as a 32-bit int and truncates the real
            64-bit window handle — so the call silently acts on a garbage handle and
            fails. This (not the focus lock) is why earlier attempts never worked.
        2.  AttachThreadInput to the foreground thread lets us legally call
            SetForegroundWindow / SetActiveWindow / SetFocus.

        add_appwindow gives the popup a taskbar presence (WS_EX_APPWINDOW) so the OS
        treats it as a real, activatable application window.
        """
        if sys.platform != "win32":
            return
        try:
            import ctypes
            from ctypes import wintypes
            user32 = ctypes.windll.user32
            kernel32 = ctypes.windll.kernel32

            HWND = wintypes.HWND
            # ── Declare signatures so 64-bit HWNDs aren't truncated to int ──
            user32.GetAncestor.restype = HWND
            user32.GetAncestor.argtypes = [HWND, wintypes.UINT]
            user32.GetForegroundWindow.restype = HWND
            user32.GetForegroundWindow.argtypes = []
            user32.GetWindowThreadProcessId.restype = wintypes.DWORD
            user32.GetWindowThreadProcessId.argtypes = [HWND, ctypes.POINTER(wintypes.DWORD)]
            user32.AttachThreadInput.restype = wintypes.BOOL
            user32.AttachThreadInput.argtypes = [wintypes.DWORD, wintypes.DWORD, wintypes.BOOL]
            user32.BringWindowToTop.restype = wintypes.BOOL
            user32.BringWindowToTop.argtypes = [HWND]
            user32.SetForegroundWindow.restype = wintypes.BOOL
            user32.SetForegroundWindow.argtypes = [HWND]
            user32.SetActiveWindow.restype = HWND
            user32.SetActiveWindow.argtypes = [HWND]
            user32.SetFocus.restype = HWND
            user32.SetFocus.argtypes = [HWND]
            user32.SetWindowPos.restype = wintypes.BOOL
            user32.SetWindowPos.argtypes = [HWND, HWND, ctypes.c_int, ctypes.c_int,
                                            ctypes.c_int, ctypes.c_int, wintypes.UINT]
            user32.AllowSetForegroundWindow.restype = wintypes.BOOL
            user32.AllowSetForegroundWindow.argtypes = [wintypes.DWORD]
            kernel32.GetCurrentThreadId.restype = wintypes.DWORD
            kernel32.GetCurrentThreadId.argtypes = []
            # *Ptr variants exist only on 64-bit; fall back to the 32-bit names.
            get_long = getattr(user32, "GetWindowLongPtrW", None) or user32.GetWindowLongW
            set_long = getattr(user32, "SetWindowLongPtrW", None) or user32.SetWindowLongW
            get_long.restype = ctypes.c_ssize_t
            get_long.argtypes = [HWND, ctypes.c_int]
            set_long.restype = ctypes.c_ssize_t
            set_long.argtypes = [HWND, ctypes.c_int, ctypes.c_ssize_t]

            win.update_idletasks()
            GA_ROOT = 2
            hwnd = user32.GetAncestor(win.winfo_id(), GA_ROOT) or win.winfo_id()

            # ── 1. Taskbar presence → the OS sees a real, activatable window ──
            if add_appwindow:
                GWL_EXSTYLE = -20
                WS_EX_APPWINDOW = 0x00040000
                WS_EX_TOOLWINDOW = 0x00000080
                try:
                    old_ex = get_long(hwnd, GWL_EXSTYLE)
                    new_ex = (old_ex & ~WS_EX_TOOLWINDOW) | WS_EX_APPWINDOW
                    set_long(hwnd, GWL_EXSTYLE, new_ex)
                except Exception:
                    pass

            # ── 2. Ask the system to lift the foreground lock ──
            try:
                user32.AllowSetForegroundWindow(0xFFFFFFFF)
            except Exception:
                pass

            # ── 3. Attach to the foreground thread's input queue ──
            fg = user32.GetForegroundWindow()
            cur = kernel32.GetCurrentThreadId()
            fg_thread = user32.GetWindowThreadProcessId(fg, None) if fg else 0
            attached = False
            if fg_thread and fg_thread != cur:
                attached = bool(user32.AttachThreadInput(fg_thread, cur, True))

            # ── 4. Float to top, then relax topmost ──
            HWND_TOPMOST = HWND(-1)
            HWND_NOTOPMOST = HWND(-2)
            SWP_NOMOVE = 0x0002
            SWP_NOSIZE = 0x0001
            SWP_SHOWWINDOW = 0x0040
            flags = SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW
            user32.SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, flags)
            user32.SetWindowPos(hwnd, HWND_NOTOPMOST, 0, 0, 0, 0, flags)

            # ── 5. Activate + focus ──
            user32.BringWindowToTop(hwnd)
            user32.SetForegroundWindow(hwnd)
            user32.SetActiveWindow(hwnd)
            user32.SetFocus(hwnd)

            if attached:
                user32.AttachThreadInput(fg_thread, cur, False)
        except Exception:
            pass

    def _grab_keyboard(self, win, widget, add_appwindow=False):
        """Force OS-level keyboard focus onto a popup.

        Win 10/11 deny SetForegroundWindow to a process spawned from an
        overrideredirect root, so the first attempt can lose the race with the
        window actually mapping. We retry a few times early (idle → 80 → 250 → 500)
        and stop — running it later would yank focus away mid-typing. The first call
        grants WS_EX_APPWINDOW so the popup is a "real" window in the OS's eyes.
        """
        def go(aaw=False):
            if not win.winfo_exists():
                return
            try:
                win.deiconify()
                win.lift()
                win.update_idletasks()
                self._win32_foreground(win, add_appwindow=aaw)
                win.focus_force()
                if widget is not None and widget.winfo_exists():
                    widget.focus_set()
                    widget.focus_force()
            except Exception:
                pass
        # First call: add APPWINDOW style so Windows knows this is a real window.
        win.after_idle(lambda: go(add_appwindow))
        win.after(80, go)
        win.after(250, go)
        win.after(500, go)

    # ── Timer core ────────────────────────────────────

    def elapsed(self):
        if self.timer_running and self.timer_started_at is not None:
            return self.timer_base_elapsed + int(time.time() - self.timer_started_at)
        return self.timer_base_elapsed

    @staticmethod
    def fmt(s):
        s = max(0, int(s))
        return f"{s // 60:02d}:{s % 60:02d}"

    def _display_seconds(self):
        el = self.elapsed()
        if self.timer_mode == "countdown":
            return max(0, self.timer_countdown_min * 60 - el)
        return el

    def start_or_resume(self):
        self.timer_started_at = time.time()
        self.timer_running = True
        self.refresh_panel()

    def pause_timer(self):
        self.timer_base_elapsed = self.elapsed()
        self.timer_started_at = None
        self.timer_running = False
        self._restore_name()
        self.refresh_panel()

    def reset_timer(self):
        self.timer_running = False
        self.timer_started_at = None
        self.timer_base_elapsed = 0
        self._restore_name()
        self.refresh_panel()

    def toggle_start(self):
        if self.timer_running:
            self.pause_timer()
        else:
            self.start_or_resume()

    def set_mode(self, mode):
        if self.timer_running:
            return
        self.timer_mode = mode
        self.timer_base_elapsed = 0
        self.timer_started_at = None
        self.refresh_panel()

    def set_countdown_min(self, m):
        if self.timer_running:
            return
        self.timer_countdown_min = m
        self.timer_base_elapsed = 0
        self.refresh_panel()

    def _restore_name(self):
        if self._name_overridden:
            self._name_overridden = False
            self.name_label.configure(text=self._nickname())

    def finish(self):
        el = self.elapsed()
        capped = min(el, self.timer_countdown_min * 60) if self.timer_mode == "countdown" else el
        self.timer_running = False
        self.timer_started_at = None
        self.timer_base_elapsed = 0
        self._restore_name()
        self.refresh_panel()

        if capped < 30:
            self._set_status("不足 30 秒，未记录")
            return

        minutes = max(1, round(capped / 60))
        title = (self.timer_title or "").strip() or "专注"

        auth = load_auth()
        if not auth or not auth.get("access_token"):
            self.open_login(after=lambda: self._do_record(minutes, title))
            return
        self._do_record(minutes, title)

    def _do_record(self, minutes, title):
        self._set_status("正在记录…")
        self.run_async(
            lambda: supabase_insert_entry(title, minutes),
            lambda res: self._after_record(res, minutes, title),
        )

    def _after_record(self, res, minutes, title):
        ok, entry_id, err = res
        if not ok:
            self._set_status("记录失败：" + (err or ""))
            return
        self.last_entry_id = entry_id
        self.show_finish_frame(minutes, title)

    # ── Timer panel (Toplevel card) ───────────────────

    def toggle_panel(self):
        if self.panel is not None and self.panel.winfo_exists():
            self.close_panel()
        else:
            self.open_panel()

    def close_panel(self):
        if self.panel is not None and self.panel.winfo_exists():
            self.panel.destroy()
        self.panel = None
        self.p_widgets = {}

    def open_panel(self):
        if self.panel is not None and self.panel.winfo_exists():
            self.panel.lift()
            return
        p = tk.Toplevel(self.root)
        self.panel = p
        # 用带标题栏的普通窗口（非 overrideredirect）：Win11 只允许这种窗口成为前台/活动窗口，
        # 输入框才能稳定接收键盘；overrideredirect 窗口像气泡提示，永远拿不到键盘焦点。
        p.title("⏱ 专注计时")
        p.wm_attributes("-topmost", True)
        p.resizable(False, False)
        p.configure(bg="#ffffff")
        p.protocol("WM_DELETE_WINDOW", self.close_panel)
        px = self.root.winfo_x() - 80
        py = self.root.winfo_y() - 320
        px = max(10, px)
        py = max(10, py)
        p.geometry(f"270x380+{px}+{py}")

        wrap = tk.Frame(p, bg="#ffffff")
        wrap.pack(fill=tk.BOTH, expand=True)

        body = tk.Frame(wrap, bg="#ffffff")
        body.pack(fill=tk.BOTH, expand=True, padx=14, pady=10)

        # Mode toggle
        mode_row = tk.Frame(body, bg="#ffffff")
        mode_row.pack(fill=tk.X)
        self.p_widgets["mode_btns"] = {}
        for m, lbl in (("countdown", "⏳ 倒计时"), ("countup", "⏱ 正计时")):
            b = tk.Button(mode_row, text=lbl, font=(YH, 9), relief=tk.FLAT,
                          cursor="hand2", command=lambda mm=m: self.set_mode(mm))
            b.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)
            self.p_widgets["mode_btns"][m] = b

        # Countdown presets
        preset_row = tk.Frame(body, bg="#ffffff")
        preset_row.pack(fill=tk.X, pady=(8, 0))
        self.p_widgets["preset_row"] = preset_row
        self.p_widgets["preset_btns"] = {}
        for mn in (15, 25, 45, 60):
            b = tk.Button(preset_row, text=str(mn), font=(YH, 8), relief=tk.FLAT,
                          width=4, cursor="hand2", command=lambda x=mn: self.set_countdown_min(x))
            b.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)
            self.p_widgets["preset_btns"][mn] = b

        # Big time
        p_time = tk.Label(body, text="00:00", bg="#ffffff", fg="#1a3a5c", font=(YH, 34, "bold"),
                          anchor="w")
        p_time.pack(fill=tk.X, pady=(10, 0))
        self.p_widgets["time"] = p_time

        # Current clock
        p_clock = tk.Label(body, text="", bg="#ffffff", fg="#90a4ae", font=(YH, 9), anchor="w")
        p_clock.pack(fill=tk.X)
        self.p_widgets["clock"] = p_clock

        # What are you doing
        tk.Label(body, text="正在做什么", bg="#ffffff", fg="#5c8dc9", font=(YH, 8)).pack(anchor="w", pady=(8, 0))
        entry = tk.Entry(body, font=(YH, 10))
        entry.pack(fill=tk.X)
        entry.insert(0, self.timer_title or "")
        entry.bind("<KeyRelease>", lambda e: setattr(self, "timer_title", entry.get()))
        self.p_widgets["entry"] = entry

        # Controls
        ctrl = tk.Frame(body, bg="#ffffff")
        ctrl.pack(fill=tk.X, pady=(10, 0))
        startb = tk.Button(ctrl, text="开始", font=(YH, 9), bg="#42a5f5", fg="#ffffff",
                           relief=tk.FLAT, cursor="hand2", command=self.toggle_start)
        startb.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)
        self.p_widgets["start"] = startb
        tk.Button(ctrl, text="结束", font=(YH, 9), bg="#66bb6a", fg="#ffffff",
                  relief=tk.FLAT, cursor="hand2", command=self.finish).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2)
        tk.Button(ctrl, text="重置", font=(YH, 9), bg="#eceff1", fg="#607d8b",
                  relief=tk.FLAT, cursor="hand2", command=self.reset_timer).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        # Status
        p_status = tk.Label(body, text="", bg="#ffffff", fg="#90a4ae", font=(YH, 8),
                            wraplength=236, justify=tk.LEFT, anchor="w")
        p_status.pack(fill=tk.X, pady=(8, 0))
        self.p_widgets["status"] = p_status

        # Account
        p_account = tk.Label(body, text="", bg="#ffffff", fg="#b0bec5", font=(YH, 8),
                            wraplength=236, justify=tk.LEFT, anchor="w")
        p_account.pack(fill=tk.X, pady=(4, 0))
        self.p_widgets["account"] = p_account

        self.refresh_panel()
        # 抢占系统键盘焦点并落到任务输入框，确保打开即可输入。
        self._grab_keyboard(p, self.p_widgets.get("entry"), add_appwindow=True)

    def _set_status(self, text):
        w = self.p_widgets.get("status")
        if w is not None and w.winfo_exists():
            w.configure(text=text)

    def refresh_panel(self):
        if self.panel is None or not self.panel.winfo_exists():
            return
        active = "#42a5f5"
        inactive = "#f5f9ff"
        # mode buttons
        for m, b in self.p_widgets.get("mode_btns", {}).items():
            if m == self.timer_mode:
                b.configure(bg=active, fg="#ffffff")
            else:
                b.configure(bg=inactive, fg="#5c8dc9")
            b.configure(state="disabled" if self.timer_running else "normal")
        # presets (only meaningful for countdown when idle)
        show_presets = self.timer_mode == "countdown" and not self.timer_running and self.timer_base_elapsed == 0
        prow = self.p_widgets.get("preset_row")
        if prow is not None:
            if show_presets:
                prow.pack(fill=tk.X, pady=(8, 0))
            else:
                prow.pack_forget()
        for mn, b in self.p_widgets.get("preset_btns", {}).items():
            if mn == self.timer_countdown_min:
                b.configure(bg=active, fg="#ffffff")
            else:
                b.configure(bg=inactive, fg="#5c8dc9")
        # time + clock
        t = self.p_widgets.get("time")
        if t is not None:
            t.configure(text=self.fmt(self._display_seconds()))
        c = self.p_widgets.get("clock")
        if c is not None:
            c.configure(text="现在 " + time.strftime("%H:%M:%S"))
        # start button label
        sb = self.p_widgets.get("start")
        if sb is not None:
            sb.configure(text="暂停" if self.timer_running else "开始")
        # account
        ac = self.p_widgets.get("account")
        if ac is not None:
            auth = load_auth()
            if auth and auth.get("email"):
                ac.configure(text="✓ " + auth["email"] + " · 记入日历")
            else:
                ac.configure(text="未登录 · 结束时会请你登录")

    # ── Finish / reflection window ────────────────────

    def show_finish_frame(self, minutes, title):
        if self.finish_win is not None and self.finish_win.winfo_exists():
            self.finish_win.destroy()
        win = tk.Toplevel(self.root)
        self.finish_win = win
        # 同专注面板：用带标题栏的普通窗口，复盘输入框才能正常打字。
        win.title("复盘 · 记录收获")
        win.wm_attributes("-topmost", True)
        win.resizable(False, False)
        win.configure(bg="#ffffff")
        px = max(10, self.root.winfo_x() - 80)
        py = max(10, self.root.winfo_y() - 280)
        win.geometry(f"280x300+{px}+{py}")

        wrap = tk.Frame(win, bg="#ffffff", highlightbackground="#66bb6a", highlightthickness=2)
        wrap.pack(fill=tk.BOTH, expand=True)
        body = tk.Frame(wrap, bg="#ffffff")
        body.pack(fill=tk.BOTH, expand=True, padx=16, pady=14)

        tk.Label(body, text="🎉 已专注 %d 分钟" % minutes, bg="#ffffff", fg="#2e7d32",
                 font=(YH, 13, "bold")).pack(anchor="w")
        tk.Label(body, text="「%s」已记入今天的日历" % title, bg="#ffffff", fg="#66bb6a",
                 font=(YH, 9)).pack(anchor="w", pady=(2, 8))
        tk.Label(body, text="简单复盘一下吧（可留空）", bg="#ffffff", fg="#5c8dc9",
                 font=(YH, 9)).pack(anchor="w")

        txt = tk.Text(body, height=5, font=(YH, 10), wrap=tk.WORD,
                      relief=tk.SOLID, bd=1, highlightthickness=0)
        txt.pack(fill=tk.BOTH, expand=True, pady=(4, 8))
        self._grab_keyboard(win, txt, add_appwindow=True)

        status = tk.Label(body, text="", bg="#ffffff", fg="#90a4ae", font=(YH, 8))
        status.pack(anchor="w")

        btn_row = tk.Frame(body, bg="#ffffff")
        btn_row.pack(fill=tk.X, pady=(6, 0))

        def save_reflection():
            note = txt.get("1.0", tk.END).strip()
            if not note or not self.last_entry_id:
                win.destroy()
                self.finish_win = None
                return
            status.configure(text="保存中…")
            savebtn.configure(state="disabled")

            def done(res):
                ok, err = res
                if win.winfo_exists():
                    if ok:
                        win.destroy()
                        self.finish_win = None
                        self._flash_bubble("收获已记下 ✨")
                    else:
                        status.configure(text="保存失败：" + (err or ""), fg="#e57373")
                        savebtn.configure(state="normal")

            self.run_async(lambda: supabase_update_note(self.last_entry_id, note), done)

        def skip():
            win.destroy()
            self.finish_win = None

        win.protocol("WM_DELETE_WINDOW", skip)

        savebtn = tk.Button(btn_row, text="保存收获", font=(YH, 9), bg="#66bb6a", fg="#ffffff",
                            relief=tk.FLAT, cursor="hand2", command=save_reflection)
        savebtn.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)
        tk.Button(btn_row, text="完成", font=(YH, 9), bg="#eceff1", fg="#607d8b",
                  relief=tk.FLAT, cursor="hand2", command=skip).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2)

    # ── Quick note / 碎碎念 window ─────────────────────

    def open_quicknote(self):
        """随手记一句想法，回车即写进网页笔记库（entries, source=desktop）。"""
        if self.quicknote_win is not None and self.quicknote_win.winfo_exists():
            self.quicknote_win.lift()
            self._grab_keyboard(self.quicknote_win, self._qn_text, add_appwindow=True)
            return
        # 带标题栏的普通窗口，输入框才能稳定打字（同专注/复盘窗）。
        win = tk.Toplevel(self.root)
        self.quicknote_win = win
        win.title("碎碎念")
        win.wm_attributes("-topmost", True)
        win.resizable(False, False)
        win.configure(bg="#ffffff")
        px = max(10, self.root.winfo_x() - 90)
        py = max(10, self.root.winfo_y() - 210)
        win.geometry(f"300x230+{px}+{py}")

        wrap = tk.Frame(win, bg="#ffffff", highlightbackground="#ffb74d", highlightthickness=2)
        wrap.pack(fill=tk.BOTH, expand=True)
        body = tk.Frame(wrap, bg="#ffffff")
        body.pack(fill=tk.BOTH, expand=True, padx=14, pady=12)

        tk.Label(body, text="💭 此刻在想什么", bg="#ffffff", fg="#e8920a",
                 font=(YH, 12, "bold")).pack(anchor="w")
        tk.Label(body, text="回车记下并同步到网页笔记 · Shift+回车换行", bg="#ffffff",
                 fg="#b0875c", font=(YH, 8)).pack(anchor="w", pady=(2, 6))

        txt = tk.Text(body, height=4, font=(YH, 10), wrap=tk.WORD,
                      relief=tk.SOLID, bd=1, highlightthickness=0)
        txt.pack(fill=tk.BOTH, expand=True)
        self._qn_text = txt

        status = tk.Label(body, text="", bg="#ffffff", fg="#90a4ae", font=(YH, 8),
                          wraplength=260, justify=tk.LEFT, anchor="w")
        status.pack(fill=tk.X, pady=(6, 0))

        auth = load_auth()
        if not (auth and auth.get("email")):
            status.configure(text="未登录 · 右键我登录后碎碎念才会同步到网页")

        def close_qn():
            win.destroy()
            self.quicknote_win = None

        def do_save(event=None):
            note = txt.get("1.0", tk.END).strip()
            if not note:
                return "break"
            cur = load_auth()
            if not (cur and cur.get("email")):
                status.configure(text="请先右键我登录，再记碎碎念才能同步", fg="#e57373")
                return "break"
            status.configure(text="记录中…", fg="#90a4ae")
            savebtn.configure(state="disabled")

            def done(res):
                ok, err = res
                if not win.winfo_exists():
                    return
                if ok:
                    close_qn()
                    self._flash_bubble("碎碎念已记下 ✨")
                else:
                    status.configure(text="同步失败：" + (err or ""), fg="#e57373")
                    savebtn.configure(state="normal")

            self.run_async(lambda: supabase_insert_entry_note(note), done)
            return "break"

        win.protocol("WM_DELETE_WINDOW", close_qn)

        btn_row = tk.Frame(body, bg="#ffffff")
        btn_row.pack(fill=tk.X, pady=(8, 0))
        savebtn = tk.Button(btn_row, text="记下并同步", font=(YH, 9), bg="#ffa726", fg="#ffffff",
                            relief=tk.FLAT, cursor="hand2", command=do_save)
        savebtn.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)
        tk.Button(btn_row, text="关闭", font=(YH, 9), bg="#eceff1", fg="#607d8b",
                  relief=tk.FLAT, cursor="hand2", command=close_qn).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2)

        # 回车=记下（阻止换行）；Shift+回车=换行（交给 Text 默认行为）。
        txt.bind("<Return>", do_save)
        txt.bind("<Shift-Return>", lambda e: None)
        self._grab_keyboard(win, txt, add_appwindow=True)

    # ── Global tick (timer display + panel refresh + auto-finish) ──

    def _tick(self):
        try:
            if self.timer_running:
                if self.timer_mode == "countdown" and self.elapsed() >= self.timer_countdown_min * 60:
                    self.finish()
                else:
                    # live time on the companion name
                    self._name_overridden = True
                    self.name_label.configure(text="⏱ " + self.fmt(self._display_seconds()))
            if self.panel is not None and self.panel.winfo_exists():
                self.refresh_panel()
        except Exception:
            pass
        self.root.after(1000, self._tick)

    # ── File watcher (poll every 5s) ──────────────────

    def watch_config(self):
        try:
            if hasattr(self, "_config_mtime"):
                if os.path.exists(CONFIG_FILE):
                    mtime = os.path.getmtime(CONFIG_FILE)
                    if mtime != self._config_mtime:
                        self._config_mtime = mtime
                        new_config = load_config()
                        if new_config != self.config:
                            self.config = new_config
                            self.apply_config()
                            if self._bubble_timer:
                                self.root.after_cancel(self._bubble_timer)
                            self.schedule_bubble()
            else:
                self._config_mtime = (
                    os.path.getmtime(CONFIG_FILE) if os.path.exists(CONFIG_FILE) else 0
                )
        except Exception:
            pass

        self._config_watcher = self.root.after(5000, self.watch_config)

    # ── Quit ──────────────────────────────────────────

    def quit(self):
        try:
            save_position(self.root.winfo_x(), self.root.winfo_y())
        except Exception:
            pass
        self._stop_gif()
        self._stop_breathe()
        try:
            os.remove(PID_FILE)
        except Exception:
            pass
        self.root.destroy()
        sys.exit(0)


# ── Entry ──────────────────────────────────────────────

def _expected_image_token():
    """识别"自己"时在进程映像名里期望出现的子串：
    打包后是 exe 文件名（如 小H.exe），脚本模式下是 python 解释器。"""
    if FROZEN:
        return os.path.basename(sys.executable).lower()
    return "python"


def _pid_is_companion(pid):
    """True only if `pid` is a live process matching our own image — guards
    against PID recycling: a stale companion.pid may now point at an
    unrelated process."""
    try:
        import ctypes
        from ctypes import wintypes

        kernel32 = ctypes.windll.kernel32
        kernel32.OpenProcess.restype = wintypes.HANDLE
        kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        kernel32.QueryFullProcessImageNameW.restype = wintypes.BOOL
        kernel32.QueryFullProcessImageNameW.argtypes = [
            wintypes.HANDLE,
            wintypes.DWORD,
            wintypes.LPWSTR,
            ctypes.POINTER(wintypes.DWORD),
        ]
        kernel32.CloseHandle.argtypes = [wintypes.HANDLE]

        PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
        handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
        if not handle:
            return False
        try:
            size = wintypes.DWORD(1024)
            buf = ctypes.create_unicode_buffer(size.value)
            if not kernel32.QueryFullProcessImageNameW(handle, 0, buf, ctypes.byref(size)):
                return False
            return _expected_image_token() in buf.value.lower()
        finally:
            kernel32.CloseHandle(handle)
    except Exception:
        return False


# Kept alive for the whole process so the OS doesn't release our claim early.
_SINGLE_INSTANCE_MUTEX = None


def _acquire_single_instance():
    """Claim 'only one companion' via a named Windows mutex, then sys.exit(0)
    if another instance already holds it.

    A kernel mutex is the reliable guard the PID file never was: it's claimed
    atomically by exactly one process — no %APPDATA% write to fail (the source
    of the PermissionError crash), and no check-then-write window for two
    near-simultaneous launches to both slip through (which spawned a second
    floating window). Returns the handle on success, or None when unavailable
    (non-Windows / ctypes failure) so the caller can fall back to the PID file.
    """
    if sys.platform != "win32":
        return None
    try:
        import ctypes
        from ctypes import wintypes

        kernel32 = ctypes.windll.kernel32
        kernel32.CreateMutexW.restype = wintypes.HANDLE
        kernel32.CreateMutexW.argtypes = [wintypes.LPVOID, wintypes.BOOL, wintypes.LPCWSTR]
        ERROR_ALREADY_EXISTS = 183
        # No namespace prefix → per-login-session, exactly one floating window per desktop.
        handle = kernel32.CreateMutexW(None, False, "XiaoH_Companion_SingleInstance")
        if kernel32.GetLastError() == ERROR_ALREADY_EXISTS:
            sys.exit(0)
        return handle
    except Exception:
        return None


if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()

    # ── Build verification ──
    # `小H.exe --selftest` writes BUILD_TAG next to the exe so a rebuild can be
    # *verified* to contain the latest source, not just assumed (PyInstaller's
    # cache has silently produced no-op rebuilds before).
    if "--selftest" in sys.argv:
        try:
            with open(os.path.join(BASE_DIR, "selftest.txt"), "w", encoding="utf-8") as f:
                f.write(BUILD_TAG + "\n")
        except Exception:
            pass
        sys.exit(0)

    # ── Single instance ──
    # Primary guard: a named kernel mutex (atomic; survives an unwritable PID file).
    _SINGLE_INSTANCE_MUTEX = _acquire_single_instance()  # exits here if 2nd instance

    # Fallback only when the mutex is unavailable: legacy PID-file check.
    if _SINGLE_INSTANCE_MUTEX is None and os.path.exists(PID_FILE):
        try:
            with open(PID_FILE) as f:
                old_pid = int(f.read().strip())
            if old_pid != os.getpid() and _pid_is_companion(old_pid):
                print(f"Companion already running (PID {old_pid})")
                sys.exit(0)
        except Exception:
            pass

    # Clear any stale PID; Companion.__init__ rewrites a fresh one (best-effort)
    # so the web panel can still detect / stop us.
    if os.path.exists(PID_FILE):
        try:
            os.remove(PID_FILE)
        except Exception:
            pass

    Companion()
