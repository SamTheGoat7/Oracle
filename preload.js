// ── Preload ──

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  resizeWindow: (width, height) => {
    ipcRenderer.send("resize-window-upward", width, height);
  },
});
