'use strict';
        document.addEventListener('DOMContentLoaded', () => {

            // ── Hamburger ──
            const hamburgerBtn = document.getElementById('hamburgerBtn');
            const mobileMenu   = document.getElementById('mobileMenu');
            const backdrop     = document.getElementById('backdrop');
            let menuOpen = false;

            function openMenu() {
                menuOpen = true;
                hamburgerBtn.classList.add('open');
                hamburgerBtn.setAttribute('aria-expanded', 'true');
                mobileMenu.classList.add('open');
                mobileMenu.setAttribute('aria-hidden', 'false');
                backdrop.classList.add('visible');
                document.body.style.overflow = 'hidden';
            }
            function closeMenu() {
                menuOpen = false;
                hamburgerBtn.classList.remove('open');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.remove('open');
                mobileMenu.setAttribute('aria-hidden', 'true');
                backdrop.classList.remove('visible');
                document.body.style.overflow = '';
            }

            hamburgerBtn.addEventListener('click', e => { e.stopPropagation(); menuOpen ? closeMenu() : openMenu(); });
            backdrop.addEventListener('click', closeMenu);
            document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) closeMenu(); });
            mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setTimeout(closeMenu, 120)));
            window.addEventListener('resize', () => { if (window.innerWidth >= 769 && menuOpen) closeMenu(); });
        });