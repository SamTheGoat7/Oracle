// ── Sources Store ──
// Load, save, and migrate sources + blacklist to/from disk.
// Handles both legacy format (array) and current format ({ sources, blacklist }).

const path = require("path");
const fs = require("fs");
const { app } = require("electron");
const logger = require("../../shared/logger");
const state = require("../state");
const { SOURCES_FILE } = require("../../shared/constants");

const sourcesPath = path.join(app.getPath("userData"), SOURCES_FILE);

// ── Validate and repair a single source entry ───────────────────
function repairSource(entry, index) {
  if (!entry || typeof entry !== "object") {
    logger.warn("sourcesStore", `Entry ${index} is not an object, skipping`);
    return null;
  }

  // url: must be a non-empty string
  const url = typeof entry.url === "string" ? entry.url.trim() : "";
  if (!url) {
    logger.warn("sourcesStore", `Entry ${index} has no valid url, skipping`);
    return null;
  }

  // label: fall back to url if missing or empty
  let label = typeof entry.label === "string" ? entry.label.trim() : "";
  if (!label) {
    label = url;
  }

  return { label, url };
}

// ── Validate and repair the full sources structure ──────────────
function validateSources(raw) {
  // Legacy format: plain array of entries
  if (Array.isArray(raw)) {
    logger.info("sourcesStore", "Migrating legacy array format to object format");
    const repaired = raw
      .map(repairSource)
      .filter(Boolean);
    return { sources: repaired, blacklist: [] };
  }

  // Current format: { sources, blacklist }
  if (raw && typeof raw === "object") {
    const sourceEntries = Array.isArray(raw.sources) ? raw.sources : [];
    const repaired = sourceEntries
      .map(repairSource)
      .filter(Boolean);

    const rawBlacklist = Array.isArray(raw.blacklist) ? raw.blacklist : [];
    const blacklistEntries = rawBlacklist
      .filter((url) => typeof url === "string" && url.trim());

    return { sources: repaired, blacklist: blacklistEntries };
  }

  // Completely invalid format
  logger.warn("sourcesStore", "Sources file is not an array or object, using empty state");
  return { sources: [], blacklist: [] };
}

// ── Load ────────────────────────────────────────────────────────
function loadSources() {
  if (state.flags.testFresh) return;

  try {
    if (fs.existsSync(sourcesPath)) {
      const raw = JSON.parse(fs.readFileSync(sourcesPath, "utf8"));
      const validated = validateSources(raw);

      state.sources.length = 0;
      state.sources.push(...validated.sources);

      state.blacklist.length = 0;
      state.blacklist.push(...validated.blacklist);
    }
  } catch (err) {
    logger.error("sourcesStore", "Failed to load sources", err);
    // State remains as empty arrays from module load
  }
}

// ── Save ────────────────────────────────────────────────────────
function saveSources() {
  if (state.flags.testFresh) return;

  try {
    fs.writeFileSync(
      sourcesPath,
      JSON.stringify({ sources: state.sources, blacklist: state.blacklist }, null, 2),
      "utf8"
    );
  } catch (err) {
    logger.error("sourcesStore", "Failed to save sources", err);
  }
}

module.exports = { loadSources, saveSources, sourcesPath };