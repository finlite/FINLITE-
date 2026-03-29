// Theme Manager - handles light/dark/auto mode across the application
// This script can be included on any page that needs theme support.

(function () {
  "use strict";

  const THEME_KEY = "finlite_theme";

  // Resolve the effective theme for 'auto' based on the OS preference.
  function resolveAutoTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  // Apply saved theme immediately (before DOM loads to prevent flash)
  function applySavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || "light";
    const effective = savedTheme === "auto" ? resolveAutoTheme() : savedTheme;
    document.documentElement.setAttribute("data-theme", effective);
    return savedTheme;
  }

  // Set theme and save preference
  function setTheme(theme) {
    const effective = theme === "auto" ? resolveAutoTheme() : theme;
    document.documentElement.setAttribute("data-theme", effective);
    localStorage.setItem(THEME_KEY, theme);
    updateToggleButtons(theme);
  }

  // Update toggle button active states
  function updateToggleButtons(theme) {
    const lightBtn = document.getElementById("theme-light");
    const darkBtn = document.getElementById("theme-dark");

    if (lightBtn && darkBtn) {
      if (theme === "dark") {
        darkBtn.classList.add("active");
        lightBtn.classList.remove("active");
      } else {
        lightBtn.classList.add("active");
        darkBtn.classList.remove("active");
      }
    }
  }

  // Apply theme immediately
  const currentTheme = applySavedTheme();

  // Set up toggle buttons when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    updateToggleButtons(currentTheme);

    const lightBtn = document.getElementById("theme-light");
    const darkBtn = document.getElementById("theme-dark");

    if (lightBtn) {
      lightBtn.addEventListener("click", () => setTheme("light"));
    }
    if (darkBtn) {
      darkBtn.addEventListener("click", () => setTheme("dark"));
    }

    // Re-apply auto theme if OS preference changes at runtime
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        const current = localStorage.getItem(THEME_KEY) || "light";
        if (current === "auto") setTheme("auto");
      });
  });

  // Expose globally for other scripts
  window.FinliteTheme = { setTheme, applySavedTheme };
  window.setTheme = setTheme; // For compatibility with theme-builder.js
})();
