// ── Sources IPC ──
// Handlers for source and blacklist IPC channels.

const { ipcMain } = require("electron");
const logger = require("../../shared/logger");
const state = require("../state");
const sourcesStore = require("../storage/sourcesStore");
const { IPC } = require("../../shared/constants");

function register(rebuildTrayMenu) {
  // Get sources
  ipcMain.handle(IPC.GET_SOURCES, async () => {
    try {
      return { sources: state.sources, blacklist: state.blacklist };
    } catch (err) {
      logger.error("ipc:sources", "GET_SOURCES handler failed", err);
      return { sources: [], blacklist: [] };
    }
  });

  // Set sources (accepts array or {sources, blacklist} object)
  ipcMain.handle(IPC.SET_SOURCES, async (_event, data) => {
    try {
      if (Array.isArray(data)) {
        state.sources.length = 0;
        state.sources.push(...data);
        state.blacklist.length = 0;
      } else {
        state.sources.length = 0;
        state.sources.push(...(data.sources || []));
        state.blacklist.length = 0;
        state.blacklist.push(...(data.blacklist || []));
      }
      sourcesStore.saveSources();
    } catch (err) {
      logger.error("ipc:sources", "SET_SOURCES handler failed", err);
    }
  });

  // Add URL to blacklist
  ipcMain.handle(IPC.ADD_TO_BLACKLIST, async (_event, url) => {
    try {
      if (!state.blacklist.includes(url)) {
        state.blacklist.push(url);
        sourcesStore.saveSources();
        if (rebuildTrayMenu) rebuildTrayMenu();
      }
    } catch (err) {
      logger.error("ipc:sources", "ADD_TO_BLACKLIST handler failed", err);
    }
  });

  // Clear blacklist
  ipcMain.handle(IPC.CLEAR_BLACKLIST, async () => {
    try {
      state.blacklist.length = 0;
      sourcesStore.saveSources();
      if (rebuildTrayMenu) rebuildTrayMenu();
    } catch (err) {
      logger.error("ipc:sources", "CLEAR_BLACKLIST handler failed", err);
    }
  });
}

module.exports = { register };
