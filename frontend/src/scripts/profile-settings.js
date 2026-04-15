"use strict";

import { API_URL } from "./config.js";

/* ── HELPERS ── */
const getToken = () => localStorage.getItem("token");
const getUser  = () => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } };

function redirectToLogin() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

function requireAuth() {
  if (!getToken()) { redirectToLogin(); return false; }
  return true;
}

/* ── NAV ── */
const hb = document.getElementById("hamburgerBtn"),
  mm = document.getElementById("mobileMenu"),
  bd = document.getElementById("backdrop");
let navOpen = false;
const openNav = () => {
  navOpen = true;
  hb.classList.add("open");
  mm.classList.add("open");
  bd.classList.add("visible");
  document.body.style.overflow = "hidden";
};
const closeNav = () => {
  navOpen = false;
  hb.classList.remove("open");
  mm.classList.remove("open");
  bd.classList.remove("visible");
  document.body.style.overflow = "";
};
hb.addEventListener("click", (e) => {
  e.stopPropagation();
  navOpen ? closeNav() : openNav();
});
bd.addEventListener("click", closeNav);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeNav();
    document
      .querySelectorAll(".edit-overlay.open")
      .forEach((o) => o.classList.remove("open"));
    document.body.style.overflow = "";
  }
});
window.addEventListener("resize", () => {
  if (window.innerWidth >= 769 && navOpen) closeNav();
});

/* ── AVATAR ── */
document.getElementById("avatar-input").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById("avatarImg");
    document.getElementById("avatarInitials").style.display = "none";
    img.src = e.target.result;
    img.style.display = "block";
  };
  reader.readAsDataURL(file);
});

/* ── NAME → hero sync ── */
document.getElementById("fieldName").addEventListener("input", function () {
  const n = this.value.trim();
  const heroName = document.getElementById("heroName");
  if (n) {
    heroName.textContent = n;
    heroName.classList.remove("placeholder");
    const ini = n
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    const initEl = document.getElementById("avatarInitials");
    initEl.textContent = ini;
    initEl.style.color = "#fff";
    initEl.style.fontStyle = "normal";
    initEl.style.fontSize = "28px";
  } else {
    heroName.textContent = "Your name will appear here";
    heroName.classList.add("placeholder");
    const initEl = document.getElementById("avatarInitials");
    initEl.textContent = "Photo";
    initEl.style.color = "rgba(255,255,255,.5)";
    initEl.style.fontStyle = "italic";
    initEl.style.fontSize = "14px";
  }
});

/* ── HOURS TOGGLE ── */
function toggleDay(day) {
  const chk = document.getElementById("chk-" + day);
  const times = document.getElementById("times-" + day);
  const closed = document.getElementById("closed-" + day);
  if (chk.checked) {
    times.style.display = "block";
    closed.style.display = "none";
  } else {
    times.style.display = "none";
    closed.style.display = "block";
  }
}
window.toggleDay = toggleDay;

/* ── PERSIST HELPERS ── */
const DAYS_LIST = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function getAvatarDataUrl() {
  const imgEl = document.getElementById("avatarImg");
  return imgEl &&
    imgEl.style.display !== "none" &&
    imgEl.src &&
    imgEl.src.startsWith("data:")
    ? imgEl.src
    : "";
}

function getHoursFromForm() {
  const hours = {};
  DAYS_LIST.forEach((day) => {
    const chk = document.getElementById("chk-" + day);
    hours[day] = {
      enabled: chk ? chk.checked : false,
      open: document.getElementById("open-" + day)?.value || "",
      close: document.getElementById("close-" + day)?.value || "",
    };
  });
  return hours;
}

function persistToLocalStorage(profile, hours) {
  localStorage.setItem("finlite_profile", JSON.stringify(profile));
  localStorage.setItem("finlite_hours", JSON.stringify(hours));
}

/* ── REVENUE STATS (from API) ── */
function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "—";
  return "₦" + Number(value).toLocaleString("en-NG");
}

