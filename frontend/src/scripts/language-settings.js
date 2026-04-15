'use strict';

import { API_URL } from './config.js';

const LANGS = {
    en: { name: 'English', native: 'English', flagKey: 'gb', region: 'west', date: 'DD/MM/YYYY', currency: '₦ (Nigerian Naira)', num: '1,234.56' },
    yo: { name: 'Yoruba', native: 'Yorùbá', flagKey: 'ng', region: 'west', date: 'DD/MM/YYYY', currency: '₦ (Nigerian Naira)', num: '1.234,56' },
    ig: { name: 'Igbo', native: 'Asụsụ Igbo', flagKey: 'ng', region: 'west', date: 'DD/MM/YYYY', currency: '₦ (Nigerian Naira)', num: '1,234.56' },
    ha: { name: 'Hausa', native: 'Hausa', flagKey: 'ng', region: 'west', date: 'DD/MM/YYYY', currency: '₦ (Nigerian Naira)', num: '1,234.56' },
    fr: { name: 'French', native: 'Français', flagKey: 'fr', region: 'west', date: 'DD/MM/YYYY', currency: 'XOF (CFA Franc)', num: '1 234,56' },
    sw: { name: 'Swahili', native: 'Kiswahili', flagKey: 'ke', region: 'east', date: 'DD/MM/YYYY', currency: 'KSh (Kenyan Shilling)', num: '1,234.56' },
    am: { name: 'Amharic', native: 'አማርኛ', flagKey: 'et', region: 'east', date: 'DD/MM/YYYY', currency: 'ETB (Ethiopian Birr)', num: '1,234.56' },
    zu: { name: 'Zulu', native: 'isiZulu', flagKey: 'za', region: 'south', date: 'YYYY/MM/DD', currency: 'R (South African Rand)', num: '1 234,56' },
    xh: { name: 'Xhosa', native: 'isiXhosa', flagKey: 'za', region: 'south', date: 'YYYY/MM/DD', currency: 'R (South African Rand)', num: '1 234,56' }
};

