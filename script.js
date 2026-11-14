const STORAGE_KEYS = {
  limit: "sampling-counter-limit",
  savedSamples: "sampling-counter-saved-samples",
  drawHistory: "sampling-counter-draw-history",
  latestNumber: "sampling-counter-latest-number",
};

const MAX_VISIBLE_HISTORY = 12;

const elements = {
  limitInput: document.getElementById("limitInput"),
  resultValue: document.getElementById("resultValue"),
  resultNote: document.getElementById("resultNote"),
  drawButton: document.getElementById("drawButton"),
  saveButton: document.getElementById("saveButton"),
  drawCount: document.getElementById("drawCount"),
  savedCount: document.getElementById("savedCount"),
  savedList: document.getElementById("savedList"),
  historyList: document.getElementById("historyList"),
  savedEmpty: document.getElementById("savedEmpty"),
  historyEmpty: document.getElementById("historyEmpty"),
  clearSavedButton: document.getElementById("clearSavedButton"),
  clearHistoryButton: document.getElementById("clearHistoryButton"),
};

const state = {
  limit: 34,
  latestNumber: null,
  savedSamples: [],
  drawHistory: [],
};

function loadStoredNumber(key, fallback) {
  const value = Number.parseInt(localStorage.getItem(key) || "", 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function loadStoredList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.limit, String(state.limit));
  localStorage.setItem(STORAGE_KEYS.savedSamples, JSON.stringify(state.savedSamples));
  localStorage.setItem(STORAGE_KEYS.drawHistory, JSON.stringify(state.drawHistory));

  if (state.latestNumber === null) {
    localStorage.removeItem(STORAGE_KEYS.latestNumber);
    return;
  }

  localStorage.setItem(STORAGE_KEYS.latestNumber, String(state.latestNumber));
}

function clampLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getRandomNumber(limit) {
  return Math.floor(Math.random() * limit) + 1;
}

function formatTimestamp(isoString) {
  return new Date(isoString).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function createHistoryItem(entry, label) {
  const item = document.createElement("li");
  item.className = "history-item";

  const title = document.createElement("strong");
  title.textContent = `${label} ${entry.number}`;

  const meta = document.createElement("span");
  meta.className = "history-meta";
  meta.textContent = formatTimestamp(entry.timestamp);

  item.append(title, meta);
  return item;
}

function renderList(listElement, emptyElement, entries, label) {
  listElement.innerHTML = "";

  if (!entries.length) {
    emptyElement.hidden = false;
    return;
  }

  emptyElement.hidden = true;

  entries
    .slice()
    .reverse()
    .slice(0, MAX_VISIBLE_HISTORY)
    .forEach((entry) => {
      listElement.appendChild(createHistoryItem(entry, label));
    });
}

function updateResultMessage() {
  if (state.latestNumber === null) {
    elements.resultValue.textContent = "--";
    elements.resultNote.textContent = "Tap the button to generate a random sample.";
    elements.saveButton.disabled = true;
    return;
  }

  elements.resultValue.textContent = String(state.latestNumber);
  elements.resultNote.textContent = `Each draw is independent. Number ${state.latestNumber} can appear again on the very next tap.`;
  elements.saveButton.disabled = false;
}

function render() {
  elements.limitInput.value = String(state.limit);
  elements.drawCount.textContent = String(state.drawHistory.length);
  elements.savedCount.textContent = String(state.savedSamples.length);

  updateResultMessage();
  renderList(elements.savedList, elements.savedEmpty, state.savedSamples, "No.");
  renderList(elements.historyList, elements.historyEmpty, state.drawHistory, "No.");
}

function initializeState() {
  state.limit = loadStoredNumber(STORAGE_KEYS.limit, 34);
  state.latestNumber = Number.parseInt(localStorage.getItem(STORAGE_KEYS.latestNumber) || "", 10);
  state.latestNumber = Number.isInteger(state.latestNumber) && state.latestNumber > 0
    ? state.latestNumber
    : null;
  state.savedSamples = loadStoredList(STORAGE_KEYS.savedSamples);
  state.drawHistory = loadStoredList(STORAGE_KEYS.drawHistory);
}

function updateLimit(value) {
  const nextLimit = clampLimit(value);
  const hasChanged = nextLimit !== state.limit;

  state.limit = nextLimit;

  if (hasChanged) {
    state.latestNumber = null;
  }

  saveState();
  render();
}

function drawNumber() {
  state.latestNumber = getRandomNumber(state.limit);
  state.drawHistory.push({
    number: state.latestNumber,
    timestamp: new Date().toISOString(),
  });
  saveState();
  render();
}

function saveLatestNumber() {
  if (state.latestNumber === null) {
    return;
  }

  state.savedSamples.push({
    number: state.latestNumber,
    timestamp: new Date().toISOString(),
  });
  saveState();
  render();
}

function clearSavedSamples() {
  if (!state.savedSamples.length || !window.confirm("Clear all saved samples?")) {
    return;
  }

  state.savedSamples = [];
  saveState();
  render();
}

function clearDrawHistory() {
  if (!state.drawHistory.length || !window.confirm("Clear the generated number history?")) {
    return;
  }

  state.drawHistory = [];
  saveState();
  render();
}

elements.limitInput.addEventListener("change", (event) => {
  updateLimit(event.target.value);
});

elements.limitInput.addEventListener("blur", (event) => {
  updateLimit(event.target.value);
});

elements.drawButton.addEventListener("click", drawNumber);
elements.saveButton.addEventListener("click", saveLatestNumber);
elements.clearSavedButton.addEventListener("click", clearSavedSamples);
elements.clearHistoryButton.addEventListener("click", clearDrawHistory);

initializeState();
render();
