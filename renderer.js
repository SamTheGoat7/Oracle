// ── Renderer ──

// ── State ───────────────────────────────────────────────────────
let locked    = false;
let editMode  = false;
let editingIndex = -1;
let isDragging   = false;
let layout = "row";
let sources;
let dragFromSrcIndex = -1;

// ── DOM Refs ────────────────────────────────────────────────────
const glass         = document.getElementById("glass");
const hud           = document.getElementById("hud");
const hudRow        = document.getElementById("hudRow");
const wrap          = document.getElementById("wrap");
const addCardBtn    = document.getElementById("addCardBtn");
const layoutBtn     = document.getElementById("layoutBtn");
const editToggleBtn = document.getElementById("editBtn");
const pinBtn        = document.getElementById("pinBtn");
const modalOverlay  = document.getElementById("modalOverlay");
const modalLabel    = document.getElementById("modalLabel");
const modalUrl      = document.getElementById("modalUrl");
const modalConfirmBtn = document.getElementById("modalConfirmBtn");
const modalCancelBtn  = document.getElementById("modalCancelBtn");
const modalFugiBtn    = document.getElementById("modalFugiBtn");

let intervals = [];
let activePollCards = new Set();

// ── Load Persisted State ────────────────────────────────────────
const TEST_FIRST_LAUNCH = new URLSearchParams(window.location.search).has("firstlaunch");

async function loadSources() {
  const stored = await window.electronAPI.getSources();
  sources = (TEST_FIRST_LAUNCH || !stored || !stored.length) ? [] : stored;
}

try {
  const savedLayout = localStorage.getItem("hud_layout");
  if (savedLayout === "row" || savedLayout === "column") layout = savedLayout;
} catch {}

// ── Resize ──────────────────────────────────────────────────────
function requestResize() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const rect = wrap.getBoundingClientRect();
      window.electronAPI.resizeWindow(Math.ceil(rect.width), Math.ceil(rect.height));
    });
  });
}

// ── Drag Ghost Canvas ───────────────────────────────────────────
function createDragGhost(card) {
  const w = 140, h = 140;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const r = 12;

  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.arcTo(w, 0, w, r, r);
  ctx.lineTo(w, h - r);
  ctx.arcTo(w, h, w - r, h, r);
  ctx.lineTo(r, h);
  ctx.arcTo(0, h, 0, h - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fill();
  ctx.shadowColor = "rgba(100, 180, 255, 0.6)";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "rgba(180, 220, 255, 0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label = card.querySelector(".card-label");
  if (label && label.textContent) ctx.fillText(label.textContent, w / 2, h / 2);
  return c;
}

function getCardSrcIndex(card) {
  return parseInt(card.dataset.srcIndex, 10);
}

// ── Shared SVG Icons ────────────────────────────────────────────
const ICONS = {
  edit:
    '<svg class="card-icon" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 015 12.5V12h-.5a.5.5 0 01-.5-.5V11h-.5a.5.5 0 01-.468-.325z"/></svg>',
  remove:
    '<svg class="card-icon" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 11.708-.708L8 7.293l5.146-5.147a.5.5 0 01.708.708L8.707 8l5.147 5.146a.5.5 0 01-.708.708L8 8.707l-5.146 5.147a.5.5 0 01-.708-.708L7.293 8 2.146 2.854z"/></svg>',
};

// ── Card Creation ───────────────────────────────────────────────
function createCardElement(src, srcIdx) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.display = "none";
  card.dataset.srcIndex = srcIdx;

  const label = document.createElement("div");
  label.className = "card-label";
  label.textContent = src.label || src.url;
  card.appendChild(label);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "card-action-btn edit";
  editBtn.innerHTML = ICONS.edit;
  editBtn.title = "Edit source";
  editBtn.onclick = (e) => { e.stopPropagation(); openModal(srcIdx); };

  const removeBtn = document.createElement("button");
  removeBtn.className = "card-action-btn remove";
  removeBtn.innerHTML = ICONS.remove;
  removeBtn.title = "Remove source";
  removeBtn.onclick = (e) => { e.stopPropagation(); removeSource(srcIdx); };

  actions.appendChild(editBtn);
  actions.appendChild(removeBtn);
  card.appendChild(actions);

  const view = document.createElement("webview");
  view.src = src.url;
  card.appendChild(view);

  let isCurrentlyActive = false;

  card._startPolling = function () {
    if (activePollCards.has(card)) return;
    activePollCards.add(card);
    const loop = setInterval(async () => {
      if (isDragging) return;
      if (!document.body.contains(card)) {
        clearInterval(loop);
        activePollCards.delete(card);
        return;
      }
      try {
        const hasActiveElement = await view.executeJavaScript(
          `document.querySelector('div[data-discord-id]') !== null`
        );
        if (hasActiveElement && !isCurrentlyActive) {
          card.style.display = "flex";
          isCurrentlyActive = true;
          updateGlassVisibility();
          requestResize();
        } else if (!hasActiveElement && isCurrentlyActive) {
          card.style.display = "none";
          isCurrentlyActive = false;
          updateGlassVisibility();
          requestResize();
        }
      } catch (err) {
        console.error(err);
        clearInterval(loop);
        activePollCards.delete(card);
      }
    }, 1000);
    intervals.push(loop);
  };

  card._stopPolling = function () {
    activePollCards.delete(card);
  };

  view.addEventListener("dom-ready", () => {
    if (!editMode) {
      card._startPolling();
    }
  });

  return card;
}

