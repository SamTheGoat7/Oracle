// ── Cards ──
// Card creation, rendering, edit mode, and source removal.

// ── Card Creation ───────────────────────────────────────────────
function createCardElement(src, srcIdx) {
  var card = document.createElement("div");
  card.className = "card";
  card.style.display = "none";
  card.dataset.srcIndex = srcIdx;

  var label = document.createElement("div");
  label.className = "card-label";
  label.textContent = src.label || src.url;
  card.appendChild(label);

  var actions = document.createElement("div");
  actions.className = "card-actions";

  var editBtn = document.createElement("button");
  editBtn.className = "card-action-btn edit";
  editBtn.innerHTML = ICONS.edit;
  editBtn.title = "Edit source";
  editBtn.onclick = function (e) {
    e.stopPropagation();
    openModal(srcIdx);
  };

  var removeBtn = document.createElement("button");
  removeBtn.className = "card-action-btn remove";
  removeBtn.innerHTML = ICONS.remove;
  removeBtn.title = "Remove source";
  removeBtn.onclick = function (e) {
    e.stopPropagation();
    confirmRemove(srcIdx);
  };

  actions.appendChild(editBtn);
  actions.appendChild(removeBtn);
  card.appendChild(actions);

  var view = document.createElement("webview");
  view.setAttribute("partition", "persist:reactive");
  view.src = src.url;
  card.appendChild(view);

  var isCurrentlyActive = false;

  card._startPolling = function () {
    if (activePollCards.has(card)) return;
    activePollCards.add(card);
    var loop = setInterval(async function () {
      if (isDragging) return;
      if (!document.body.contains(card)) {
        clearInterval(loop);
        activePollCards.delete(card);
        return;
      }
      try {
        var hasActiveElement = await view.executeJavaScript(
          "document.querySelector('div[data-discord-id]') !== null"
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
        clearInterval(loop);
        activePollCards.delete(card);
      }
    }, 1000);
    intervals.push(loop);
  };

  card._stopPolling = function () {
    activePollCards.delete(card);
  };

  view.addEventListener("dom-ready", function () {
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

  hud.querySelectorAll(".card").forEach(function (c) {
    c.remove();
  });
  hud.querySelectorAll(".placeholder-msg").forEach(function (el) {
    el.remove();
  });

  if (sources.length === 0) {
    editToggleBtn.style.display = "none";
    if (editMode) {
      glass.style.opacity = "1";
      addCardBtn.classList.add("visible");
    } else {
      glass.style.opacity = "1";
      glass.style.webkitAppRegion = "no-drag";
      showPlaceholderMsg();
    }
    requestResize();
    return;
  }
  editToggleBtn.style.display = "";
  glass.style.webkitAppRegion = "";

  hudRow.className = "";
  hudRow.classList.add("layout-" + layout);
  sources.forEach(function (src, index) {
    if (!src.url || !src.url.trim()) return;
    var card = createCardElement(src, index);
    hud.insertBefore(card, addCardBtn);
  });

  applyEditMode();
  requestResize();
}

// ── Placeholder message helper ──────────────────────────────────
function showPlaceholderMsg() {
  var msg = document.createElement("div");
  msg.className = "placeholder-msg first-launch";
  msg.textContent = "Connect to Reactive Fugi Tech";
  msg.onclick = function () {
    window.electronAPI.openHubForLogin();
  };
  hud.insertBefore(msg, addCardBtn);
}

// ── Edit Mode ───────────────────────────────────────────────────
function applyEditMode() {
  var cards = hud.querySelectorAll(".card");
  cards.forEach(function (card) {
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
    cards.forEach(function (card) {
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
  var cards = hud.querySelectorAll(".card");
  if (cards.length === 0) {
    glass.style.opacity = "1";
    return;
  }
  var anyVisible = Array.from(cards).some(function (c) {
    return c.style.display === "flex";
  });
  glass.style.opacity = anyVisible ? "1" : "0";
}

// ── Remove Source ───────────────────────────────────────────────
function removeSource(index) {
  var src = sources[index];
  if (src && src.url) {
    window.electronAPI.addToBlacklist(src.url);
  }

  var card = hud.querySelector('.card[data-src-index="' + index + '"]');
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
    hud.querySelectorAll(".card").forEach(function (c) {
      c.remove();
    });
    hud.querySelectorAll(".placeholder-msg").forEach(function (el) {
      el.remove();
    });
    glass.style.opacity = "1";
    addCardBtn.classList.add("visible");
  }
  requestResize();
}

function refreshIndices() {
  var cards = hud.querySelectorAll(".card");
  cards.forEach(function (card, i) {
    card.dataset.srcIndex = i;
    var eBtn = card.querySelector(".card-action-btn.edit");
    var rBtn = card.querySelector(".card-action-btn.remove");
    if (eBtn)
      eBtn.onclick = function (e) {
        e.stopPropagation();
        openModal(i);
      };
    if (rBtn)
      rBtn.onclick = function (e) {
        e.stopPropagation();
        confirmRemove(i);
      };
  });
}