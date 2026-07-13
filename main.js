// ── Main ──

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require("electron");
const path = require("path");

let win;
let tray;
let isQuitting = false;

function createWindow() {
  win = new BrowserWindow({
    width: 200,
    height: 200,

    frame: false,
    transparent: true,
    resizable: false,

    alwaysOnTop: true,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webviewTag: true
    }
  });

  // ── Overlay ──
  win.setAlwaysOnTop(true, "screen-saver", 1);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setSkipTaskbar(true);

  win.loadFile("overlay.html");

  // ── Close ──
  win.on("close", () => {
    isQuitting = true;
    app.quit();
  });

  win.on("closed", () => { win = null; });
}

function createTray() {
  const iconPath = path.join(__dirname, "icon.ico");
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip("Oracle");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show / Hide",
      click: () => {
        if (!win || win.isDestroyed()) { createWindow(); win.show(); }
        else { win.isVisible() ? win.hide() : win.show(); }
      }
    },
    { type: "separator" },
    { label: "Quit", click: () => { isQuitting = true; app.quit(); } }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (!win || win.isDestroyed()) { createWindow(); win.show(); }
    else { win.isVisible() ? win.hide() : win.show(); }
  });
}

// ── Resize ──
let lastWidth = 200;
let lastHeight = 200;

ipcMain.on("resize-window-upward", (_event, newWidth, newHeight) => {
  if (!win || win.isDestroyed()) return;

  const w = Math.ceil(newWidth);
  const h = Math.ceil(newHeight);
  if (w === lastWidth && h === lastHeight) return;
  lastWidth = w;
  lastHeight = h;

  const bounds = win.getBounds();
  const currentBottomY = bounds.y + bounds.height;
  const newTopY = currentBottomY - h;

  win.setBounds(
    {
      x: bounds.x,
      y: newTopY,
      width: w,
      height: h
    },
    false
  );
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("before-quit", () => { isQuitting = true; });
app.on("window-all-closed", () => { app.quit(); });
