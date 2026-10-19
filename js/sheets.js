/**
 * Iron Log - Bottom Sheet Modals & User Interaction Logic
 */

var scrim = document.getElementById("scrim");
var detailSheet = document.getElementById("detailSheet");
var videoSheet = document.getElementById("videoSheet");
var addSheet = document.getElementById("addSheet");
var pickerSheet = document.getElementById("pickerSheet");

var currentEx = null;
var currentLogDate = todayStr();
var committedSets = [];
var stagingInputs = { w: "", r: "", t: "", s: "", g: "" };
var currentVideoEx = null;

var pickerDayIdx = null;
var isFreestylePick = false;
var selectedNewExCat = CATS[1];

/* ---------------- Sheet Open/Close Transitions ---------------- */
function openSheet(sheet) {
  if (!sheet) return;
  document.activeElement && document.activeElement.blur();

  if (scrim && sheet.id !== "videoSheet") {
    scrim.classList.add("open");
    scrim.style.opacity = "1";
    scrim.style.pointerEvents = "auto";
  }

  sheet.classList.add("open");
  sheet.style.transform = "translate3d(0,0,0)";
}

function closeSheets() {
  document.activeElement && document.activeElement.blur();

  var vs = document.getElementById("videoSheet");
  if (vs && vs.classList.contains("open")) {
    closeVideoSheet();
    if (
      detailSheet.classList.contains("open") ||
      pickerSheet.classList.contains("open")
    ) {
      return;
    }
  }

  if (scrim) {
    scrim.classList.remove("open");
    scrim.style.opacity = "0";
    scrim.style.pointerEvents = "none";
  }

  [detailSheet, addSheet, pickerSheet].forEach(function (s) {
    if (s) {
      s.classList.remove("open");
      s.style.transform = "translate3d(0,105%,0)";
    }
  });

  refreshViews();
}

scrim.addEventListener("click", closeSheets);
document.getElementById("detailClose").addEventListener("click", closeSheets);
document.getElementById("addClose").addEventListener("click", closeSheets);
document.getElementById("pickerClose").addEventListener("click", closeSheets);

/* ---------------- Detail Sheet & Set Logging ---------------- */
var unitToggle = document.getElementById("unitToggle");
Array.from(unitToggle.children).forEach(function (btn) {
  btn.addEventListener("click", function () {
    var oldUnit = state.unit;
    var newUnit = btn.getAttribute("data-unit");
    if (oldUnit === newUnit) return;

    state.unit = newUnit;
    committedSets.forEach(function (s) {
      if (s.w !== undefined && s.w !== "" && !isNaN(parseFloat(s.w))) {
        s.w = round1(fromKg(toKg(parseFloat(s.w), oldUnit), newUnit));
      }
    });
    if (stagingInputs.w !== "" && !isNaN(parseFloat(stagingInputs.w))) {
      stagingInputs.w = round1(fromKg(toKg(parseFloat(stagingInputs.w), oldUnit), newUnit));
    }
    if (state.profile.weight) {
      state.profile.weight = round1(fromKg(toKg(state.profile.weight, oldUnit), newUnit));
    }

    save();
    updateDrawerProfileUI();
    renderUnitToggle();
    renderSetsUI();
    renderPRBanner();
    syncCommittedToStorage();
    if (document.getElementById("viewSettings").classList.contains("active")) {
      renderSettingsView();
    }
  });
});

function renderUnitToggle() {
  Array.from(unitToggle.children).forEach(function (btn) {
    btn.classList.toggle("active", btn.getAttribute("data-unit") === state.unit);
  });
}

