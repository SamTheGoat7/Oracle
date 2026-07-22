// ── Preload ──

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  resizeWindow: (width, height) => {
    ipcRenderer.send("resize-window-upward", width, height);
  },
  onToggleEditMode: (callback) => {
    ipcRenderer.on("toggle-edit-mode", () => callback());
  },
  onRefreshSources: (callback) => {
    ipcRenderer.on("refresh-sources", () => callback());
  },
  onLoginComplete: (callback) => {
    ipcRenderer.on("login-complete", () => callback());
  },
  openExternal: (url) => {
    ipcRenderer.send("open-external", url);
  },
  getSources: () => ipcRenderer.invoke("get-sources"),
  setSources: (data) => ipcRenderer.invoke("set-sources", data),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  setSettings: (data) => ipcRenderer.invoke("set-settings", data),
  addToBlacklist: (url) => ipcRenderer.invoke("add-to-blacklist", url),
  clearBlacklist: () => ipcRenderer.invoke("clear-blacklist"),
  openHub: () => ipcRenderer.send("open-hub"),
  openHubForLogin: () => ipcRenderer.send("open-hub-login"),
});