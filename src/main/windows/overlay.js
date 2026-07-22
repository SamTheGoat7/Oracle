// ── Overlay Window ──
// Creates the main transparent overlay BrowserWindow.

const { BrowserWindow } = require("electron");
const path = require("path");
const state = require("../state");
const settingsStore = require("../storage/settingsStore");
const {
  OVERLAY_DEFAULT_WIDTH,
  OVERLAY_DEFAULT_HEIGHT,
} = require("../../shared/constants");

function createOverlayWindow() {
  const win = new BrowserWindow({
    width: OVERLAY_DEFAULT_WIDTH,
    height: OVERLAY_DEFAULT_HEIGHT,

    frame: false,
    transparent: true,
    resizable: false,

    alwaysOnTop: true,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", "..", "..", "preload.js"),
      webviewTag: true,
      partition: state.sessionPartition,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver", 1);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setSkipTaskbar(true);

  win.loadFile(
    "overlay.html",
    state.flags.testFresh ? { query: { firstlaunch: "" } } : {}
  );

  // Restore saved position (skip in test mode)
  if (
    !state.flags.testFresh &&
    state.settings.windowX !== null &&
    state.settings.windowY !== null
  ) {
    win.setPosition(state.settings.windowX, state.settings.windowY);
  }

  // Save position on move (skip in test mode)
  win.on("moved", () => {
    if (state.flags.testFresh) return;
    const [x, y] = win.getPosition();
    state.settings.windowX = x;
    state.settings.windowY = y;
    settingsStore.saveSettings();
  });

  win.on("close", () => {
    state.flags.isQuitting = true;
    const { app } = require("electron");
    app.quit();
  });

  win.on("closed", () => {
    state.windows.overlay = null;
  });

  state.windows.overlay = win;
  return win;
}

module.exports = { createOverlayWindow };