// ── Settings Store ──
// Load, save, and migrate settings to/from disk.

const path = require("path");
const fs = require("fs");
const { app } = require("electron");
const logger = require("../../shared/logger");
const state = require("../state");
const { SETTINGS_FILE, DEFAULT_SETTINGS } = require("../../shared/constants");

const settingsPath = path.join(app.getPath("userData"), SETTINGS_FILE);

// ── Validate loaded settings ────────────────────────────────────
function validate(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    logger.warn("settingsStore", "Settings file is not an object, using defaults");
    return {};
  }

  const cleaned = {};

  // layout: must be "row" or "column"
  if (raw.layout === "row" || raw.layout === "column") {
    cleaned.layout = raw.layout;
  }

  // windowX / windowY: must be numbers or null
  cleaned.windowX =
    raw.windowX !== null && typeof raw.windowX === "number"
      ? raw.windowX
      : null;
  cleaned.windowY =
    raw.windowY !== null && typeof raw.windowY === "number"
      ? raw.windowY
      : null;

  return cleaned;
}

// ── Load ────────────────────────────────────────────────────────
function loadSettings() {
  if (state.flags.testFresh) return;

  try {
    if (fs.existsSync(settingsPath)) {
      const raw = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      const validated = validate(raw);
      Object.assign(state.settings, DEFAULT_SETTINGS, validated);
    }
  } catch (err) {
    logger.error("settingsStore", "Failed to load settings", err);
    // State already has defaults from module load; no action needed
  }
}

// ── Save ────────────────────────────────────────────────────────
function saveSettings() {
  if (state.flags.testFresh) return;

  try {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(state.settings, null, 2),
      "utf8"
    );
  } catch (err) {
    logger.error("settingsStore", "Failed to save settings", err);
  }
}

module.exports = { loadSettings, saveSettings, settingsPath };
