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
BUILD_TAG = "2026-06-28-inapp-chat-focusfix-mutex"

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
CHAT_FILE = os.path.join(DATA_DIR, "companion_chat.json")

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

# ── AI chat (reuse the model/key configured in web 设置→AI 智能设置) ──
# provider -> (default api base, default model)
AI_PROVIDERS = {
    "deepseek": ("https://api.deepseek.com", "deepseek-chat"),
    "qwen": ("https://dashscope.aliyuncs.com/compatible-mode/v1", "qwen-plus"),
    "glm": ("https://open.bigmodel.cn/api/paas/v4", "glm-4-flash"),
    "doubao": ("https://ark.cn-beijing.volces.com/api/v3", ""),
    "openai": ("https://api.openai.com/v1", "gpt-4o-mini"),
    "anthropic": ("https://api.anthropic.com", "claude-3-haiku-20240307"),
}

# mem0 式记忆：从一段对话里抽取关于「用户本人」的离散事实条目（add 阶段）
FACT_EXTRACTION_INSTRUCTION = (
    "你是记忆抽取器。请从下面这段对话里，提炼关于「用户本人」值得长期记住的事实，"
    "比如姓名/称呼、喜好、厌恶、目标、习惯、职业/身份、正在做的事、重要的人和事、约定、计划等。"
    "每条是一句独立、具体、自包含的中文陈述（不要代词指代不明）。"
    "与【已有记忆】比对，只输出【新增或更新】的事实，不要重复已有的。"
    "严格只输出一个 JSON 数组，例如 [\"用户叫小明\",\"用户在备考研究生\"]；"
    "如果这段对话没有值得长期记住的信息，就输出 []。不要输出任何其它文字。"
)

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

# ── Chat history + memory persistence (mem0-style fact store) ──

def _facts_from_legacy_memory(blob):
    """Old format stored memory as one '- ' bullet blob. Convert to discrete facts."""
    facts = []
    for line in (blob or "").splitlines():
        t = line.strip().lstrip("-•*").strip()
        if t:
            facts.append({"id": len(facts) + 1, "text": t, "ts": time.time()})
    return facts


def load_chat():
    """Return (messages, facts, summarized_upto). Survives restarts → companion 'remembers'.

    facts: list of {id, text, ts} — mem0-style discrete memories (migrated from the
    old single 'memory' string blob if an older chat file is found).
    """
    try:
        if os.path.exists(CHAT_FILE):
            with open(CHAT_FILE, "r", encoding="utf-8") as f:
                d = json.load(f)
            facts = d.get("facts")
            if not isinstance(facts, list):
                facts = _facts_from_legacy_memory(d.get("memory", ""))
            return (
                d.get("messages", []),
                facts,
                int(d.get("summarized_upto", 0)),
            )
    except Exception:
        pass
    return [], [], 0


def save_chat(messages, facts, summarized_upto):
    try:
        with open(CHAT_FILE, "w", encoding="utf-8") as f:
            json.dump(
                {"messages": messages, "facts": facts, "summarized_upto": summarized_upto},
                f, ensure_ascii=False, indent=2,
            )
    except Exception:
        pass


# ── mem0-style memory tokenisation / retrieval (no embeddings, pure stdlib) ──

def _mem_tokens(s):
    """Cheap language-agnostic token set: ASCII words + CJK chars & bigrams.

    Used to score relevance between a query and a stored fact without any model
    or vector DB — good enough for picking which memories to inject per message.
    """
    s = (s or "").lower()
    tokens = set()
    for w in re.findall(r"[a-z0-9]+", s):
        if len(w) >= 2:
            tokens.add(w)
    cjk = re.findall(r"[\u4e00-\u9fff]", s)
    for c in cjk:
        tokens.add(c)
    for i in range(len(cjk) - 1):
        tokens.add(cjk[i] + cjk[i + 1])
    return tokens


def retrieve_facts(facts, query, k=6):
    """mem0-style 'search': return up to k fact texts most relevant to query,
    backfilled with the most recent facts so general context isn't lost."""
    if not facts:
        return []
    qt = _mem_tokens(query)
    scored = []
    for f in facts:
        text = f.get("text") if isinstance(f, dict) else str(f)
        if not text:
            continue
        score = len(qt & _mem_tokens(text)) if qt else 0
        scored.append((score, f.get("ts", 0) if isinstance(f, dict) else 0, text))
    # relevant first (score desc, then recency desc)
    scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
    picked = [t for (sc, ts, t) in scored if sc > 0][:k]
    if len(picked) < k:
        # backfill with most recent facts not already picked
        recent = sorted(
            (f for f in facts if isinstance(f, dict) and f.get("text")),
            key=lambda f: f.get("ts", 0), reverse=True,
        )
        for f in recent:
            if f["text"] not in picked:
                picked.append(f["text"])
            if len(picked) >= k:
                break
    return picked


