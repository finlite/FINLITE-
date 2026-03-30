"use strict";

/* ════════════════════════════════════════════════
   FINLITE — Theme Builder JavaScript
   theme-builder.js

   Responsibilities:
   • Nav hamburger (shared pattern)
   • Mobile user row sync
   • Theme selection (light / dark / auto)
     — persists to localStorage as 'finlite_theme'
     — applies data-theme on <html>
     — integrates with theme.js if present
   • Display preferences (persist + apply)
   • Text size cycling
   • Reset to defaults
   ════════════════════════════════════════════════ */

/* ══════════════════════════════
   NAV
══════════════════════════════ */
const hb = document.getElementById("hamburgerBtn");
const mm = document.getElementById("mobileMenu");
const bd = document.getElementById("backdrop");
let navOpen = false;

function openNav() {
  navOpen = true;
  hb.classList.add("open");
  hb.setAttribute("aria-expanded", "true");
  mm.classList.add("open");
  mm.setAttribute("aria-hidden", "false");
  bd.classList.add("visible");
  document.body.style.overflow = "hidden";
}

function closeNav() {
  navOpen = false;
  hb.classList.remove("open");
  hb.setAttribute("aria-expanded", "false");
  mm.classList.remove("open");
  mm.setAttribute("aria-hidden", "true");
  bd.classList.remove("visible");
  document.body.style.overflow = "";
}

hb.addEventListener("click", (e) => {
  e.stopPropagation();
  navOpen ? closeNav() : openNav();
});
bd.addEventListener("click", closeNav);
mm.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => setTimeout(closeNav, 120)),
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeNav();
});
window.addEventListener("resize", () => {
  if (window.innerWidth >= 769 && navOpen) closeNav();
});

/* ══════════════════════════════
   MOBILE USER ROW
══════════════════════════════ */
function syncMobileUser() {
  const mobAvt = document.getElementById("mobile-avatar");
  const mobName = document.getElementById("mobile-user-name");
  if (!mobAvt && !mobName) return;

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (_) {}

  let name = user.full_name ? user.full_name.trim() : null;
  let initials = name
    ? name
        .split(/\s+/)
        .map((w) => w[0] || "")
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : null;

  if (initials && mobAvt) mobAvt.textContent = initials;
  if (name && mobName) mobName.textContent = name;
}

syncMobileUser();
setTimeout(syncMobileUser, 800);
setTimeout(syncMobileUser, 2000);

/* ══════════════════════════════
   THEME  (light / dark / auto)
══════════════════════════════ */
const THEME_KEY = "finlite_theme";

const THEME_META = {
  light: {
    name: "Light Mode",
    iconClass: "ph-fill ph-sun",
    previewCls: "",
  },
  dark: {
    name: "Dark Mode",
    iconClass: "ph-fill ph-moon",
    previewCls: "preview--dark",
  },
  auto: {
    name: "Auto (System)",
    iconClass: "ph-fill ph-desktop",
    previewCls: "preview--auto",
  },
};

/**
 * Resolve the effective theme for 'auto' based on the OS preference.
 * @returns {'light'|'dark'}
 */
function resolveAutoTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Apply a theme to the document and update all UI elements.
 * @param {'light'|'dark'|'auto'} theme
 * @param {boolean} persist – write to localStorage if true
 */
function applyTheme(theme, persist = false) {
  const effective = theme === "auto" ? resolveAutoTheme() : theme;

  // 1. data-theme on <html>  (CSS vars respond to this)
  document.documentElement.setAttribute("data-theme", effective);

  // 2. Also call theme.js hook if it exists  (repo integration)
  if (typeof window.setTheme === "function") {
    window.setTheme(effective);
  }

  // 3. Persist
  if (persist) {
    localStorage.setItem(THEME_KEY, theme); // store 'auto', not resolved value
  }

  // 4. Update the active card
  const meta = THEME_META[theme];
  const cardIcon = document.getElementById("themePreviewIcon");
  const cardName = document.getElementById("themeActiveName");

  if (cardIcon) {
    // Reset classes, then apply variant
    cardIcon.className = "theme-card__preview " + meta.previewCls;
    cardIcon.innerHTML = `<i class="${meta.iconClass}"></i>`;
  }

  if (cardName) {
    cardName.textContent = meta.name;
  }

  // 5. Update button aria-pressed + checks
  ["light", "dark", "auto"].forEach((t) => {
    const btn = document.getElementById("btn-" + t);
    if (btn) btn.setAttribute("aria-pressed", String(t === theme));
  });
}

/**
 * Called by the three theme buttons in HTML.
 */
function selectTheme(theme) {
  applyTheme(theme, true);
}

/* ══════════════════════════════
   DISPLAY PREFERENCES
══════════════════════════════ */
const PREF_KEY = "finlite_prefs";

const PREF_DEFAULTS = {
  textSize: "medium", // 'small' | 'medium' | 'large'
  highContrast: false,
  reduceMotion: false,
  boldCurrency: false,
  reduceTransparency: false,
};

function loadPrefs() {
  try {
    return {
      ...PREF_DEFAULTS,
      ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}"),
    };
  } catch (_) {
    return { ...PREF_DEFAULTS };
  }
}

function savePref(key, value) {
  const prefs = loadPrefs();
  prefs[key] = value;
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

function applyPrefs() {
  const prefs = loadPrefs();
  const body = document.body;

  // Text size
  body.classList.remove("text-sm", "text-md", "text-lg");
  const sizeMap = { small: "text-sm", medium: "text-md", large: "text-lg" };
  body.classList.add(sizeMap[prefs.textSize] || "text-md");

  const TEXT_SIZE_LABELS = {
    small: "Small",
    medium: "Medium (recommended)",
    large: "Large",
  };
  const lbl = document.getElementById("textSizeLabel");
  if (lbl)
    lbl.textContent =
      TEXT_SIZE_LABELS[prefs.textSize] || TEXT_SIZE_LABELS.medium;

  // Boolean prefs → body class toggles
  body.classList.toggle("pref--high-contrast", !!prefs.highContrast);
  body.classList.toggle("pref--reduce-motion", !!prefs.reduceMotion);
  body.classList.toggle("pref--bold-currency", !!prefs.boldCurrency);
  body.classList.toggle(
    "pref--reduce-transparency",
    !!prefs.reduceTransparency,
  );

  // Sync checkboxes
  const sync = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!prefs[key];
  };
  sync("pref-contrast", "highContrast");
  sync("pref-motion", "reduceMotion");
  sync("pref-bold", "boldCurrency");
  sync("pref-transparency", "reduceTransparency");
}

/* ══════════════════════════════
   RESET ALL
══════════════════════════════ */
function resetAll() {
  localStorage.setItem(PREF_KEY, JSON.stringify(PREF_DEFAULTS));
  localStorage.setItem(THEME_KEY, "light");
  applyTheme("light", false);
  applyPrefs();
}

/* ══════════════════════════════
   INIT
══════════════════════════════ */
(function init() {
  // Restore saved theme
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme, false);

  // Restore saved prefs
  applyPrefs();

  // Re-apply auto theme if OS preference changes at runtime
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const current = localStorage.getItem(THEME_KEY) || "light";
      if (current === "auto") applyTheme("auto", false);
    });
})();
