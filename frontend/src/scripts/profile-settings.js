'use strict';

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
}

function getOpenHoursFromForm() {
    return DAYS.reduce((hours, day) => {
        const isOpen = document.getElementById(`chk-${day}`).checked;
        hours[day] = {
            is_open: isOpen,
            opens: isOpen ? document.getElementById(`open-${day}`).value || null : null,
            closes: isOpen ? document.getElementById(`close-${day}`).value || null : null
        };
        return hours;
    }, {});
}

function applyOpenHours(hours = {}) {
    DAYS.forEach((day) => {
        const config = hours[day] || {};
        document.getElementById(`chk-${day}`).checked = Boolean(config.is_open);
        document.getElementById(`open-${day}`).value = config.opens || '';
        document.getElementById(`close-${day}`).value = config.closes || '';
        toggleDay(day);
    });
}

function collectBusinessPayload() {
    return {
        business_name: document.getElementById('fieldBizName').value.trim() || null,
        address: document.getElementById('fieldAddress').value.trim(),
        business_type: document.getElementById('fieldBizType').value || null,
        business_email: document.getElementById('fieldEmail').value.trim() || null,
        business_phone: document.getElementById('fieldPhone').value.trim() || null,
        registration_date: document.getElementById('fieldRegDate').value || null,
        open_hours: getOpenHoursFromForm(),
        online_prescence: {}
    };
}

function applyProfileData(profile) {
    document.getElementById('fieldName').value = profile.full_name || '';
    document.getElementById('fieldEmail').value = profile.email || '';
    document.getElementById('fieldPhone').value = profile.phone || '';
    updateHeroName(profile.full_name || '');
    updateAvatar(profile.photo_data_url, profile.full_name || '');
    applyMembership(profile);
}

function applyMembership(profile) {
    const badge = document.querySelector('.hero__badge');
    const premiumTitle = document.querySelector('.premium-banner__title');
    const premiumSub = document.querySelector('.premium-banner__sub');
    const premiumDesc = document.querySelector('.premium-banner__desc');
    const statValues = document.querySelectorAll('.stat__val');

    const isPremium = Boolean(profile.is_premium_member);
    const startDate = profile.premium_start_date || profile.created_at;
    const start = startDate ? new Date(startDate) : null;
    const daysActive = start && !Number.isNaN(start.getTime())
        ? Math.max(1, Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)))
        : '—';

    badge.innerHTML = `<i class="ph-fill ph-star"></i> ${isPremium ? 'Premium Member' : 'Standard Member'}`;
    premiumTitle.textContent = isPremium ? 'Premium Member' : 'Finlite Account';
    premiumSub.textContent = start && !Number.isNaN(start.getTime())
        ? `Active since ${start.toLocaleDateString([], { month: 'short', year: 'numeric' })}`
        : 'Activation date unavailable';
    premiumDesc.textContent = isPremium
        ? 'Enjoy unlimited transactions, advanced analytics, and priority support.'
        : 'Upgrade to premium for advanced analytics, unlimited transactions, and priority support.';

    if (statValues[2]) {
        statValues[2].textContent = daysActive;
    }
}

function applyTransactionStats(rows = []) {
    const statValues = document.querySelectorAll('.stat__val');
    const salesTotal = rows
        .filter((row) => row.category === 'sale')
        .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    if (statValues[0]) {
        statValues[0].textContent = rows.length ? formatCurrency(salesTotal) : '—';
    }
    if (statValues[1]) {
        statValues[1].textContent = rows.length ? String(rows.length) : '—';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0
    }).format(Number(amount || 0));
}

function applyBusinessData(business = {}) {
    document.getElementById('fieldBizName').value = business.business_name || '';
    document.getElementById('fieldAddress').value = business.address || '';
    document.getElementById('fieldBizType').value = business.business_type || '';
    document.getElementById('fieldRegDate').value = business.registration_date ? String(business.registration_date).slice(0, 10) : '';

    document.getElementById('editBizName').value = business.business_name || '';
    document.getElementById('editBizAddr').value = business.address || '';
    document.getElementById('editBizType').value = business.business_type || '';

    updateHeroBusinessName(business.business_name || '');
    applyOpenHours(business.open_hours || {});
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, options);
    if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        throw new Error('Authentication required');
    }

    if (response.status === 404) {
        return null;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
}

