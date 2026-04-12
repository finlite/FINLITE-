"use strict";

/* NAV */
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

/* AVATAR */
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

/* NAME → hero sync */
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

/* HOURS TOGGLE */
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

function persistProfile() {
  /* Collect avatar as data URI if one was uploaded */
  const imgEl = document.getElementById("avatarImg");
  const avatar =
    imgEl &&
    imgEl.style.display !== "none" &&
    imgEl.src &&
    imgEl.src.startsWith("data:")
      ? imgEl.src
      : "";
  const profile = {
    name: document.getElementById("fieldName").value.trim(),
    email: document.getElementById("fieldEmail").value.trim(),
    phone: document.getElementById("fieldPhone").value.trim(),
    bizName: document.getElementById("fieldBizName").value.trim(),
    address: document.getElementById("fieldAddress").value.trim(),
    bizType: document.getElementById("fieldBizType").value,
    regDate: document.getElementById("fieldRegDate")?.value || "",
    website: document.getElementById("fieldWebsite")?.value.trim() || "",
    instagram: document.getElementById("fieldInstagram")?.value.trim() || "",
    facebook: document.getElementById("fieldFacebook")?.value.trim() || "",
    avatar,
  };
  localStorage.setItem("finlite_profile", JSON.stringify(profile));
}

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "—";
  return "₦" + Number(value).toLocaleString("en-NG");
}

function updateRevenueStat() {
  const revenueElement = document.getElementById("profileRevenueValue");
  const customersElement = document.getElementById("profileCustomersValue");
  const daysActiveElement = document.getElementById("profileDaysActiveValue");

  let transactions = [];
  try {
    transactions = JSON.parse(localStorage.getItem("finlite_tx") || "[]");
  } catch (e) {
    transactions = [];
  }

  if (!Array.isArray(transactions)) transactions = [];

  const profit = transactions.reduce((sum, tx) => {
    const amount = Number(tx.amount || 0);
    if (tx.type === "sale") return sum + amount;
    if (tx.type === "expense") return sum - amount;
    return sum;
  }, 0);

  const salesCount = transactions.filter((tx) => tx.type === "sale").length;

  let activeDays = [];
  try {
    activeDays = JSON.parse(
      localStorage.getItem("finlite_active_days") || "[]",
    );
  } catch (e) {
    activeDays = [];
  }
  if (!Array.isArray(activeDays)) activeDays = [];

  if (revenueElement)
    revenueElement.textContent = transactions.length
      ? formatCurrency(profit)
      : "—";
  if (customersElement)
    customersElement.textContent = salesCount ? String(salesCount) : "—";
  if (daysActiveElement)
    daysActiveElement.textContent = activeDays.length
      ? String(activeDays.length)
      : "—";
}

function persistHours() {
  const hours = {};
  DAYS_LIST.forEach((day) => {
    const chk = document.getElementById("chk-" + day);
    hours[day] = {
      enabled: chk ? chk.checked : false,
      open: document.getElementById("open-" + day)?.value || "",
      close: document.getElementById("close-" + day)?.value || "",
    };
  });
  localStorage.setItem("finlite_hours", JSON.stringify(hours));
}

