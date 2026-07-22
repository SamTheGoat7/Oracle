// ── Overlay IPC ──
// Handlers for overlay window IPC channels.

const { ipcMain, shell } = require("electron");
const state = require("../state");
const { IPC, OVERLAY_DEFAULT_WIDTH, OVERLAY_DEFAULT_HEIGHT } = require("../../shared/constants");

function register() {
  // External links
  ipcMain.on(IPC.OPEN_EXTERNAL, (_event, url) => {
    shell.openExternal(url);
  });

  // Resize overlay window upward
  const lastSize = { width: OVERLAY_DEFAULT_WIDTH, height: OVERLAY_DEFAULT_HEIGHT };

  ipcMain.on(IPC.RESIZE_WINDOW_UPWARD, (_event, newWidth, newHeight) => {
    const win = state.windows.overlay;
    if (!win || win.isDestroyed()) return;

    const w = Math.ceil(newWidth);
    const h = Math.ceil(newHeight);
    if (w === lastSize.width && h === lastSize.height) return;
    lastSize.width = w;
    lastSize.height = h;

    const bounds = win.getBounds();
    const currentBottomY = bounds.y + bounds.height;
    const newTopY = currentBottomY - h;

    win.setBounds(
      {
        x: bounds.x,
        y: newTopY,
        width: w,
        height: h,
      },
      false
    );
  });
}

module.exports = { register };