// ── Logger ──
// Lightweight logging utility. No external dependencies.
// Sanitises user filesystem paths from error output.

const path = require("path");
const os = require("os");

const homedir = os.homedir();

// Replace absolute paths under user home with ~/ for safe logging
function sanitize(str) {
  if (typeof str !== "string") return str;
  return str.replace(homedir, "~").replace(/\\/g, "/");
}

function log(level, tag, message, err) {
  const timestamp = new Date().toISOString();
  const parts = [timestamp, level, `[${tag}]`, message];
  if (err) {
    if (err.stack) {
      parts.push("\n" + sanitize(err.stack));
    } else {
      parts.push(sanitize(String(err)));
    }
  }
  // Use appropriate console method
  if (level === "ERROR") console.error(...parts);
  else if (level === "WARN") console.warn(...parts);
  else console.log(...parts);
}

function info(tag, message) {
  log("INFO", tag, message);
}

function warn(tag, message) {
  log("WARN", tag, message);
}

function error(tag, message, err) {
  log("ERROR", tag, message, err);
}

module.exports = { info, warn, error };