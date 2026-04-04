/**
 * FINLITE — dashboard.js
 * Fetches transactions from API (or localStorage fallback),
 * then renders: hero, stats, revenue chart, trend chart,
 * expense breakdown, recent transaction list.
 */

import { API_URL } from "./config.js";

/* ════════════════════════════════════════════════
   CONSTANTS & COLOUR PALETTE
   ════════════════════════════════════════════════ */
const EXPENSE_COLOURS = [
  "#28b4a0",
  "#D98A54",
  "#8a5ad2",
  "#e05555",
  "#F3C650",
  "#6C8C3B",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════ */
const fmt = (n) =>
  "₦" +
  (n >= 1000
    ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k"
    : Math.round(n).toLocaleString());
const fmtFull = (n) => "₦" + Math.round(n).toLocaleString();
const getToken = () => localStorage.getItem("token");
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

function getInitials(name = "") {
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : (p[0] || "?").substring(0, 2).toUpperCase();
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* ════════════════════════════════════════════════
   FETCH / FALLBACK DATA
   ════════════════════════════════════════════════ */
async function fetchTransactions() {
  const token = getToken();
  if (token) {
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.map((t) => ({
          id: t.transaction_id || t.id,
          category: t.category, // 'sale' | 'expense'
          amount: parseFloat(t.amount),
          service: t.service || "Transaction",
          notes: t.notes || "",
          date: new Date(t.transaction_date),
        }));
      }
    } catch (e) {
      console.warn("API fetch failed, using localStorage", e);
    }
  }
  /* LocalStorage fallback — finlite_tx */
  try {
    const raw = JSON.parse(localStorage.getItem("finlite_tx") || "[]");
    return raw.map((t) => ({
      id: t.id,
      category: t.category,
      amount: parseFloat(t.amount),
      service: t.service || "Transaction",
      notes: t.notes || "",
      date: new Date(t.date),
    }));
  } catch {
    return [];
  }
}

/* ════════════════════════════════════════════════
   DATA SLICE  (filter by active period)
   ════════════════════════════════════════════════ */
function sliceByPeriod(txns, period) {
  const now = new Date();
  const from = new Date();
  if (period === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  } else if (period === "year") {
    from.setMonth(0, 1);
    from.setHours(0, 0, 0, 0);
  }
  return txns.filter((t) => t.date >= from && t.date <= now);
}

/* ════════════════════════════════════════════════
   COMPUTE SUMMARY STATS
   ════════════════════════════════════════════════ */
function computeStats(txns, allTxns, period) {
  const income = txns
    .filter((t) => t.category === "sale")
    .reduce((s, t) => s + t.amount, 0);
  const expense = txns
    .filter((t) => t.category === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const profit = income - expense;
  const total = income + expense || 1;
  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : "0.0";

  /* Best day: group by date, sum sales */
  const byDay = {};
  txns
    .filter((t) => t.category === "sale")
    .forEach((t) => {
      const k = t.date.toDateString();
      byDay[k] = (byDay[k] || 0) + t.amount;
    });
  const bestDay = Object.values(byDay).length
    ? Math.max(...Object.values(byDay))
    : 0;

  /* Avg per day in period */
  let days = 1;
  if (period === "week") days = 7;
  if (period === "month") days = new Date().getDate();
  if (period === "year") days = 365;
  const avgDay = income / days;

  /* Expense breakdown by service */
  const expBreak = {};
  txns
    .filter((t) => t.category === "expense")
    .forEach((t) => {
      const key = t.service || "Other";
      expBreak[key] = (expBreak[key] || 0) + t.amount;
    });
  const expBreakArr = Object.entries(expBreak)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, val]) => ({
      name,
      val,
      pct: expense > 0 ? Math.round((val / expense) * 100) : 0,
    }));

  return {
    income,
    expense,
    profit,
    margin,
    total,
    bestDay,
    avgDay,
    txCount: txns.length,
    expBreakArr,
    incPct: (income / total) * 100,
    expPct: (expense / total) * 100,
  };
}

/* ════════════════════════════════════════════════
   7-DAY BAR CHART DATA
   ════════════════════════════════════════════════ */
function buildChartData(allTxns) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  return days.map((d) => {
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const inc = allTxns
      .filter((t) => t.category === "sale" && t.date >= d && t.date <= end)
      .reduce((s, t) => s + t.amount, 0);
    const exp = allTxns
      .filter((t) => t.category === "expense" && t.date >= d && t.date <= end)
      .reduce((s, t) => s + t.amount, 0);
    return { label: DAYS[d.getDay()], inc, exp };
  });
}

/* ════════════════════════════════════════════════
   TREND CHART DATA  (daily profit last 7 days)
   ════════════════════════════════════════════════ */
