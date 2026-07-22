// ── Settings IPC ──
// Handlers for settings get/set IPC channels.

const { ipcMain } = require("electron");
const state = require("../state");
const settingsStore = require("../storage/settingsStore");
const { IPC } = require("../../shared/constants");

function register() {
  // Get settings
  ipcMain.handle(IPC.GET_SETTINGS, async () => {
    return { ...state.settings };
  });

  // Set settings (partial update)
  ipcMain.handle(IPC.SET_SETTINGS, async (_event, data) => {
    Object.assign(state.settings, data);
    if (!state.flags.testFresh) {
      settingsStore.saveSettings();
    }
  });
}

module.exports = { register };