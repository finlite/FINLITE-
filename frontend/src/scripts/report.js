"use strict";

/* ════════════════════════════════════════════════
   FINLITE — Reports Page JavaScript
   report.js
   ════════════════════════════════════════════════ */

/* ══════════════════════════════
   NAV
══════════════════════════════ */
const hb = document.getElementById("hamburgerBtn");
const mm = document.getElementById("mobileMenu");
const bd = document.getElementById("backdrop");
let navOpen = false;

function openNav() {
  navOpen = true;
  hb.classList.add("open");
  hb.setAttribute("aria-expanded", "true");
  mm.classList.add("open");
  mm.setAttribute("aria-hidden", "false");
  bd.classList.add("visible");
  document.body.style.overflow = "hidden";
}
function closeNav() {
  navOpen = false;
  hb.classList.remove("open");
  hb.setAttribute("aria-expanded", "false");
  mm.classList.remove("open");
  mm.setAttribute("aria-hidden", "true");
  bd.classList.remove("visible");
  document.body.style.overflow = "";
}

hb.addEventListener("click", (e) => {
  e.stopPropagation();
  navOpen ? closeNav() : openNav();
});
bd.addEventListener("click", closeNav);
mm.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => setTimeout(closeNav, 120)),
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeNav();
    closeModal();
  }
});
window.addEventListener("resize", () => {
  if (window.innerWidth >= 769 && navOpen) closeNav();
});

/* ══════════════════════════════
   MOBILE USER ROW
══════════════════════════════ */
function syncMobileUser() {
  const mobAvt = document.getElementById("mobile-avatar");
  const mobName = document.getElementById("mobile-user-name");
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (_) {}
  const name = user.full_name ? user.full_name.trim() : null;
  const initials = name
    ? name
        .split(/\s+/)
        .map((w) => w[0] || "")
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : null;
  if (initials && mobAvt) mobAvt.textContent = initials;
  if (name && mobName) mobName.textContent = name;
}
syncMobileUser();
setTimeout(syncMobileUser, 800);
setTimeout(syncMobileUser, 2000);

/* ══════════════════════════════
   CONFIG & AUTH
══════════════════════════════ */
const API_URL = window.apiUrl
  ? window.apiUrl.replace(/\/+$/, "")
  : "https://finlite-nizr.onrender.com/api";

function getToken() {
  return localStorage.getItem("token");
}

function redirectToLogin() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login.html";
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    return false;
  }
  return true;
}

/* ══════════════════════════════
   THEME RESTORE
══════════════════════════════ */
(function () {
  const saved = localStorage.getItem("finlite_theme") || "light";
  const eff =
    saved === "auto"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : saved;
  document.documentElement.setAttribute("data-theme", eff);
})();

/* ══════════════════════════════
   DATA  (fetched from API with fallback to localStorage)
══════════════════════════════ */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTH_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n) {
  return String(n).padStart(2, "0");
}

// Normalize API transaction to report format
function normalizeTxForReport(row) {
  const txDate = row.transaction_date
    ? new Date(row.transaction_date)
    : new Date();
  const safeDate = Number.isNaN(txDate.getTime()) ? new Date() : txDate;

  return {
    id: row.id,
    type: row.category, // 'sale' or 'expense' from API
    amount: Number(row.amount || 0),
    date: `${safeDate.getFullYear()}-${pad(safeDate.getMonth() + 1)}-${pad(safeDate.getDate())}`,
    category: row.category === "expense" ? row.service || "Others" : null,
    service: row.service || "General transaction",
    notes: row.notes || "",
  };
}

// Fetch transactions from API
async function fetchTransactionDataFromAPI() {
  const token = getToken();
  if (!token) {
    console.warn("No auth token, using sample data");
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401 || response.status === 403) {
      console.warn("Auth failed, redirecting to login");
      redirectToLogin();
      return [];
    }

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      console.warn("API error:", data.message || "Unable to load transactions");
      return [];
    }

    // Normalize API transactions to report format
    return Array.isArray(data) ? data.map(normalizeTxForReport) : [];
  } catch (error) {
    console.error("Error fetching transactions from API:", error);
    return [];
  }
}

// Load transactions (try API first, fallback to localStorage, then sample data)
async function loadTransactions() {
  let txs = await fetchTransactionDataFromAPI();

  if (txs.length === 0) {
    try {
      const raw = localStorage.getItem("finlite_tx");
      txs = raw ? JSON.parse(raw) : [];
    } catch (_) {
      txs = [];
    }
  }

  // Return sample data only if nothing else available
  return txs.length > 0 ? txs : SAMPLE_DATA;
}

