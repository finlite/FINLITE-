'use strict';

/* ════════════════════════════════════════
   FINLITE — Transactions Page JavaScript
   ════════════════════════════════════════ */

/* ── SHARED UTILITIES ── */
const now = new Date();

const pad = n => String(n).padStart(2, '0');

/* ── NAV ── */
const hb = document.getElementById('hamburgerBtn');
const mm = document.getElementById('mobileMenu');
const bd = document.getElementById('backdrop');
let navOpen = false;

const openNav = () => {
    navOpen = true;
    hb.classList.add('open');
    hb.setAttribute('aria-expanded', 'true');
    mm.classList.add('open');
    mm.setAttribute('aria-hidden', 'false');
    bd.classList.add('visible');
    document.body.style.overflow = 'hidden';
};

const closeNav = () => {
    navOpen = false;
    hb.classList.remove('open');
    hb.setAttribute('aria-expanded', 'false');
    mm.classList.remove('open');
    mm.setAttribute('aria-hidden', 'true');
    bd.classList.remove('visible');
    document.body.style.overflow = '';
};

hb.addEventListener('click', e => {
    e.stopPropagation();
    navOpen ? closeNav() : openNav();
});

bd.addEventListener('click', closeNav);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeNav();
        closePicker();
        closeOverlay();
    }
});

mm.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setTimeout(closeNav, 120));
});

window.addEventListener('resize', () => {
    if (window.innerWidth >= 769 && navOpen) closeNav();
});

/* ── MOBILE USER ROW SYNC ── */
function syncMobileAvatar() {
    const initEl  = document.getElementById('avatar-initials');
    const nameEl  = document.getElementById('avatar-name');
    const mobAvt  = document.getElementById('mobile-avatar');
    const mobName = document.getElementById('mobile-user-name');

    const user = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); }
        catch { return {}; }
    })();

    let initials = null;
    let name     = null;

    // Try DOM elements first (in case profile page set them)
    if (initEl && initEl.textContent.trim() !== '--') {
        initials = initEl.textContent.trim();
    }
    if (nameEl && nameEl.textContent.trim() !== 'Loading...') {
        name = nameEl.textContent.trim();
    }

    // Fall back to localStorage user object
    if (!initials && user.full_name) {
        const parts = user.full_name.trim().split(/\s+/);
        initials = parts.map(w => w[0]).join('').substring(0, 2).toUpperCase();
    }
    if (!name && user.full_name) {
        name = user.full_name;
    }

    if (initials && mobAvt)  mobAvt.textContent  = initials;
    if (name     && mobName) mobName.textContent = name;
}

syncMobileAvatar();
setTimeout(syncMobileAvatar, 800);
setTimeout(syncMobileAvatar, 2000);

/* ── CALENDAR / MONTH PICKER ── */
const calBtn      = document.getElementById('calBtn');
const mPicker     = document.getElementById('mPicker');
const mPickerBd   = document.getElementById('mPickerBackdrop');
const mPickerYear = document.getElementById('mPickerYear');
const mPickerGrid = document.getElementById('mPickerGrid');
const monthLabel  = document.getElementById('currentMonth');

const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let selYear  = now.getFullYear();
let selMonth = now.getMonth(); // 0-indexed

function pickerYearVal() {
    return parseInt(mPickerYear.textContent, 10);
}

function buildPickerGrid() {
    mPickerGrid.innerHTML = '';
    const yr = pickerYearVal();
    MONTH_SHORT.forEach((name, idx) => {
        const btn = document.createElement('button');
        btn.className = 'mpicker__month-btn' +
            (idx === selMonth && yr === selYear ? ' selected' : '');
        btn.textContent = name;
        btn.addEventListener('click', () => {
            selYear  = yr;
            selMonth = idx;
            monthLabel.textContent = `${MONTH_NAMES[selMonth]} ${selYear}`;
            closePicker();
            renderAll();
        });
        mPickerGrid.appendChild(btn);
    });
}

