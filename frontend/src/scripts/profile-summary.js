/**
 * FINLITE — profile-summary.js
 * Reads all data saved by profile-settings.js from
 * localStorage and renders the Business Profile Summary page.
 *
 * localStorage keys written by profile-settings:
 *   finlite_profile  → { name, email, phone, bizName, bizType,
 *                         address, regDate, avatar,
 *                         website, instagram, facebook }
 *   finlite_hours    → { monday:{open,close,enabled}, tuesday:…, … }
 */

'use strict';

/* ════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════ */
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = {
    monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday',
    thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday'
};
const STORAGE_PROFILE = 'finlite_profile';
const STORAGE_HOURS   = 'finlite_hours';

/* ════════════════════════════════════════════════
   LOAD DATA FROM localStorage
   ════════════════════════════════════════════════ */
function loadProfile() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_PROFILE) || '{}');
    } catch { return {}; }
}

function loadHours() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_HOURS) || '{}');
    } catch { return {}; }
}

/* ════════════════════════════════════════════════
   TIME HELPERS
   ════════════════════════════════════════════════ */
function fmt12(time24) {
    /* Convert "09:00" → "9:00 AM", "18:00" → "6:00 PM" */
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function isOpenNow(hours) {
    /* Check if any day that is open contains the current local time */
    const now  = new Date();
    const day  = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Mon=0 … Sun=6
    const info = hours[day];
    if (!info || !info.enabled || !info.open || !info.close) return false;
    const [oh, om] = info.open.split(':').map(Number);
    const [ch, cm] = info.close.split(':').map(Number);
    const nowMins  = now.getHours() * 60 + now.getMinutes();
    const openMins = oh * 60 + om;
    const closeMins = ch * 60 + cm;
    return nowMins >= openMins && nowMins < closeMins;
}

/* ════════════════════════════════════════════════
   RENDER — HERO CARD
   ════════════════════════════════════════════════ */
function renderHero(profile, hours) {
    /* Business name */
    const nameEl = document.getElementById('hero-biz-name');
    if (nameEl) nameEl.textContent = profile.bizName || 'Your Business';

    /* Business type */
    const typeEl = document.getElementById('hero-biz-type');
    if (typeEl) typeEl.textContent = profile.bizType || '';

    /* Avatar / logo image */
    if (profile.avatar) {
        const img  = document.getElementById('hero-logo-img');
        const icon = document.getElementById('hero-logo-icon');
        if (img)  { img.src = profile.avatar; img.style.display = 'block'; }
        if (icon) icon.style.display = 'none';
    }

    /* Open / Closed status pill */
    const open  = isOpenNow(hours);
    const pill  = document.getElementById('hero-status-pill');
    const pillI = document.getElementById('hero-status-icon');
    const pillT = document.getElementById('hero-status-text');
    if (pill) {
        if (open) {
            pill.classList.remove('hero-status-pill--closed');
            if (pillI) pillI.className = 'ph ph-globe';
            if (pillT) pillT.textContent = 'Open Now';
        } else {
            pill.classList.add('hero-status-pill--closed');
            if (pillI) pillI.className = 'ph ph-lock-simple';
            if (pillT) pillT.textContent = 'Closed Now';
        }
    }
}

/* ════════════════════════════════════════════════
   RENDER — BUSINESS HOURS CARD
   ════════════════════════════════════════════════ */
function renderHours(hours) {
    const tbody = document.getElementById('hours-tbody');
    if (!tbody) return;

    /* Open/Closed badge in card header */
    const open   = isOpenNow(hours);
    const badge  = document.getElementById('hours-badge');
    const badgeDot = document.getElementById('hours-badge-dot');
    if (badge) {
        badge.className = `info-card__badge info-card__badge--${open ? 'open' : 'closed'}`;
        badge.querySelector('span').textContent = open ? 'Open' : 'Closed';
    }
    if (badgeDot) badgeDot.className = `info-card__badge-dot info-card__badge-dot--${open ? 'open' : 'closed'}`;

    tbody.innerHTML = DAYS.map(day => {
        const info = hours[day];
        const isOpen = info && info.enabled;
        const timeStr = isOpen && info.open && info.close
            ? `${fmt12(info.open)} – ${fmt12(info.close)}`
            : null;

        return `
            <div class="hours-row">
                <span class="hours-row__day">${DAY_LABELS[day]}</span>
                ${timeStr
                    ? `<span class="hours-row__time">${timeStr}</span>`
                    : `<span class="hours-row__closed">Closed</span>`
                }
            </div>`;
    }).join('');
}

/* ════════════════════════════════════════════════
   RENDER — CONTACT INFORMATION
   ════════════════════════════════════════════════ */
function renderContact(profile) {
    const container = document.getElementById('contact-list');
    if (!container) return;

    const items = [
        { label: 'Phone Number',      icon: 'ph-phone',     value: profile.phone   },
        { label: 'Email Address',     icon: 'ph-envelope',  value: profile.email   },
        { label: 'Business Address',  icon: 'ph-map-pin',   value: profile.address },
    ];

    const hasAny = items.some(i => i.value);
    if (!hasAny) {
        container.innerHTML = `<p class="empty-val" style="padding:8px 0">No contact information saved yet.</p>`;
        return;
    }

    container.innerHTML = items
        .filter(i => i.value)
        .map(i => `
            <div class="contact-item">
                <div class="contact-item__icon">
                    <i class="ph ${i.icon}"></i>
                </div>
                <div class="contact-item__body">
                    <p class="contact-item__label">${i.label}</p>
                    <p class="contact-item__value">${i.value}</p>
                </div>
            </div>
        `).join('');
}

/* ════════════════════════════════════════════════
   RENDER — ONLINE PRESENCE
   ════════════════════════════════════════════════ */
function renderPresence(profile) {
    const container = document.getElementById('presence-list');
    const card      = document.getElementById('presence-card');
    if (!container) return;

    const items = [
        { icon: 'ph-globe',     value: profile.website,   href: profile.website   },
        { icon: 'ph-instagram-logo', value: profile.instagram ? '@' + profile.instagram.replace(/^@/,'') : null, href: profile.instagram ? `https://instagram.com/${profile.instagram.replace(/^@/,'')}` : null },
        { icon: 'ph-facebook-logo',  value: profile.facebook  ? '/' + profile.facebook.replace(/^\//,'')  : null, href: profile.facebook  ? `https://facebook.com/${profile.facebook.replace(/^\//,'')}`   : null },
    ].filter(i => i.value);

    if (!items.length) {
        if (card) card.style.display = 'none';
        return;
    }
    if (card) card.style.display = 'block';

    container.innerHTML = items.map(i => `
        <a class="presence-item" href="${i.href || '#'}" target="_blank" rel="noopener">
            <div class="presence-item__icon">
                <i class="ph ${i.icon}"></i>
            </div>
            <span class="presence-item__url">${i.value}</span>
        </a>
    `).join('');
}

/* ════════════════════════════════════════════════
   MOBILE AVATAR SYNC
   ════════════════════════════════════════════════ */
function syncMobileAvatar(profile) {
    const name     = profile.name || '';
    const initials = name.trim()
        ? name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase()
        : '--';
    const mobAvt  = document.getElementById('mobile-avatar');
    const mobName = document.getElementById('mobile-user-name');
    if (mobAvt  && initials !== '--') mobAvt.textContent  = initials;
    if (mobName && name)              mobName.textContent = name;
}

/* ════════════════════════════════════════════════
   NAV HAMBURGER (settings.js pattern exactly)
   ════════════════════════════════════════════════ */
function setupNav() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu   = document.getElementById('mobileMenu');
    const backdrop     = document.getElementById('backdrop');
    let menuOpen = false;

    function openMenu() {
        menuOpen = true;
        hamburgerBtn.classList.add('open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        hamburgerBtn.setAttribute('aria-label', 'Close navigation menu');
        mobileMenu.classList.add('open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        backdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
        menuOpen = false;
        hamburgerBtn.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.setAttribute('aria-label', 'Open navigation menu');
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        backdrop.classList.remove('visible');
        document.body.style.overflow = '';
    }

    hamburgerBtn.addEventListener('click', e => { e.stopPropagation(); menuOpen ? closeMenu() : openMenu(); });
    backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) closeMenu(); });
    mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setTimeout(closeMenu, 120)));
    window.addEventListener('resize', () => { if (window.innerWidth >= 769 && menuOpen) closeMenu(); });
}

/* ════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════ */
let toastTimer;
function showToast(msg, type = 'success') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.className = `show t-${type}`;
    el.querySelector('#toast-msg').textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ════════════════════════════════════════════════
   THEME RESTORE
   ════════════════════════════════════════════════ */
function restoreTheme() {
    const t = localStorage.getItem('finlite_theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
}

/* ════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    restoreTheme();
    setupNav();

    const profile = loadProfile();
    const hours   = loadHours();

    renderHero(profile, hours);
    renderHours(hours);
    renderContact(profile);
    renderPresence(profile);
    syncMobileAvatar(profile);

    /* Re-sync initials after any async updates */
    setTimeout(() => syncMobileAvatar(loadProfile()), 600);
});
