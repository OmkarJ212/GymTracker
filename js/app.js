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

  /* ---------------- Drawer Navigation ---------------- */
  var menuBtn = document.getElementById("menuBtn");
  var drawer = document.getElementById("mainDrawer");
  var drawerScrim = document.getElementById("drawerScrim");
  var navItems = document.querySelectorAll(".nav-item");

  window.updateDrawerProfileUI = function () {
    document.getElementById("drawerProfileName").textContent =
      state.profile.name || "User";
    document.getElementById("drawerProfileWeight").textContent =
      state.profile.weight ? state.profile.weight + " " + state.unit : "—";
  };
  updateDrawerProfileUI();

  document
    .getElementById("drawerHeaderProfile")
    .addEventListener("click", function () {
      document.querySelector('.nav-item[data-target="viewSettings"]').click();
    });

  function closeDrawer() {
    if (drawer) drawer.classList.remove("open");
    if (drawerScrim) drawerScrim.classList.remove("open");
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      if (drawer) drawer.classList.add("open");
      if (drawerScrim) drawerScrim.classList.add("open");
    });
  }

  if (drawerScrim) {
    drawerScrim.addEventListener("click", closeDrawer);
  }

  function switchView(targetId) {
    if (!targetId) return;
    document.querySelectorAll(".nav-item").forEach(function (n) {
      if (n.getAttribute("data-target") === targetId) {
        n.classList.add("active");
      } else {
        n.classList.remove("active");
      }
    });

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

    closeDrawer();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.switchToView = switchView;

  document.addEventListener("click", function (e) {
    var item = e.target.closest(".nav-item");
    if (item) {
      var targetId = item.getAttribute("data-target");
      if (targetId) {
        switchView(targetId);
      }
    }
  });

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