function loadPersistedData() {
  let p = {};
  let user = null;
  let signupProfile = null;

  try {
    p = JSON.parse(localStorage.getItem("finlite_profile") || "{}") || {};
  } catch (e) {
    p = {};
  }
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (e) {
    user = null;
  }
  try {
    signupProfile = JSON.parse(
      localStorage.getItem("finlite_signup_profile") || "null",
    );
  } catch (e) {
    signupProfile = null;
  }

  const fallback = {
    name:
      p.name ||
      user?.full_name ||
      user?.name ||
      signupProfile?.full_name ||
      signupProfile?.name ||
      "",
    email: p.email || user?.email || signupProfile?.email || "",
    phone: p.phone || user?.phone || signupProfile?.phone || "",
  };

  if (fallback.name) document.getElementById("fieldName").value = fallback.name;
  if (fallback.email)
    document.getElementById("fieldEmail").value = fallback.email;
  if (fallback.phone)
    document.getElementById("fieldPhone").value = fallback.phone;

  if (p.bizName) {
    document.getElementById("fieldBizName").value = p.bizName;
    document.getElementById("heroBiz").textContent = p.bizName;
  }
  if (p.address) document.getElementById("fieldAddress").value = p.address;
  if (p.bizType) document.getElementById("fieldBizType").value = p.bizType;
  if (p.regDate && document.getElementById("fieldRegDate"))
    document.getElementById("fieldRegDate").value = p.regDate;
  if (p.website && document.getElementById("fieldWebsite"))
    document.getElementById("fieldWebsite").value = p.website;
  if (p.instagram && document.getElementById("fieldInstagram"))
    document.getElementById("fieldInstagram").value = p.instagram;
  if (p.facebook && document.getElementById("fieldFacebook"))
    document.getElementById("fieldFacebook").value = p.facebook;

  if (fallback.name) {
    const heroName = document.getElementById("heroName");
    if (heroName) {
      heroName.textContent = fallback.name;
      heroName.classList.remove("placeholder");
    }
    const ini = fallback.name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    const initEl = document.getElementById("avatarInitials");
    if (initEl) {
      initEl.textContent = ini;
      initEl.style.color = "#fff";
      initEl.style.fontStyle = "normal";
      initEl.style.fontSize = "28px";
    }
  }
  if (p.avatar) {
    const img = document.getElementById("avatarImg");
    const initEl = document.getElementById("avatarInitials");
    if (img) {
      img.src = p.avatar;
      img.style.display = "block";
    }
    if (initEl) initEl.style.display = "none";
  }

  updateRevenueStat();

  try {
    const h = JSON.parse(localStorage.getItem("finlite_hours") || "{}");
    DAYS_LIST.forEach((day) => {
      const info = h[day];
      if (!info) return;
      const chk = document.getElementById("chk-" + day);
      if (chk && info.enabled) {
        chk.checked = true;
        toggleDay(day);
      }
      if (info.open && document.getElementById("open-" + day))
        document.getElementById("open-" + day).value = info.open;
      if (info.close && document.getElementById("close-" + day))
        document.getElementById("close-" + day).value = info.close;
    });
  } catch (e) {}
}

/* Auto-save hours whenever a time input or checkbox changes */
document.addEventListener("change", function (e) {
  if (e.target.type === "checkbox" || e.target.type === "time") persistHours();
});

/* SAVE ALL (Edit Profile Details btn) */
function saveAll() {
  const name = document.getElementById("fieldName").value.trim();
  const email = document.getElementById("fieldEmail").value.trim();
  const phone = document.getElementById("fieldPhone").value.trim();
  if (!name && !email && !phone) {
    showToast("Fill in at least one field to save");
    return;
  }
  persistProfile();
  persistHours();
  showToast("Profile details saved ✓");
}

/* BIZ SHEET */
function openBizSheet() {
  document.getElementById("editBizName").value =
    document.getElementById("fieldBizName").value;
  document.getElementById("editBizAddr").value =
    document.getElementById("fieldAddress").value;
  document.getElementById("bizOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeOverlay(id) {
  document.getElementById(id).classList.remove("open");
  document.body.style.overflow = "";
}
function closeSheet(e, id) {
  if (e.target === document.getElementById(id)) closeOverlay(id);
}
function saveBusiness() {
  const n = document.getElementById("editBizName").value;
  const a = document.getElementById("editBizAddr").value;
  const t = document.getElementById("editBizType").value;
  if (n) {
    document.getElementById("fieldBizName").value = n;
    document.getElementById("heroBiz").textContent = n;
  }
  if (a) document.getElementById("fieldAddress").value = a;
  if (t) document.getElementById("fieldBizType").value = t;
  persistProfile();
  closeOverlay("bizOverlay");
  showToast("Business profile updated ✓");
}

/* Load saved data on page start */
document.addEventListener("DOMContentLoaded", loadPersistedData);

function confirmLogout() {
  if (confirm("Are you sure you want to log out?")) {
    showToast("Logging out…");
    setTimeout(() => (window.location.href = "index.html"), 1400);
  }
}

/* TOAST */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}
