import { API_URL } from './config.js';

// Helper for toasts
const showToast = (message, type = 'info') => {
    let backgroundColor;
    switch (type) {
        case 'success':
            backgroundColor = "linear-gradient(to right, #00b09b, #96c93d)";
            break;
        case 'error':
            backgroundColor = "linear-gradient(to right, #ff5f6d, #ffc371)";
            break;
        default:
            backgroundColor = "linear-gradient(to right, #667eea, #764ba2)";
    }
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
            background: backgroundColor,
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        },
    }).showToast();
};

// Get token from localStorage
const getToken = () => localStorage.getItem('token');
const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
};

// Check authentication — redirect to login if not logged in
function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Generate initials from full name
function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
}

// Load user profile from API
async function loadProfile() {
    const token = getToken();
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const profile = await response.json();
            // Update avatar section
            const avatarInitials = document.getElementById('avatar-initials');
            const avatarName = document.getElementById('avatar-name');
            const avatarEmail = document.getElementById('avatar-email');

            if (avatarInitials) avatarInitials.textContent = getInitials(profile.full_name);
            if (avatarName) avatarName.textContent = profile.full_name;
            if (avatarEmail) avatarEmail.textContent = profile.email;

            return profile;
        } else if (response.status === 401) {
            // Token expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to localStorage user data
        const user = getUser();
        if (user) {
            const avatarInitials = document.getElementById('avatar-initials');
            const avatarName = document.getElementById('avatar-name');
            const avatarEmail = document.getElementById('avatar-email');

            if (avatarInitials) avatarInitials.textContent = getInitials(user.full_name);
            if (avatarName) avatarName.textContent = user.full_name;
            if (avatarEmail) avatarEmail.textContent = user.email;
        }
    }
}

// Logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    loadProfile();
    setupLogout();
});


'use strict';

document.addEventListener('DOMContentLoaded', () => {

    /* ─────────────────────────────────────────
       1  HAMBURGER / MOBILE MENU
    ───────────────────────────────────────── */
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

    // Toggle on button click
    hamburgerBtn.addEventListener('click', e => {
        e.stopPropagation();
        menuOpen ? closeMenu() : openMenu();
    });

    // Close on backdrop tap
    backdrop.addEventListener('click', closeMenu);

    // Close on Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && menuOpen) closeMenu();
    });

    // Close when a mobile link is tapped
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setTimeout(closeMenu, 120));
    });

    // Close when resized back to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 769 && menuOpen) closeMenu();
    });


    // /* ─────────────────────────────────────────
    //   THEME TOGGLE  (Light / Dark)
    // ───────────────────────────────────────── */
    // const btnLight = document.getElementById('btnLight');
    // const btnDark  = document.getElementById('btnDark');

    // function applyTheme(theme) {
    //     document.documentElement.setAttribute('data-theme', theme);
    //     localStorage.setItem('finlite_theme', theme);
    //     btnLight.classList.toggle('active', theme === 'light');
    //     btnDark.classList.toggle('active',  theme === 'dark');
    // }

    // // Restore saved preference on load
    // const savedTheme = localStorage.getItem('finlite_theme') || 'light';
    // applyTheme(savedTheme);

    // btnLight.addEventListener('click', () => applyTheme('light'));
    // btnDark.addEventListener('click',  () => applyTheme('dark));


    /* ─────────────────────────────────────────
       AVATAR SYNC
       Mirrors initials from the main avatar card
       into the mobile menu user row
    ───────────────────────────────────────── */
    function syncMobileAvatar() {
        const initEl  = document.getElementById('avatar-initials');
        const nameEl  = document.getElementById('avatar-name');
        const mobAvt  = document.getElementById('mobile-avatar');
        const mobName = document.getElementById('mobile-user-name');

        const initials = initEl && initEl.textContent.trim() !== '--'
            ? initEl.textContent.trim()
            : null;

        const name = nameEl && nameEl.textContent.trim() !== 'Loading...'
            ? nameEl.textContent.trim()
            : null;

        if (initials && mobAvt)  mobAvt.textContent  = initials;
        if (name     && mobName) mobName.textContent = name;
    }

    // Run immediately, then again after async profile load
    syncMobileAvatar();
    setTimeout(syncMobileAvatar, 800);
    setTimeout(syncMobileAvatar, 2000);

});


