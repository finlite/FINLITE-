"use strict";

/* ════════════════════════════════════════════════
   FINLITE — Typography Settings JavaScript
   typography.js

   Responsibilities:
   • Nav hamburger (shared pattern)
   • Mobile user row sync
   • Text size pill selection (small / medium / large)
   • Bold numbers toggle
   • Increase line spacing toggle
   • Live preview card update
   • Persists all prefs to localStorage as 'finlite_prefs'
   • Applies body classes globally so every page that
     reads 'finlite_prefs' on load reflects the choices
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
  const name = user.full_name ? user.full_name.trim() : null;
  const initials = name
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
   PERSISTENCE  (shared key with theme-builder)
══════════════════════════════ */
const PREF_KEY = "finlite_prefs";

const DEFAULTS = {
  textSize: "medium", // 'small' | 'medium' | 'large'
  boldNumbers: false,
  lineSpacing: false,
};

function loadPrefs() {
  try {
    return {
      ...DEFAULTS,
      ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}"),
    };
  } catch (_) {
    return { ...DEFAULTS };
  }
}

function savePrefs(patch) {
  const current = loadPrefs();
  const updated = { ...current, ...patch };
  localStorage.setItem(PREF_KEY, JSON.stringify(updated));
  return updated;
}

/* ══════════════════════════════
   BODY CLASS APPLICATION
   Called on load + every change.
   Other pages read finlite_prefs on their own load
   and call the same logic — keeping everything in sync.
══════════════════════════════ */
function applyToBody(prefs) {
  const b = document.body;

  // Text size
  b.classList.remove("typo-small", "typo-medium", "typo-large");
  b.classList.add("typo-" + (prefs.textSize || "medium"));

  // Bold numbers
  b.classList.toggle("typo-bold-numbers", !!prefs.boldNumbers);

  // Line spacing
  b.classList.toggle("typo-line-spacing", !!prefs.lineSpacing);
}

/* ══════════════════════════════
   UI SYNC
   Reflects stored prefs back into the page controls
   and updates the live preview.
══════════════════════════════ */
const SIZE_LABEL = { small: "Small", medium: "Medium", large: "Large" };

function syncUI(prefs) {
  // Size pills — active state
  document.querySelectorAll(".size-pill").forEach((btn) => {
    const isActive = btn.dataset.size === prefs.textSize;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  // Current size label next to icon
  const currentLbl = document.getElementById("currentSizeLabel");
  if (currentLbl)
    currentLbl.textContent = SIZE_LABEL[prefs.textSize] || "Medium";

  // Toggle checkboxes
  const boldChk = document.getElementById("tog-bold");
  const spacingChk = document.getElementById("tog-spacing");
  if (boldChk) boldChk.checked = !!prefs.boldNumbers;
  if (spacingChk) spacingChk.checked = !!prefs.lineSpacing;

  // Live preview
  updatePreview(prefs);
}

function updatePreview(prefs) {
  const amounts = document.querySelectorAll(".preview-row__amount");
  amounts.forEach((el) => {
    // Font size from size setting
    const sizeMap = { small: "13px", medium: "15px", large: "18px" };
    el.style.fontSize = sizeMap[prefs.textSize] || "15px";

    // Bold numbers
    el.style.fontWeight = prefs.boldNumbers ? "800" : "700";
    el.style.letterSpacing = prefs.boldNumbers ? "-.01em" : "0";
  });

  const descs = document.querySelectorAll(".preview-row__desc");
  descs.forEach((el) => {
    el.style.lineHeight = prefs.lineSpacing ? "1.8" : "1.5";
  });
}

/* ══════════════════════════════
   PUBLIC HANDLERS  (called from HTML onclick)
══════════════════════════════ */

/**
 * Called when a size pill is tapped.
 * @param {'small'|'medium'|'large'} size
 */
function selectSize(size) {
  const prefs = savePrefs({ textSize: size });
  applyToBody(prefs);
  syncUI(prefs);
}

/**
 * Called by the Bold Numbers toggle.
 */
function toggleBoldNumbers(checked) {
  const prefs = savePrefs({ boldNumbers: checked });
  applyToBody(prefs);
  syncUI(prefs);
}

/**
 * Called by the Increase Line Spacing toggle.
 */
function toggleLineSpacing(checked) {
  const prefs = savePrefs({ lineSpacing: checked });
  applyToBody(prefs);
  syncUI(prefs);
}

/**
 * Cycle to the next text size (small → medium → large → small)
 */
function cycleTextSize() {
  const SIZES = ["small", "medium", "large"];
  const prefs = loadPrefs();
  const currentIdx = SIZES.indexOf(prefs.textSize);
  const nextIdx = (currentIdx + 1) % SIZES.length;
  const nextSize = SIZES[nextIdx];
  selectSize(nextSize);
}

/* ══════════════════════════════
   INIT
══════════════════════════════ */
(function init() {
  // Restore saved theme so dark mode renders correctly
  const savedTheme = localStorage.getItem("finlite_theme") || "light";
  const effective =
    savedTheme === "auto"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : savedTheme;
  document.documentElement.setAttribute("data-theme", effective);

  // Load and apply typography prefs
  const prefs = loadPrefs();
  applyToBody(prefs);
  syncUI(prefs);

  // Check if we should cycle the text size (from theme-builder Change button)
  const params = new URLSearchParams(window.location.search);
  if (params.get("action") === "cycle") {
    // Cycle to the next size and clean the URL
    cycleTextSize();
    window.history.replaceState({}, document.title, window.location.pathname);
  }
})();