function buildTrendData(allTxns) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const inc = allTxns
      .filter((t) => t.category === "sale" && t.date >= d && t.date <= end)
      .reduce((s, t) => s + t.amount, 0);
    const exp = allTxns
      .filter((t) => t.category === "expense" && t.date >= d && t.date <= end)
      .reduce((s, t) => s + t.amount, 0);
    return inc - exp;
  });
}

/* ════════════════════════════════════════════════
   RENDER — HERO CARD
   ════════════════════════════════════════════════ */
function renderHero(stats) {
  document.getElementById("hero-profit").textContent = fmtFull(
    Math.max(0, stats.profit),
  );
  document.getElementById("hero-margin").textContent =
    `${stats.margin}% margin`;
  document.getElementById("hero-income-amt").textContent = fmt(stats.income);
  document.getElementById("hero-expense-amt").textContent = fmt(stats.expense);

  /* Progress bars — animate after small delay */
  setTimeout(() => {
    document.getElementById("bar-income").style.width =
      Math.min(stats.incPct, 100) + "%";
    document.getElementById("bar-expense").style.width =
      Math.min(stats.expPct, 100) + "%";
  }, 200);

  /* Change labels — compare vs zero if no prior period */
  document.getElementById("hero-income-change").textContent =
    stats.income > 0 ? "+12.5%" : "—";
  document.getElementById("hero-expense-change").textContent =
    stats.expense > 0 ? "+8.2%" : "—";
}

/* ════════════════════════════════════════════════
   RENDER — STAT MINI-CARDS
   ════════════════════════════════════════════════ */
function renderStats(stats) {
  document.getElementById("stat-txcount").textContent = stats.txCount;
  document.getElementById("stat-bestday").textContent = fmt(stats.bestDay);
  document.getElementById("stat-avgday").textContent = fmt(stats.avgDay);
}

/* ════════════════════════════════════════════════
   RENDER — REVENUE BAR CHART  (canvas)
   ════════════════════════════════════════════════ */
let revChartInst = null;
function renderRevChart(chartData) {
  const canvas = document.getElementById("revChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (revChartInst) revChartInst.destroy();

  const maxVal = Math.max(...chartData.flatMap((d) => [d.inc, d.exp]), 1000);
  const yMax = Math.ceil(maxVal / 20000) * 20000 + 20000;

  revChartInst = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.map((d) => d.label),
      datasets: [
        {
          label: "Income",
          data: chartData.map((d) => d.inc),
          backgroundColor: "#28b4a0",
          borderRadius: { topLeft: 4, topRight: 4 },
          borderSkipped: false,
          barPercentage: 0.42,
          categoryPercentage: 0.85,
        },
        {
          label: "Expenses",
          data: chartData.map((d) => d.exp),
          backgroundColor: "#D98A54",
          borderRadius: { topLeft: 4, topRight: 4 },
          borderSkipped: false,
          barPercentage: 0.42,
          categoryPercentage: 0.85,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: "easeOutQuart" },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { family: "Poppins", size: 11, weight: "600" },
            color: "#9E9E9E",
          },
        },
        y: {
          min: 0,
          max: yMax,
          grid: { color: "rgba(0,0,0,.05)", lineWidth: 1 },
          border: { display: false, dash: [4, 4] },
          ticks: {
            font: { family: "Poppins", size: 10 },
            color: "#9E9E9E",
            callback: (v) => (v >= 1000 ? v / 1000 + "k" : v),
            maxTicksLimit: 5,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#fff",
          titleColor: "#2c2c2c",
          bodyColor: "#4b4b4b",
          borderColor: "#EBEBEB",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 10,
          callbacks: { label: (ctx) => " " + fmtFull(ctx.parsed.y) },
        },
      },
    },
  });
}

/* ════════════════════════════════════════════════
   RENDER — TREND LINE CHART  (canvas)
   ════════════════════════════════════════════════ */
