/**
 * Iron Log - View Renderers (Today, Weekly Plan, Analytics, PRs, Library, Settings)
 */

/* ---------------- Today's Session View ---------------- */
function renderTodayView() {
  var todayIdx = new Date().getDay();
  var planIds = state.weeklyPlan[todayIdx] || [];
  var tStr = todayStr();
  var label = state.dayLabels[todayIdx] ? " — " + state.dayLabels[todayIdx] : "";

  var todayTitleLabel = document.getElementById("todayTitleLabel");
  if (todayTitleLabel) {
    todayTitleLabel.textContent = "Scheduled for " + DAY_NAMES_FULL[todayIdx] + label;
  }

  var extraIds = [];
  Object.keys(state.logs).forEach(function (exId) {
    if (planIds.indexOf(exId) === -1 && extraIds.indexOf(exId) === -1) {
      var arr = state.logs[exId] || [];
      var hasTodayLog = arr.some(function (sess) {
        return sess.date === tStr && sess.sets && sess.sets.length > 0;
      });
      if (hasTodayLog) extraIds.push(exId);
    }
  });

  var allTodayIds = planIds.concat(extraIds);
  // Filter only valid existing exercises to prevent orphaned custom exercises from breaking totalCount
  var validTodayIds = allTodayIds.filter(function (id) {
    return !!exById(id);
  });

  var completedCount = 0;
  var listEl = document.getElementById("todayExerciseList");
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!validTodayIds.length) {
    listEl.innerHTML =
      '<div class="empty-state" style="padding:36px 10px;">' +
      "Rest Day — Nothing scheduled in your routine.<br>" +
      "Use the button below to log an extra or freestyle workout." +
      "</div>";
  } else {
    validTodayIds.forEach(function (id) {
      var ex = exById(id);
      if (!ex) return;

      var isExtra = planIds.indexOf(id) === -1;
      var arr = state.logs[ex.id] || [];
      var sess = arr.find(function (s) {
        return s.date === tStr;
      });
      var hasLogged = sess && sess.sets && sess.sets.length > 0;
      if (hasLogged) completedCount++;

      var card = document.createElement("div");
      card.className = "today-ex-card";
      card.setAttribute("data-exid", ex.id);

      var categoryBadge =
        escapeHtml(ex.cat) +
        (isExtra
          ? ' · <span style="color:var(--accent);">Freestyle</span>'
          : " · Scheduled");

      var cardHtml =
        '<div class="today-ex-head">' +
        "<div>" +
        '<div class="today-ex-name">' +
        escapeHtml(ex.name) +
        "</div>" +
        '<div class="today-ex-cat">' +
        categoryBadge +
        "</div>" +
        "</div>" +
        "<div>" +
        (hasLogged
          ? '<span class="badge badge-done">✓ ' + sess.sets.length + " Sets Done</span>"
          : '<span class="badge badge-pending">Tap to Log</span>') +
        "</div>" +
        "</div>";

      if (hasLogged) {
        cardHtml += '<table class="inline-table">';
        sess.sets.forEach(function (s, idx) {
          var setDesc = "";
          if (isCardio(ex)) {
            setDesc = s.t + " mins";
            if (s.s > 0) setDesc += " @" + s.s + " km/h";
            if (s.g !== undefined && s.g !== "") setDesc += " (" + s.g + "% grade)";
          } else {
            var wKg = toKg(s.w, s.unit);
            setDesc =
              round1(fromKg(wKg, state.unit)) +
              " " +
              state.unit +
              " × " +
              s.r +
              " reps";
          }
          cardHtml +=
            '<tr><td class="s-idx">Set ' +
            (idx + 1) +
            '</td><td class="s-val">' +
            setDesc +
            "</td></tr>";
        });
        cardHtml += "</table>";
      }

      card.innerHTML = cardHtml;
      listEl.appendChild(card);
    });
  }

  var totalCount = validTodayIds.length;
  document.getElementById("todayProgressText").innerHTML =
    completedCount + " <span>/ " + totalCount + " Done</span>";
  var pct =
    totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : completedCount > 0
      ? 100
      : 0;
  document.getElementById("todayProgressFill").style.width = pct + "%";
}

var todayListWrap = document.getElementById("todayExerciseList");
todayListWrap.addEventListener("click", function (e) {
  var card = e.target.closest(".today-ex-card");
  if (!card) return;
  var exId = card.getAttribute("data-exid");
  var ex = exById(exId);
  if (ex) {
    openDetail(ex, todayStr());
  }
});

