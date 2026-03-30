import { API_URL } from './config.js';

const form = document.getElementById('support-form');
const submitButton = document.getElementById('support-submit');
const latestTicketCard = document.getElementById('latest-ticket-card');
const latestTicketSubject = document.getElementById('latest-ticket-subject');
const latestTicketMessage = document.getElementById('latest-ticket-message');
const latestTicketId = document.getElementById('latest-ticket-id');

const getToken = () => localStorage.getItem('token');

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
};

const showToast = (message, type = 'info') => {
    if (typeof Toastify !== 'function') return;

    const background = type === 'error'
        ? 'linear-gradient(to right, #ff5f6d, #ffc371)'
        : 'linear-gradient(to right, #00b09b, #96c93d)';

    Toastify({
        text: message,
        duration: 3000,
        gravity: 'top',
        position: 'center',
        stopOnFocus: true,
        style: { background, borderRadius: '10px' }
    }).showToast();
};

const redirectToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

const syncMobileUser = (profile = getStoredUser()) => {
    const mobAvt = document.getElementById('mobile-avatar');
    const mobName = document.getElementById('mobile-user-name');
    const fullName = profile.full_name?.trim();

    if (!fullName) return;

    const initials = fullName
        .split(/\s+/)
        .map((word) => word[0] || '')
        .join('')
        .substring(0, 2)
        .toUpperCase();

    if (mobAvt) mobAvt.textContent = initials || '--';
    if (mobName) mobName.textContent = fullName;
};

const setupNav = () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const backdrop = document.getElementById('backdrop');
    let menuOpen = false;

    const openMenu = () => {
        menuOpen = true;
        hamburgerBtn.classList.add('open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        mobileMenu.classList.add('open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        backdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
        menuOpen = false;
        hamburgerBtn.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        backdrop.classList.remove('visible');
        document.body.style.overflow = '';
    };

    hamburgerBtn?.addEventListener('click', (event) => {
        event.stopPropagation();
        menuOpen ? closeMenu() : openMenu();
    });

    backdrop?.addEventListener('click', closeMenu);
    mobileMenu?.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setTimeout(closeMenu, 120));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuOpen) {
            closeMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 769 && menuOpen) {
            closeMenu();
        }
    });
};

const wireBackButton = () => {
    const button = document.getElementById('help-back-button');
    if (!button) return;

    button.addEventListener('click', () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        window.location.href = 'settings.html';
    });
};

const populateProfile = async () => {
    const token = getToken();
    const storedUser = getStoredUser();
    syncMobileUser(storedUser);

    if (!token) {
        redirectToLogin();
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            redirectToLogin();
            return null;
        }

        if (!response.ok) {
            throw new Error('Unable to load profile');
        }

        const profile = await response.json();
        localStorage.setItem('user', JSON.stringify(profile));
        syncMobileUser(profile);

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        if (nameInput && !nameInput.value) nameInput.value = profile.full_name || '';
        if (emailInput && !emailInput.value) emailInput.value = profile.email || '';

        return profile;
    } catch (error) {
        console.error('Error loading help profile:', error);
        if (storedUser.full_name) {
            document.getElementById('name').value = storedUser.full_name;
        }
        if (storedUser.email) {
            document.getElementById('email').value = storedUser.email;
        }
        return storedUser;
    }
};

const renderLatestTicket = (tickets) => {
    if (!latestTicketCard) return;
    if (!Array.isArray(tickets) || tickets.length === 0) {
        latestTicketCard.classList.add('hidden');
        return;
    }

    const latest = [...tickets].sort((a, b) => Number(b.support_id || 0) - Number(a.support_id || 0))[0];
    latestTicketSubject.textContent = latest.subject || 'Support request';
    latestTicketMessage.textContent = latest.message || 'Your latest support request is on file.';
    latestTicketId.textContent = `Ticket #${latest.support_id}`;
    latestTicketCard.classList.remove('hidden');
};

const loadTickets = async () => {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/support`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            redirectToLogin();
            return;
        }

        const data = await response.json().catch(() => []);
        if (!response.ok) {
            throw new Error(data.message || 'Unable to load support tickets');
        }

        renderLatestTicket(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error('Error loading support tickets:', error);
    }
};

const submitSupportMessage = async (event) => {
    event.preventDefault();
    const token = getToken();
    if (!token) {
        redirectToLogin();
        return;
    }

    const full_name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!full_name || !email || !subject || !message) {
        showToast('Please complete all fields before sending.', 'error');
        return;
    }

    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    try {
        const response = await fetch(`${API_URL}/support`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ full_name, email, subject, message })
        });

        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
            redirectToLogin();
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || 'Unable to send message');
        }

        showToast('Your support message has been sent.', 'success');
        renderLatestTicket([{ support_id: data.ticketId, subject, message }]);
        form.reset();

        const user = getStoredUser();
        if (user.full_name) document.getElementById('name').value = user.full_name;
        if (user.email) document.getElementById('email').value = user.email;

        await loadTickets();
    } catch (error) {
        console.error('Error creating support ticket:', error);
        showToast(error.message || 'Unable to send message', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    setupNav();
    wireBackButton();
    await populateProfile();
    await loadTickets();
    form?.addEventListener('submit', submitSupportMessage);
});
