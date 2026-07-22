// ── Renderer State ──
// Shared state and DOM references. Loaded first in dependency order.

// ── State ───────────────────────────────────────────────────────
var locked = false;
var editMode = false;
var editingIndex = -1;
var isDragging = false;
var layout = "row";
var sources = [];
var blacklist = [];
var dragFromSrcIndex = -1;

var intervals = [];
var activePollCards = new Set();
var hoverTimeout = null;

var TEST_FIRST_LAUNCH = new URLSearchParams(window.location.search).has("firstlaunch");
var initialLoadDone = false;

// ── DOM Refs ────────────────────────────────────────────────────
var glass = document.getElementById("glass");
var hud = document.getElementById("hud");
var hudRow = document.getElementById("hudRow");
var wrap = document.getElementById("wrap");
var addCardBtn = document.getElementById("addCardBtn");
var layoutBtn = document.getElementById("layoutBtn");
var editToggleBtn = document.getElementById("editBtn");
var pinBtn = document.getElementById("pinBtn");
var modalOverlay = document.getElementById("modalOverlay");
var modalLabel = document.getElementById("modalLabel");
var modalUrl = document.getElementById("modalUrl");
var modalConfirmBtn = document.getElementById("modalConfirmBtn");
var modalCancelBtn = document.getElementById("modalCancelBtn");
var modalFugiBtn = document.getElementById("modalFugiBtn");
var modalActions = document.querySelector(".modal-actions");
var modalDialog = document.getElementById("modalDialog");

// ── Shared SVG Icons ────────────────────────────────────────────
var ICONS = {
  edit: '<svg class="card-icon" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 015 12.5V12h-.5a.5.5 0 01-.5-.5V11h-.5a.5.5 0 01-.468-.325z"/></svg>',
  remove: '<svg class="card-icon" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 11.708-.708L8 7.293l5.146-5.147a.5.5 0 01.708.708L8.707 8l5.147 5.146a.5.5 0 01-.708.708L8 8.707l-5.146 5.147a.5.5 0 01-.708-.708L7.293 8 2.146 2.854z"/></svg>',
};

// ── Shared Helpers ──────────────────────────────────────────────
function getCardSrcIndex(card) {
  return parseInt(card.dataset.srcIndex, 10);
}

// ── Persisted State ─────────────────────────────────────────────
async function loadSources() {
  try {
    var raw = await window.electronAPI.getSources();
    if (Array.isArray(raw)) {
      sources = raw;
      blacklist = [];
    } else {
      sources = raw.sources || [];
      blacklist = raw.blacklist || [];
    }
    if (!initialLoadDone && TEST_FIRST_LAUNCH) {
      sources = [];
      initialLoadDone = true;
    }
  } catch (e) {
    console.error("[renderer] Failed to load sources:", e && e.message ? e.message : e);
    sources = [];
    blacklist = [];
  }
}

async function loadSettings() {
  try {
    var s = await window.electronAPI.getSettings();
    if (s.layout === "row" || s.layout === "column") layout = s.layout;
  } catch (e) {
    console.error("[renderer] Failed to load settings:", e);
  }
}

function save() {
  window.electronAPI.setSources({ sources: sources, blacklist: blacklist });
}