var freestyleBtn = document.getElementById("freestyleBtn");
if (freestyleBtn) {
  freestyleBtn.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    openPicker(new Date().getDay(), true);
  };
}

/* ---------------- Weekly Plan View ---------------- */
function renderPlanView() {
  var planView = document.getElementById("viewPlan");
  var todayIdx = new Date().getDay();
  planView.innerHTML = "";

  PLAN_DAY_ORDER.forEach(function (dayIdx) {
    var card = document.createElement("div");
    card.className = "day-card" + (dayIdx === todayIdx ? " is-today" : "");

    var dateStr = getDateForDayIndex(dayIdx);
    var head = document.createElement("div");
    head.className = "day-card-head";
    head.innerHTML =
      '<div class="day-name">' +
      DAY_NAMES_FULL[dayIdx] +
      ' <span style="font-size:12px; font-weight:600; color:var(--text-dim);">(' +
      fmtDateShort(dateStr) +
      ")</span>" +
      (dayIdx === todayIdx ? '<span class="today-dot"></span>' : "") +
      "</div>";

    var labelInput = document.createElement("input");
    labelInput.className = "day-label-input";
    labelInput.placeholder = "e.g. Push day";
    labelInput.value = state.dayLabels[dayIdx] || "";
    labelInput.addEventListener("input", function () {
      state.dayLabels[dayIdx] = labelInput.value;
      save();
    });
    head.appendChild(labelInput);
    card.appendChild(head);

    var ids = state.weeklyPlan[dayIdx] || [];
    // Clean up any deleted exercise IDs
    var validIds = ids.filter(function (id) {
      return !!exById(id);
    });

    if (validIds.length) {
      var chipsWrap2 = document.createElement("div");
      chipsWrap2.className = "day-chips";
      var tableRows = [];

      validIds.forEach(function (id) {
        var ex = exById(id);
        if (!ex) return;

        var chip = document.createElement("div");
        chip.className = "day-chip";

        var nameSpan = document.createElement("span");
        nameSpan.className = "day-chip-name";
        nameSpan.textContent = ex.name;
        chip.appendChild(nameSpan);

        var rm = document.createElement("button");
        rm.className = "day-chip-del";
        rm.textContent = "✕";
        rm.addEventListener("click", function (e) {
          e.stopPropagation();
          state.weeklyPlan[dayIdx] = state.weeklyPlan[dayIdx].filter(function (x) {
            return x !== id;
          });
          forceSave();
          refreshViews();
        });
        chip.appendChild(rm);

        chip.addEventListener("click", function () {
          openDetail(ex, dateStr);
        });
        chipsWrap2.appendChild(chip);

        var arr = state.logs[ex.id] || [];
        var daySession = arr.find(function (s) {
          return s.date === dateStr;
        });
        if (daySession && daySession.sets && daySession.sets.length > 0) {
          var setsSummary = [];
          var topSetKg = 0;
          var topSetDisp = "";

          if (isCardio(ex)) {
            var maxT = 0;
            daySession.sets.forEach(function (s) {
              var desc = s.t + "m";
              if (s.s > 0) desc += " @" + s.s + "km/h";
              if (s.g > 0) desc += " " + s.g + "%";
              setsSummary.push(desc);
              if (s.t >= maxT) {
                maxT = s.t;
                topSetDisp = desc;
              }
            });
          } else {
            daySession.sets.forEach(function (s) {
              var wKg = toKg(s.w, s.unit);
              var curDisp = round1(fromKg(wKg, state.unit));
              setsSummary.push(curDisp + "×" + s.r);
              if (wKg >= topSetKg) {
                topSetKg = wKg;
                topSetDisp = curDisp + " " + state.unit + " × " + s.r;
              }
            });
          }

          tableRows.push({
            name: ex.name,
            setsCount: daySession.sets.length,
            setsSummary: setsSummary.join(", "),
            top: topSetDisp
          });
        }
      });
      card.appendChild(chipsWrap2);

      if (tableRows.length > 0) {
        var tableWrap = document.createElement("div");
        tableWrap.className = "day-table-wrap";
        var tHtml =
          '<table class="log-table">' +
          "<thead><tr><th>Exercise</th><th>Sets</th><th>Logged Data</th><th>Top Set</th></tr></thead>" +
          "<tbody>";
        tableRows.forEach(function (r) {
          tHtml +=
            '<tr><td class="col-ex">' +
            escapeHtml(r.name) +
            "</td><td>" +
            r.setsCount +
            '</td><td class="col-sets">' +
            r.setsSummary +
            '</td><td class="col-top">' +
            r.top +
            "</td></tr>";
        });
        tHtml += "</tbody></table>";
        tableWrap.innerHTML = tHtml;
        card.appendChild(tableWrap);
      }
    } else {
      var empty = document.createElement("div");
      empty.className = "day-empty";
      empty.textContent = "Rest day — nothing scheduled yet.";
      card.appendChild(empty);
    }

    var addBtn = document.createElement("button");
    addBtn.className = "day-add-btn";
    addBtn.textContent = "+ Add exercise";
    addBtn.addEventListener("click", function () {
      openPicker(dayIdx);
    });
    card.appendChild(addBtn);

    planView.appendChild(card);
  });
}