function openPicker() {
    mPickerYear.textContent = selYear;
    buildPickerGrid();
    mPicker.classList.add('open');
    mPickerBd.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closePicker() {
    mPicker.classList.remove('open');
    mPickerBd.classList.remove('open');
    document.body.style.overflow = '';
}

calBtn.addEventListener('click', e => {
    e.stopPropagation();
    mPicker.classList.contains('open') ? closePicker() : openPicker();
});

mPickerBd.addEventListener('click', closePicker);
document.getElementById('mPickerClose').addEventListener('click', closePicker);

document.getElementById('mPickerPrev').addEventListener('click', () => {
    mPickerYear.textContent = pickerYearVal() - 1;
    buildPickerGrid();
});

document.getElementById('mPickerNext').addEventListener('click', () => {
    mPickerYear.textContent = pickerYearVal() + 1;
    buildPickerGrid();
});

// Initialise label
monthLabel.textContent = `${MONTH_NAMES[selMonth]} ${selYear}`;

/* ── DATA STORE ── */
// { id, type:'sale'|'expense', desc, amount, time, date:'YYYY-MM-DD', note }
let transactions = JSON.parse(localStorage.getItem('finlite_tx') || '[]');

function saveTx() {
    localStorage.setItem('finlite_tx', JSON.stringify(transactions));
}

/* ── STATE ── */
let activeFilter = 'all';   // 'all' | 'sales' | 'expenses'
let searchQuery  = '';

/* ── HELPERS ── */
function fmt(n) {
    if (n == null) return 'N/A';
    return '₦' + Number(n).toLocaleString('en-NG');
}

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function groupByDate(list) {
    const groups = {};
    list.forEach(tx => {
        if (!groups[tx.date]) groups[tx.date] = [];
        groups[tx.date].push(tx);
    });
    return groups;
}

function labelDate(dateStr) {
    const today = todayStr();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (dateStr === today)     return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    const [yr, mo, day] = dateStr.split('-').map(Number);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[mo - 1]} ${day}, ${yr}`;
}

function getMonthTxs() {
    return transactions.filter(tx => {
        const [tyr, tmo] = tx.date.split('-').map(Number);
        return tyr === selYear && tmo === selMonth + 1;
    });
}

/* ── SUMMARY ── */
function updateSummary() {
    const monthTxs = getMonthTxs();
    const sales    = monthTxs.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const profit   = sales - expenses;

    document.getElementById('totalSales').textContent    = monthTxs.length ? fmt(sales)    : 'N/A';
    document.getElementById('totalExpenses').textContent = monthTxs.length ? fmt(expenses) : 'N/A';
    document.getElementById('totalProfit').textContent   = monthTxs.length ? fmt(profit)   : 'N/A';

    const todayTxs  = transactions.filter(t => t.date === todayStr());
    const tSales    = todayTxs.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
    const tExpenses = todayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    document.getElementById('todaySales').textContent    = todayTxs.length ? fmt(tSales)    : 'N/A';
    document.getElementById('todayExpenses').textContent = todayTxs.length ? fmt(tExpenses) : 'N/A';

    updateBarChart();
}

function updateBarChart() {
    const bars = document.querySelectorAll('.bar-chart__bar');
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
    const vals = days.map(dateStr => {
        const dayTxs = transactions.filter(t => t.date === dateStr);
        const s = dayTxs.filter(t => t.type === 'sale').reduce((a, t) => a + t.amount, 0);
        const e = dayTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
        return Math.max(0, s - e);
    });
    const maxVal = Math.max(...vals, 1);
    bars.forEach((bar, i) => {
        const pct = Math.max(8, Math.round((vals[i] / maxVal) * 100));
        bar.style.height = pct + '%';
    });
}

/* ── RENDER TRANSACTIONS ── */
function renderAll() {
    updateSummary();

    const list = document.getElementById('txList');
    list.innerHTML = '';

    let filtered = getMonthTxs().filter(tx => {
        if (activeFilter === 'sales'    && tx.type !== 'sale')    return false;
        if (activeFilter === 'expenses' && tx.type !== 'expense') return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return tx.desc.toLowerCase().includes(q) ||
                   (tx.note || '').toLowerCase().includes(q);
        }
        return true;
    });

    filtered.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    if (!filtered.length) {
        const typeLabel = activeFilter === 'sales'
            ? 'sale'
            : activeFilter === 'expenses'
                ? 'expense'
                : 'transaction';
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon"><i class="ph ph-receipt"></i></div>
                <p class="empty-state__msg">No transactions found.<br>Add your first ${typeLabel}!</p>
            </div>`;
        return;
    }

    const groups      = groupByDate(filtered);
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    sortedDates.forEach(dateStr => {
        const items = groups[dateStr];
        const total = items.reduce(
            (s, t) => s + (t.type === 'sale' ? t.amount : -t.amount), 0
        );
        const isPos = total >= 0;

        const group = document.createElement('div');
        group.className = 'tx-group';
        group.innerHTML = `
            <div class="tx-group__header">
                <span class="tx-group__date">${labelDate(dateStr)}</span>
                <span class="tx-group__total ${isPos ? '' : 'tx-group__total--loss'}">
                    ${fmt(Math.abs(total))}
                    <i class="ph ph-trend-${isPos ? 'up' : 'down'}"></i>
                </span>
            </div>
            <div class="tx-items" id="items-${dateStr}"></div>`;
        list.appendChild(group);

        const container = document.getElementById(`items-${dateStr}`);
        items.forEach(tx => {
            const isSale = tx.type === 'sale';
            const item   = document.createElement('div');
            item.className = 'tx-item';
            item.innerHTML = `
                <div class="tx-item__icon tx-item__icon--${isSale ? 'sale' : 'expense'}">
                    <i class="ph ph-trend-${isSale ? 'up' : 'down'}"></i>
                </div>
                <div class="tx-item__body">
                    <span class="tx-item__name">${tx.desc}</span>
                    <span class="tx-item__meta">${tx.time}${tx.note ? ' • ' + tx.note : ''}</span>
                </div>
                <span class="tx-item__amt tx-item__amt--${isSale ? 'pos' : 'neg'}">
                    ${isSale ? '+' : '-'}${fmt(tx.amount)}
                </span>`;
            container.appendChild(item);
        });
    });
}