// Fallback sample data used when no real data exists
const SAMPLE_DATA = [
  { type: "sale", amount: 180000, date: "2025-01-15" },
  { type: "sale", amount: 210000, date: "2025-02-10" },
  { type: "expense", amount: 95000, date: "2025-01-20" },
  { type: "expense", amount: 130000, date: "2025-02-18" },
  { type: "sale", amount: 195000, date: "2025-03-05" },
  { type: "expense", amount: 110000, date: "2025-03-12" },
  { type: "sale", amount: 240000, date: "2025-04-08" },
  { type: "expense", amount: 140000, date: "2025-04-22" },
  { type: "sale", amount: 220000, date: "2025-05-14" },
  { type: "expense", amount: 125000, date: "2025-05-28" },
  { type: "sale", amount: 260000, date: "2025-06-03" },
  { type: "expense", amount: 155000, date: "2025-06-19" },
  // Spending categories (expenses)
  { type: "expense", amount: 45000, date: "2025-06-01", category: "Food" },
  { type: "expense", amount: 32000, date: "2025-06-05", category: "Shopping" },
  { type: "expense", amount: 28000, date: "2025-06-10", category: "Transport" },
  { type: "expense", amount: 20000, date: "2025-06-15", category: "Utilities" },
  { type: "expense", amount: 15000, date: "2025-06-20", category: "Others" },
];

/* ══════════════════════════════
   STATE
══════════════════════════════ */
let selectedPeriod = "6"; // months back  ('1'|'3'|'6'|'12')

const PERIOD_OPTIONS = [
  { value: "1", label: "Last Month" },
  { value: "3", label: "Last 3 Months" },
  { value: "6", label: "Last 6 Months" },
  { value: "12", label: "Last 12 Months" },
];

/* ══════════════════════════════
   PERIOD DROPDOWN
══════════════════════════════ */
const periodBar = document.getElementById("periodBar");
const periodLabel = document.getElementById("periodLabel");
const periodDropdown = document.getElementById("periodDropdown");

function buildPeriodOptions() {
  periodDropdown.innerHTML = "";
  PERIOD_OPTIONS.forEach((opt) => {
    const el = document.createElement("div");
    el.className =
      "period-option" + (opt.value === selectedPeriod ? " active" : "");
    el.dataset.value = opt.value;
    el.innerHTML = `${opt.label}<span class="period-option__check"><i class="ph-fill ph-check-circle"></i></span>`;
    el.addEventListener("click", async () => {
      selectedPeriod = opt.value;
      periodLabel.textContent = opt.label;
      buildPeriodOptions();
      periodDropdown.classList.remove("open");
      await updateAll();
    });
    periodDropdown.appendChild(el);
  });
}

periodBar.addEventListener("click", (e) => {
  e.stopPropagation();
  periodDropdown.classList.toggle("open");
});

document.addEventListener("click", () =>
  periodDropdown.classList.remove("open"),
);
buildPeriodOptions();

/* ══════════════════════════════
   DATA HELPERS
══════════════════════════════ */
function getRange(months) {
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() }); // 0-indexed
  }
  return result;
}

function getTxForMonth(txArr, year, month) {
  return txArr.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function sumType(txArr, type) {
  return txArr
    .filter((t) => t.type === type)
    .reduce((s, t) => s + (t.amount || 0), 0);
}

/* ══════════════════════════════
   UPDATE SUMMARY PILLS
══════════════════════════════ */
function updatePills(txArr) {
  const income = sumType(txArr, "sale");
  const expenses = sumType(txArr, "expense");
  const balance = income - expenses;

  document.getElementById("pillIncome").textContent = fmt(income);
  document.getElementById("pillExpenses").textContent = fmt(expenses);
  document.getElementById("pillBalance").textContent = fmt(Math.abs(balance));
  // colour the balance differently if negative
  const balEl = document.getElementById("pillBalance");
  balEl.style.color = balance >= 0 ? "" : "var(--red)";
}

function fmt(n) {
  if (n == null) return "₦0";
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "₦" + Math.round(n / 1_000) + "K";
  return "₦" + Number(n).toLocaleString("en-NG");
}

/* ══════════════════════════════
   BAR CHART
══════════════════════════════ */
function renderBarChart(allTx) {
  const months = parseInt(selectedPeriod, 10);
  const range = getRange(months);
  const barsArea = document.getElementById("barsArea");
  const xLabels = document.getElementById("xLabels");
  const yLabels = document.getElementById("yLabels");

  // Build per-month income/expense totals
  const data = range.map(({ year, month }) => {
    const tx = getTxForMonth(allTx, year, month);
    return {
      label: MONTHS[month],
      income: sumType(tx, "sale"),
      expense: sumType(tx, "expense"),
    };
  });

  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);

  // Y axis ticks (4 ticks from 0 to max)
  yLabels.innerHTML = "";
  for (let i = 4; i >= 0; i--) {
    const tick = Math.round((maxVal / 4) * i);
    const lbl = document.createElement("span");
    lbl.className = "y-label";
    lbl.textContent =
      tick >= 1000 ? "₦" + Math.round(tick / 1000) + "K" : "₦" + tick;
    yLabels.appendChild(lbl);
  }

  // Bars
  barsArea.innerHTML = "";
  data.forEach((d, idx) => {
    const group = document.createElement("div");
    group.className = "bar-group";
    group.title = `${d.label}: Income ₦${d.income.toLocaleString()}, Expense ₦${d.expense.toLocaleString()}`;

    const incH = Math.max(2, Math.round((d.income / maxVal) * 100));
    const expH = Math.max(2, Math.round((d.expense / maxVal) * 100));
    const delay = idx * 0.06;

    group.innerHTML = `
            <div class="bar bar--income"  style="height:${incH}%;animation-delay:${delay}s"  title="Income: ₦${d.income.toLocaleString()}"></div>
            <div class="bar bar--expense" style="height:${expH}%;animation-delay:${delay + 0.03}s" title="Expense: ₦${d.expense.toLocaleString()}"></div>`;
    barsArea.appendChild(group);
  });

  // X labels
  xLabels.innerHTML = "";
  data.forEach((d) => {
    const lbl = document.createElement("span");
    lbl.className = "x-label";
    lbl.textContent = d.label;
    xLabels.appendChild(lbl);
  });

  // Averages
  const avgIncome = Math.round(
    data.reduce((s, d) => s + d.income, 0) / (data.length || 1),
  );
  const avgExpense = Math.round(
    data.reduce((s, d) => s + d.expense, 0) / (data.length || 1),
  );
  document.getElementById("avgIncome").textContent = fmt(avgIncome);
  document.getElementById("avgExpense").textContent = fmt(avgExpense);
}