/* ---------------- Analytics View ---------------- */
function renderAnalyticsView() {
  var now = new Date();
  var todayStart = getStartOfDay(now);
  var currentWeekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

  var weeklyTonnage = 0;
  var max1RM = 0;
  var weeklyVols = [0, 0, 0, 0];

  Object.keys(state.logs).forEach(function (exId) {
    var ex = exById(exId);
    if (isCardio(ex)) return;

    state.logs[exId].forEach(function (sess) {
      var sessDate = new Date(sess.date + "T00:00:00");
      var daysDiff = Math.round((todayStart - sessDate) / (1000 * 60 * 60 * 24));

      sess.sets.forEach(function (set) {
        var wKg = toKg(set.w, set.unit);
        var r = parseInt(set.r, 10) || 0;
        var vol = wKg * r;

        if (daysDiff >= 0 && daysDiff < 28) {
          var bucket = 3 - Math.floor(daysDiff / 7);
          if (bucket >= 0 && bucket <= 3) {
            weeklyVols[bucket] += vol;
          }
        }

        if (sessDate >= currentWeekStart) {
          weeklyTonnage += vol;
        }

        // Est 1RM using exact Epley formula (for r=1, 1RM=w) across all history
        if (wKg > 0 && r > 0) {
          var e1RM = r === 1 ? wKg : wKg * (1 + r / 30);
          if (e1RM > max1RM) max1RM = e1RM;
        }
      });
    });
  });

  document.getElementById("analyticsTonnage").textContent =
    round1(fromKg(weeklyTonnage, state.unit)) + " " + state.unit;
  document.getElementById("analytics1RM").textContent =
    round1(fromKg(max1RM, state.unit)) + " " + state.unit;

  var chartEl = document.getElementById("volumeTrendChart");
  var maxVol = Math.max.apply(null, weeklyVols.concat([1]));
  var barsHtml = weeklyVols
    .map(function (vol, idx) {
      var h = Math.max(10, Math.round((vol / maxVol) * 65));
      var isCurrent = idx === 3;
      var lbl = isCurrent ? "This Wk" : "Wk -" + (3 - idx);
      return (
        '<div class="trend-bar-wrap"><div class="trend-bar ' +
        (isCurrent ? "current" : "") +
        '" style="height:' +
        h +
        'px"></div><div class="trend-lbl">' +
        lbl +
        "</div></div>"
      );
    })
    .join("");
  chartEl.innerHTML = barsHtml;
}

/* ---------------- Personal Records View ---------------- */
var prSearchTerm = "";
document.getElementById("prSearch").addEventListener("input", function (e) {
  prSearchTerm = e.target.value.trim().toLowerCase();
  renderPRView();
});

