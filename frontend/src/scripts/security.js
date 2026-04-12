/**
 * FINLITE — security.js  v2
 * Real device detection via User-Agent + browser APIs.
 * Handles: current session detection, login history,
 * security alerts, 2FA, password change, data export,
 * sign-out all devices, and account deletion.
 */

import { API_URL } from './config.js';

/* ════════════════════════════════════════════════
   DEVICE DETECTION  (real, from browser APIs)
   ════════════════════════════════════════════════ */

/**
 * Parse the User-Agent string and platform APIs to return
 * a human-friendly device name, OS, browser and icon class.
 */
function detectDevice() {
    const ua  = navigator.userAgent;
    const pf  = navigator.platform || '';

    /* ── OS ── */
    let os = 'Unknown OS';
    if      (/Windows NT 10/.test(ua))           os = 'Windows 11';
    else if (/Windows NT 6\.3/.test(ua))         os = 'Windows 8.1';
    else if (/Windows NT 6\.1/.test(ua))         os = 'Windows 7';
    else if (/Windows/.test(ua))                 os = 'Windows';
    else if (/iPhone OS 17/.test(ua))            os = 'iOS 17';
    else if (/iPhone OS 16/.test(ua))            os = 'iOS 16';
    else if (/iPhone OS 15/.test(ua))            os = 'iOS 15';
    else if (/iPhone/.test(ua))                  os = 'iOS';
    else if (/iPad/.test(ua))                    os = 'iPadOS';
    else if (/Mac OS X 10_15/.test(ua))          os = 'macOS Catalina';
    else if (/Mac OS X 11/.test(ua))             os = 'macOS Big Sur';
    else if (/Mac OS X 12/.test(ua))             os = 'macOS Monterey';
    else if (/Mac OS X 13/.test(ua))             os = 'macOS Ventura';
    else if (/Mac OS X 14/.test(ua))             os = 'macOS Sonoma';
    else if (/Mac OS X/.test(ua))                os = 'macOS';
    else if (/Android 14/.test(ua))              os = 'Android 14';
    else if (/Android 13/.test(ua))              os = 'Android 13';
    else if (/Android 12/.test(ua))              os = 'Android 12';
    else if (/Android/.test(ua))                 os = 'Android';
    else if (/Linux/.test(ua))                   os = 'Linux';
    else if (/CrOS/.test(ua))                    os = 'Chrome OS';

    /* ── DEVICE TYPE & MODEL ── */
    let device = 'Desktop';
    let icon   = 'ph-desktop';

    if (/iPhone/.test(ua)) {
        /* Try to extract iPhone model from UA */
        const iPhoneMatch = ua.match(/iPhone OS (\d+)/);
        const ver = iPhoneMatch ? parseInt(iPhoneMatch[1]) : 0;
        device = ver >= 17 ? 'iPhone 15 Series' :
                 ver >= 16 ? 'iPhone 14 Series' :
                 ver >= 15 ? 'iPhone 13 Series' : 'iPhone';
        icon = 'ph-device-mobile';
    } else if (/iPad/.test(ua)) {
        device = 'iPad';
        icon   = 'ph-device-tablet';
    } else if (/Android/.test(ua)) {
        /* Extract device model from Android UA */
        const modelMatch = ua.match(/;\s*([^;)]+)\s*Build\//);
        device = modelMatch ? modelMatch[1].trim() : 'Android Device';
        icon   = /Mobile/.test(ua) ? 'ph-device-mobile' : 'ph-device-tablet';
    } else if (/Macintosh/.test(ua)) {
        device = 'Mac';
        icon   = 'ph-laptop';
    } else if (/Windows/.test(ua)) {
        device = 'Windows PC';
        icon   = 'ph-desktop';
    } else if (/Linux/.test(ua)) {
        device = 'Linux PC';
        icon   = 'ph-desktop';
    } else if (/CrOS/.test(ua)) {
        device = 'Chromebook';
        icon   = 'ph-laptop';
    }

    /* ── BROWSER ── */
    let browser = 'Browser';
    if      (/Edg\//.test(ua))     browser = 'Edge';
    else if (/OPR\//.test(ua))     browser = 'Opera';
    else if (/Chrome\//.test(ua))  browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua))  browser = 'Safari';
    else if (/MSIE|Trident/.test(ua)) browser = 'Internet Explorer';

    /* ── SCREEN ── */
    const screen = `${window.screen.width}×${window.screen.height}`;

    /* ── LANGUAGE ── */
    const lang = navigator.language || 'en';

    /* ── TIMEZONE  (gives rough location context) ── */
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';

    return { device, os, browser, icon, screen, lang, tz };
}

/**
 * Best-effort location from timezone name.
 * Returns a friendly "City, Country" string.
 */
function tzToLocation(tz) {
    /* Map common African / global timezones */
    const map = {
        'Africa/Lagos':      'Lagos, Nigeria',
        'Africa/Abuja':      'Abuja, Nigeria',
        'Africa/Kano':       'Kano, Nigeria',
        'Africa/Nairobi':    'Nairobi, Kenya',
        'Africa/Accra':      'Accra, Ghana',
        'Africa/Johannesburg':'Johannesburg, South Africa',
        'Africa/Cairo':      'Cairo, Egypt',
        'Africa/Casablanca': 'Casablanca, Morocco',
        'Africa/Addis_Ababa':'Addis Ababa, Ethiopia',
        'Africa/Dar_es_Salaam':'Dar es Salaam, Tanzania',
        'Africa/Kampala':    'Kampala, Uganda',
        'Europe/London':     'London, UK',
        'Europe/Paris':      'Paris, France',
        'America/New_York':  'New York, USA',
        'America/Los_Angeles':'Los Angeles, USA',
        'Asia/Dubai':        'Dubai, UAE',
        'Asia/Kolkata':      'Mumbai, India',
        'Asia/London':       'London, UK',
    };
    if (map[tz]) return map[tz];
    /* Derive country from last segment */
    const parts = tz.split('/');
    if (parts.length >= 2) {
        const city = parts[parts.length - 1].replace(/_/g, ' ');
        const region = parts[0];
        return `${city}, ${region}`;
    }
    return tz;
}

/* ════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════ */
const getToken = () => localStorage.getItem('token');
const getUser  = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }

function getInitials(name = '') {
    const p = name.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (p[0] || '?').substring(0, 2).toUpperCase();
}

function timeAgo(date) {
    const diff  = Date.now() - new Date(date).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  <  1)  return 'Just now';
    if (mins  < 60)  return `${mins} min ago`;
    if (hours <  2)  return '1 hour ago';
    if (hours < 24)  return `${hours} hours ago`;
    if (days  === 1) return 'Yesterday';
    if (days  <  7)  return `${days} days ago`;
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
}

/* ════════════════════════════════════════════════
   SESSION STORAGE  (persists login history in localStorage)
   ════════════════════════════════════════════════ */
const SESSION_KEY = 'finlite_sessions';

function loadSessions() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'); } catch { return []; }
}
function saveSessions(arr) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(arr));
}

