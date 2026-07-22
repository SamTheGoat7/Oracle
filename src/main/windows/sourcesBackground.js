// ── Sources Background Window ──
// Hidden window that loads the Reactive sources page and runs
// a MutationObserver + timed scanners to discover new sources.

const { BrowserWindow } = require("electron");
const path = require("path");
const state = require("../state");
const {
  HUB_WINDOW_WIDTH,
  HUB_WINDOW_HEIGHT,
  SOURCES_PAGE_URL,
} = require("../../shared/constants");

// ── Injected scanner script ─────────────────────────────────────
const SCANNER_SCRIPT = `
  (() => {
    const seen = new Set();
    const notify = (url, label) => {
      window.postMessage({ type: 'oracle-new-source', url, label }, '*');
    };

    // Parse copy buttons — extract data-copy attribute
    const scan = () => {
      document.querySelectorAll('[data-copy]').forEach(btn => {
        const url = btn.getAttribute('data-copy');
        if (!url || !url.includes('reactive')) return;
        const row = btn.closest('[class*="row"], [class*="card"], [class*="item"], div.flex, [class*="source"], [class*="pt-4"]');
        const label = row?.querySelector('.text-lg.font-semibold, [class*="name"], [class*="label"]')?.textContent?.trim()
          || row?.querySelector('span, p, h3, a')?.textContent?.trim()
          || row?.textContent?.trim()?.split('\\n')[0]?.substring(0, 40)
          || url;
        if (!seen.has(url)) {
          seen.add(url);
          notify(url, label);
        }
      });
    };

    // MutationObserver
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });

    // Initial scans (page may load data asynchronously via SPA)
    // Burst-poll every 500ms for first 5s, then at wider intervals
    for (let i = 0; i < 10; i++) setTimeout(scan, 500 * (i + 1));
    setTimeout(scan, 8000);
    setTimeout(scan, 15000);
    setTimeout(scan, 30000);
  })();
`;

// ── Window creation ─────────────────────────────────────────────
function createSourcesBackgroundWindow() {
  if (state.windows.sourcesBg && !state.windows.sourcesBg.isDestroyed()) return;

  const win = new BrowserWindow({
    width: HUB_WINDOW_WIDTH,
    height: HUB_WINDOW_HEIGHT,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", "..", "..", "preload-hub.js"),
      partition: state.sessionPartition,
    },
  });

  win.loadURL(SOURCES_PAGE_URL);

  win.webContents.on("did-finish-load", () => {
    state.flags.sourcesLoaded = true;
    win.webContents.executeJavaScript(SCANNER_SCRIPT);
  });

  win.on("closed", () => {
    state.windows.sourcesBg = null;
  });

  state.windows.sourcesBg = win;
  return win;
}

module.exports = { createSourcesBackgroundWindow };