async function updateRevenueStat() {
  const revenueElement = document.getElementById("profileRevenueValue");
  const customersElement = document.getElementById("profileCustomersValue");
  const daysActiveElement = document.getElementById("profileDaysActiveValue");

  // Always compute active days from localStorage
  let activeDays = [];
  try {
    activeDays = JSON.parse(localStorage.getItem("finlite_active_days") || "[]");
  } catch (e) {
    activeDays = [];
  }
  if (!Array.isArray(activeDays)) activeDays = [];
  if (daysActiveElement)
    daysActiveElement.textContent = activeDays.length ? String(activeDays.length) : "—";

  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const transactions = await res.json();
    if (!Array.isArray(transactions)) return;

    const profit = transactions.reduce((sum, tx) => {
      const amount = Number(tx.amount || 0);
      if (tx.category === "sale") return sum + amount;
      if (tx.category === "expense") return sum - amount;
      return sum;
    }, 0);

    const salesCount = transactions.filter((tx) => tx.category === "sale").length;

    if (revenueElement)
      revenueElement.textContent = transactions.length ? formatCurrency(profit) : "—";
    if (customersElement)
      customersElement.textContent = salesCount ? String(salesCount) : "—";
  } catch (e) {
    // Fallback to localStorage
    try {
      const transactions = JSON.parse(localStorage.getItem("finlite_tx") || "[]");
      if (!Array.isArray(transactions)) return;
      const profit = transactions.reduce((sum, tx) => {
        const amount = Number(tx.amount || 0);
        if (tx.type === "sale" || tx.category === "sale") return sum + amount;
        if (tx.type === "expense" || tx.category === "expense") return sum - amount;
        return sum;
      }, 0);
      const salesCount = transactions.filter(
        (tx) => tx.type === "sale" || tx.category === "sale"
      ).length;
      if (revenueElement)
        revenueElement.textContent = transactions.length ? formatCurrency(profit) : "—";
      if (customersElement)
        customersElement.textContent = salesCount ? String(salesCount) : "—";
    } catch (_) {}
  }
}

/* ── POPULATE FORM FROM DATA ── */
function populateUserFields(profile) {
  const name  = profile.full_name || profile.name || "";
  const email = profile.email || "";
  const phone = profile.phone || "";

  const nameEl  = document.getElementById("fieldName");
  const emailEl = document.getElementById("fieldEmail");
  const phoneEl = document.getElementById("fieldPhone");

  if (nameEl)  nameEl.value  = name;
  if (emailEl) emailEl.value = email;
  if (phoneEl) phoneEl.value = phone;

  // Hero sync
  if (name) {
    const heroName = document.getElementById("heroName");
    if (heroName) { heroName.textContent = name; heroName.classList.remove("placeholder"); }
    const ini = name.split(/\s+/).map((w) => w[0]).join("").substring(0, 2).toUpperCase();
    const initEl = document.getElementById("avatarInitials");
    if (initEl) {
      initEl.textContent = ini;
      initEl.style.color = "#fff";
      initEl.style.fontStyle = "normal";
      initEl.style.fontSize = "28px";
    }
  }

  // Avatar photo
  if (profile.photo_data_url) {
    const img     = document.getElementById("avatarImg");
    const initEl  = document.getElementById("avatarInitials");
    if (img)    { img.src = profile.photo_data_url; img.style.display = "block"; }
    if (initEl) initEl.style.display = "none";
  }
}

