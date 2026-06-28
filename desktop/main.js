// Electron 42 desktop companion — loads the Next.js companion page
// in a transparent always-on-top window.
//
// Run: npx electron desktop/main.js
// (requires `next dev` running on port 3000)

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, screen } = require("electron");
const path = require("path");

// ── Single instance lock ──────────────────────────────

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let win = null;
let tray = null;
let isExpanded = false;
let isQuitting = false;

// ── Create Window ─────────────────────────────────────

function createWindow() {
  win = new BrowserWindow({
    width: 128,
    height: 128,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Position: bottom-right corner
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  win.setPosition(screenW - 160, screenH - 160);

  // Load from Next.js dev server
  win.loadURL("http://localhost:3000/companion");

  win.on("blur", () => {
    if (isExpanded) collapseWindow();
  });

  win.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

// ── Expand / Collapse ─────────────────────────────────

function expandWindow() {
  if (isExpanded) return;
  isExpanded = true;
  const [x, y] = win.getPosition();
  win.setBounds({
    x: Math.max(0, x - 100),
    y: Math.max(0, y - 350),
    width: 320,
    height: 460,
  });
  win.setSkipTaskbar(false);
}

function collapseWindow() {
  if (!isExpanded) return;
  isExpanded = false;
  const [x, y] = win.getPosition();
  win.setBounds({
    x: x + 96,
    y: y + 350,
    width: 128,
    height: 128,
  });
  win.setSkipTaskbar(true);
}

// ── System Tray ───────────────────────────────────────

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("人生面板");

  const ctxMenu = Menu.buildFromTemplate([
    {
      label: "🖥️ 打开网页面板",
      click: () => shell.openExternal("https://breadog.top"),
    },
    { type: "separator" },
    {
      label: "🐱 显示/隐藏",
      click: () => (win.isVisible() ? win.hide() : win.show()),
    },
    { type: "separator" },
    {
      label: "❌ 退出",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(ctxMenu);
}

// ── IPC ───────────────────────────────────────────────

ipcMain.handle("expand-window", () => {
  expandWindow();
  return isExpanded;
});

ipcMain.handle("collapse-window", () => {
  collapseWindow();
  return isExpanded;
});

ipcMain.handle("get-window-position", () => {
  return win.getPosition();
});

ipcMain.handle("open-web-panel", () => {
  shell.openExternal("https://breadog.top");
});

// ── Lifecycle ─────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("before-quit", () => {
  isQuitting = true;
});