def merge_facts(facts, new_texts, cap=200):
    """mem0-style 'add': append new fact texts, skipping exact/near-duplicates."""
    existing_norm = {(_norm_fact(f.get("text")) if isinstance(f, dict) else _norm_fact(f)): True
                     for f in facts}
    next_id = max((f.get("id", 0) for f in facts if isinstance(f, dict)), default=0) + 1
    for t in new_texts:
        t = (t or "").strip()
        if not t:
            continue
        n = _norm_fact(t)
        if not n or n in existing_norm:
            continue
        facts.append({"id": next_id, "text": t, "ts": time.time()})
        existing_norm[n] = True
        next_id += 1
    if len(facts) > cap:  # keep the most recent ones
        facts = sorted(facts, key=lambda f: f.get("ts", 0))[-cap:]
    return facts


def _norm_fact(t):
    return re.sub(r"\s+", "", (t or "").lower())


def _first_json_array(t):
    i, j = t.find("["), t.rfind("]")
    return t[i:j + 1] if (i != -1 and j > i) else None


def _parse_fact_list(text):
    """Pull a list of fact strings out of a model reply (tolerant of code fences / stray text)."""
    if not text:
        return []
    t = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.IGNORECASE).strip()
    for cand in (t, _first_json_array(t)):
        if not cand:
            continue
        try:
            arr = json.loads(cand)
            if isinstance(arr, list):
                return [str(x).strip() for x in arr if str(x).strip()]
        except Exception:
            pass
    out = []
    for line in t.splitlines():
        s = line.strip().lstrip("-•*0123456789. ").strip()
        if s and s not in ("[", "]", "{", "}"):
            out.append(s)
    return out

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


def _http_post_json(url, headers, payload, timeout=60):
    """POST JSON to an arbitrary URL (used for LLM APIs). Returns (status, json|None, err|None)."""
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, (json.loads(body) if body else None), None
    except urllib.error.HTTPError as e:
        try:
            txt = e.read().decode("utf-8")
        except Exception:
            txt = str(e)
        return e.code, None, "接口错误 %s：%s" % (e.code, txt[:300])
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


def supabase_get_ai_settings():
    """Read the user's AI config (provider/key/model) saved by the web app. RLS-protected."""
    token, user_id = _ensure_token()
    if not token or not user_id:
        return None, "未登录"
    status, data, err = _api(
        "GET",
        "/rest/v1/ai_settings",
        headers={"Authorization": "Bearer " + token},
        query={"user_id": "eq." + str(user_id), "select": "provider,api_key,api_base,model"},
    )
    if err:
        return None, err
    row = (data[0] if isinstance(data, list) and data else None)
    if not row or not row.get("api_key"):
        return None, "未配置"
    return row, None