function openDetail(ex, targetDate) {
  currentEx = ex;
  currentLogDate = targetDate || todayStr();
  document.getElementById("detailName").textContent = ex.name;
  var isToday = currentLogDate === todayStr();
  document.getElementById("detailSub").textContent =
    ex.cat + " · " + (isToday ? "Today's Log" : "Logging for " + fmtDateShort(currentLogDate));

  var cardio = isCardio(currentEx);
  unitToggle.style.display = cardio ? "none" : "flex";
  renderUnitToggle();

  var arr = state.logs[ex.id];
  var targetSess = arr
    ? arr.find(function (s) {
        return s.date === currentLogDate;
      })
    : null;

  if (targetSess && targetSess.sets && targetSess.sets.length > 0) {
    if (cardio) {
      committedSets = targetSess.sets.map(function (s) {
        return { t: s.t, s: s.s, g: s.g, type: "cardio" };
      });
    } else {
      committedSets = targetSess.sets.map(function (s) {
        return { w: round1(fromKg(toKg(s.w, s.unit), state.unit)), r: s.r };
      });
    }
  } else {
    committedSets = [];
  }

  // Prefill staging with last logged values if available
  if (cardio) {
    var lastCardio = committedSets.length ? committedSets[committedSets.length - 1] : null;
    stagingInputs = {
      t: "",
      s: lastCardio && lastCardio.s !== undefined ? String(lastCardio.s) : "",
      g: lastCardio && lastCardio.g !== undefined ? String(lastCardio.g) : ""
    };
  } else {
    var lastWeight = committedSets.length ? committedSets[committedSets.length - 1].w : "";
    stagingInputs = { w: lastWeight !== "" ? String(lastWeight) : "", r: "" };
  }

  renderSetsUI();
  renderPRBanner();
  openSheet(detailSheet);
}

var setsWrap = document.getElementById("setsWrap");
var newSetFields = document.getElementById("newSetFields");
var newSetBoxTitle = document.getElementById("newSetBoxTitle");