async function loadData() {
    try {
        const [profile, business] = await Promise.all([
            apiRequest('/users/profile', { headers: getAuthHeaders() }),
            apiRequest('/business', { headers: getAuthHeaders() })
        ]);

        if (profile) {
            applyProfileData(profile);
        }

        if (business) {
            applyBusinessData(business);
        } else {
            applyOpenHours();
        }

        try {
            const rows = await apiRequest('/transactions', { headers: getAuthHeaders() });
            applyTransactionStats(Array.isArray(rows) ? rows : []);
        } catch (statsError) {
            console.error('Error loading profile stats:', statsError);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showToast(error.message || 'Unable to load profile settings');
    }
}

async function saveAll() {
    const name = document.getElementById('fieldName').value.trim();
    const email = document.getElementById('fieldEmail').value.trim();
    const phone = document.getElementById('fieldPhone').value.trim();

    if (!name || !email) {
        showToast('Full name and email are required');
        return;
    }

    try {
        const [profile] = await Promise.all([
            apiRequest('/users/profile', {
                method: 'PUT',
                headers: getAuthHeaders(true),
                body: JSON.stringify({
                    full_name: name,
                    email,
                    phone,
                    photo_data_url: currentPhotoDataUrl
                })
            }),
            apiRequest('/business', {
                method: 'PUT',
                headers: getAuthHeaders(true),
                body: JSON.stringify(collectBusinessPayload())
            })
        ]);

        let storedUser = {};
        try {
            storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            storedUser = {};
        }

        localStorage.setItem('user', JSON.stringify({
            ...storedUser,
            ...(profile || {}),
            full_name: name,
            email,
            phone,
            photo_data_url: currentPhotoDataUrl
        }));

        updateHeroName(name);
        updateAvatar(currentPhotoDataUrl, name);
        updateHeroBusinessName(document.getElementById('fieldBizName').value.trim());
        if (profile) {
            applyMembership(profile);
        }
        showToast('Profile details saved');
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast(error.message || 'Unable to save profile details');
    }
}

function openBizSheet() {
    document.getElementById('editBizName').value = document.getElementById('fieldBizName').value;
    document.getElementById('editBizAddr').value = document.getElementById('fieldAddress').value;
    document.getElementById('editBizType').value = document.getElementById('fieldBizType').value;
    document.getElementById('bizOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeOverlay(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
}

function closeSheet(e, id) {
    if (e.target === document.getElementById(id)) {
        closeOverlay(id);
    }
}

async function saveBusiness() {
    document.getElementById('fieldBizName').value = document.getElementById('editBizName').value.trim();
    document.getElementById('fieldAddress').value = document.getElementById('editBizAddr').value.trim();
    document.getElementById('fieldBizType').value = document.getElementById('editBizType').value;
    updateHeroBusinessName(document.getElementById('fieldBizName').value);

    try {
        await apiRequest('/business', {
            method: 'PUT',
            headers: getAuthHeaders(true),
            body: JSON.stringify(collectBusinessPayload())
        });

        closeOverlay('bizOverlay');
        showToast('Business profile updated');
    } catch (error) {
        console.error('Error saving business:', error);
        showToast(error.message || 'Unable to update business profile');
    }
}

function confirmLogout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('finlite_tx');
        showToast('Logging out...');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 800);
    }
}

function setupAvatarPreview() {
    document.getElementById('avatar-input').addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            updateAvatar(e.target.result, document.getElementById('fieldName').value.trim());
        };
        reader.readAsDataURL(file);
    });
}

function setupLiveSync() {
    document.getElementById('fieldName').addEventListener('input', function () {
        updateHeroName(this.value.trim());
    });

    document.getElementById('fieldBizName').addEventListener('input', function () {
        updateHeroBusinessName(this.value.trim());
    });
}

function setupNav() {
    const hb = document.getElementById('hamburgerBtn');
    const bd = document.getElementById('backdrop');

    hb.addEventListener('click', (e) => {
        e.stopPropagation();
        navOpen ? closeNav() : openNav();
    });
    bd.addEventListener('click', closeNav);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeNav();
            document.querySelectorAll('.edit-overlay.open').forEach((overlay) => overlay.classList.remove('open'));
            document.body.style.overflow = '';
        }
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 769 && navOpen) closeNav();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    setupNav();
    setupAvatarPreview();
    setupLiveSync();
    loadData();
});

window.toggleDay = toggleDay;
window.saveAll = saveAll;
window.openBizSheet = openBizSheet;
window.closeOverlay = closeOverlay;
window.closeSheet = closeSheet;
window.saveBusiness = saveBusiness;
window.confirmLogout = confirmLogout;
