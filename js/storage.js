/**
 * Iron Log - State Management, Storage & Helpers
 */

function loadState() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    profile: { name: "", weight: "" },
    customExercises: [],
    unit: "kg",
    logs: {},
    weeklyPlan: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    dayLabels: { 0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" },
    videoOverrides: {}
  };
}

var state = loadState();
if (!state.customExercises || !Array.isArray(state.customExercises)) state.customExercises = [];
if (!state.logs || typeof state.logs !== "object") state.logs = {};
if (!state.weeklyPlan) state.weeklyPlan = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
if (!state.dayLabels) state.dayLabels = { 0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" };
if (!state.profile) state.profile = { name: "", weight: "" };
if (!state.videoOverrides) state.videoOverrides = {};
if (!state.unit) state.unit = "kg";

var saveTimer = null;
function save() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {}
  }, 400);
}

function forceSave() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {}
}

var cachedAllExercises = null;
var cachedExMap = null;

function invalidateExCache() {
  cachedAllExercises = null;
  cachedExMap = null;
}

function allExercises() {
  if (!cachedAllExercises) {
    cachedAllExercises = DEFAULT_EXERCISES.concat(state.customExercises || []);
  }
  return cachedAllExercises;
}

function exById(id) {
  if (!cachedExMap) {
    cachedExMap = {};
    var list = allExercises();
    for (var i = 0; i < list.length; i++) {
      if (list[i]) cachedExMap[list[i].id] = list[i];
    }
  }
  return cachedExMap[id];
}

function isCardio(ex) {
  return ex && ex.cat === "Cardio";
}

function todayStr() {
  var d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/**
 * Calculates calendar date YYYY-MM-DD for a given day-of-week index (0=Sun..6=Sat)
 * aligned with the current Monday-first workout week (Mon..Sun).
 */
function getDateForDayIndex(targetDayIdx) {
  var now = new Date();
  var currentDay = now.getDay();
  var currentMondayBased = currentDay === 0 ? 6 : currentDay - 1;
  var targetMondayBased = targetDayIdx === 0 ? 6 : targetDayIdx - 1;
  var diff = targetMondayBased - currentMondayBased;
  var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function fmtDateShort(str) {
  var d = new Date(str + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getStartOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toKg(w, unit) {
  return unit === "lb" ? (parseFloat(w) || 0) * 0.453592 : parseFloat(w) || 0;
}

function fromKg(wKg, unit) {
  return unit === "lb" ? (parseFloat(wKg) || 0) / 0.453592 : parseFloat(wKg) || 0;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function bestHistoricalWeightFor(id, targetDate) {
  var arr = state.logs[id];
  if (!arr) return null;
  var best = null;
  var target = targetDate || todayStr();
  arr
    .filter(function (s) {
      return s.date !== target;
    })
    .forEach(function (sess) {
      sess.sets.forEach(function (s) {
        var wKg = toKg(s.w, s.unit);
        if (best === null || wKg > best) best = wKg;
      });
    });
  return best;
}
