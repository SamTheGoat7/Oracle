// ── Modal ──
// Edit/add modal, confirmation dialog, and modal lifecycle.

// ── Open / Close ────────────────────────────────────────────────
function openModal(index) {
  editingIndex = index;
  restoreModal();
  if (index >= 0) {
    modalLabel.value = sources[index].label || "";
    modalUrl.value = sources[index].url || "";
  } else {
    modalLabel.value = "";
    modalUrl.value = "https://";
  }
  modalOverlay.classList.add("open");
  modalLabel.focus();
  if (index >= 0) modalLabel.select();
}

function closeModal() {
  modalOverlay.classList.remove("open");
  editingIndex = -1;
}

// ── Modal Confirm Handler ───────────────────────────────────────
function modalConfirmHandler() {
  var label = modalLabel.value.trim();
  var url = modalUrl.value.trim();
  if (!url) return;

  if (editingIndex >= 0) {
    sources[editingIndex] = { label: label, url: url };
  } else {
    sources.push({ label: label, url: url });
    save();
    closeModal();
    hud.querySelectorAll(".placeholder-msg").forEach(function (el) { el.remove(); });
    editToggleBtn.style.display = "";
    glass.style.webkitAppRegion = "";
    var newIndex = sources.length - 1;
    var card = createCardElement({ label: label, url: url }, newIndex);
    hud.insertBefore(card, addCardBtn);
    if (!editMode && card._startPolling) card._startPolling();
    applyEditMode();
    updateGlassVisibility();
    requestResize();
    return;
  }

  save();
  closeModal();
  var card = hud.querySelector('.card[data-src-index="' + editingIndex + '"]');
  if (card) {
    var oldView = card.querySelector("webview");
    if (oldView) {
      var newView = document.createElement("webview");
      newView.src = url;
      newView.setAttribute("partition", "persist:reactive");
      oldView.replaceWith(newView);
      card.appendChild(newView);
      if (card._stopPolling) card._stopPolling();
      if (!editMode && card._startPolling) card._startPolling();
    }
    var labelEl = card.querySelector(".card-label");
    if (labelEl) labelEl.textContent = label || url;
  }
}

// ── Confirmation Dialog (re-purposes modal for remove confirmation) ──
function confirmRemove(index) {
  var src = sources[index];
  if (!src) return;

  modalLabel.style.display = "none";
  document.querySelector('label[for="modalLabel"]').style.display = "none";
  modalUrl.style.display = "none";
  document.querySelector('label[for="modalUrl"]').style.display = "none";
  modalFugiBtn.style.display = "none";

  modalOverlay.classList.add("open");

  var existing = document.getElementById("confirmMsg");
  if (existing) existing.remove();
  var msg = document.createElement("p");
  msg.id = "confirmMsg";
  msg.style.cssText = "color:rgba(255,255,255,0.85);font-family:system-ui,sans-serif;font-size:12px;margin:0;text-align:center;";
  msg.innerHTML = 'Remove "<b>' + (src.label || src.url) + '</b>"?<br><br><small style="color:rgba(255,255,255,0.5)">Its URL will be added to the blacklist so it wont be re-added automatically.</small>';
  modalDialog.insertBefore(msg, modalActions);

  modalConfirmBtn.textContent = "Remove & Blacklist";
  modalConfirmBtn.className = "modal-btn primary remove-confirm";
  modalConfirmBtn.onclick = function () {
    removeSource(index);
    restoreModal();
    modalOverlay.classList.remove("open");
  };
  modalCancelBtn.onclick = function () {
    restoreModal();
    modalOverlay.classList.remove("open");
  };
}

function restoreModal() {
  modalLabel.style.display = "";
  document.querySelector('label[for="modalLabel"]').style.display = "";
  modalUrl.style.display = "";
  document.querySelector('label[for="modalUrl"]').style.display = "";
  modalFugiBtn.style.display = "";
  modalConfirmBtn.textContent = "Save";
  modalConfirmBtn.className = "modal-btn primary";
  var msg = document.getElementById("confirmMsg");
  if (msg) msg.remove();

  modalConfirmBtn.onclick = modalConfirmHandler;
  modalCancelBtn.onclick = closeModal;
}