// ── Render ──────────────────────────────────────────────────────
function render() {
  intervals.forEach(clearInterval);
  intervals = [];
  activePollCards.clear();

  // ── Remove cards only ──
  hud.querySelectorAll(".card").forEach((c) => c.remove());
  hud.querySelectorAll(".placeholder-msg").forEach((el) => el.remove());

  if (sources.length === 0) {
    editToggleBtn.style.display = "none";
    if (editMode) {
      glass.style.opacity = "1";
      addCardBtn.classList.add("visible");
    } else {
      glass.style.opacity = "1";
      glass.style.webkitAppRegion = "no-drag";
      const msg = document.createElement("div");
      msg.className = "placeholder-msg first-launch";
      msg.textContent = "Click here to add your first source";
      msg.onclick = () => openModal(-1);
      hud.insertBefore(msg, addCardBtn);
    }
    requestResize();
    return;
  }
  editToggleBtn.style.display = "";

  hudRow.className = "";
  hudRow.classList.add("layout-" + layout);
  sources.forEach((src, index) => {
    if (!src.url || !src.url.trim()) return;
    const card = createCardElement(src, index);
    hud.insertBefore(card, addCardBtn);
  });

  applyEditMode();
  requestResize();
}

// ── Layout ──────────────────────────────────────────────────────
function applyLayout() {
  hudRow.className = "";
  hudRow.classList.add("layout-" + layout);
  localStorage.setItem("hud_layout", layout);

  // ── Icon toggle ──
  const iconRow = document.querySelector(".icon-row");
  const iconCol = document.querySelector(".icon-column");
  const isColumn = layout === "column";
  if (iconRow) iconRow.style.display = isColumn ? "none" : "block";
  if (iconCol) iconCol.style.display = isColumn ? "block" : "none";
  layoutBtn.title = isColumn ? "Column layout" : "Row layout";

  requestResize();
}

layoutBtn.onclick = () => {
  layout = layout === "row" ? "column" : "row";
  applyLayout();
};

// ── Edit Mode ───────────────────────────────────────────────────
function applyEditMode() {
  const cards = hud.querySelectorAll(".card");
  cards.forEach((card) => {
    card.classList.toggle("edit-mode", editMode);
    card.draggable = editMode;
  });
  addCardBtn.classList.toggle("visible", editMode);

  if (editMode) {
    intervals.forEach(clearInterval);
    intervals = [];
    glass.style.opacity = "1";
  } else if (sources.length > 0) {
    intervals.forEach(clearInterval);
    intervals = [];
    activePollCards.clear();
    cards.forEach((card) => {
      if (card._startPolling) card._startPolling();
    });
  }
  updateGlassVisibility();
}

