/**
 * Iron Log - App Core Entry, Navigation & Initialization
 */

(function () {
  "use strict";

  /* ---------------- Service Worker Registration ---------------- */
  if (
    "serviceWorker" in navigator &&
    (window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function (err) {});
    });
  }

  /* ---------------- Date Header Display ---------------- */
  var todayHeaderLabel = document.getElementById("todayLabel");
  if (todayHeaderLabel) {
    todayHeaderLabel.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }

  /* ---------------- Navigation ---------------- */
  function switchView(targetId) {
    if (!targetId) return;

    document.querySelectorAll(".dock-tab").forEach(function (tab) {
      if (tab.getAttribute("data-target") === targetId) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    var headerProfileBtn = document.getElementById("headerProfileBtn");
    if (headerProfileBtn) {
      headerProfileBtn.classList.toggle("active", targetId === "viewSettings");
    }

    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.remove("active");
    });
    var targetEl = document.getElementById(targetId);
    if (targetEl) targetEl.classList.add("active");

    if (targetId === "viewToday") renderTodayView();
    if (targetId === "viewPlan") renderPlanView();
    if (targetId === "viewAnalytics") renderAnalyticsView();
    if (targetId === "viewPR") renderPRView();
    if (targetId === "viewLibrary") renderLibraryView();
    if (targetId === "viewSettings") renderSettingsView();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.switchToView = switchView;

  document.addEventListener("click", function (e) {
    var tab = e.target.closest(".dock-tab, #headerProfileBtn, [data-target]");
    if (tab && tab.getAttribute("data-target")) {
      switchView(tab.getAttribute("data-target"));
    }
  });

  window.updateDrawerProfileUI = function () {
    // Legacy stub for views.js calls
  };

  /* ---------------- Global Keyboard Shortcuts ---------------- */
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.keyCode === 27) {
      var vs = document.getElementById("videoSheet");
      if (vs && vs.classList.contains("open")) {
        closeVideoSheet();
      } else if (drawer && drawer.classList.contains("open")) {
        closeDrawer();
      } else {
        closeSheets();
      }
    }
  });

  /* ---------------- Application Initialization ---------------- */
  renderTodayView();
})();
