// ── Hub Preload ──
const { contextBridge, ipcRenderer } = require("electron");

// Listen for messages from the injected script via window.postMessage
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "oracle-new-source") {
    ipcRenderer.send("hub-source-found", event.data.url, event.data.label);
  }
});

contextBridge.exposeInMainWorld("electronAPI", {
  openExternal: (url) => ipcRenderer.send("open-external", url),
});