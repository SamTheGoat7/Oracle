// ── Preload ──

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  resizeWindow: (width, height) => {
    ipcRenderer.send("resize-window-upward", width, height);
  },
  onToggleEditMode: (callback) => {
    ipcRenderer.on("toggle-edit-mode", () => callback());
  },
  openExternal: (url) => {
    ipcRenderer.send("open-external", url);
  },
  getSources: () => ipcRenderer.invoke("get-sources"),
  setSources: (data) => ipcRenderer.invoke("set-sources", data),
});
