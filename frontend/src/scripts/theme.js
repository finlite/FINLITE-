// Theme Manager - handles light/dark mode across the application
// This script can be included on any page that needs theme support.

(function () {
    'use strict';

    const THEME_KEY = 'finlite-theme';

    // Apply saved theme immediately (before DOM loads to prevent flash)
    function applySavedTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        return savedTheme;
    }

    // Set theme and save preference
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        updateToggleButtons(theme);
    }

    // Update toggle button active states
    function updateToggleButtons(theme) {
        const lightBtn = document.getElementById('theme-light');
        const darkBtn = document.getElementById('theme-dark');

        if (lightBtn && darkBtn) {
            if (theme === 'dark') {
                darkBtn.classList.add('active');
                lightBtn.classList.remove('active');
            } else {
                lightBtn.classList.add('active');
                darkBtn.classList.remove('active');
            }
        }
    }

    // Apply theme immediately
    const currentTheme = applySavedTheme();

    // Set up toggle buttons when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        updateToggleButtons(currentTheme);

        const lightBtn = document.getElementById('theme-light');
        const darkBtn = document.getElementById('theme-dark');

        if (lightBtn) {
            lightBtn.addEventListener('click', () => setTheme('light'));
        }
        if (darkBtn) {
            darkBtn.addEventListener('click', () => setTheme('dark'));
        }
    });

    // Expose globally for other scripts
    window.FinliteTheme = { setTheme, applySavedTheme };
})();
