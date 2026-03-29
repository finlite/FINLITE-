"use strict";

const API_URL = (window.FINLITE_API_URL || 'https://finlite-nizr.onrender.com/api').replace(/\/+$/, '');
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

let navOpen = false;
let toastTimer;
let currentPhotoDataUrl = null;

function getToken() {
    return localStorage.getItem('token');
}

function getAuthHeaders(withJson = false) {
    const headers = {
        Authorization: `Bearer ${getToken()}`
    };

    if (withJson) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
}

function redirectToLogin() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function requireAuth() {
    if (!getToken()) {
        redirectToLogin();
        return false;
    }

    return true;
}

function getInitials(name) {
    if (!name) return 'FL';
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function showToast(msg) {
    const el = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function openNav() {
    const hb = document.getElementById('hamburgerBtn');
    const mm = document.getElementById('mobileMenu');
    const bd = document.getElementById('backdrop');

    navOpen = true;
    hb.classList.add('open');
    mm.classList.add('open');
    bd.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeNav() {
    const hb = document.getElementById('hamburgerBtn');
    const mm = document.getElementById('mobileMenu');
    const bd = document.getElementById('backdrop');

    navOpen = false;
    hb.classList.remove('open');
    mm.classList.remove('open');
    bd.classList.remove('visible');
    document.body.style.overflow = '';
}

function updateHeroName(name) {
    const heroName = document.getElementById('heroName');
    const avatarInitials = document.getElementById('avatarInitials');
    const mobileAvatar = document.getElementById('mobile-avatar');
    const mobileUserName = document.getElementById('mobile-user-name');

    if (name) {
        heroName.textContent = name;
        heroName.classList.remove('placeholder');
        avatarInitials.textContent = getInitials(name);
        avatarInitials.style.color = '#fff';
        avatarInitials.style.fontStyle = 'normal';
        avatarInitials.style.fontSize = '28px';
        mobileAvatar.textContent = getInitials(name);
        mobileUserName.textContent = name;
    } else {
        heroName.textContent = 'Your name will appear here';
        heroName.classList.add('placeholder');
        avatarInitials.textContent = 'Photo';
        avatarInitials.style.color = 'rgba(255,255,255,.5)';
        avatarInitials.style.fontStyle = 'italic';
        avatarInitials.style.fontSize = '14px';
    }
}

function updateAvatar(photoDataUrl, fallbackName = '') {
    const avatarInitials = document.getElementById('avatarInitials');
    const avatarImg = document.getElementById('avatarImg');
    currentPhotoDataUrl = photoDataUrl || null;

    if (photoDataUrl) {
        avatarImg.src = photoDataUrl;
        avatarImg.style.display = 'block';
        avatarInitials.style.display = 'none';
        return;
    }

    avatarImg.removeAttribute('src');
    avatarImg.style.display = 'none';
    avatarInitials.style.display = 'block';
    if (fallbackName) {
        avatarInitials.textContent = getInitials(fallbackName);
        avatarInitials.style.color = '#fff';
        avatarInitials.style.fontStyle = 'normal';
        avatarInitials.style.fontSize = '28px';
    }
}

function updateHeroBusinessName(name) {
    const heroBiz = document.getElementById('heroBiz');
    heroBiz.textContent = name || 'Business name';
    heroBiz.style.color = name ? '' : 'rgba(255,255,255,.55)';
    heroBiz.style.fontStyle = name ? 'normal' : 'italic';
}

function toggleDay(day) {
    const chk = document.getElementById(`chk-${day}`);
    const times = document.getElementById(`times-${day}`);
    const closed = document.getElementById(`closed-${day}`);

    if (chk.checked) {
        times.style.display = 'block';
        closed.style.display = 'none';
    } else {
        times.style.display = 'none';
        closed.style.display = 'block';
    }
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

/* SAVE ALL (Edit Profile Details btn) */
function saveAll(){
    const name=document.getElementById('fieldName').value.trim();
    const email=document.getElementById('fieldEmail').value.trim();
    const phone=document.getElementById('fieldPhone').value.trim();
    if(!name&&!email&&!phone){ showToast('Fill in at least one field to save'); return; }
    showToast('Profile details saved ✓');
}

/* BIZ SHEET */
function openBizSheet(){
    document.getElementById('editBizName').value=document.getElementById('fieldBizName').value;
    document.getElementById('editBizAddr').value=document.getElementById('fieldAddress').value;
    document.getElementById('bizOverlay').classList.add('open');
    document.body.style.overflow='hidden';
}
function closeOverlay(id){document.getElementById(id).classList.remove('open');document.body.style.overflow='';}
function closeSheet(e,id){if(e.target===document.getElementById(id))closeOverlay(id);}
function saveBusiness(){
    const n=document.getElementById('editBizName').value;
    const a=document.getElementById('editBizAddr').value;
    const t=document.getElementById('editBizType').value;
    if(n){ document.getElementById('fieldBizName').value=n; document.getElementById('heroBiz').textContent=n; }
    if(a)document.getElementById('fieldAddress').value=a;
    if(t)document.getElementById('fieldBizType').value=t;
    closeOverlay('bizOverlay');
    showToast('Business profile updated ✓');
}

function confirmLogout(){
    if(confirm('Are you sure you want to log out?')){
        showToast('Logging out…');
        setTimeout(()=>window.location.href='index.html',1400);
    }
}

// Initialize user profile text on page load
document.addEventListener("DOMContentLoaded", loadProfileFromStorage);

/* TOAST */
let toastTimer;
function showToast(msg){
    const el=document.getElementById('toast');
    document.getElementById('toastMsg').textContent=msg;
    el.classList.add('show'); clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove('show'),2800);
}