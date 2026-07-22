// ── Hub Window ──
// Creates the Hub/Library BrowserWindow for login and source browsing.

const { BrowserWindow } = require("electron");
const path = require("path");
const state = require("../state");
const {
  HUB_WINDOW_WIDTH,
  HUB_WINDOW_HEIGHT,
  HUB_URL,
  LOGIN_REDIRECT_PATHS,
} = require("../../shared/constants");

function attachLoginWatcher(win) {
  if (!win) return;

  const handler = (_event, url) => {
    const matched = LOGIN_REDIRECT_PATHS.some((p) => url.includes(p));
    if (matched) {
      win.hide();
      if (state.windows.overlay && !state.windows.overlay.isDestroyed()) {
        state.windows.overlay.show();
        state.windows.overlay.webContents.send("login-complete");
      }
      // Trigger sources background window creation
      const { createSourcesBackgroundWindow } = require("./sourcesBackground");
      createSourcesBackgroundWindow();
      // Remove watchers after login detected
      win.webContents.removeListener("did-navigate", handler);
      win.webContents.removeListener("did-navigate-in-page", handler);
    }
  };

  win.webContents.on("did-navigate", handler);
  win.webContents.on("did-navigate-in-page", handler);
}

function createHubWindow(isLoginFlow) {
  if (state.windows.hub && !state.windows.hub.isDestroyed()) {
    state.windows.hub.show();
    state.windows.hub.focus();
    // If re-opening for login, attach the redirect watcher again
    if (isLoginFlow) attachLoginWatcher(state.windows.hub);
    return state.windows.hub;
  }

  const win = new BrowserWindow({
    width: HUB_WINDOW_WIDTH,
    height: HUB_WINDOW_HEIGHT,
    title: "Oracle - Reactive Hub",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", "..", "..", "preload.js"),
      partition: state.sessionPartition,
    },
  });

  win.loadURL(HUB_URL);

  if (isLoginFlow) attachLoginWatcher(win);

  win.on("closed", () => {
    state.windows.hub = null;
  });

  state.windows.hub = win;
  return win;
}

module.exports = { createHubWindow };