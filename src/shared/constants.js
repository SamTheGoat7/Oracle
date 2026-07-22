// ── Shared Constants ──
// JS-referenced values only. CSS retains ownership of visual styling.

// ── File names ──────────────────────────────────────────────────
const SOURCES_FILE = "sources.json";
const SETTINGS_FILE = "settings.json";

// ── Session partition ───────────────────────────────────────────
const PERSISTENT_PARTITION = "persist:reactive";

// ── Default settings ────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  layout: "row",
  windowX: null,
  windowY: null,
};

// ── Layout modes ────────────────────────────────────────────────
const LAYOUT_ROW = "row";
const LAYOUT_COLUMN = "column";

// ── Card dimensions ─────────────────────────────────────────────
const CARD_SIZE = 140;

// ── Window dimensions ───────────────────────────────────────────
const OVERLAY_DEFAULT_WIDTH = 350;
const OVERLAY_DEFAULT_HEIGHT = 250;
const HUB_WINDOW_WIDTH = 900;
const HUB_WINDOW_HEIGHT = 700;

// ── IPC channels ────────────────────────────────────────────────
const IPC = {
  // Sources
  GET_SOURCES: "get-sources",
  SET_SOURCES: "set-sources",
  ADD_TO_BLACKLIST: "add-to-blacklist",
  CLEAR_BLACKLIST: "clear-blacklist",

  // Settings
  GET_SETTINGS: "get-settings",
  SET_SETTINGS: "set-settings",

  // Hub / Sources window
  OPEN_HUB: "open-hub",
  OPEN_HUB_LOGIN: "open-hub-login",
  HUB_SOURCE_FOUND: "hub-source-found",

  // Overlay
  RESIZE_WINDOW_UPWARD: "resize-window-upward",
  TOGGLE_EDIT_MODE: "toggle-edit-mode",
  REFRESH_SOURCES: "refresh-sources",
  LOGIN_COMPLETE: "login-complete",

  // External
  OPEN_EXTERNAL: "open-external",
};

// ── Web URLs ────────────────────────────────────────────────────
const HUB_URL = "https://reactive.fugi.tech";
const SOURCES_PAGE_URL = "https://reactive.fugi.tech/sources";

// ── Login redirect paths ────────────────────────────────────────
const LOGIN_REDIRECT_PATHS = ["/library", "/sources", "/dashboard"];

module.exports = {
  SOURCES_FILE,
  SETTINGS_FILE,
  PERSISTENT_PARTITION,
  DEFAULT_SETTINGS,
  LAYOUT_ROW,
  LAYOUT_COLUMN,
  CARD_SIZE,
  OVERLAY_DEFAULT_WIDTH,
  OVERLAY_DEFAULT_HEIGHT,
  HUB_WINDOW_WIDTH,
  HUB_WINDOW_HEIGHT,
  IPC,
  HUB_URL,
  SOURCES_PAGE_URL,
  LOGIN_REDIRECT_PATHS,
};