/* ══════════════════════════════
   DONUT CHART  (canvas)
══════════════════════════════ */
const CAT_COLOURS = ["#D94F4F", "#6C8C3B", "#F3C650", "#3a7bd5", "#9E9E9E"];
const CAT_NAMES = ["Food", "Shopping", "Transport", "Utilities", "Others"];

let donutChart = null;

function renderDonut(allTx) {
  const canvas = document.getElementById("donutCanvas");
  const ctx = canvas.getContext("2d");
  const size = 180;
  canvas.width = canvas.height = size;

  // Build category totals from expense transactions
  const catMap = {};
  CAT_NAMES.forEach((c) => (catMap[c] = 0));
  allTx
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = t.category || "Others";
      if (catMap[cat] !== undefined) catMap[cat] += t.amount || 0;
      else catMap["Others"] += t.amount || 0;
    });

  const values = CAT_NAMES.map((c) => catMap[c]);
  const total = values.reduce((a, b) => a + b, 0) || 1;

  // Draw donut
  const cx = size / 2,
    cy = size / 2,
    r = 76,
    inner = 48;
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, size, size);

  values.forEach((val, i) => {
    if (val === 0) return;
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = CAT_COLOURS[i];
    ctx.fill();
    startAngle += slice;
  });

  // Punch inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--card-bg")
      .trim() || "#fff";
  ctx.fill();

  // Update legend percentages
  const legend = document.getElementById("catLegend");
  legend.innerHTML = "";
  CAT_NAMES.forEach((name, i) => {
    const pct = total > 0 ? Math.round((values[i] / total) * 100) : 0;
    const item = document.createElement("div");
    item.className = "cat-legend__item";
    item.innerHTML = `<span class="cat-legend__dot" style="background:${CAT_COLOURS[i]}"></span>${name}`;
    legend.appendChild(item);
  });
}

/* ══════════════════════════════
   INSIGHTS
══════════════════════════════ */
function updateInsights(allTx) {
  const months = parseInt(selectedPeriod, 10);
  const range = getRange(months);

  const monthlyData = range.map(({ year, month }) => {
    const tx = getTxForMonth(allTx, year, month);
    return { income: sumType(tx, "sale"), expense: sumType(tx, "expense") };
  });

  const totalIncome = monthlyData.reduce((s, d) => s + d.income, 0);
  const totalExpenses = monthlyData.reduce((s, d) => s + d.expense, 0);
  const totalSaved = totalIncome - totalExpenses;

  // Income growth: compare last two months
  const lastIncome = monthlyData.at(-1)?.income || 0;
  const prevIncome = monthlyData.at(-2)?.income || 0;
  const growthPct =
    prevIncome > 0
      ? Math.round(((lastIncome - prevIncome) / prevIncome) * 100)
      : 0;

  const growthTxt =
    growthPct >= 0
      ? `Your income increased by ${growthPct}% this month.`
      : `Your income decreased by ${Math.abs(growthPct)}% this month.`;

  document.getElementById("insightGrowthTitle").textContent =
    growthPct >= 0 ? "Income Growth 📈" : "Income Dip 📉";
  document.getElementById("insightGrowth").textContent = growthTxt;

  const savedTxt =
    totalSaved >= 0
      ? `You saved ${fmt(totalSaved)} this period. Great job!`
      : `You spent ${fmt(Math.abs(totalSaved))} more than you earned. Watch your expenses.`;
  document.getElementById("insightSaved").textContent = savedTxt;
  document.getElementById("insightSavedTitle").textContent =
    totalSaved >= 0 ? "Great Work 🎉" : "Heads Up ⚠️";

  // Top spending category
  const catMap = {};
  CAT_NAMES.forEach((c) => (catMap[c] = 0));
  allTx
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = t.category || "Others";
      catMap[cat] = (catMap[cat] || 0) + (t.amount || 0);
    });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("insightTopSpending").textContent =
    topCat && topCat[1] > 0
      ? `${topCat[0]} is your highest expense category.`
      : "No spending data available yet.";
}