function renderPRView() {
  var prs = [];
  var bwKg = toKg(state.profile.weight || 0, state.unit);

  Object.keys(state.logs).forEach(function (exId) {
    var ex = exById(exId);
    if (!ex) return;
    var arr = state.logs[exId];
    if (!arr || arr.length === 0) return;

    if (isCardio(ex)) {
      var maxT = 0;
      var maxSpeed = 0;
      arr.forEach(function (sess) {
        sess.sets.forEach(function (s) {
          if ((s.t || 0) > maxT) {
            maxT = s.t;
            maxSpeed = s.s || 0;
          }
        });
      });
      if (maxT > 0) {
        var cardioDisp = maxT + " mins" + (maxSpeed > 0 ? " @" + maxSpeed + " km/h" : "");
        prs.push({ ex: ex, val: maxT, disp: cardioDisp, bwDisp: "" });
      }
    } else {
      var maxWKg = 0;
      var topRepsAtMaxW = 0;
      var maxRepsBodyweight = 0;

      arr.forEach(function (sess) {
        sess.sets.forEach(function (s) {
          var wKg = toKg(s.w, s.unit);
          var r = parseInt(s.r, 10) || 0;
          if (wKg > maxWKg) {
            maxWKg = wKg;
            topRepsAtMaxW = r;
          } else if (wKg === maxWKg && r > topRepsAtMaxW) {
            topRepsAtMaxW = r;
          }
          if (wKg === 0 && r > maxRepsBodyweight) {
            maxRepsBodyweight = r;
          }
        });
      });

      if (maxWKg > 0) {
        var bwRatio = bwKg > 0 ? (maxWKg / bwKg).toFixed(2) + "x BW" : "";
        var weightStr = round1(fromKg(maxWKg, state.unit)) + " " + state.unit;
        if (topRepsAtMaxW > 0) weightStr += " × " + topRepsAtMaxW + " reps";

        prs.push({
          ex: ex,
          val: maxWKg,
          disp: weightStr,
          bwDisp: bwRatio
        });
      } else if (maxRepsBodyweight > 0) {
        prs.push({
          ex: ex,
          val: maxRepsBodyweight,
          disp: maxRepsBodyweight + " reps",
          bwDisp: "Bodyweight"
        });
      }
    }
  });

  var filtered = prs.filter(function (pr) {
    return !prSearchTerm || pr.ex.name.toLowerCase().indexOf(prSearchTerm) > -1;
  });
  var listEl = document.getElementById("prListWrap");
  listEl.innerHTML = "";

  if (!filtered.length) {
    listEl.innerHTML = '<div class="empty-state">No records found. Keep pushing!</div>';
    return;
  }

  filtered.forEach(function (pr) {
    var div = document.createElement("div");
    div.className = "pr-card";
    var bwHtml = pr.bwDisp ? '<div class="pr-bw">' + pr.bwDisp + "</div>" : "";
    div.innerHTML =
      '<div class="pr-details"><h4>' +
      escapeHtml(pr.ex.name) +
      "</h4><p>" +
      escapeHtml(pr.ex.cat) +
      '</p></div><div><div class="pr-value">' +
      pr.disp +
      "</div>" +
      bwHtml +
      "</div>";

    div.addEventListener("click", function () {
      openDetail(pr.ex, todayStr());
    });
    listEl.appendChild(div);
  });
}

/* ---------------- Exercise Library View ---------------- */
var libActiveCat = "All";
var libSearchTerm = "";
var libChipsWrap = document.getElementById("libChips");

CATS.forEach(function (c) {
  var el = document.createElement("div");
  el.className = "chip" + (c === libActiveCat ? " active" : "");
  el.textContent = c;
  el.addEventListener("click", function () {
    libActiveCat = c;
    Array.from(libChipsWrap.children).forEach(function (ch) {
      ch.classList.remove("active");
    });
    el.classList.add("active");
    renderLibraryView();
  });
  libChipsWrap.appendChild(el);
});

document.getElementById("libSearch").addEventListener("input", function (e) {
  libSearchTerm = e.target.value.trim().toLowerCase();
  renderLibraryView();
});

function renderLibraryView() {
  var items = allExercises().filter(function (ex) {
    var catOk = libActiveCat === "All" || ex.cat === libActiveCat;
    var searchOk = !libSearchTerm || ex.name.toLowerCase().indexOf(libSearchTerm) > -1;
    return catOk && searchOk;
  });
  var libListWrap = document.getElementById("libListWrap");
  libListWrap.innerHTML = "";
  if (!items.length) {
    libListWrap.innerHTML =
      '<div class="empty-state"><div class="big">🏋️</div>No exercises found.<br>Try adding a custom one.</div>';
    return;
  }
  var byCat = {};
  items.forEach(function (ex) {
    (byCat[ex.cat] = byCat[ex.cat] || []).push(ex);
  });
  var order = libActiveCat === "All" ? CATS.slice(1) : [libActiveCat];

  order.forEach(function (cat) {
    var arr = byCat[cat];
    if (!arr || !arr.length) return;
    var label = document.createElement("div");
    label.className = "group-label";
    label.textContent = cat;
    libListWrap.appendChild(label);

    arr.forEach(function (ex) {
      var card = document.createElement("div");
      card.className = "ex-card";
      var actionHtml = '<div class="ex-actions">';
      actionHtml +=
        '<button class="btn-watch-lib" title="Watch Form Tutorial">🎬</button>';
      if (ex.id.indexOf("custom-") === 0) {
        actionHtml +=
          '<button class="del-custom" data-id="' + ex.id + '" title="Delete">🗑</button>';
      }
      actionHtml += "</div>";

      card.innerHTML =
        '<div class="ex-info"><div class="ex-name">' +
        escapeHtml(ex.name) +
        '</div><div class="ex-meta"><span>' +
        escapeHtml(ex.cat) +
        "</span></div></div>" +
        actionHtml;

      card.addEventListener("click", function (e) {
        if (e.target.closest(".del-custom")) {
          e.stopPropagation();
          if (confirm("Delete custom exercise '" + ex.name + "'?")) {
            state.customExercises = state.customExercises.filter(function (c) {
              return c.id !== ex.id;
            });
            // Clean up from weeklyPlan
            Object.keys(state.weeklyPlan).forEach(function (day) {
              state.weeklyPlan[day] = (state.weeklyPlan[day] || []).filter(function (x) {
                return x !== ex.id;
              });
            });
            invalidateExCache();
            forceSave();
            refreshViews();
          }
          return;
        }

        if (e.target.closest(".btn-watch-lib")) {
          e.stopPropagation();
          openVideoSheet(ex);
          return;
        }

        // Tapping card opens exercise detail/history
        openDetail(ex, todayStr());
      });

      libListWrap.appendChild(card);
    });
  });
}