function populateBusinessFields(biz) {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val != null) el.value = val;
  };
  setVal("fieldBizName",  biz.business_name);
  setVal("fieldAddress",  biz.address);
  setVal("fieldBizType",  biz.business_type);
  setVal("fieldRegDate",  biz.registration_date ? biz.registration_date.slice(0, 10) : "");
  setVal("fieldWebsite",  biz.online_prescence?.website || "");
  setVal("fieldInstagram",biz.online_prescence?.instagram || "");
  setVal("fieldFacebook", biz.online_prescence?.facebook || "");

  // Hero biz name
  const heroBiz = document.getElementById("heroBiz");
  if (heroBiz && biz.business_name) heroBiz.textContent = biz.business_name;

  // Hours
  if (biz.open_hours && typeof biz.open_hours === "object") {
    DAYS_LIST.forEach((day) => {
      const info = biz.open_hours[day];
      if (!info) return;
      const chk = document.getElementById("chk-" + day);
      if (chk && info.enabled) {
        chk.checked = true;
        toggleDay(day);
      }
      const openEl  = document.getElementById("open-"  + day);
      const closeEl = document.getElementById("close-" + day);
      if (openEl  && info.open)  openEl.value  = info.open;
      if (closeEl && info.close) closeEl.value = info.close;
    });
    // Also persist to localStorage for profile-summary.js
    localStorage.setItem("finlite_hours", JSON.stringify(biz.open_hours));
  }
}