function renderSetsUI() {
  var cardio = isCardio(currentEx);
  setsWrap.innerHTML = "";
  var priorBest = bestHistoricalWeightFor(currentEx.id, currentLogDate);

  committedSets.forEach(function (set, idx) {
    var row = document.createElement("div");
    row.className = "set-row";

    if (cardio) {
      row.style.gridTemplateColumns = "24px 1fr 1fr 1fr 28px";
      row.innerHTML =
        '<div class="set-idx">' +
        (idx + 1) +
        "</div>" +
        '<div class="set-field"><label>Time (min)</label><input type="number" min="0" inputmode="decimal" value="' +
        set.t +
        '" data-k="t"/></div>' +
        '<div class="set-field"><label>Speed</label><input type="number" min="0" inputmode="decimal" step="0.5" value="' +
        (set.s !== undefined ? set.s : "") +
        '" data-k="s"/></div>' +
        '<div class="set-field"><label>Grade (%)</label><input type="number" min="0" inputmode="decimal" step="0.5" value="' +
        (set.g !== undefined ? set.g : "") +
        '" data-k="g"/></div>' +
        '<button class="set-del">✕</button>';

      row.querySelector('[data-k="t"]').addEventListener("input", function (e) {
        set.t = e.target.value;
        syncCommittedToStorage();
      });
      row.querySelector('[data-k="s"]').addEventListener("input", function (e) {
        set.s = e.target.value;
        syncCommittedToStorage();
      });
      row.querySelector('[data-k="g"]').addEventListener("input", function (e) {
        set.g = e.target.value;
        syncCommittedToStorage();
      });
    } else {
      row.style.gridTemplateColumns = "24px 1fr 1fr 28px";
      var currentWKg = toKg(set.w, state.unit);
      var isPr =
        priorBest !== null &&
        set.w !== "" &&
        currentWKg > priorBest &&
        (parseFloat(set.w) || 0) > 0;
      if (isPr) row.classList.add("is-pr");

      row.innerHTML =
        '<div class="set-idx">' +
        (idx + 1) +
        "</div>" +
        '<div class="set-field"><label>Weight (' +
        state.unit +
        ')</label><input type="number" min="0" inputmode="decimal" step="0.5" value="' +
        set.w +
        '" data-k="w"/></div>' +
        '<div class="set-field"><label>Reps</label><input type="number" min="1" inputmode="numeric" value="' +
        set.r +
        '" data-k="r"/></div>' +
        '<button class="set-del">✕</button>';

      var wInput = row.querySelector('[data-k="w"]');
      var rInput = row.querySelector('[data-k="r"]');

      wInput.addEventListener("input", function () {
        set.w = wInput.value;
        var val = parseFloat(wInput.value) || 0;
        var nowPr =
          priorBest !== null &&
          wInput.value !== "" &&
          toKg(val, state.unit) > priorBest &&
          val > 0;
        row.classList.toggle("is-pr", nowPr);
        syncCommittedToStorage();
      });
      rInput.addEventListener("input", function () {
        set.r = rInput.value;
        syncCommittedToStorage();
      });
    }

    row.querySelector(".set-del").addEventListener("click", function () {
      committedSets.splice(idx, 1);
      syncCommittedToStorage();
      renderSetsUI();
      renderPRBanner();
    });
    setsWrap.appendChild(row);
  });

  newSetBoxTitle.textContent = "Log Set #" + (committedSets.length + 1);
  newSetFields.innerHTML = "";
  var stagingRow = document.createElement("div");
  stagingRow.className = "set-row";

  if (cardio) {
    stagingRow.style.gridTemplateColumns = "1fr 1fr 1fr";
    stagingRow.innerHTML =
      '<div class="set-field"><label>Time (min)*</label><input type="number" min="0" id="stageTime" inputmode="decimal" placeholder="15" value="' +
      stagingInputs.t +
      '"/></div>' +
      '<div class="set-field"><label>Speed (km/h)</label><input type="number" min="0" id="stageSpeed" inputmode="decimal" step="0.5" placeholder="0" value="' +
      stagingInputs.s +
      '"/></div>' +
      '<div class="set-field"><label>Grade (%)</label><input type="number" min="0" id="stageGrade" inputmode="decimal" step="0.5" placeholder="0" value="' +
      stagingInputs.g +
      '"/></div>';
    newSetFields.appendChild(stagingRow);
    document.getElementById("stageTime").addEventListener("input", function (e) {
      stagingInputs.t = e.target.value;
    });
    document.getElementById("stageSpeed").addEventListener("input", function (e) {
      stagingInputs.s = e.target.value;
    });
    document.getElementById("stageGrade").addEventListener("input", function (e) {
      stagingInputs.g = e.target.value;
    });
  } else {
    stagingRow.style.gridTemplateColumns = "1fr 1fr";
    stagingRow.innerHTML =
      '<div class="set-field"><label>Weight (' +
      state.unit +
      ')*</label><input type="number" min="0" id="stageWeight" inputmode="decimal" step="0.5" placeholder="60" value="' +
      stagingInputs.w +
      '"/></div>' +
      '<div class="set-field"><label>Reps*</label><input type="number" min="1" id="stageReps" inputmode="numeric" placeholder="10" value="' +
      stagingInputs.r +
      '"/></div>';
    newSetFields.appendChild(stagingRow);
    document.getElementById("stageWeight").addEventListener("input", function (e) {
      stagingInputs.w = e.target.value;
    });
    document.getElementById("stageReps").addEventListener("input", function (e) {
      stagingInputs.r = e.target.value;
    });
  }
}

document.getElementById("addSetBtn").addEventListener("click", function () {
  var cardio = isCardio(currentEx);

  if (cardio) {
    var tVal = parseFloat(stagingInputs.t);
    if (isNaN(tVal) || tVal <= 0) {
      var stT = document.getElementById("stageTime");
      if (stT) {
        stT.focus();
        stT.style.borderColor = "var(--danger)";
      }
      return;
    }
    var sVal = stagingInputs.s === "" ? 0 : parseFloat(stagingInputs.s) || 0;
    var gVal = stagingInputs.g === "" ? 0 : parseFloat(stagingInputs.g) || 0;
    committedSets.push({ t: tVal, s: sVal, g: gVal, type: "cardio" });
    stagingInputs = { t: "", s: String(sVal), g: String(gVal) };
  } else {
    var wVal = parseFloat(stagingInputs.w);
    var rVal = parseInt(stagingInputs.r, 10);
    if (isNaN(wVal) || wVal < 0 || isNaN(rVal) || rVal <= 0) {
      if (isNaN(wVal) || wVal < 0) {
        var stW = document.getElementById("stageWeight");
        if (stW) {
          stW.focus();
          stW.style.borderColor = "var(--danger)";
        }
      } else {
        var stR = document.getElementById("stageReps");
        if (stR) {
          stR.focus();
          stR.style.borderColor = "var(--danger)";
        }
      }
      return;
    }
    committedSets.push({ w: wVal, r: rVal });
    stagingInputs = { w: String(wVal), r: "" };
  }

  syncCommittedToStorage();
  renderSetsUI();
  renderPRBanner();
});