const T = {
    hero_title: { en: 'Choose Your Language', yo: 'Yan Ede Rẹ', ig: 'Họrọ Asụsụ Gị', ha: 'Zaɓi Yarenka', fr: 'Choisissez Votre Langue', sw: 'Chagua Lugha Yako', am: 'ቋንቋወን ይምረጡ', zu: 'Khetha Ulimi Lwakho', xh: 'Khetha Ulwimi Lwakho' },
    hero_sub: { en: "Select the language you're most comfortable with", yo: 'Yan ede ti o ro rọ̀n jùlọ', ig: 'Họrọ asụsụ ọ dị mma', ha: 'Zaɓi harshen da kake jin daɗi', fr: "Sélectionnez la langue avec laquelle vous êtes le plus à l'aise", sw: 'Chagua lugha unayoijua vizuri', am: 'የሚያምድወትን ቋንቋ ይምረጡ', zu: 'Khetha ulimi olukwaziyo', xh: 'Khetha ulwimi owazi' },
    fav_label: { en: 'Favorite Languages', yo: 'Awon Ede Ayanfẹ', ig: 'Asụsụ Ndị Ahọrọ', ha: 'Harsunan da ake so', fr: 'Langues Favorites', sw: 'Lugha Zinazopendelewa', am: 'ተወዳጅ ቋንቋዎች', zu: 'Izilimi Ezikhethiwe', xh: 'Iilwimi Ezithandwayo' },
    west_africa: { en: 'West Africa', yo: 'Iwo-Oorun Afirika', ig: 'Ọdịda Anyanwụ Afurika', ha: 'Yammacin Afirka', fr: "Afrique de l'Ouest", sw: 'Afrika Magharibi', am: 'ምዕራብ አፍሪካ', zu: 'Ntshonalanga Afrika', xh: 'Ntshona Afrika' },
    east_africa: { en: 'East Africa', yo: 'Ila-Oorun Afirika', ig: 'Ọwụwa Anyanwụ Afrika', ha: 'Gabashin Afirka', fr: "Afrique de l'Est", sw: 'Afrika Mashariki', am: 'ምሥራቅ አፍሪካ', zu: 'Mpumalanga Afrika', xh: 'Mpuma Afrika' },
    south_africa: { en: 'Southern Africa', yo: 'Guusu Afirika', ig: 'Ndịda Afirika', ha: 'Kudancin Afirka', fr: 'Afrique Australe', sw: 'Afrika Kusini', am: 'ደቡብ አፍሪካ', zu: 'Ningizimu Afrika', xh: 'Mzantsi Afrika' },
    regional_format: { en: 'Regional Format', yo: 'Ọna Agbegbe', ig: 'Usoro Mpaghara', ha: 'Tsarin Yanki', fr: 'Format Régional', sw: 'Muundo wa Kikanda', am: 'የክሉ ቅርጸት', zu: 'Ifomathi Yesifunda', xh: 'Ifomati Yesithili' },
    date_format: { en: 'Date Format', yo: 'Ọna Ọjọ', ig: 'Ụdị Ụbọchị', ha: 'Tsarin kwanan wata', fr: 'Format de date', sw: 'Muundo wa Tarehe', am: 'የቀን ቅርጸት', zu: 'Ifomathi Yosuku', xh: 'Ifomati Yomhla' },
    currency_display: { en: 'Currency Display', yo: 'Àfihàn Owó', ig: 'Ngosipụta Ego', ha: 'Nuna Kuɗi', fr: 'Affichage de la devise', sw: 'Onyesho la Sarafu', am: 'የምንዛሬ ማሳያ', zu: 'Ukuboniswa Kwemali', xh: 'Umboniso Wemali' },
    number_format: { en: 'Number Format', yo: 'Ọna Nọ́ǹbà', ig: 'Ụdị Nọ́ǹbà', ha: 'Tsarin lamba', fr: 'Format de nombre', sw: 'Muundo wa Nambari', am: 'የቁጥር ቅርጸት', zu: 'Ifomathi Yenombolo', xh: 'Ifomati Yenombolo' },
    change: { en: 'Change', yo: 'Yipada', ig: 'Gbanwee', ha: 'Canza', fr: 'Changer', sw: 'Badilisha', am: 'ቀይር', zu: 'Shintsha', xh: 'Tshintsha' },
    translation_settings: { en: 'Translation Settings', yo: 'Eto Itumọ', ig: 'Ntọala Ntughari', ha: 'Saitunan fassara', fr: 'Paramètres de traduction', sw: 'Mipangilio ya Tafsiri', am: 'የትርጉም ቅንብሮች', zu: 'Izilungiselelo Zokuhumusha', xh: 'Iimeko Zokuguqulela' },
    auto_translate: { en: 'Auto-Translate', yo: 'Itumọ Adasẹ', ig: 'Ntughari Akpaaka', ha: 'Fassara atomatik', fr: 'Traduction automatique', sw: 'Tafsiri Moja kwa Moja', am: 'ራስ-ሰር ትርጉም', zu: 'Ukuhumusha Ngokwezenzo', xh: 'Ukuguqulela Ngokwezenzo' },
    auto_translate_desc: { en: 'Translate content automatically', yo: 'Tumọ akoonu laifọwọyi', ig: 'Tụgharịa ọdịnaya na-akpaaka', ha: 'Fassara abubuwa ta atomatik', fr: 'Traduire le contenu automatiquement', sw: 'Tafsiri maudhui moja kwa moja', am: 'ይዘቱን በራስ-ሰር ይተርጉሙ', zu: 'Humusha okuqukethwe ngokwezenzo', xh: 'Guqulela umxholo ngokwezenzo' },
    show_original: { en: 'Show Original Text', yo: 'Ṣe afihàn Ọrọ Atileba', ig: 'Gosipụta Ọ Bụ Nnụnụ', ha: 'Nuna asalin rubutu', fr: 'Afficher le texte original', sw: 'Onyesha Maandishi ya Awali', am: 'ዋናውን ጽሁፍ አሳይ', zu: 'Bonisa Umbhalo Wokuqala', xh: 'Bonisa Isicatshulwa Sokuqala' },
    show_original_desc: { en: 'Display original alongside translation', yo: 'Ṣe afihàn atilẹba lẹgbẹ̀ẹ́ itumo', ig: 'Gosipụta mbụ na ntughari', ha: 'Nuna asali tare da fassara', fr: "Afficher l'original à côté de la traduction", sw: 'Onyesha asili pamoja na tafsiri', am: 'ዋናውን ከትርጉም ጎን ያሳዩ', zu: 'Bonisa umsuka eduze kokuhunyushwa', xh: 'Bonisa isicatshulwa ekuguqulelweni' }
};

const FAV_KEYS = ['en', 'yo', 'ig', 'ha', 'fr', 'sw', 'am'];
const DATE_OPTS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD', 'YYYY-MM-DD'];
const CURR_OPTS = ['₦ (Nigerian Naira)', 'KSh (Kenyan Shilling)', 'R (South African Rand)', 'GHS (Ghanaian Cedi)', 'XOF (CFA Franc)', 'ETB (Ethiopian Birr)'];
const NUM_OPTS = ['1,234.56', '1.234,56', '1 234,56', '1234.56'];