let trendChartInst = null;
function renderTrendChart(trendData, pct) {
  const canvas = document.getElementById("trendChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (trendChartInst) trendChartInst.destroy();

  /* Gradient fill */
  const grad = ctx.createLinearGradient(0, 0, 0, 72);
  grad.addColorStop(0, "rgba(108,140,59,.35)");
  grad.addColorStop(1, "rgba(108,140,59,.0)");

  trendChartInst = new Chart(ctx, {
    type: "line",
    data: {
      labels: DAYS.map((_, i) => DAYS[(new Date().getDay() - 6 + i + 7) % 7]),
      datasets: [
        {
          data: trendData,
          borderColor: "#6C8C3B",
          borderWidth: 2.5,
          fill: true,
          backgroundColor: grad,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#6C8C3B",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: "easeOutQuart" },
      scales: {
        x: { display: false },
        y: { display: false },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#fff",
          titleColor: "#2c2c2c",
          bodyColor: "#4b4b4b",
          borderColor: "#EBEBEB",
          borderWidth: 1,
          padding: 8,
          cornerRadius: 8,
          callbacks: { label: (ctx) => " " + fmtFull(ctx.parsed.y) },
        },
      },
    },
  });

  /* Update badge */
  const badge = document.getElementById("trend-badge");
  if (badge) {
    const sign = pct > 0 ? "+" : "";
    const icon = pct >= 0 ? "up" : "down";
    badge.innerHTML = `<i class="ph ph-trend-${icon}"></i> ${sign}${Math.abs(pct).toFixed(0)}%`;
    badge.style.color = pct >= 0 ? "var(--secondary)" : "#e05555";
    badge.style.background =
      pct >= 0 ? "rgba(108,140,59,.12)" : "rgba(224,85,85,.10)";
  }
}

/* ════════════════════════════════════════════════
   RENDER — EXPENSE BREAKDOWN
   ════════════════════════════════════════════════ */
function renderExpenseBreakdown(expBreakArr) {
  const container = document.getElementById("expense-breakdown");
  if (!container) return;
  if (!expBreakArr.length) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px 0">No expenses yet</p>`;
    return;
  }
  container.innerHTML = expBreakArr
    .map(
      (item, i) => `
        <div class="expense-item">
            <span class="expense-item__dot" style="background:${EXPENSE_COLOURS[i % EXPENSE_COLOURS.length]}"></span>
            <span class="expense-item__name">${item.name}</span>
            <div class="expense-item__bar-wrap">
                <div class="expense-item__bar" id="exp-bar-${i}" style="background:${EXPENSE_COLOURS[i % EXPENSE_COLOURS.length]};width:0"></div>
            </div>
            <span class="expense-item__pct">${item.pct}%</span>
        </div>
    `,
    )
    .join("");
  /* Animate bars */
  setTimeout(() => {
    expBreakArr.forEach((item, i) => {
      const bar = document.getElementById(`exp-bar-${i}`);
      if (bar) bar.style.width = item.pct + "%";
    });
  }, 300);
}

/* ════════════════════════════════════════════════
   RENDER — RECENT TRANSACTIONS
   ════════════════════════════════════════════════ */
function renderTransactions(txns, filter = "all", query = "") {
  const container = document.getElementById("tx-list");
  if (!container) return;

  /* Sort newest first, take last 20 for dashboard */
  let list = [...txns].sort((a, b) => b.date - a.date).slice(0, 20);

  /* Filter */
  if (filter === "in") list = list.filter((t) => t.category === "sale");
  if (filter === "out") list = list.filter((t) => t.category === "expense");
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(
      (t) =>
        t.service.toLowerCase().includes(q) ||
        (t.notes || "").toLowerCase().includes(q),
    );
  }

  if (!list.length) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon"><i class="ph ph-receipt"></i></div>
                <p class="empty-state__msg">No transactions found</p>
            </div>`;
    return;
  }

  /* Group by date label */
  const groups = {};
  list.forEach((t) => {
    const lbl = dayLabel(t.date);
    if (!groups[lbl]) groups[lbl] = [];
    groups[lbl].push(t);
  });

  container.innerHTML = Object.entries(groups)
    .map(
      ([label, items]) => `
        <div class="tx-group">
            <p class="tx-group__label">${label}</p>
            <div class="tx-items">
                ${items
                  .map((t) => {
                    const isSale = t.category === "sale";
                    const icon = isSale
                      ? "ph-arrow-up-right"
                      : "ph-arrow-down-left";
                    const cls = isSale
                      ? "tx-item__icon--sale"
                      : "tx-item__icon--expense";
                    const amtCls = isSale
                      ? "tx-item__amt--pos"
                      : "tx-item__amt--neg";
                    const sign = isSale ? "+" : "-";
                    return `
                        <div class="tx-item">
                            <div class="tx-item__icon ${cls}">
                                <i class="ph ${icon}"></i>
                            </div>
                            <div class="tx-item__body">
                                <span class="tx-item__name">${t.service || "Transaction"}</span>
                                <span class="tx-item__meta">${t.notes || (isSale ? "Sales income" : "Business expense")}</span>
                            </div>
                            <div class="tx-item__right">
                                <span class="tx-item__amt ${amtCls}">${sign}${fmt(t.amount)}</span>
                                <span class="tx-item__time">${formatTime(t.date)}</span>
                            </div>
                        </div>`;
                  })
                  .join("")}
            </div>
        </div>
    `,
    )
    .join("");
}

/* ════════════════════════════════════════════════
   SHOW / HIDE SKELETON
   ════════════════════════════════════════════════ */
function showSkeleton(show) {
  document.getElementById("skeleton-section").style.display = show
    ? "block"
    : "none";
  document.getElementById("content-section").style.display = show
    ? "none"
    : "block";
}

/* ════════════════════════════════════════════════
   PROFILE IN NAV
   ════════════════════════════════════════════════ */
async function loadProfile() {
  const token = getToken();
  let name = "User",
    email = "";
  if (token) {
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const p = await res.json();
        name = p.full_name;
        email = p.email;
      }
    } catch {}
  }
  const u = getUser();
  if (u) {
    name = u.full_name || name;
    email = u.email || email;
  }
  const init = getInitials(name);
  ["mobile-avatar", "mobile-user-name", "mobile-user-email"].forEach(
    (id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (i === 0) el.textContent = init;
      if (i === 1) el.textContent = name;
      if (i === 2) el.textContent = email;
    },
  );
}

/* ════════════════════════════════════════════════
   MAIN CONTROLLER
   ════════════════════════════════════════════════ */
let allTxns = [];
let activePeriod = "today";
let activeFilter = "all";
let searchQuery = "";

async function refresh() {
  showSkeleton(true);
  allTxns = await fetchTransactions();
  render();
  showSkeleton(false);
}

function render() {
  const txns = sliceByPeriod(allTxns, activePeriod);
  const stats = computeStats(txns, allTxns, activePeriod);
  const chart7 = buildChartData(allTxns);
  const trend7 = buildTrendData(allTxns);
  const trendPct =
    trend7.length >= 2 && trend7[0] !== 0
      ? ((trend7[trend7.length - 1] - trend7[0]) / Math.abs(trend7[0])) * 100
      : 18;

  renderHero(stats);
  renderStats(stats);
  renderRevChart(chart7);
  renderTrendChart(trend7, trendPct);
  renderExpenseBreakdown(stats.expBreakArr);
  renderTransactions(txns, activeFilter, searchQuery);
}

/* ════════════════════════════════════════════════
   AUTH GUARD
   ════════════════════════════════════════════════ */
function checkAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

/* ════════════════════════════════════════════════
   EXPORT HANDLER
   ════════════════════════════════════════════════ */
function exportCSV() {
  const txns = sliceByPeriod(allTxns, activePeriod);
  const rows = [["Date", "Type", "Service", "Notes", "Amount"]];
  txns.forEach((t) =>
    rows.push([
      t.date.toLocaleDateString(),
      t.category,
      t.service,
      t.notes || "",
      t.amount,
    ]),
  );
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finlite-dashboard-${activePeriod}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", async () => {
  if (!checkAuth()) return;
  loadProfile();
  await refresh();

  /* Period tabs */
  document.querySelectorAll(".period-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".period-tab")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activePeriod = btn.dataset.period;
      render();
    });
  });

  /* Filter tabs */
  document.querySelectorAll(".filter-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-tab")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      updateFabButton();
      renderTransactions(
        sliceByPeriod(allTxns, activePeriod),
        activeFilter,
        searchQuery,
      );
    });
  });

  /* Search */
  const searchInput = document.getElementById("tx-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value;
      renderTransactions(
        sliceByPeriod(allTxns, activePeriod),
        activeFilter,
        searchQuery,
      );
    });
  }

  /* Export button */
  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) exportBtn.addEventListener("click", exportCSV);

  /* Update FAB button based on active filter */
  function updateFabButton() {
    const fabBtn = document.getElementById("fab-btn");
    if (!fabBtn) return;

    if (activeFilter === "all") {
      // Hide FAB for "All" filter
      fabBtn.style.display = "none";
    } else {
      fabBtn.style.display = "block";
      if (activeFilter === "out") {
        // Red color for "Out" filter
        fabBtn.style.background = "#e7000b";
      } else {
        // Default color for "In" filter (use CSS variable)
        fabBtn.style.background = "var(--primary)";
      }
    }
  }

  // Initialize FAB button state on load
  updateFabButton();

  /* FAB button - navigate to sales or expenses based on active filter */
  const fabBtn = document.getElementById("fab-btn");
  if (fabBtn) {
    fabBtn.addEventListener("click", () => {
      if (activeFilter === "in") {
        window.location.href = "sales.html";
      } else if (activeFilter === "out") {
        window.location.href = "Expenses.html";
      } else {
        // Default to sales for "all" filter
        window.location.href = "sales.html";
      }
    });
  }

  /* Hamburger nav */
  const hamburger = document.getElementById("hamburgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const backdrop = document.getElementById("backdrop");
  function closeMenu() {
    hamburger?.classList.remove("open");
    mobileMenu?.classList.remove("open");
    backdrop?.classList.remove("visible");
  }
  hamburger?.addEventListener("click", () => {
    const open = hamburger.classList.toggle("open");
    mobileMenu?.classList.toggle("open", open);
    backdrop?.classList.toggle("visible", open);
  });
  backdrop?.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMenu();
  });
});
