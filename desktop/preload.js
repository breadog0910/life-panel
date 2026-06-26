// Electron preload — exposes safe IPC bridge to companion page
// All electronAPI methods are invoked from the Next.js companion page

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  expandWindow: () => ipcRenderer.invoke("expand-window"),
  collapseWindow: () => ipcRenderer.invoke("collapse-window"),
  getWindowPosition: () => ipcRenderer.invoke("get-window-position"),
  openWebPanel: () => ipcRenderer.invoke("open-web-panel"),
});
