// ── Resize & Layout ──
// Window resize, layout toggling, hover controls.

// ── Resize ──────────────────────────────────────────────────────
function requestResize() {
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      var rect = wrap.getBoundingClientRect();
      window.electronAPI.resizeWindow(
        Math.ceil(rect.width),
        Math.ceil(rect.height)
      );
    });
  });
}

// ── Layout ──────────────────────────────────────────────────────
function applyLayout() {
  hudRow.className = "";
  hudRow.classList.add("layout-" + layout);
  window.electronAPI.setSettings({ layout: layout });

  var iconRow = document.querySelector(".icon-row");
  var iconCol = document.querySelector(".icon-column");
  var isColumn = layout === "column";
  if (iconRow) iconRow.style.display = isColumn ? "none" : "block";
  if (iconCol) iconCol.style.display = isColumn ? "block" : "none";
  layoutBtn.title = isColumn ? "Column layout" : "Row layout";

  requestResize();
}

// ── Hover Controls ──────────────────────────────────────────────
function showControls() {
  clearTimeout(hoverTimeout);
  wrap.classList.add("show-controls");
}

function hideControls() {
  if (editMode) return;
  hoverTimeout = setTimeout(function () {
    wrap.classList.remove("show-controls");
  }, 1100);
}

// ── Init layout & hover listeners ───────────────────────────────
function initResize() {
  layoutBtn.onclick = function () {
    layout = layout === "row" ? "column" : "row";
    applyLayout();
  };

  wrap.addEventListener("mouseenter", showControls);
  wrap.addEventListener("mouseleave", hideControls);
}