function syncCommittedToStorage() {
  var t = currentLogDate;
  var cardio = isCardio(currentEx);
  var validSets = [];

  if (cardio) {
    validSets = committedSets
      .filter(function (s) {
        return s.t !== "" && !isNaN(parseFloat(s.t)) && parseFloat(s.t) > 0;
      })
      .map(function (s) {
        return {
          t: parseFloat(s.t),
          s: s.s === "" ? 0 : parseFloat(s.s) || 0,
          g: s.g === "" ? 0 : parseFloat(s.g) || 0,
          type: "cardio"
        };
      });
  } else {
    validSets = committedSets
      .filter(function (s) {
        var wNum = parseFloat(s.w);
        var rNum = parseInt(s.r, 10);
        return (
          s.w !== "" &&
          s.r !== "" &&
          !isNaN(wNum) &&
          wNum >= 0 &&
          !isNaN(rNum) &&
          rNum > 0
        );
      })
      .map(function (s) {
        return { w: parseFloat(s.w), r: parseInt(s.r, 10), unit: state.unit };
      });
  }

  var arr = state.logs[currentEx.id] || (state.logs[currentEx.id] = []);
  var targetSess = arr.find(function (s) {
    return s.date === t;
  });

  if (!validSets.length) {
    if (targetSess) {
      arr.splice(arr.indexOf(targetSess), 1);
    }
  } else if (targetSess) {
    targetSess.sets = validSets;
  } else {
    arr.push({ date: t, sets: validSets });
  }

  arr.sort(function (a, b) {
    return a.date.localeCompare(b.date);
  });
  save();
  renderPRBanner();

  if (document.getElementById("viewToday").classList.contains("active")) {
    renderTodayView();
  }
  if (document.getElementById("viewPlan").classList.contains("active")) {
    renderPlanView();
  }
}

function renderPRBanner() {
  var cardio = isCardio(currentEx);
  var prBanner = document.getElementById("prBanner");

  if (cardio) {
    prBanner.style.display = "none";
  } else {
    var draftTop = committedSets
      .filter(function (s) {
        return s.w !== "" && !isNaN(parseFloat(s.w)) && parseFloat(s.w) > 0;
      })
      .reduce(function (a, b) {
        return a === null || toKg(b.w, state.unit) > toKg(a.w, state.unit) ? b : a;
      }, null);
    var priorBest = bestHistoricalWeightFor(currentEx.id, currentLogDate);

    if (draftTop && priorBest !== null && toKg(draftTop.w, state.unit) > priorBest) {
      prBanner.style.display = "flex";
      document.getElementById("prBannerText").textContent =
        "New personal record — " + round1(parseFloat(draftTop.w)) + " " + state.unit + "!";
    } else if (draftTop && priorBest === null && parseFloat(draftTop.w) > 0) {
      prBanner.style.display = "flex";
      document.getElementById("prBannerText").textContent =
        "First logged set for this exercise. Nice start!";
    } else {
      prBanner.style.display = "none";
    }
  }
}

/* ---------------- Video Player & YouTube Embed Logic ---------------- */
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  var match = url.match(regExp);
  return match && match[2] && match[2].length === 11
    ? "https://www.youtube-nocookie.com/embed/" + match[2] + "?rel=0&enablejsapi=1"
    : null;
}