function updateGlassVisibility() {
  if (editMode) {
    glass.style.opacity = "1";
    return;
  }
  if (sources.length === 0) {
    glass.style.opacity = "1";
    return;
  }
  const cards = hud.querySelectorAll(".card");
  if (cards.length === 0) {
    glass.style.opacity = "1";
    return;
  }
  const anyVisible = Array.from(cards).some((c) => c.style.display === "flex");
  glass.style.opacity = anyVisible ? "1" : "0";
}

// ── Hover Controls ──────────────────────────────────────────────
let hoverTimeout;

function showControls() {
  clearTimeout(hoverTimeout);
  wrap.classList.add("show-controls");
}

function hideControls() {
  if (editMode) return;
  hoverTimeout = setTimeout(() => {
    wrap.classList.remove("show-controls");
  }, 1100);
}

wrap.addEventListener("mouseenter", showControls);
wrap.addEventListener("mouseleave", hideControls);

// ── Edit Toggle Button ──────────────────────────────────────────
editToggleBtn.onclick = () => {
  editMode = !editMode;
  editToggleBtn.classList.toggle("active", editMode);
  if (editMode) {
    wrap.classList.add("show-controls");
  } else if (sources.length === 0) {
    editMode = true;
    editToggleBtn.classList.add("active");
    return;
  }
  applyEditMode();
  requestResize();
};

function save() {
  window.electronAPI.setSources(sources);
}

// ── Remove Source ───────────────────────────────────────────────
function removeSource(index) {
  const card = hud.querySelector(`.card[data-src-index="${index}"]`);
  if (card) {
    if (card._stopPolling) card._stopPolling();
    card.remove();
  }
  sources.splice(index, 1);
  save();
  refreshIndices();
  updateGlassVisibility();

  if (sources.length === 0) {
    editToggleBtn.style.display = "none";
    if (!editMode) {
      editMode = true;
      editToggleBtn.classList.add("active");
      wrap.classList.add("show-controls");
    }
    hud.querySelectorAll(".card").forEach((c) => c.remove());
    hud.querySelectorAll(".placeholder-msg").forEach((el) => el.remove());
    glass.style.opacity = "1";
    addCardBtn.classList.add("visible");
  }
  requestResize();
}

function refreshIndices() {
  const cards = hud.querySelectorAll(".card");
  cards.forEach((card, i) => {
    card.dataset.srcIndex = i;
    const eBtn = card.querySelector(".card-action-btn.edit");
    const rBtn = card.querySelector(".card-action-btn.remove");
    if (eBtn) eBtn.onclick = (e) => { e.stopPropagation(); openModal(i); };
    if (rBtn) rBtn.onclick = (e) => { e.stopPropagation(); removeSource(i); };
  });
}

// ── Modal ───────────────────────────────────────────────────────
function openModal(index) {
  editingIndex = index;
  if (index >= 0) {
    modalLabel.value = sources[index].label || "";
    modalUrl.value   = sources[index].url   || "";
  } else {
    modalLabel.value = "";
    modalUrl.value   = "https://";
  }
  modalOverlay.classList.add("open");
  modalLabel.focus();
  if (index >= 0) modalLabel.select();
}

function closeModal() {
  modalOverlay.classList.remove("open");
  editingIndex = -1;
}

modalConfirmBtn.onclick = () => {
  const label = modalLabel.value.trim();
  const url   = modalUrl.value.trim();
  if (!url) return;

  if (editingIndex >= 0) {
    sources[editingIndex] = { label, url };
  } else {
    sources.push({ label, url });
    save();
    closeModal();
    const newIndex = sources.length - 1;
    const card = createCardElement({ label, url }, newIndex);
    hud.insertBefore(card, addCardBtn);
    if (!editMode && card._startPolling) card._startPolling();
    applyEditMode();
    updateGlassVisibility();
    requestResize();
    return;
  }

  save();
  closeModal();
  const card = hud.querySelector(`.card[data-src-index="${editingIndex}"]`);
  if (card) {
    const oldView = card.querySelector("webview");
    if (oldView) {
      const newView = document.createElement("webview");
      newView.src = url;
      oldView.replaceWith(newView);
      card.appendChild(newView);
      if (card._stopPolling) card._stopPolling();
      if (!editMode && card._startPolling) card._startPolling();
    }
    const labelEl = card.querySelector(".card-label");
    if (labelEl) labelEl.textContent = label || url;
  }
};