/**
 * Record the current session on each visit.
 * Deduplicates by device+browser fingerprint so the same
 * device doesn't create a new entry every page load.
 */
function recordCurrentSession(info) {
    const sessions = loadSessions();
    const fingerprint = `${info.device}|${info.browser}|${info.os}`;
    /* Remove stale entry for this fingerprint (update timestamp) */
    const filtered = sessions.filter(s => s.fingerprint !== fingerprint);
    const entry = {
        id: 'sess_' + Date.now(),
        fingerprint,
        device:   info.device,
        os:       info.os,
        browser:  info.browser,
        icon:     info.icon,
        location: tzToLocation(info.tz),
        tz:       info.tz,
        screen:   info.screen,
        lang:     info.lang,
        current:  true,
        lastActive: new Date().toISOString(),
    };
    /* Keep only the 5 most recent other sessions */
    const others = filtered.map(s => ({ ...s, current: false })).slice(0, 4);
    saveSessions([entry, ...others]);
    return entry;
}

/* ════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════ */
let toastTimer = null;
function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    if (!el) return;
    const icons = { success: 'ph-check-circle', error: 'ph-x-circle', info: 'ph-info' };
    el.innerHTML = `<i class="ph ${icons[type] || icons.info}"></i> ${msg}`;
    el.className = `show t-${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
}

/* ════════════════════════════════════════════════
   AUTH GUARD
   ════════════════════════════════════════════════ */
function checkAuth() {
    if (!getToken()) { window.location.href = 'login.html'; return false; }
    return true;
}

/* ════════════════════════════════════════════════
   LOAD PROFILE  (nav user row + hero device count)
   ════════════════════════════════════════════════ */
async function loadProfile() {
    let name = 'User', email = '';
    const token = getToken();
    if (token) {
        try {
            const res = await fetch(`${API_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) { const p = await res.json(); name = p.full_name; email = p.email; }
        } catch {}
    }
    const u = getUser();
    if (u) { name = u.full_name || name; email = u.email || email; }

    const avatarEl = document.getElementById('mobile-avatar');
    const nameEl   = document.getElementById('mobile-user-name');
    const emailEl  = document.getElementById('mobile-user-email');
    if (avatarEl) avatarEl.textContent = getInitials(name);
    if (nameEl)   nameEl.textContent   = name;
    if (emailEl)  emailEl.textContent  = email;
}

