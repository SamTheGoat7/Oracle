// ── Hub IPC ──
// Handlers for hub window, sources scanner, and login flow IPC channels.

const { ipcMain } = require("electron");
const state = require("../state");
const sourcesStore = require("../storage/sourcesStore");
const { IPC } = require("../../shared/constants");

function register({ createHubWindow, createSourcesBgWindow }) {
  // Open hub library window
  ipcMain.on(IPC.OPEN_HUB, () => {
    createHubWindow();
  });

  // Open hub for login flow (hides overlay, shows hub with redirect watcher)
  ipcMain.on(IPC.OPEN_HUB_LOGIN, () => {
    const win = state.windows.overlay;
    if (win && !win.isDestroyed()) win.hide();
    createHubWindow(true);
  });

  // New source found by background scanner
  ipcMain.on(IPC.HUB_SOURCE_FOUND, (_event, url, label) => {
    if (state.blacklist.includes(url)) return;
    const exists = state.sources.some((s) => s.url === url);
    if (exists) return;

    state.sources.push({ label: label || url, url });
    sourcesStore.saveSources();

    const win = state.windows.overlay;
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC.REFRESH_SOURCES);
    }
  });
}

module.exports = { register };