// ── Application State ──
// Simple shared state. Modules import and mutate directly.
// No Redux-style patterns.

const { DEFAULT_SETTINGS } = require("../shared/constants");

// ── Settings ────────────────────────────────────────────────────
const settings = { ...DEFAULT_SETTINGS };

// ── Sources ─────────────────────────────────────────────────────
const sources = [];
const blacklist = [];

// ── Window references ───────────────────────────────────────────
const windows = {
  overlay: null,      // main overlay BrowserWindow
  hub: null,          // hub/library BrowserWindow
  sourcesBg: null,    // background scanner BrowserWindow
};

// ── Tray ────────────────────────────────────────────────────────
const tray = { instance: null, menu: null };

// ── Flags ───────────────────────────────────────────────────────
const flags = {
  isQuitting: false,
  sourcesLoaded: false,
  testFresh: process.argv.includes("--test-fresh"),
};

// ── Session partition ───────────────────────────────────────────
const { PERSISTENT_PARTITION } = require("../shared/constants");
const sessionPartition = flags.testFresh
  ? "test-" + Date.now()
  : PERSISTENT_PARTITION;

module.exports = {
  settings,
  sources,
  blacklist,
  windows,
  tray,
  flags,
  sessionPartition,
};