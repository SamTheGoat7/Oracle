// ── Renderer Index ──
// Startup orchestration, IPC listeners, action buttons, init.

// ── Edit Toggle Button ──────────────────────────────────────────
editToggleBtn.onclick = function () {
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

// ── Add New Source ──────────────────────────────────────────────
addCardBtn.onclick = function () {
  openModal(-1);
};

// ── Action Buttons ──────────────────────────────────────────────
document.getElementById("closeBtn").onclick = function () {
  window.close();
};

pinBtn.onclick = function () {
  locked = !locked;
  document.body.classList.toggle("locked", locked);
  pinBtn.classList.toggle("pinned", locked);
};

// ── Modal Event Listeners ───────────────────────────────────────
modalConfirmBtn.onclick = modalConfirmHandler;

modalFugiBtn.onclick = function () {
  window.electronAPI.openHub();
};

modalCancelBtn.onclick = closeModal;

modalOverlay.onclick = function (e) {
  if (e.target === modalOverlay) closeModal();
};

modalUrl.onkeydown = function (e) {
  if (e.key === "Enter") modalConfirmHandler();
};

modalLabel.onkeydown = function (e) {
  if (e.key === "Enter") modalUrl.focus();
};

// ── Tray Edit Mode Listener ────────────────────────────────────
window.electronAPI.onToggleEditMode(function () {
  editMode = !editMode;
  editToggleBtn.classList.toggle("active", editMode);
  if (editMode) {
    wrap.classList.add("show-controls");
    if (sources.length === 0) {
      glass.style.opacity = "1";
      hud.querySelectorAll(".placeholder-msg").forEach(function (el) {
        el.remove();
      });
      showPlaceholderMsg();
      addCardBtn.classList.add("visible");
      requestResize();
      return;
    }
    applyEditMode();
  } else {
    wrap.classList.remove("show-controls");
    applyEditMode();
  }
  requestResize();
});

// ── Refresh Sources (from hub scanner) ─────────────────────────
window.electronAPI.onRefreshSources(async function () {
  await loadSources();
  render();
});

// ── Login Complete (hub login finished) ────────────────────────
window.electronAPI.onLoginComplete(async function () {
  glass.style.opacity = "1";
  hud.querySelectorAll(".placeholder-msg").forEach(function (el) {
    el.remove();
  });
  await loadSources();
  if (sources.length > 0) {
    editToggleBtn.style.display = "";
    glass.style.webkitAppRegion = "";
  }
  render();
});

// ── Init ────────────────────────────────────────────────────────
(async function init() {
  await loadSources();
  await loadSettings();
  applyLayout();
  initResize();
  initDragDrop();
  render();
})();

// ── Cleanup on unload ───────────────────────────────────────────
// Prevent timer leaks if the renderer is refreshed or destroyed.
window.addEventListener("beforeunload", function () {
  // Clear all polling intervals
  intervals.forEach(clearInterval);
  intervals = [];
  activePollCards.clear();

  // Clear hover timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
});