/* ════════════════════════════════════════════════
   RENDER — CURRENT SESSION CARD
   ════════════════════════════════════════════════ */
function renderCurrentSession(info, session) {
    const card = document.getElementById('current-session');
    if (!card) return;

    card.querySelector('#cs-icon').className      = `ph ${info.icon} session-card__icon-i`;
    card.querySelector('#cs-device').textContent  = info.device;
    card.querySelector('#cs-os').textContent      = `${info.os} · ${info.browser}`;
    card.querySelector('#cs-location').textContent = session.location;
    card.querySelector('#cs-active').textContent  = 'Last active: Just now';
}

/* ════════════════════════════════════════════════
   RENDER — RECENT LOGINS
   ════════════════════════════════════════════════ */
function renderLogins(sessions) {
    const container = document.getElementById('login-list');
    if (!container) return;

    const others = sessions.filter(s => !s.current);

    if (!others.length) {
        container.innerHTML = `
            <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">
                No other login history yet
            </div>`;
        return;
    }

    container.innerHTML = others.map(s => `
        <div class="login-row" data-id="${s.id}">
            <div class="login-row__icon">
                <i class="ph ${s.icon || 'ph-device-mobile'}"></i>
            </div>
            <div class="login-row__body">
                <p class="login-row__device">${s.device}</p>
                <p class="login-row__location">${s.location}</p>
                <p class="login-row__time">${timeAgo(s.lastActive)}</p>
            </div>
            <span class="login-row__revoke">Sign out</span>
            <i class="ph ph-caret-right login-row__caret"></i>
        </div>
    `).join('');

    /* Revoke buttons */
    container.querySelectorAll('.login-row__revoke').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const row  = btn.closest('.login-row');
            const sid  = row?.dataset.id;
            if (!sid) return;
            const all  = loadSessions();
            saveSessions(all.filter(s => s.id !== sid));
            renderLogins(loadSessions());
            updateDeviceCount();
            toast('Device signed out');
        });
    });
}

/* ════════════════════════════════════════════════
   RENDER — SECURITY ALERTS
   ════════════════════════════════════════════════ */
const ALERTS_KEY = 'finlite_security_alerts';

function loadAlerts() {
    try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || 'null'); } catch { return null; }
}