/* ══════════════════════════════
   MASTER UPDATE
══════════════════════════════ */
async function updateAll() {
  const allTx = await loadTransactions();

  const months = parseInt(selectedPeriod, 10);
  const range = getRange(months);
  const periodTx = allTx.filter((t) => {
    const d = new Date(t.date);
    return range.some(
      (r) => r.year === d.getFullYear() && r.month === d.getMonth(),
    );
  });

  updatePills(periodTx);
  renderBarChart(allTx);
  renderDonut(allTx);
  updateInsights(allTx);
}

/* ══════════════════════════════
   DOWNLOAD MODAL
══════════════════════════════ */
let selectedFormat = "pdf";

const modalOverlay = document.getElementById("modalOverlay");

function openModal() {
  modalOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modalOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

document.getElementById("dlBtn").addEventListener("click", openModal);
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalCancel").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Format selection
document.querySelectorAll(".format-option").forEach((opt) => {
  opt.addEventListener("click", () => {
    document
      .querySelectorAll(".format-option")
      .forEach((o) => o.classList.remove("selected"));
    opt.classList.add("selected");
    selectedFormat = opt.dataset.format;
  });
});

// Download action
document.getElementById("modalDownload").addEventListener("click", async () => {
  closeModal();

  const months = parseInt(selectedPeriod, 10);
  const range = getRange(months);
  const allTx = await loadTransactions();

  if (selectedFormat === "csv") {
    // CSV export
    const rows = [["Date", "Type", "Description", "Amount", "Category"]];
    const periodTx = allTx.filter((t) => {
      const d = new Date(t.date);
      return range.some(
        (r) => r.year === d.getFullYear() && r.month === d.getMonth(),
      );
    });
    periodTx.forEach((t) =>
      rows.push([t.date, t.type, t.desc || "", t.amount, t.category || ""]),
    );
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finlite-report-${selectedPeriod}m.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Report exported as CSV ✓");
  } else {
    // PDF: open a new print window with the report summary
    const win = window.open("", "_blank");
    if (!win) {
      showToast("Allow pop-ups to download PDF");
      return;
    }
    const periodTx = allTx.filter((t) => {
      const d = new Date(t.date);
      return range.some(
        (r) => r.year === d.getFullYear() && r.month === d.getMonth(),
      );
    });
    const income = sumType(periodTx, "sale");
    const expenses = sumType(periodTx, "expense");
    win.document.write(`<!DOCTYPE html><html><head><title>Finlite Report</title>
        <style>body{font-family:sans-serif;padding:40px;color:#2c2c2c}
        h1{color:#D98A54}table{width:100%;border-collapse:collapse;margin-top:20px}
        td,th{padding:10px 14px;border:1px solid #eee;text-align:left}
        th{background:#f5f5f5;font-weight:700}.pos{color:#6C8C3B}.neg{color:#D94F4F}</style></head>
        <body><h1>Finlite Report</h1><p>Period: Last ${months} months</p>
        <p>Total Income: <strong class="pos">₦${income.toLocaleString()}</strong></p>
        <p>Total Expenses: <strong class="neg">₦${expenses.toLocaleString()}</strong></p>
        <p>Net Balance: <strong>₦${(income - expenses).toLocaleString()}</strong></p>
        <table><thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead><tbody>
        ${periodTx
          .slice(0, 50)
          .map(
            (t) => `<tr><td>${t.date}</td><td>${t.type}</td>
        <td class="${t.type === "sale" ? "pos" : "neg"}">₦${(t.amount || 0).toLocaleString()}</td></tr>`,
          )
          .join("")}
        </tbody></table></body></html>`);
    win.document.close();
    win.print();
    showToast("PDF opened for printing ✓");
  }
});

/* ══════════════════════════════
   TOAST
══════════════════════════════ */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

/* ══════════════════════════════
   INIT
══════════════════════════════ */
(async () => {
  await updateAll();
})();
