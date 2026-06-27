"""
小橘 🐱 — 桌面透明悬浮伙伴

纯 Python 标准库 + Pillow（GIF 帧播放）。
支持三种角色模式：Emoji 预设 / 自定义图片 / GIF 动图。
通过 companion_config.json 热加载设置。
"""

import tkinter as tk
import webbrowser
import random
import json
import os
import sys

# ── Config ────────────────────────────────────────────
WEB_PANEL_URL = "http://localhost:3000"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)  # project root
IMAGE_DIR = os.path.join(PROJECT_DIR, "public", "companion")  # images served by Next.js
POSITION_FILE = os.path.join(BASE_DIR, "companion_position.json")
CONFIG_FILE = os.path.join(BASE_DIR, "companion_config.json")
PID_FILE = os.path.join(BASE_DIR, "companion.pid")

TRANSPARENT_COLOR = "#010101"  # magic transparency key

DEFAULT_CONFIG = {
    "mode": "emoji",
    "character": "🐱",
    "character_id": "cat",
    "nickname": "小橘",
    "breathing_enabled": True,
    "bubble_enabled": True,
    "image_path": "",
}

IDLE_PHRASES = [
    "今天也要加油呀～",
    "记得休息一下哦",
    "喝点水吧 💧",
    "摸摸头～",
    "有什么想说的吗？",
    "累了吗？放松一下",
    "你真棒！✨",
    "今天过得怎么样？",
]

# ── Helpers ───────────────────────────────────────────

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

# ── Main companion class ──────────────────────────────

