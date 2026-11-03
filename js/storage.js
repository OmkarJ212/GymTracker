/**
 * Iron Log - State Management, Storage & Helpers
 */

function applyTheme(themeId) {
  if (typeof THEMES === "undefined" || !THEMES[themeId]) {
    themeId = typeof DEFAULT_THEME !== "undefined" ? DEFAULT_THEME : "nike-volt";
  }
  try {
    localStorage.setItem("ironlog.theme", themeId);
  } catch (e) {}
  document.documentElement.setAttribute("data-theme", themeId);
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme && typeof THEMES !== "undefined" && THEMES[themeId]) {
    metaTheme.setAttribute("content", THEMES[themeId].metaColor);
  }
  var quickBtn = document.getElementById("themeQuickBtn");
  if (quickBtn && typeof THEMES !== "undefined" && THEMES[themeId]) {
    var isLight = THEMES[themeId].type === "light";
    var sunSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    var moonSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    quickBtn.innerHTML = isLight ? moonSvg : sunSvg;
    quickBtn.setAttribute("title", isLight ? "Switch to Dark Mode" : "Switch to Light Mode");
  }
}

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
    videoOverrides: {},
    theme: typeof DEFAULT_THEME !== "undefined" ? DEFAULT_THEME : "nike-volt"
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
if (state.theme === "titanium-slate" || !state.theme || (typeof THEMES !== "undefined" && !THEMES[state.theme])) {
  state.theme = typeof DEFAULT_THEME !== "undefined" ? DEFAULT_THEME : "nike-volt";
  try {
    localStorage.setItem("ironlog.theme", state.theme);
  } catch (e) {}
}

applyTheme(state.theme);

var saveTimer = null;
function save() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      if (state.theme) localStorage.setItem("ironlog.theme", state.theme);
    } catch (e) {}
  }, 400);
}

function forceSave() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    if (state.theme) localStorage.setItem("ironlog.theme", state.theme);
  } catch (e) {}
}

var cachedAllExercises = null;
var cachedExMap = null;

function invalidateExCache() {
  cachedAllExercises = null;
  cachedExMap = null;
  invalidatePrMemo();
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

function debounce(fn, delay) {
  var timer = null;
  return function () {
    var ctx = this;
    var args = arguments;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(ctx, args);
    }, delay);
  };
}

var SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDateShort(str) {
  if (!str) return "";
  var parts = str.split("-");
  if (parts.length === 3) {
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    if (m >= 1 && m <= 12 && !isNaN(d)) {
      return SHORT_MONTHS[m - 1] + " " + d;
    }
  }
  var dateObj = new Date(str + "T00:00:00");
  return dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

var prMemoCache = {};

function invalidatePrMemo(id) {
  if (id) {
    delete prMemoCache[id];
  } else {
    prMemoCache = {};
  }
}

function bestHistoricalWeightFor(id, targetDate) {
  var arr = state.logs[id];
  if (!arr || !arr.length) return null;
  var target = targetDate || todayStr();
  
  if (prMemoCache[id] && prMemoCache[id][target] !== undefined) {
    return prMemoCache[id][target];
  }

  var best = null;
  for (var i = 0; i < arr.length; i++) {
    var sess = arr[i];
    if (sess && sess.date !== target && sess.sets) {
      for (var j = 0; j < sess.sets.length; j++) {
        var s = sess.sets[j];
        var wKg = toKg(s.w, s.unit);
        if (best === null || wKg > best) best = wKg;
      }
    }
  }

  if (!prMemoCache[id]) prMemoCache[id] = {};
  prMemoCache[id][target] = best;
  return best;
}