/* ---------------- Profile & Settings View ---------------- */
var profileNameInput = document.getElementById("profileName");
var profileWeightInput = document.getElementById("profileWeight");
var settingsUnitToggle = document.getElementById("settingsUnitToggle");

function renderSettingsView() {
  document.getElementById("profileUnitLbl").textContent = state.unit;
  profileNameInput.value = state.profile.name || "";
  profileWeightInput.value = state.profile.weight || "";

  if (settingsUnitToggle) {
    Array.from(settingsUnitToggle.children).forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-unit") === state.unit);
    });
  }
}

profileNameInput.addEventListener("input", function (e) {
  state.profile.name = e.target.value.trim();
  save();
  updateDrawerProfileUI();
});

profileWeightInput.addEventListener("input", function (e) {
  state.profile.weight = parseFloat(e.target.value) || 0;
  save();
  updateDrawerProfileUI();
});

if (settingsUnitToggle) {
  Array.from(settingsUnitToggle.children).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var oldUnit = state.unit;
      var newUnit = btn.getAttribute("data-unit");
      if (oldUnit === newUnit) return;

      state.unit = newUnit;
      if (state.profile.weight) {
        state.profile.weight = round1(fromKg(toKg(state.profile.weight, oldUnit), newUnit));
      }
      save();
      updateDrawerProfileUI();
      renderUnitToggle();
      renderSettingsView();
      refreshViews();
    });
  });
}

document.getElementById("exportDataBtn").addEventListener("click", function () {
  var dataBlob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json"
  });
  var blobUrl = URL.createObjectURL(dataBlob);
  var dlNode = document.createElement("a");
  dlNode.setAttribute("href", blobUrl);
  dlNode.setAttribute("download", "ironlog_backup_" + todayStr() + ".json");
  document.body.appendChild(dlNode);
  dlNode.click();
  dlNode.remove();
  URL.revokeObjectURL(blobUrl);
});

document.getElementById("importDataInput").addEventListener("change", function (e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (evt) {
    try {
      var importedState = JSON.parse(evt.target.result);
      if (importedState && importedState.logs) {
        state = importedState;
        if (!state.customExercises || !Array.isArray(state.customExercises))
          state.customExercises = [];
        if (!state.logs || typeof state.logs !== "object") state.logs = {};
        if (!state.weeklyPlan) state.weeklyPlan = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        if (!state.dayLabels) state.dayLabels = { 0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" };
        if (!state.profile) state.profile = { name: "", weight: "" };
        if (!state.videoOverrides) state.videoOverrides = {};
        if (!state.unit) state.unit = "kg";

        invalidateExCache();
        forceSave();
        alert("Data successfully imported!");
        location.reload();
      } else {
        alert("Invalid backup file format.");
      }
    } catch (err) {
      alert("Error parsing backup file.");
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
});

/* ---------------- Refresh All Active Views ---------------- */
function refreshViews() {
  renderTodayView();
  if (document.getElementById("viewPlan").classList.contains("active")) renderPlanView();
  if (document.getElementById("viewAnalytics").classList.contains("active")) renderAnalyticsView();
  if (document.getElementById("viewPR").classList.contains("active")) renderPRView();
  if (document.getElementById("viewLibrary").classList.contains("active")) renderLibraryView();
  if (document.getElementById("viewSettings").classList.contains("active")) renderSettingsView();
}
