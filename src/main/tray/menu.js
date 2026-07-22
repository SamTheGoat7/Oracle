// ── Tray Menu ──
// Builds the tray context menu template.

const { screen } = require("electron");
const state = require("../state");

function buildMenuTemplate({ win, blacklist, saveSources, createWindow, createHubWindow, rebuildTrayMenu, app }) {
  return [
    {
      label: "Show / Hide",
      click: () => {
        if (!win || win.isDestroyed()) { createWindow(); win.show(); }
        else { win.isVisible() ? win.hide() : win.show(); }
      }
    },
    {
      label: "Edit Sources",
      click: () => {
        if (!win || win.isDestroyed()) { createWindow(); }
        win.show();
        win.webContents.send("toggle-edit-mode");
      }
    },
    { type: "separator" },
    {
      label: "Reactive Library",
      click: () => { createHubWindow(); }
    },
    {
      label: "Clear Blacklist (" + blacklist.length + ")",
      click: () => {
        // Mutate the shared blacklist array in place
        blacklist.length = 0;
        saveSources();
        if (win && !win.isDestroyed()) win.webContents.send("refresh-sources");
        rebuildTrayMenu();
      }
    },
    { type: "separator" },
    {
      label: "Reset Position",
      click: () => {
        if (!win || win.isDestroyed()) { createWindow(); }
        const display = screen.getDisplayMatching(win.getBounds());
        const h = win.getBounds().height;
        win.setPosition(0, display.workArea.y + display.workArea.height - h);
        win.show();
      }
    },
    { type: "separator" },
    { label: "Quit", click: () => { state.flags.isQuitting = true; app.quit(); } }
  ];
}

module.exports = { buildMenuTemplate };