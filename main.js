// ── Main ──

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, shell } = require("electron");
const path = require("path");
const fs = require("fs");

// ── Toggle to true to test first-launch experience ──
const TEST_FIRST_LAUNCH = false;

const sourcesPath = path.join(app.getPath("userData"), "sources.json");

let win;
let tray;
let isQuitting = false;

function createWindow() {
  win = new BrowserWindow({
    width: 350,
    height: 250,

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

  win.loadFile("overlay.html", TEST_FIRST_LAUNCH ? { query: { firstlaunch: "" } } : {});

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
    {
      label: "Edit Sources",
      click: () => {
        if (!win || win.isDestroyed()) { createWindow(); }
        win.show();
        win.webContents.send("toggle-edit-mode");
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
let lastWidth = 350;
let lastHeight = 250;

ipcMain.handle("get-sources", async () => {
  try {
    if (fs.existsSync(sourcesPath)) {
      return JSON.parse(fs.readFileSync(sourcesPath, "utf8"));
    }
  } catch {}
  return [];
});

ipcMain.handle("set-sources", async (_event, data) => {
  fs.writeFileSync(sourcesPath, JSON.stringify(data, null, 2), "utf8");
});

ipcMain.on("open-external", (_event, url) => {
  shell.openExternal(url);
});

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
