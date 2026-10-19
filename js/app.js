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
    drawer.classList.remove("open");
    drawerScrim.classList.remove("open");
  }

  menuBtn.addEventListener("click", function () {
    drawer.classList.add("open");
    drawerScrim.classList.add("open");
  });

  drawerScrim.addEventListener("click", closeDrawer);

  navItems.forEach(function (item) {
    item.addEventListener("click", function () {
      navItems.forEach(function (n) {
        n.classList.remove("active");
      });
      item.classList.add("active");

      var targetId = item.getAttribute("data-target");
      document.querySelectorAll(".view").forEach(function (v) {
        v.classList.remove("active");
      });
      document.getElementById(targetId).classList.add("active");

      if (targetId === "viewToday") renderTodayView();
      if (targetId === "viewPlan") renderPlanView();
      if (targetId === "viewAnalytics") renderAnalyticsView();
      if (targetId === "viewPR") renderPRView();
      if (targetId === "viewLibrary") renderLibraryView();
      if (targetId === "viewSettings") renderSettingsView();

      closeDrawer();
    });
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