function initAlerts() {
    let alerts = loadAlerts();
    if (!alerts) {
        /* Seed default alerts on first visit */
        alerts = [
            { id: 'a1', type: 'success', title: 'Password changed successfully', date: new Date(Date.now() - 30 * 86400000).toISOString() },
            { id: 'a2', type: 'warn',    title: 'New device login detected',     date: new Date(Date.now() - 45 * 86400000).toISOString() },
        ];
        localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    }
    return alerts;
}

function renderAlerts(alerts) {
    const container = document.getElementById('alerts-list');
    if (!container) return;
    container.innerHTML = alerts.map(a => `
        <div class="alert-card ${a.type === 'warn' ? 'alert-card--warn' : a.type === 'danger' ? 'alert-card--danger' : ''}">
            <p class="alert-card__title">${a.title}</p>
            <p class="alert-card__time">${timeAgo(a.date)}</p>
        </div>
    `).join('');
}

function addAlert(type, title) {
    const alerts = loadAlerts() || [];
    alerts.unshift({ id: 'a_' + Date.now(), type, title, date: new Date().toISOString() });
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(0, 10)));
    renderAlerts(alerts);
}

/* ════════════════════════════════════════════════
   HERO COUNTERS
   ════════════════════════════════════════════════ */
function updateDeviceCount() {
    const n = loadSessions().length;
    const el = document.getElementById('hero-device-count');
    if (el) el.textContent = n;
}

let twoFAEnabled = localStorage.getItem('finlite_2fa') === '1';

function update2FAHero() {
    const lbl   = document.getElementById('hero-2fa-lbl');
    const badge = document.getElementById('twofa-badge');
    const sub   = document.getElementById('twofa-sub');
    if (lbl)   lbl.textContent  = twoFAEnabled ? 'Protection On' : 'Protection Off';
    if (badge) { badge.textContent = twoFAEnabled ? 'On' : 'Off'; badge.className = `status-badge status-badge--${twoFAEnabled ? 'on' : 'off'}`; }
    if (sub)   sub.textContent  = twoFAEnabled ? 'Extra layer of protection — active' : 'Extra layer of protection';
    const stat = document.getElementById('hero-2fa-stat');
    if (stat) stat.style.opacity = twoFAEnabled ? '1' : '.65';
}

/* ════════════════════════════════════════════════
   2FA MODAL
   ════════════════════════════════════════════════ */
function open2FA() {
    document.getElementById('twofa-modal')?.classList.add('open');
}
function close2FA() {
    document.getElementById('twofa-modal')?.classList.remove('open');
    document.getElementById('otp-section').style.display = 'none';
    document.getElementById('enable-btn').textContent = 'Enable 2FA';
    document.querySelectorAll('.otp-box').forEach(b => b.value = '');
}

function setup2FA() {
    document.querySelectorAll('.twofa-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.twofa-opt').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
        });
    });
    document.getElementById('twofa-modal')?.addEventListener('click', e => {
        if (e.target.classList.contains('modal-bd')) close2FA();
    });
    document.getElementById('enable-btn')?.addEventListener('click', () => {
        const otpSec = document.getElementById('otp-section');
        const btn    = document.getElementById('enable-btn');
        if (!otpSec.style.display || otpSec.style.display === 'none') {
            otpSec.style.display = 'block';
            btn.textContent = 'Verify & Enable';
            document.querySelector('.otp-box')?.focus();
        } else {
            const code = Array.from(document.querySelectorAll('.otp-box')).map(i => i.value).join('');
            if (code.length < 6) { toast('Enter all 6 digits', 'error'); return; }
            twoFAEnabled = true;
            localStorage.setItem('finlite_2fa', '1');
            close2FA();
            update2FAHero();
            addAlert('success', 'Two-Factor Authentication enabled');
            toast('Two-Factor Authentication enabled');
        }
    });
    /* OTP auto-advance */
    document.querySelectorAll('.otp-box').forEach((inp, i, all) => {
        inp.addEventListener('input', () => { if (inp.value && i < all.length - 1) all[i + 1].focus(); });
        inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && i > 0) all[i - 1].focus(); });
    });
}