class Companion:
    def __init__(self):
        self.config = load_config()

        # Write PID so web panel can detect & control us
        with open(PID_FILE, "w") as f:
            f.write(str(os.getpid()))

        self.root = tk.Tk()
        self.root.title("小橘 · 桌面伙伴")

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
            font=("Microsoft YaHei", 10),
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

        # ── Name ───────────────────────────────────────
        self.name_label = tk.Label(
            self.root,
            text=self.config.get("nickname", "小橘"),
            font=("Microsoft YaHei", 9),
            bg=TRANSPARENT_COLOR,
            fg="#90a4ae",
            cursor="hand2",
        )
        self.name_label.pack(pady=(0, 4))

        # ── Hint ───────────────────────────────────────
        self.hint_label = tk.Label(
            self.root,
            text="点击摸摸我 · 右键菜单",
            font=("Microsoft YaHei", 7),
            bg=TRANSPARENT_COLOR,
            fg="#90a4ae",
            cursor="hand2",
        )
        self.hint_label.pack()

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

        # ── Apply initial mode ─────────────────────────
        self.apply_config()

        # ── Events ─────────────────────────────────────
        self._bind_events()

        # ── Right-click menu ───────────────────────────
        self.ctx_menu = tk.Menu(self.root, tearoff=0, font=("Microsoft YaHei", 10))
        self.ctx_menu.add_command(label="🖥️  打开网页面板", command=self.open_web)
        self.ctx_menu.add_command(label="⚙️  伙伴设置", command=self.open_settings)
        self.ctx_menu.add_separator()
        self.ctx_menu.add_command(label="❌ 退出小橘", command=self.quit)

        # ── Start services ─────────────────────────────
        self.schedule_bubble()
        self.watch_config()

        self.root.mainloop()

    # ── Bind mouse events ──────────────────────────────

    def _bind_events(self):
        widgets = [
            self.char_label,
            self.name_label,
            self.hint_label,
            self.bubble_label,
        ]
        for w in widgets:
            w.bind("<Button-1>", self.on_click)
            w.bind("<Button-3>", self.on_right_click)

        # Drag on non-character areas
        self.root.bind("<Button-1>", self.start_drag)
        self.root.bind("<B1-Motion>", self.on_drag)
        self.root.bind("<ButtonRelease-1>", self.end_drag)

    # ── Apply config (all modes) ──────────────────────

    def apply_config(self):
        """Update the UI according to current config."""
        cfg = self.config
        mode = cfg.get("mode", "emoji")

        # Stop any running GIF animation
        self._stop_gif()

        # Update name
        self.name_label.configure(text=cfg.get("nickname", "小橘"))

        if mode == "emoji":
            self._apply_emoji_mode(cfg)
        elif mode == "gif":
            self._apply_gif_mode(cfg)
        else:
            self._apply_image_mode(cfg)

    # ── Emoji mode ────────────────────────────────────

    def _apply_emoji_mode(self, cfg):
        char = cfg.get("character", "🐱")
        self.char_label.configure(
            text=char,
            image="",
            font=("Segoe UI Emoji", 68),
        )
        self._photo_ref = None

        # Adjust window size for emoji
        self.root.geometry(f"{self.W}x{self.H}")

        if cfg.get("breathing_enabled", True):
            self.animate_breathe()
        else:
            self._stop_breathe()
            self.char_label.configure(font=("Segoe UI Emoji", 68))

    # ── Image mode (static PNG/JPG) ───────────────────

    def _apply_image_mode(self, cfg):
        self._stop_breathe()
        image_path = cfg.get("image_path", "")
        full_path = os.path.join(BASE_DIR, image_path) if image_path else ""

        # Try public/companion/ first, then desktop/
        alt_path = os.path.join(IMAGE_DIR, image_path) if image_path else ""
        if not (full_path and os.path.exists(full_path)) and alt_path and os.path.exists(alt_path):
            full_path = alt_path

        if full_path and os.path.exists(full_path):
            try:
                from PIL import Image, ImageTk
                pil_img = Image.open(full_path)
                # Resize to fit
                pil_img = pil_img.resize((120, 120), Image.LANCZOS)
                img = ImageTk.PhotoImage(pil_img)
                self._photo_ref = img
                self.char_label.configure(image=img, text="", font=("Segoe UI Emoji", 1))
            except Exception:
                self._fallback_emoji()
        else:
            # No image yet — show placeholder
            self.char_label.configure(
                text="🖼️",
                image="",
                font=("Segoe UI Emoji", 48),
            )
            self._photo_ref = None

        if cfg.get("breathing_enabled", True):
            self.animate_breathe()
        else:
            self._stop_breathe()

    # ── GIF mode ──────────────────────────────────────

    def _apply_gif_mode(self, cfg):
        self._stop_breathe()
        self._stop_gif()

        image_path = cfg.get("image_path", "")
        full_path = os.path.join(BASE_DIR, image_path) if image_path else ""

        # Try public/companion/ first, then desktop/
        alt_path = os.path.join(IMAGE_DIR, image_path) if image_path else ""
        if not (full_path and os.path.exists(full_path)) and alt_path and os.path.exists(alt_path):
            full_path = alt_path

        if full_path and os.path.exists(full_path) and full_path.lower().endswith(".gif"):
            try:
                from PIL import Image, ImageSequence, ImageTk

                pil_img = Image.open(full_path)
                frames = []
                for frame in ImageSequence.Iterator(pil_img):
                    # Convert to RGBA for transparency support
                    f = frame.convert("RGBA")
                    # Resize to fit
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
        """Advance to next GIF frame."""
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
        """Scale the character label slightly for breathing effect."""
        if not self.config.get("breathing_enabled", True):
            self._stop_breathe()
            return

        if self.config.get("mode") == "gif":
            return  # GIF handles its own animation

        # Only apply breathing in emoji and image modes
        mode = self.config.get("mode", "emoji")
        if mode not in ("emoji", "image"):
            return

        # For image mode, we scale the label differently
        if mode == "image":
            sizes = [0.96, 0.98, 1.0, 1.02, 1.0, 0.98]
            scale = sizes[self._breath_scale_idx % len(sizes)]
            self._breath_scale_idx += 1
            try:
                # Use tkinter's place scaling for the char_frame
                self.char_label.configure(font=("Segoe UI Emoji", max(1, int(68 * scale))))
            except tk.TclError:
                pass
        else:
            # Emoji mode: cycle font sizes
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

    # ── Drag ───────────────────────────────────────────

    def start_drag(self, event):
        self._drag_x = event.x
        self._drag_y = event.y

    def on_drag(self, event):
        dx = event.x - self._drag_x
        dy = event.y - self._drag_y
        x = self.root.winfo_x() + dx
        y = self.root.winfo_y() + dy
        self.root.geometry(f"+{x}+{y}")

    def end_drag(self, event):
        save_position(self.root.winfo_x(), self.root.winfo_y())

    # ── Click ──────────────────────────────────────────

    def on_click(self, event):
        """Left click — show a quick reaction bubble, don't open browser."""
        # Show a random reaction bubble
        reactions = ["嘻嘻～", "嗯？", "怎么啦？", "摸摸～", "✨", "❤️"]
        phrase = random.choice(reactions)
        # Stop any current bubble
        if self._bubble_timer:
            self.root.after_cancel(self._bubble_timer)
        if self.bubble_phrase_showing:
            self.bubble_phrase_showing = False
            self.bubble_label.pack_forget()
        # Show quick reaction
        self.bubble_label.configure(text=phrase)
        self.bubble_label.pack(side=tk.TOP, pady=(8, 0))
        self.bubble_phrase_showing = True
        self.root.after(1500, self.hide_bubble)

    def on_right_click(self, event):
        try:
            self.ctx_menu.tk_popup(event.x_root, event.y_root)
        finally:
            self.ctx_menu.grab_release()

    def open_web(self):
        webbrowser.open(WEB_PANEL_URL)

    def open_settings(self):
        webbrowser.open(f"{WEB_PANEL_URL}/partner")

    # ── File watcher (poll every 5s) ──────────────────

    def watch_config(self):
        """Check if config file changed; if so, reload and apply."""
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
                            # Restart bubble scheduling
                            if self._bubble_timer:
                                self.root.after_cancel(self._bubble_timer)
                            self.schedule_bubble()
            else:
                self._config_mtime = (
                    os.path.getmtime(CONFIG_FILE)
                    if os.path.exists(CONFIG_FILE)
                    else 0
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
        # Remove PID file
        try:
            os.remove(PID_FILE)
        except Exception:
            pass
        self.root.destroy()
        sys.exit(0)


# ── Entry ──────────────────────────────────────────────

def _pid_is_companion(pid):
    """True only if `pid` is a live python process — guards against PID
    recycling: a stale companion.pid may now point at an unrelated process."""
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
            return "python" in buf.value.lower()
        finally:
            kernel32.CloseHandle(handle)
    except Exception:
        return False


if __name__ == "__main__":
    # ── Single instance check (robust against PID recycling) ──
    if os.path.exists(PID_FILE):
        running = False
        try:
            with open(PID_FILE) as f:
                old_pid = int(f.read().strip())
            running = old_pid != os.getpid() and _pid_is_companion(old_pid)
        except Exception:
            running = False
        if running:
            print(f"Companion already running (PID {old_pid})")
            sys.exit(0)
        # Stale PID — remove and continue
        try:
            os.remove(PID_FILE)
        except Exception:
            pass
    Companion()