let activeLang = 'en';
let curModal = null;
let toastTmr;
let menuOpen = false;
const downloaded = new Set(['en', 'yo', 'sw', 'ha']);
const choices = { date: 'DD/MM/YYYY', currency: '₦ (Nigerian Naira)', number: '1,234.56' };

function getToken() {
    return localStorage.getItem('token');
}

function getAuthHeaders(withJson = false) {
    const headers = { Authorization: `Bearer ${getToken()}` };
    if (withJson) headers['Content-Type'] = 'application/json';
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

function t(key, lang) {
    return (T[key] && T[key][lang]) || (T[key] && T[key].en) || key;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTmr);
    toastTmr = setTimeout(() => toast.classList.remove('show'), 2600);
}

function countryCodeToEmoji(code) {
    return String(code || '')
        .toUpperCase()
        .split('')
        .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
        .join('');
}

function mkFavFlag(flagKey) {
    return `<div class="fav-card__flag-wrap"><span aria-hidden="true" style="font-size:32px;line-height:1;">${countryCodeToEmoji(flagKey)}</span></div>`;
}

function mkRowFlag(flagKey) {
    return `<div class="lang-row__flag-wrap"><span aria-hidden="true" style="font-size:24px;line-height:1;">${countryCodeToEmoji(flagKey)}</span></div>`;
}

function applyI18n(lang) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = t(el.dataset.i18n, lang);
    });
}

function renderFavs() {
    const container = document.getElementById('favScroll');
    container.innerHTML = '';
    FAV_KEYS.forEach((code) => {
        const lang = LANGS[code];
        const selected = code === activeLang;
        const div = document.createElement('div');
        div.className = `fav-card${selected ? ' selected' : ''}`;
        div.innerHTML = `${mkFavFlag(lang.flagKey)}<span class="fav-card__name">${lang.name}</span><span class="fav-card__nat">${lang.native}</span><span class="fav-card__tick"><i class="ph-fill ph-check"></i></span>`;
        div.onclick = () => selectLang(code);
        container.appendChild(div);
    });
}

function renderList(id, region) {
    const container = document.getElementById(id);
    container.innerHTML = '';
    Object.entries(LANGS)
        .filter(([, value]) => value.region === region)
        .forEach(([code, lang]) => {
            const isActive = code === activeLang;
            const isDownloaded = downloaded.has(code);
            const row = document.createElement('div');
            row.className = `lang-row${isActive ? ' active' : ''}`;
            row.innerHTML = `${mkRowFlag(lang.flagKey)}<div class="lang-row__info"><p class="lang-row__name">${lang.name}</p><p class="lang-row__nat">${lang.native}</p></div><div class="lang-row__action">${isDownloaded ? '<div class="lang-row__check"><i class="ph-fill ph-check"></i></div>' : '<div class="lang-row__dl"><i class="ph ph-download-simple"></i></div>'}</div>`;
            row.onclick = () => selectLang(code);
            container.appendChild(row);
        });
}

function renderAll() {
    renderFavs();
    renderList('westList', 'west');
    renderList('eastList', 'east');
    renderList('southList', 'south');
}

function syncPreferenceFields() {
    document.getElementById('dateVal').textContent = choices.date;
    document.getElementById('currencyVal').textContent = choices.currency;
    document.getElementById('numberVal').textContent = choices.number;
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, options);
    if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        throw new Error('Authentication required');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
}

async function savePreferences(showMessage = false) {
    try {
        await apiRequest('/users/preferences', {
            method: 'PUT',
            headers: getAuthHeaders(true),
            body: JSON.stringify({
                preferred_language: activeLang,
                date_format: choices.date,
                currency_display: choices.currency,
                number_format: choices.number,
                auto_translate: document.getElementById('autoTog').checked,
                show_original_text: document.getElementById('origTog').checked
            })
        });

        if (showMessage) {
            showToast('Language settings updated');
        }
    } catch (error) {
        console.error('Error saving preferences:', error);
        showToast(error.message || 'Unable to save language settings');
    }
}

async function loadPreferences() {
    try {
        const preferences = await apiRequest('/users/preferences', {
            headers: getAuthHeaders()
        });

        activeLang = preferences.preferred_language || 'en';
        choices.date = preferences.date_format || choices.date;
        choices.currency = preferences.currency_display || choices.currency;
        choices.number = preferences.number_format || choices.number;
        document.getElementById('autoTog').checked = preferences.auto_translate !== false;
        document.getElementById('origTog').checked = Boolean(preferences.show_original_text);
        downloaded.add(activeLang);
        syncPreferenceFields();
        renderAll();
        applyI18n(document.getElementById('autoTog').checked ? activeLang : 'en');
    } catch (error) {
        console.error('Error loading preferences:', error);
        renderAll();
        syncPreferenceFields();
        applyI18n('en');
        showToast(error.message || 'Unable to load language settings');
    }
}