/* ── LOAD DATA FROM API ── */
async function loadPersistedData() {
  const token = getToken();

  // Always try localStorage first as a fast prefill
  try {
    const p = JSON.parse(localStorage.getItem("finlite_profile") || "{}") || {};
    const user = getUser();
    const signupProfile = JSON.parse(localStorage.getItem("finlite_signup_profile") || "null");
    const fallback = {
      full_name: p.name || user?.full_name || user?.name || signupProfile?.full_name || signupProfile?.name || "",
      email: p.email || user?.email || signupProfile?.email || "",
      phone: p.phone || user?.phone || signupProfile?.phone || "",
    };
    populateUserFields(fallback);

    if (p.bizName)    { const el = document.getElementById("fieldBizName");    if (el) el.value = p.bizName; }
    if (p.address)    { const el = document.getElementById("fieldAddress");    if (el) el.value = p.address; }
    if (p.bizType)    { const el = document.getElementById("fieldBizType");    if (el) el.value = p.bizType; }
    if (p.regDate)    { const el = document.getElementById("fieldRegDate");    if (el) el.value = p.regDate; }
    if (p.website)    { const el = document.getElementById("fieldWebsite");    if (el) el.value = p.website; }
    if (p.instagram)  { const el = document.getElementById("fieldInstagram"); if (el) el.value = p.instagram; }
    if (p.facebook)   { const el = document.getElementById("fieldFacebook");  if (el) el.value = p.facebook; }

    if (p.avatar) {
      const img    = document.getElementById("avatarImg");
      const initEl = document.getElementById("avatarInitials");
      if (img)    { img.src = p.avatar; img.style.display = "block"; }
      if (initEl) initEl.style.display = "none";
    }
  } catch (_) {}

  // Load hours from localStorage
  try {
    const h = JSON.parse(localStorage.getItem("finlite_hours") || "{}");
    DAYS_LIST.forEach((day) => {
      const info = h[day];
      if (!info) return;
      const chk = document.getElementById("chk-" + day);
      if (chk && info.enabled) { chk.checked = true; toggleDay(day); }
      if (info.open  && document.getElementById("open-"  + day)) document.getElementById("open-"  + day).value = info.open;
      if (info.close && document.getElementById("close-" + day)) document.getElementById("close-" + day).value = info.close;
    });
  } catch (_) {}

  updateRevenueStat();

  if (!token) return;

  // Now fetch fresh data from API
  try {
    const [profileRes, bizRes] = await Promise.allSettled([
      fetch(`${API_URL}/users/profile`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/business`,       { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (profileRes.status === "fulfilled" && profileRes.value.ok) {
      const profile = await profileRes.value.json();
      localStorage.setItem("user", JSON.stringify(profile));
      populateUserFields(profile);
    } else if (profileRes.status === "fulfilled" && (profileRes.value.status === 401 || profileRes.value.status === 403)) {
      redirectToLogin();
      return;
    }

    if (bizRes.status === "fulfilled" && bizRes.value.ok) {
      const biz = await bizRes.value.json();
      populateBusinessFields(biz);
    }
    // 404 on business means no record yet — that's fine
  } catch (err) {
    console.error("Error loading profile from API:", err);
  }
}

/* ── AUTO-SAVE HOURS ── */
document.addEventListener("change", function (e) {
  if (e.target.type === "checkbox" || e.target.type === "time") {
    const hours = getHoursFromForm();
    localStorage.setItem("finlite_hours", JSON.stringify(hours));
  }
});

/* ── SAVE ALL ── */
async function saveAll() {
  const name  = document.getElementById("fieldName").value.trim();
  const email = document.getElementById("fieldEmail").value.trim();
  const phone = document.getElementById("fieldPhone").value.trim();
  if (!name && !email && !phone) {
    showToast("Fill in at least one field to save");
    return;
  }

  const token = getToken();
  const avatarDataUrl = getAvatarDataUrl();
  const hours = getHoursFromForm();

  // Build localStorage cache
  const localProfile = {
    name,
    email,
    phone,
    bizName:    document.getElementById("fieldBizName")?.value.trim()    || "",
    address:    document.getElementById("fieldAddress")?.value.trim()    || "",
    bizType:    document.getElementById("fieldBizType")?.value           || "",
    regDate:    document.getElementById("fieldRegDate")?.value           || "",
    website:    document.getElementById("fieldWebsite")?.value.trim()   || "",
    instagram:  document.getElementById("fieldInstagram")?.value.trim() || "",
    facebook:   document.getElementById("fieldFacebook")?.value.trim()  || "",
    avatar: avatarDataUrl,
  };
  persistToLocalStorage(localProfile, hours);

  if (!token) {
    showToast("Saved locally (not logged in)");
    setTimeout(() => { window.location.href = "profile-summary.html"; }, 1400);
    return;
  }

  try {
    // 1. Update user profile
    const profilePayload = { full_name: name, email, phone };
    if (avatarDataUrl) profilePayload.photo_data_url = avatarDataUrl;

    const profileRes = await fetch(`${API_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profilePayload),
    });

    if (profileRes.status === 401 || profileRes.status === 403) {
      redirectToLogin(); return;
    }
    if (!profileRes.ok) {
      const d = await profileRes.json().catch(() => ({}));
      showToast(d.message || "Failed to update profile");
      return;
    }

    const updatedProfile = await profileRes.json();
    localStorage.setItem("user", JSON.stringify(updatedProfile));

    // 2. Upsert business info
    const onlinePresence = {
      website:   localProfile.website,
      instagram: localProfile.instagram,
      facebook:  localProfile.facebook,
    };
    const bizPayload = {
      business_name:     localProfile.bizName,
      address:           localProfile.address,
      business_type:     localProfile.bizType,
      registration_date: localProfile.regDate || null,
      open_hours:        hours,
      online_prescence:  onlinePresence,
    };

    // Also try to get phone from business phone field if it exists
    const bizPhoneEl = document.getElementById("fieldBizPhone");
    if (bizPhoneEl) bizPayload.business_phone = bizPhoneEl.value.trim();

    const bizRes = await fetch(`${API_URL}/business`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bizPayload),
    });
    // We don't block on biz failure — it may not exist yet; the server handles upsert
    if (bizRes.status === 401 || bizRes.status === 403) {
      redirectToLogin(); return;
    }

    showToast("Saved ✓");
    setTimeout(() => { window.location.href = "profile-summary.html"; }, 1400);
  } catch (err) {
    console.error("Error saving profile:", err);
    showToast("Saved locally (offline)");
    setTimeout(() => { window.location.href = "profile-summary.html"; }, 1400);
  }
}

window.saveAll = saveAll;

/* ── LOAD ON START ── */
document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;
  loadPersistedData();
});

function confirmLogout() {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    showToast("Logging out…");
    setTimeout(() => (window.location.href = "login.html"), 1400);
  }
}
window.confirmLogout = confirmLogout;

/* ── TOAST ── */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  document.getElementById("toastMsg").textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}
