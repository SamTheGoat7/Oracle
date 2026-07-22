// ── Main Orchestrator ──
// Initialises all modules and starts the application.

const { app } = require("electron");
const logger = require("../shared/logger");
const state = require("./state");
const settingsStore = require("./storage/settingsStore");
const sourcesStore = require("./storage/sourcesStore");
const { createOverlayWindow } = require("./windows/overlay");
const { createHubWindow } = require("./windows/hub");
const { createSourcesBackgroundWindow } = require("./windows/sourcesBackground");
const { createTray, buildAndSetMenu } = require("./tray");
const ipcSources = require("./ipc/sources");
const ipcSettings = require("./ipc/settings");
const ipcOverlay = require("./ipc/overlay");
const ipcHub = require("./ipc/hub");

// ── Single instance lock ──────────────────────────────────────
// Prevents multiple app instances. Second launch focuses the existing window.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  return;
}

app.on("second-instance", () => {
  const win = state.windows.overlay;
  if (win) {
    if (win.isMinimized()) win.restore();
    if (!win.isVisible()) win.show();
    win.focus();
  }
});

// ── Load persisted state ──────────────────────────────────────
try {
  settingsStore.loadSettings();
} catch (err) {
  logger.error("startup", "settingsStore.loadSettings threw", err);
}

try {
  sourcesStore.loadSources();
} catch (err) {
  logger.error("startup", "sourcesStore.loadSources threw", err);
}

// ── Window shims (wrappers that sync local refs to state module) ──
function createOverlayWin() {
  const win = createOverlayWindow();
  state.windows.overlay = win;
  return win;
}

function createHubWin(isLoginFlow) {
  const win = createHubWindow(isLoginFlow);
  state.windows.hub = win;
  return win;
}

function createSourcesBgWin() {
  const win = createSourcesBackgroundWindow();
  state.windows.sourcesBg = win;
  return win;
}

// ── Tray (needs rebuild trigger) ──────────────────────────────
function rebuildTrayMenu() {
  buildAndSetMenu({
    createWindow: createOverlayWin,
    createHubWindow: createHubWin,
    saveSources: () => sourcesStore.saveSources(),
  });
}

function createAppTray() {
  createTray({
    createWindow: createOverlayWin,
    createHubWindow: createHubWin,
    saveSources: () => sourcesStore.saveSources(),
  });
  rebuildTrayMenu();
}

// ── Register IPC handlers ─────────────────────────────────────
ipcSources.register(rebuildTrayMenu);
ipcSettings.register();
ipcOverlay.register();
ipcHub.register({
  createHubWindow: createHubWin,
  createSourcesBgWindow: createSourcesBgWin,
});

// ── App lifecycle ─────────────────────────────────────────────
app.whenReady()
  .then(() => {
    try {
      createOverlayWin();
    } catch (err) {
      logger.error("startup", "createOverlayWin failed", err);
    }

    try {
      createAppTray();
    } catch (err) {
      logger.error("startup", "createAppTray failed", err);
    }
  })
  .catch((err) => {
    logger.error("startup", "app.whenReady failed", err);
    app.quit();
  });

app.on("before-quit", () => {
  state.flags.isQuitting = true;
});

app.on("window-all-closed", () => {
  app.quit();
});