modalFugiBtn.onclick = () => {
  window.electronAPI.openExternal("https://fugi.tech");
};

modalCancelBtn.onclick = closeModal;
modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeModal(); };
modalUrl.onkeydown   = (e) => { if (e.key === "Enter") modalConfirmBtn.click(); };
modalLabel.onkeydown = (e) => { if (e.key === "Enter") modalUrl.focus(); };

// ── Drag & Drop ─────────────────────────────────────────────────
// ── Rebuild sources from DOM order ──
function rebuildSourcesFromDOM() {
  const newSources = [];
  hud.querySelectorAll(".card").forEach((card) => {
    const si = getCardSrcIndex(card);
    if (!isNaN(si) && sources[si]) newSources.push(sources[si]);
  });
  sources = newSources;
  save();
  dragFromSrcIndex = -1;
  requestResize();
}

hud.addEventListener("dragstart", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  isDragging = true;
  dragFromSrcIndex = getCardSrcIndex(card);
  card.classList.add("dragging-source");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", String(dragFromSrcIndex));
  const ghost = createDragGhost(card);
  e.dataTransfer.setDragImage(ghost, 70, 70);
});

hud.addEventListener("dragend", () => {
  const card = hud.querySelector(`.card[data-src-index="${dragFromSrcIndex}"]`);
  if (card) card.classList.remove("dragging-source");
  isDragging = false;
  rebuildSourcesFromDOM();
});

hud.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  if (dragFromSrcIndex < 0) return;
  const targetCard = e.target.closest(".card");
  if (!targetCard) return;
  const draggedCard = hud.querySelector(`.card[data-src-index="${dragFromSrcIndex}"]`);
  if (!draggedCard || targetCard === draggedCard) return;

  const rect = targetCard.getBoundingClientRect();
  const swapX = layout === "column"
    ? rect.top  + rect.height * 0.35
    : rect.left + rect.width  * 0.35;

  if (layout === "column") {
    if (e.clientY < swapX) {
      if (targetCard.previousSibling !== draggedCard) hud.insertBefore(draggedCard, targetCard);
    } else {
      if (targetCard.nextSibling !== draggedCard) hud.insertBefore(draggedCard, targetCard.nextSibling);
    }
  } else {
    if (e.clientX < swapX) {
      if (targetCard.previousSibling !== draggedCard) hud.insertBefore(draggedCard, targetCard);
    } else {
      if (targetCard.nextSibling !== draggedCard) hud.insertBefore(draggedCard, targetCard.nextSibling);
    }
  }
});

hud.addEventListener("drop", (e) => {
  e.preventDefault();
  if (dragFromSrcIndex < 0) return;
  const card = hud.querySelector(`.card[data-src-index="${dragFromSrcIndex}"]`);
  if (card) card.classList.remove("dragging-source");
  isDragging = false;
  rebuildSourcesFromDOM();
});

// ── Add New Source ──────────────────────────────────────────────
addCardBtn.onclick = () => { openModal(-1); };

// ── Action Buttons ──────────────────────────────────────────────
document.getElementById("closeBtn").onclick = () => window.close();

pinBtn.onclick = () => {
  locked = !locked;
  document.body.classList.toggle("locked", locked);
  pinBtn.classList.toggle("pinned", locked);
};

// ── Tray Edit Mode Listener ────────────────────────────────────
window.electronAPI.onToggleEditMode(() => {
  if (!editMode) {
    editMode = true;
    editToggleBtn.classList.add("active");
    wrap.classList.add("show-controls");
    if (sources.length === 0) {
      glass.style.opacity = "1";
      hud.querySelectorAll(".placeholder-msg").forEach((el) => el.remove());
      const msg = document.createElement("div");
      msg.className = "placeholder-msg first-launch";
      msg.textContent = "Click here to add your first source";
      msg.onclick = () => openModal(-1);
      hud.insertBefore(msg, addCardBtn);
      addCardBtn.classList.add("visible");
      requestResize();
      return;
    }
    applyEditMode();
    requestResize();
  }
});

// ── Init ────────────────────────────────────────────────────────
(async function init() {
  await loadSources();
  localStorage.removeItem("hud_sources");
  applyLayout();
  render();
})();
