// ── Tray ──
// Creates the system tray icon and manages context menu.

const { Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const state = require("../state");
const { buildMenuTemplate } = require("./menu");

let trayRef = null;

function buildAndSetMenu(deps) {
  const { app } = require("electron");
  const template = buildMenuTemplate({
    win: state.windows.overlay,
    blacklist: state.blacklist,
    saveSources: deps.saveSources,
    createWindow: deps.createWindow,
    createHubWindow: deps.createHubWindow,
    rebuildTrayMenu: () => buildAndSetMenu(deps),
    app,
  });
  const menu = Menu.buildFromTemplate(template);
  trayRef.setContextMenu(menu);
  state.tray.menu = menu;
}

function createTray(deps) {
  const iconPath = path.join(__dirname, "..", "..", "..", "icon.ico");
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 });

  trayRef = new Tray(icon);
  trayRef.setToolTip("Oracle");
  state.tray.instance = trayRef;

  buildAndSetMenu(deps);

  trayRef.on("click", () => {
    const win = state.windows.overlay;
    if (!win || win.isDestroyed()) {
      deps.createWindow();
      state.windows.overlay.show();
    } else {
      win.isVisible() ? win.hide() : win.show();
    }
  });

  return trayRef;
}

module.exports = { createTray, buildAndSetMenu };