def llm_chat(cfg, messages, system_prompt, max_tokens=800):
    """Call the configured LLM with a list of {role,content}. Returns (reply_text|None, err|None)."""
    provider = (cfg.get("provider") or "deepseek").lower()
    api_key = cfg.get("api_key")
    base_default, model_default = AI_PROVIDERS.get(provider, AI_PROVIDERS["deepseek"])
    api_base = (cfg.get("api_base") or base_default).rstrip("/")
    model = cfg.get("model") or model_default
    if not model:
        return None, "未设置模型名称（请在网页 AI 设置里填写 model）"

    if provider == "anthropic":
        url = api_base + "/v1/messages"
        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "system": system_prompt,
            "messages": messages,
            "temperature": 0.7,
        }
        status, data, err = _http_post_json(url, headers, payload)
        if err:
            return None, err
        try:
            return (data["content"][0]["text"] or "").strip(), None
        except Exception:
            return None, "无法解析模型返回"

    # OpenAI-compatible (deepseek / qwen / glm / doubao / openai)
    url = api_base + "/chat/completions"
    headers = {"Authorization": "Bearer " + api_key}
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "temperature": 0.7,
    }
    status, data, err = _http_post_json(url, headers, payload)
    if err:
        return None, err
    try:
        return (data["choices"][0]["message"]["content"] or "").strip(), None
    except Exception:
        return None, "无法解析模型返回"

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
        self.p_widgets = {}

        # ── Chat state (lazy-loaded from disk on first open) ──
        self.chat_win = None
        self.chat_log = None
        self.chat_entry = None
        self.chat_loaded = False
        self.chat_messages = []
        self.chat_facts = []
        self.chat_summarized_upto = 0
        self.chat_sending = False
        self._chat_pending = ""

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
        menu.add_command(label="和我聊天", command=self.open_chat)
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

    # ── Change avatar (local picker) ──────────────────

    def change_avatar(self):
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

    # ── Chat with the LLM (with persistent memory) ────

    def _ensure_chat_loaded(self):
        if not self.chat_loaded:
            self.chat_messages, self.chat_facts, self.chat_summarized_upto = load_chat()
            self.chat_loaded = True

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

    def open_chat(self):
        """In-app chat window (tkinter). Reuses the model/key configured in the web
        设置→AI 智能设置 and remembers facts across restarts (mem0-style)."""
        self._ensure_chat_loaded()
        if self.chat_win is not None and self.chat_win.winfo_exists():
            self.chat_win.lift()
            self._grab_keyboard(self.chat_win, self.chat_entry, add_appwindow=True)
            return

        nick = self._nickname()
        win = tk.Toplevel(self.root)
        self.chat_win = win
        win.title("和" + nick + "聊天")
        win.configure(bg="#ffffff")
        win.wm_attributes("-topmost", True)
        win.minsize(320, 380)
        try:
            win.geometry("380x500+%d+%d" % (self.root.winfo_x() - 220, self.root.winfo_y() - 320))
        except Exception:
            pass
        win.protocol("WM_DELETE_WINDOW", self._chat_close)

        # Header
        header = tk.Frame(win, bg="#42a5f5")
        header.pack(fill=tk.X)
        tk.Label(header, text="和" + nick + "聊天", bg="#42a5f5", fg="#ffffff",
                 font=(YH, 11, "bold")).pack(side=tk.LEFT, padx=10, pady=6)
        tk.Label(header, text="清空记忆", bg="#42a5f5", fg="#e3f2fd", font=(YH, 8),
                 cursor="hand2").pack(side=tk.RIGHT, padx=10, pady=6)
        tk.Label(header, text="记得的事", bg="#42a5f5", fg="#e3f2fd", font=(YH, 8),
                 cursor="hand2").pack(side=tk.RIGHT, padx=2, pady=6)
        for w in header.winfo_children():
            if w.cget("text") == "清空记忆":
                w.bind("<Button-1>", lambda e: self._chat_clear())
            elif w.cget("text") == "记得的事":
                w.bind("<Button-1>", lambda e: self._chat_show_memory())

        # Transcript area
        body = tk.Frame(win, bg="#ffffff")
        body.pack(fill=tk.BOTH, expand=True, padx=10, pady=(8, 0))
        scroll = tk.Scrollbar(body)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)
        log = tk.Text(body, wrap="word", font=(YH, 10), bg="#f7fbff", fg="#1a3a5c",
                      relief=tk.FLAT, padx=8, pady=6, yscrollcommand=scroll.set,
                      highlightthickness=1, highlightbackground="#e3f2fd")
        log.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scroll.config(command=log.yview)
        log.tag_configure("who_me", foreground="#1e88e5", font=(YH, 9, "bold"))
        log.tag_configure("who_bot", foreground="#43a047", font=(YH, 9, "bold"))
        log.tag_configure("msg", spacing3=6)
        log.tag_configure("hint", foreground="#90a4ae")
        log.tag_configure("pending", foreground="#b0bec5")
        self.chat_log = log

        # Input row
        inp = tk.Frame(win, bg="#ffffff")
        inp.pack(fill=tk.X, padx=10, pady=10)
        entry = tk.Entry(inp, font=(YH, 10))
        entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=3)
        entry.bind("<Return>", self._chat_send)
        entry.bind("<Button-1>", lambda e: (self._win32_foreground(win), entry.focus_set()))
        self.chat_entry = entry
        tk.Button(inp, text="发送", font=(YH, 9), bg="#42a5f5", fg="#ffffff", relief=tk.FLAT,
                  width=6, cursor="hand2", command=self._chat_send).pack(side=tk.LEFT, padx=(8, 0))

        self._chat_pending = ""
        self._chat_render()
        self._grab_keyboard(win, entry, add_appwindow=True)

    def _chat_close(self):
        if self.chat_win is not None and self.chat_win.winfo_exists():
            self.chat_win.destroy()
        self.chat_win = None
        self.chat_log = None
        self.chat_entry = None

    def _chat_clear(self):
        if not messagebox.askyesno("清空记忆", "确定要清空全部聊天记录和记忆吗？这无法恢复。"):
            return
        self.chat_messages = []
        self.chat_facts = []
        self.chat_summarized_upto = 0
        save_chat(self.chat_messages, self.chat_facts, self.chat_summarized_upto)
        self._chat_pending = ""
        self._chat_render()

    def _chat_show_memory(self):
        """Read-only view of the mem0-style fact store (newest first)."""
        facts = [f.get("text") for f in self.chat_facts if isinstance(f, dict) and f.get("text")]
        facts = facts[::-1]
        if not facts:
            messagebox.showinfo("记得的事", "我还没记住什么呢～多聊几句，我会慢慢记住关于你的事 💙")
            return
        body = "\n".join("· " + t for t in facts[:60])
        if len(facts) > 60:
            body += "\n…（共 %d 条，仅显示最近 60 条）" % len(facts)
        messagebox.showinfo("记得的事（%d 条）" % len(facts), body)

    def _chat_system_prompt(self, query=""):
        nick = self._nickname()
        base = (
            "你是「%s」，用户桌面上的一个温暖、可爱、懂陪伴的小伙伴。"
            "说话亲切自然、口语化，像熟悉的朋友一样关心 ta，可以适当用 emoji。"
            "回答尽量简短（通常 1-3 句），除非用户明确要求展开。"
        ) % nick
        relevant = retrieve_facts(self.chat_facts, query)
        if relevant:
            base += (
                "\n\n【你已经记住的关于 ta 的事】（自然地运用，别生硬复述）：\n"
                + "\n".join("- " + t for t in relevant)
            )
        return base

    def _chat_render(self):
        t = self.chat_log
        if t is None or not t.winfo_exists():
            return
        nick = self._nickname()
        t.configure(state="normal")
        t.delete("1.0", "end")
        if not self.chat_messages:
            t.insert("end", "来和我说点什么吧～我会记住我们聊过的内容 💙\n\n", ("hint",))
        for m in self.chat_messages:
            if m.get("role") == "user":
                t.insert("end", "你\n", ("who_me",))
                t.insert("end", (m.get("content") or "") + "\n\n", ("msg",))
            else:
                t.insert("end", nick + "\n", ("who_bot",))
                t.insert("end", (m.get("content") or "") + "\n\n", ("msg",))
        if self._chat_pending:
            t.insert("end", nick + "\n", ("who_bot",))
            t.insert("end", self._chat_pending + "\n\n", ("pending",))
        t.configure(state="disabled")
        t.see("end")

    def _chat_set_pending(self, text):
        self._chat_pending = text
        self._chat_render()

    def _chat_error_hint(self, msg):
        if msg == "未登录":
            return "请先右键登录，再来聊天哦"
        if msg == "未配置":
            return "还没配置模型，请到网页「设置 → AI 智能设置」填好模型和 API Key"
        return msg

    def _chat_send(self, event=None):
        if self.chat_win is None or not self.chat_win.winfo_exists() or self.chat_sending:
            return
        text = self.chat_entry.get().strip()
        if not text:
            return
        self.chat_entry.delete(0, "end")
        self.chat_messages.append({"role": "user", "content": text})
        save_chat(self.chat_messages, self.chat_facts, self.chat_summarized_upto)
        self.chat_sending = True
        self._chat_set_pending("正在输入…")

        req_msgs = [{"role": m["role"], "content": m["content"]} for m in self.chat_messages[-24:]]
        sys_prompt = self._chat_system_prompt(text)

        def work():
            cfg, err = supabase_get_ai_settings()
            if err:
                return ("err", err)
            reply, e2 = llm_chat(cfg, req_msgs, sys_prompt)
            if e2:
                return ("err", e2)
            return ("ok", reply)

        def done(res):
            self.chat_sending = False
            ok = isinstance(res, tuple) and len(res) >= 2 and res[0] == "ok"
            if not ok:
                msg = res[-1] if isinstance(res, tuple) else "出错了"
                self._chat_set_pending("⚠ " + self._chat_error_hint(str(msg)))
                return
            reply = (res[1] or "").strip() or "（没有内容）"
            self._chat_pending = ""
            self.chat_messages.append({"role": "assistant", "content": reply})
            save_chat(self.chat_messages, self.chat_facts, self.chat_summarized_upto)
            self._chat_render()
            self._chat_maybe_extract()

        self.run_async(work, done)

    def _chat_maybe_extract(self):
        """mem0-style 'add': extract discrete facts about the user from the latest
        turns and merge them into the local fact store, so memory accumulates over
        time without re-processing or losing earlier history."""
        start = self.chat_summarized_upto
        new = self.chat_messages[start:]
        if len(new) < 4:  # wait for a couple of exchanges before spending an LLM call
            return
        transcript = "\n".join(
            ("用户：" if m.get("role") == "user" else "我：") + (m.get("content") or "")
            for m in new
        )
        existing = [f.get("text") for f in self.chat_facts if isinstance(f, dict) and f.get("text")][-60:]
        new_upto = len(self.chat_messages)

        def work():
            cfg, err = supabase_get_ai_settings()
            if err:
                return ("err", err)
            user_p = (
                FACT_EXTRACTION_INSTRUCTION
                + "\n\n【已有记忆】\n" + ("\n".join("- " + t for t in existing) or "（暂无）")
                + "\n\n【新对话】\n" + transcript
            )
            reply, e2 = llm_chat(
                cfg,
                [{"role": "user", "content": user_p}],
                "你是负责抽取用户长期记忆的助手，严格只输出 JSON 数组。",
                max_tokens=500,
            )
            if e2:
                return ("err", e2)
            return ("ok", reply)

        def done(res):
            ok = isinstance(res, tuple) and len(res) >= 2 and res[0] == "ok"
            if not ok:
                return  # best-effort; cursor not advanced so we retry next time
            new_texts = _parse_fact_list(res[1])
            self.chat_summarized_upto = new_upto
            if new_texts:
                self.chat_facts = merge_facts(self.chat_facts, new_texts)
            save_chat(self.chat_messages, self.chat_facts, self.chat_summarized_upto)

        self.run_async(work, done)

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
        p.overrideredirect(True)
        p.wm_attributes("-topmost", True)
        p.configure(bg="#ffffff")
        px = self.root.winfo_x() - 80
        py = self.root.winfo_y() - 320
        px = max(10, px)
        py = max(10, py)
        p.geometry(f"270x380+{px}+{py}")

        wrap = tk.Frame(p, bg="#ffffff", highlightbackground="#42a5f5", highlightthickness=1)
        wrap.pack(fill=tk.BOTH, expand=True)

        # Header (draggable + close)
        header = tk.Frame(wrap, bg="#42a5f5")
        header.pack(fill=tk.X)
        htitle = tk.Label(header, text="⏱ 专注计时", bg="#42a5f5", fg="#ffffff", font=(YH, 11, "bold"))
        htitle.pack(side=tk.LEFT, padx=10, pady=6)
        closebtn = tk.Label(header, text="✕", bg="#42a5f5", fg="#ffffff",
                            font=(YH, 11), cursor="hand2")
        closebtn.pack(side=tk.RIGHT, padx=10, pady=6)
        closebtn.bind("<Button-1>", lambda e: self.close_panel())
        for w in (header, htitle):
            w.bind("<Button-1>", self._panel_press)
            w.bind("<B1-Motion>", self._panel_motion)

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

    def _panel_press(self, event):
        self._p_px = event.x_root
        self._p_py = event.y_root
        self._p_wx = self.panel.winfo_x()
        self._p_wy = self.panel.winfo_y()

    def _panel_motion(self, event):
        if self.panel is None or not self.panel.winfo_exists():
            return
        dx = event.x_root - self._p_px
        dy = event.y_root - self._p_py
        self.panel.geometry(f"+{self._p_wx + dx}+{self._p_wy + dy}")

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
        win.overrideredirect(True)
        win.wm_attributes("-topmost", True)
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

        savebtn = tk.Button(btn_row, text="保存收获", font=(YH, 9), bg="#66bb6a", fg="#ffffff",
                            relief=tk.FLAT, cursor="hand2", command=save_reflection)
        savebtn.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=2)
        tk.Button(btn_row, text="完成", font=(YH, 9), bg="#eceff1", fg="#607d8b",
                  relief=tk.FLAT, cursor="hand2", command=skip).pack(
            side=tk.LEFT, expand=True, fill=tk.X, padx=2)

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