function updateVideoPlayerState(embedUrl) {
  var iframe = document.getElementById("videoIframe");
  var placeholder = document.getElementById("videoPlaceholder");
  if (embedUrl) {
    if (iframe) {
      iframe.src = embedUrl;
      iframe.style.display = "block";
    }
    if (placeholder) placeholder.style.display = "none";
  } else {
    if (iframe) {
      iframe.src = "";
      iframe.style.display = "none";
    }
    if (placeholder) placeholder.style.display = "flex";
  }
}

function openVideoSheet(ex) {
  document.activeElement && document.activeElement.blur();
  currentVideoEx = ex;
  document.getElementById("videoExName").textContent = ex.name;

  var url = state.videoOverrides[ex.id] || DEFAULT_VIDEOS[ex.id] || "";
  document.getElementById("editVideoUrlInput").value = url;

  var embedUrl = getYouTubeEmbedUrl(url);
  updateVideoPlayerState(embedUrl);

  openSheet(document.getElementById("videoSheet"));
}

function closeVideoSheet() {
  var vs = document.getElementById("videoSheet");
  if (!vs) return;
  vs.classList.remove("open");
  vs.style.transform = "translate3d(0,105%,0)";

  var iframe = document.getElementById("videoIframe");
  if (iframe) iframe.src = "";

  if (
    detailSheet.classList.contains("open") ||
    pickerSheet.classList.contains("open")
  ) {
    return;
  }

  if (scrim) {
    scrim.classList.remove("open");
    scrim.style.opacity = "0";
    scrim.style.pointerEvents = "none";
  }
}

document.getElementById("saveVideoUrlBtn").onclick = function () {
  var newUrl = document.getElementById("editVideoUrlInput").value.trim();
  if (!state.videoOverrides) state.videoOverrides = {};
  state.videoOverrides[currentVideoEx.id] = newUrl;
  forceSave();

  var embedUrl = getYouTubeEmbedUrl(newUrl);
  updateVideoPlayerState(embedUrl);
};

document.getElementById("editVideoUrlInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("saveVideoUrlBtn").click();
  }
});

document.getElementById("videoClose").addEventListener("click", closeVideoSheet);

document.getElementById("watchFormBtn").onclick = function () {
  if (currentEx) openVideoSheet(currentEx);
};

/* ---------------- Day Exercise Picker Sheet ---------------- */
var pickerList = document.getElementById("pickerList");
var pickerSearch = document.getElementById("pickerSearch");

function openPicker(dayIdx, isFreestyle) {
  pickerDayIdx = dayIdx;
  isFreestylePick = !!isFreestyle;
  document.getElementById("pickerTitle").textContent = isFreestylePick
    ? "Log Extra / Freestyle Exercise"
    : "Add to " + DAY_NAMES_FULL[dayIdx];
  pickerSearch.value = "";
  renderPickerList("");
  openSheet(pickerSheet);
}

function renderPickerList(term) {
  var t = term.trim().toLowerCase();
  var items = allExercises().filter(function (ex) {
    return !t || ex.name.toLowerCase().indexOf(t) > -1;
  });
  pickerList.innerHTML = "";
  var current = state.weeklyPlan[pickerDayIdx] || [];

  items.forEach(function (ex) {
    var row = document.createElement("div");
    row.className = "picker-row";
    var on = current.indexOf(ex.id) > -1;

    row.innerHTML =
      "<div><div class=\"pname\">" +
      escapeHtml(ex.name) +
      '</div><div class="pcat">' +
      escapeHtml(ex.cat) +
      "</div></div>" +
      (isFreestylePick
        ? '<div style="font-size:13px; font-weight:800; color:var(--accent);">Select ›</div>'
        : '<div class="picker-check' + (on ? " on" : "") + '">✓</div>');

    row.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (isFreestylePick) {
        if (pickerSheet) {
          pickerSheet.classList.remove("open");
          pickerSheet.style.transform = "translate3d(0,105%,0)";
        }
        openDetail(ex, todayStr());
      } else {
        var arr =
          state.weeklyPlan[pickerDayIdx] || (state.weeklyPlan[pickerDayIdx] = []);
        var pos = arr.indexOf(ex.id);
        if (pos > -1) arr.splice(pos, 1);
        else arr.push(ex.id);
        forceSave();
        renderPickerList(pickerSearch.value);
        refreshViews();
      }
    });
    pickerList.appendChild(row);
  });
}