/* ── FILTER TABS ── */
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        activeFilter = tab.dataset.filter;

        const fab = document.getElementById('fab');
        if (activeFilter === 'sales' || activeFilter === 'expenses') {
            fab.style.display = 'flex';
        } else {
            fab.style.display = 'none';
        }

        renderAll();
    });
});

/* ── SEARCH ── */
document.getElementById('searchInput').addEventListener('input', function () {
    searchQuery = this.value.trim();
    renderAll();
});

/* ── FAB — navigates to sales.html or expenses.html ── */
document.getElementById('fab').addEventListener('click', () => {
    if (activeFilter === 'sales') {
        window.location.href = '../public/sales.html';
    } else if (activeFilter === 'expenses') {
        window.location.href = '../public/expenses.html';
    }
});

/* ── BOTTOM BAR ── */
document.getElementById('activityBtn').addEventListener('click', () => {
    showToast('Activity view coming soon');
});

/* ── EXPORT ── */
document.getElementById('exportBtn').addEventListener('click', () => {
    const data = getMonthTxs();
    if (!data.length) { showToast('No transactions to export'); return; }

    const rows = [['Date','Type','Description','Amount','Time','Note']];
    data.forEach(t => rows.push([t.date, t.type, t.desc, t.amount, t.time, t.note || '']));

    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `finlite-${selYear}-${pad(selMonth + 1)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported successfully ✓');
});

/* ── SHEET (kept for programmatic use from other pages if needed) ── */
function closeOverlay() {
    document.getElementById('sheetOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function closeSheet(e) {
    if (e.target === document.getElementById('sheetOverlay')) closeOverlay();
}

/* ── TOAST ── */
let toastTimer;
function showToast(msg) {
    const el = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ── INIT ── */
renderAll();