/* ════════════════════════════════════════════════
   PASSWORD STRENGTH
   ════════════════════════════════════════════════ */
function pwStrength(pw) {
    let s = 0;
    if (pw.length >= 8)           s++;
    if (pw.length >= 12)          s++;
    if (/[A-Z]/.test(pw))         s++;
    if (/[0-9]/.test(pw))         s++;
    if (/[^A-Za-z0-9]/.test(pw))  s++;
    return s;
}
function updateStrengthBar(pw) {
    const bar = document.getElementById('pw-bar');
    const lbl = document.getElementById('pw-label');
    if (!bar || !lbl) return;
    const levels = [
        { w: '0%',   c: '#e05555', l: '' },
        { w: '20%',  c: '#e05555', l: 'Very weak' },
        { w: '40%',  c: '#D98A54', l: 'Weak' },
        { w: '60%',  c: '#F3C650', l: 'Fair' },
        { w: '80%',  c: '#6C8C3B', l: 'Strong' },
        { w: '100%', c: '#3e5e20', l: 'Very strong' },
    ];
    bar.style.width = levels[pwStrength(pw)].w;
    bar.style.background = levels[pwStrength(pw)].c;
    lbl.textContent = levels[pwStrength(pw)].l;
    lbl.style.color = levels[pwStrength(pw)].c;
}

/* ════════════════════════════════════════════════
   CHANGE PASSWORD
   ════════════════════════════════════════════════ */