function selectLang(code) {
    if (code === activeLang) return;
    activeLang = code;
    downloaded.add(code);
    const lang = LANGS[code];
    choices.date = lang.date;
    choices.currency = lang.currency;
    choices.number = lang.num;
    syncPreferenceFields();
    renderAll();
    if (document.getElementById('autoTog').checked) {
        applyI18n(code);
    }
    savePreferences(true);
}

function openModal(type) {
    curModal = type;
    const titles = { date: 'Date Format', currency: 'Currency Display', number: 'Number Format' };
    const options = { date: DATE_OPTS, currency: CURR_OPTS, number: NUM_OPTS };
    const valueKeys = { date: 'date', currency: 'currency', number: 'number' };

    document.getElementById('modalTitle').textContent = titles[type];
    const optsEl = document.getElementById('modalOpts');
    optsEl.innerHTML = '';

    options[type].forEach((option) => {
        const chosen = choices[valueKeys[type]] === option;
        const el = document.createElement('div');
        el.className = `modal__opt${chosen ? ' chosen' : ''}`;
        el.innerHTML = `<span class="modal__opt-text">${option}</span><i class="ph-fill ph-check modal__opt-chk"></i>`;
        el.onclick = () => {
            optsEl.querySelectorAll('.modal__opt').forEach((node) => node.classList.remove('chosen'));
            el.classList.add('chosen');
            choices[valueKeys[type]] = option;
            syncPreferenceFields();
            savePreferences(true);
        };
        optsEl.appendChild(el);
    });

    document.getElementById('modalOv').classList.add('open');
}

function closeModal() {
    document.getElementById('modalOv').classList.remove('open');
    curModal = null;
}

function closeModalOutside(e) {
    if (e.target === document.getElementById('modalOv')) {
        closeModal();
    }
}

function openMenu() {
    const hb = document.getElementById('hamburgerBtn');
    const mm = document.getElementById('mobileMenu');
    const bd = document.getElementById('backdrop');

    menuOpen = true;
    hb.classList.add('open');
    hb.setAttribute('aria-expanded', 'true');
    mm.classList.add('open');
    mm.setAttribute('aria-hidden', 'false');
    bd.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    const hb = document.getElementById('hamburgerBtn');
    const mm = document.getElementById('mobileMenu');
    const bd = document.getElementById('backdrop');

    menuOpen = false;
    hb.classList.remove('open');
    hb.setAttribute('aria-expanded', 'false');
    mm.classList.remove('open');
    mm.setAttribute('aria-hidden', 'true');
    bd.classList.remove('visible');
    document.body.style.overflow = '';
}

function syncMobileUser() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const name = user.full_name || 'Finlite User';
        document.getElementById('mobile-user-name').textContent = name;
        document.getElementById('mobile-avatar').textContent = name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
    } catch {
        document.getElementById('mobile-user-name').textContent = 'Finlite User';
        document.getElementById('mobile-avatar').textContent = 'FL';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    const hb = document.getElementById('hamburgerBtn');
    const mm = document.getElementById('mobileMenu');
    const bd = document.getElementById('backdrop');

    hb.addEventListener('click', (e) => {
        e.stopPropagation();
        menuOpen ? closeMenu() : openMenu();
    });
    bd.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
            closeModal();
        }
    });
    mm.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setTimeout(closeMenu, 120)));
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 769 && menuOpen) closeMenu();
    });

    document.getElementById('autoTog').addEventListener('change', function () {
        applyI18n(this.checked ? activeLang : 'en');
        savePreferences(true);
    });

    document.getElementById('origTog').addEventListener('change', () => {
        savePreferences(true);
    });

    const scroller = document.getElementById('favScroll');
    let isDown = false;
    let startX;
    let scrollLeft;
    scroller.addEventListener('mousedown', (e) => {
        isDown = true;
        scroller.classList.add('active');
        startX = e.pageX - scroller.offsetLeft;
        scrollLeft = scroller.scrollLeft;
    });
    scroller.addEventListener('mouseleave', () => { isDown = false; scroller.classList.remove('active'); });
    scroller.addEventListener('mouseup', () => { isDown = false; scroller.classList.remove('active'); });
    scroller.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - scroller.offsetLeft;
        scroller.scrollLeft = scrollLeft - (x - startX) * 1.2;
    });

    syncMobileUser();
    loadPreferences();
});

window.openModal = openModal;
window.closeModal = closeModal;
window.closeModalOutside = closeModalOutside;
