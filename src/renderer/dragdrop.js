// ── Drag & Drop ──
// Drag ghost canvas, drag start/over/drop/end handlers.

// ── Drag Ghost Canvas ───────────────────────────────────────────
function createDragGhost(card) {
  var w = 140, h = 140;
  var c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  var ctx = c.getContext("2d");
  var r = 12;

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
  var label = card.querySelector(".card-label");
  if (label && label.textContent) ctx.fillText(label.textContent, w / 2, h / 2);
  return c;
}

// ── Rebuild sources array from DOM order ────────────────────────
function rebuildSourcesFromDOM() {
  var newSources = [];
  hud.querySelectorAll(".card").forEach(function (card) {
    var si = getCardSrcIndex(card);
    if (!isNaN(si) && sources[si]) newSources.push(sources[si]);
  });
  sources = newSources;
  save();
  dragFromSrcIndex = -1;
  requestResize();
}

// ── Init drag listeners ─────────────────────────────────────────
function initDragDrop() {
  hud.addEventListener("dragstart", function (e) {
    var card = e.target.closest(".card");
    if (!card) return;
    isDragging = true;
    dragFromSrcIndex = getCardSrcIndex(card);
    card.classList.add("dragging-source");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(dragFromSrcIndex));
    var ghost = createDragGhost(card);
    e.dataTransfer.setDragImage(ghost, 70, 70);
  });

  hud.addEventListener("dragend", function () {
    var card = hud.querySelector('.card[data-src-index="' + dragFromSrcIndex + '"]');
    if (card) card.classList.remove("dragging-source");
    isDragging = false;
    rebuildSourcesFromDOM();
  });

  hud.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragFromSrcIndex < 0) return;
    var targetCard = e.target.closest(".card");
    if (!targetCard) return;
    var draggedCard = hud.querySelector('.card[data-src-index="' + dragFromSrcIndex + '"]');
    if (!draggedCard || targetCard === draggedCard) return;

    var rect = targetCard.getBoundingClientRect();
    var swapX =
      layout === "column"
        ? rect.top + rect.height * 0.35
        : rect.left + rect.width * 0.35;

    if (layout === "column") {
      if (e.clientY < swapX) {
        if (targetCard.previousSibling !== draggedCard)
          hud.insertBefore(draggedCard, targetCard);
      } else {
        if (targetCard.nextSibling !== draggedCard)
          hud.insertBefore(draggedCard, targetCard.nextSibling);
      }
    } else {
      if (e.clientX < swapX) {
        if (targetCard.previousSibling !== draggedCard)
          hud.insertBefore(draggedCard, targetCard);
      } else {
        if (targetCard.nextSibling !== draggedCard)
          hud.insertBefore(draggedCard, targetCard.nextSibling);
      }
    }
  });

  hud.addEventListener("drop", function (e) {
    e.preventDefault();
    if (dragFromSrcIndex < 0) return;
    var card = hud.querySelector('.card[data-src-index="' + dragFromSrcIndex + '"]');
    if (card) card.classList.remove("dragging-source");
    isDragging = false;
    rebuildSourcesFromDOM();
  });
}