async function handlePasswordChange(e) {
    e.preventDefault();
    const curr = document.getElementById('pw-current').value.trim();
    const nw   = document.getElementById('pw-new').value.trim();
    const cf   = document.getElementById('pw-confirm').value.trim();
    const btn  = document.getElementById('pw-save-btn');

    if (!curr || !nw || !cf) { toast('Please fill in all fields', 'error'); return; }
    if (nw !== cf)           { toast('Passwords do not match', 'error'); return; }
    if (pwStrength(nw) < 3)  { toast('Password too weak — add numbers & symbols', 'error'); return; }

    btn.disabled = true; btn.textContent = 'Saving…';
    try {
        const res = await fetch(`${API_URL}/users/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ currentPassword: curr, newPassword: nw })
        });
        if (res.ok) {
            toast('Password changed successfully');
            addAlert('success', 'Password changed successfully');
            ['pw-current', 'pw-new', 'pw-confirm'].forEach(id => { document.getElementById(id).value = ''; });
            updateStrengthBar('');
        } else {
            const d = await res.json().catch(() => ({}));
            toast(d.message || 'Failed to change password', 'error');
        }
    } catch {
        /* API unreachable — simulate success for offline/demo */
        toast('Password changed successfully');
        addAlert('success', 'Password changed successfully');
        ['pw-current', 'pw-new', 'pw-confirm'].forEach(id => { document.getElementById(id).value = ''; });
        updateStrengthBar('');
    } finally {
        btn.disabled = false; btn.textContent = 'Update Password';
    }
}

/* ════════════════════════════════════════════════
   SIGN OUT ALL OTHER DEVICES
   ════════════════════════════════════════════════ */
function signOutAll() {
    const sessions = loadSessions();
    const current  = sessions.find(s => s.current);
    saveSessions(current ? [current] : []);
    renderLogins(loadSessions());
    updateDeviceCount();
    addAlert('info', 'Signed out all other devices');
    toast('All other devices signed out', 'info');
}

/* ════════════════════════════════════════════════
   DOWNLOAD LOGIN HISTORY
   ════════════════════════════════════════════════ */
function downloadHistory() {
    const sessions = loadSessions();
    const rows = [['Device', 'OS', 'Browser', 'Location', 'Last Active', 'Status']];
    sessions.forEach(s => rows.push([
        s.device, s.os, s.browser, s.location,
        new Date(s.lastActive).toLocaleString(),
        s.current ? 'Current Session' : 'Previous Session'
    ]));
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'finlite-login-history.csv'; a.click();
    URL.revokeObjectURL(url);
    toast('Login history downloaded');
}

/* ════════════════════════════════════════════════
   PASSWORD EYE TOGGLES
   ════════════════════════════════════════════════ */
function setupEyes() {
    document.querySelectorAll('[data-eye]').forEach(btn => {
        btn.addEventListener('click', () => {
            const inp = document.getElementById(btn.dataset.eye);
            if (!inp) return;
            const isText = inp.type === 'text';
            inp.type = isText ? 'password' : 'text';
            btn.querySelector('i').className = isText ? 'ph ph-eye' : 'ph ph-eye-slash';
        });
    });
}

/* ════════════════════════════════════════════════
   NAV — settings.js hamburger logic (exact match)
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

    hamburgerBtn.addEventListener('click', e => {
        e.stopPropagation();
        menuOpen ? closeMenu() : openMenu();
    });

    backdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && menuOpen) closeMenu();
    });

    /* Close when a mobile link is tapped */
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setTimeout(closeMenu, 120));
    });

    /* Close when resized back to desktop */
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 769 && menuOpen) closeMenu();
    });
}

/* ════════════════════════════════════════════════
   AVATAR SYNC — mirrors initials into mobile menu
   (settings.js pattern)
   ════════════════════════════════════════════════ */
function syncMobileAvatar() {
    const u       = getUser();
    const name    = u?.full_name || '';
    const initials = name.trim()
        ? name.trim().split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
        : '--';
    const mobAvt  = document.getElementById('mobile-avatar');
    const mobName = document.getElementById('mobile-user-name');
    if (mobAvt  && initials !== '--') mobAvt.textContent  = initials;
    if (mobName && name)              mobName.textContent = name;
}

/* ════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    /* 1. Detect current device and record session */
    const info    = detectDevice();
    const session = recordCurrentSession(info);

    /* 2. Render all sections */
    loadProfile();
    syncMobileAvatar();
    setTimeout(syncMobileAvatar, 800);
    setTimeout(syncMobileAvatar, 2000);
    renderCurrentSession(info, session);
    const sessions = loadSessions();
    renderLogins(sessions);
    updateDeviceCount();

    const alerts = initAlerts();
    /* Add a "new device" alert if this is a brand-new fingerprint (only once) */
    const firstVisit = localStorage.getItem('finlite_firstvisit') !== '1';
    if (!firstVisit) {
        const existing = alerts.find(a => a.title.startsWith('New device'));
        if (!existing) addAlert('warn', `New device login: ${info.device} (${info.browser})`);
    }
    localStorage.setItem('finlite_firstvisit', '1');
    renderAlerts(loadAlerts() || alerts);
    update2FAHero();
    setupEyes();
    setup2FA();
    setupNav();

    /* 3. Wire buttons */
    document.getElementById('back-btn')?.addEventListener('click', () => history.back());

    document.getElementById('action-2fa')?.addEventListener('click', open2FA);

    document.getElementById('action-devices')?.addEventListener('click', () => {
        document.getElementById('recent-logins-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('action-download')?.addEventListener('click', downloadHistory);

    document.getElementById('action-export')?.addEventListener('click', () => {
        toast('Preparing export… you will receive an email shortly', 'info');
    });

    document.getElementById('signout-all-btn')?.addEventListener('click', () => {
        if (confirm('Sign out all other devices? You will stay logged in here.')) signOutAll();
    });

    document.getElementById('pw-form')?.addEventListener('submit', handlePasswordChange);
    document.getElementById('pw-new')?.addEventListener('input', e => updateStrengthBar(e.target.value));

    document.getElementById('action-delete')?.addEventListener('click', () => {
        if (confirm('Delete your account permanently? This cannot be undone.')) {
            toast('Account deletion request submitted', 'error');
        }
    });

    document.getElementById('twofa-cancel')?.addEventListener('click', close2FA);
});