pickerSearch.addEventListener("input", function () {
  renderPickerList(pickerSearch.value);
});

/* ---------------- Add Custom Exercise Sheet ---------------- */
var addFab = document.getElementById("addExerciseFab");
var newExCatChips = document.getElementById("newExCatChips");

CATS.slice(1).forEach(function (c) {
  var chip = document.createElement("div");
  chip.className = "cat-chip" + (c === selectedNewExCat ? " active" : "");
  chip.textContent = c;
  chip.addEventListener("click", function () {
    selectedNewExCat = c;
    Array.from(newExCatChips.children).forEach(function (ch) {
      ch.classList.remove("active");
    });
    chip.classList.add("active");
  });
  newExCatChips.appendChild(chip);
});

addFab.addEventListener("click", function () {
  document.getElementById("newExName").value = "";
  selectedNewExCat = CATS[1];
  Array.from(newExCatChips.children).forEach(function (ch, idx) {
    ch.classList.toggle("active", idx === 0);
  });
  openSheet(addSheet);
});

function handleSaveNewExercise() {
  var name = document.getElementById("newExName").value.trim();
  if (!name) return;

  var exists = allExercises().some(function (e) {
    return e.name.toLowerCase() === name.toLowerCase();
  });
  if (exists) {
    alert("An exercise named '" + name + "' already exists.");
    return;
  }

  var id =
    "custom-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now();

  state.customExercises.push({ id: id, name: name, cat: selectedNewExCat });
  invalidateExCache();
  forceSave();
  closeSheets();
  refreshViews();
}

document.getElementById("saveNewEx").addEventListener("click", handleSaveNewExercise);

document.getElementById("newExName").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSaveNewExercise();
  }
});

/* ---------------- Touch & Pointer Drag for Sheets ---------------- */
function setupSheetDrag(sheetEl, dragHandles) {
  var startY = 0,
    currentDelta = 0,
    isDragging = false;

  function start(y) {
    isDragging = true;
    currentDelta = 0;
    startY = y;
    sheetEl.style.transition = "none";
  }

  function move(y) {
    if (!isDragging) return;
    currentDelta = Math.max(0, y - startY);
    sheetEl.style.transform = "translate3d(0," + currentDelta + "px,0)";
  }

  function end() {
    if (!isDragging) return;
    isDragging = false;
    sheetEl.style.transition = "transform .28s cubic-bezier(.32,.72,0,1)";
    if (currentDelta > 100) {
      if (sheetEl.id === "videoSheet") {
        closeVideoSheet();
      } else {
        closeSheets();
      }
    } else {
      sheetEl.style.transform = "translate3d(0,0,0)";
    }
  }

  dragHandles.forEach(function (h) {
    if (!h) return;
    h.addEventListener(
      "touchstart",
      function (e) {
        var tag = (e.target.tagName || "").toLowerCase();
        if (tag === "button" || tag === "input" || tag === "select") return;
        start(e.touches[0].clientY);
      },
      { passive: true }
    );

    h.addEventListener(
      "touchmove",
      function (e) {
        if (!isDragging) return;
        move(e.touches[0].clientY);
        if (e.cancelable && currentDelta > 5) e.preventDefault();
      },
      { passive: false }
    );

    h.addEventListener("touchend", end);
    h.addEventListener("touchcancel", end);

    h.addEventListener("mousedown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "button" || tag === "input" || tag === "select") return;
      start(e.clientY);
      function onMouseMove(ev) {
        move(ev.clientY);
      }
      function onMouseUp() {
        end();
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  });
}

[detailSheet, addSheet, pickerSheet, videoSheet].forEach(function (sheetEl) {
  if (!sheetEl) return;
  var handle = sheetEl.querySelector(".sheet-handle");
  var head = sheetEl.querySelector(".sheet-head");
  setupSheetDrag(sheetEl, [handle, head]);
});
