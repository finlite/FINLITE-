import { API_URL } from "./config.js";

const expenseForm = document.querySelector("main form");
const amountInput = document.getElementById("expenses");
const serviceInput = document.getElementById("category");
const dateTimeInput = document.getElementById("date-time");
const noteInput = document.getElementById("note");
const saveButton = document.getElementById("save-expense");
const confirmationModal = document.getElementById("salesConfirmation-modal");
const overlay = document.getElementById("overlay");

const quickAmountButtons = [
  { id: "quick-1k", value: 1000 },
  { id: "quick-2k", value: 2000 },
  { id: "quick-5k", value: 5000 },
  { id: "quick-10k", value: 10000 },
];

const quickServiceButtons = [
  "first-commonService",
  "second-commonService",
  "third-commonService",
  "fourth-commonService",
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

const getToken = () => localStorage.getItem("token");

const showToast = (message, type = "info") => {
  if (typeof Toastify !== "function") return;
  const background =
    type === "error"
      ? "linear-gradient(to right, #ff5f6d, #ffc371)"
      : "linear-gradient(to right, #00b09b, #96c93d)";

  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "center",
    stopOnFocus: true,
    style: { background, borderRadius: "10px" },
  }).showToast();
};

const parseAmount = (raw) => {
  const cleaned = String(raw || "").replace(/[^0-9.]/g, "");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
};

const formatTime = (isoDateTime) => {
  const dt = new Date(isoDateTime);
  return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const formatDate = (isoDateTime) => {
  const dt = new Date(isoDateTime);
  return dt.toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const showConfirmation = async ({ amount, service, transactionDate }) => {
  if (!confirmationModal) return;

  const amountReceived = document.getElementById("amount-received");
  const serviceType = document.getElementById("serviceType-log");
  const salesTime = document.getElementById("salesTime-log");
  const dateLog = document.getElementById("date-log");
  const totalSales = document.getElementById("total-Sales");

  if (amountReceived) amountReceived.textContent = formatCurrency(amount);
  if (serviceType) serviceType.textContent = service || "General expense";
  if (salesTime) salesTime.textContent = formatTime(transactionDate);
  if (dateLog) dateLog.textContent = formatDate(transactionDate);

  try {
    // Calculate total expenses today from localStorage
    const existingTx = JSON.parse(localStorage.getItem("finlite_tx") || "[]");
    const today = new Date().toDateString();
    const todayTotal = existingTx
      .filter(
        (t) =>
          t.category === "expense" && new Date(t.date).toDateString() === today,
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    if (totalSales) totalSales.textContent = formatCurrency(todayTotal);
  } catch (error) {
    console.error("Failed to compute total expenses:", error);
  }

  if (overlay) {
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
  }

  confirmationModal.classList.remove("hidden");
  confirmationModal.classList.add("flex");
};

const hideConfirmation = () => {
  if (!confirmationModal) return;
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
  }
  confirmationModal.classList.add("hidden");
  confirmationModal.classList.remove("flex");
};

const wireQuickInputs = () => {
  quickAmountButtons.forEach(({ id, value }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      amountInput.value = String(value);
    });
  });

  quickServiceButtons.forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      serviceInput.value = btn.textContent.trim();
    });
  });
};

const wireModalButtons = () => {
  const anotherExpenseBtn = document.getElementById("another-saleBtn");
  const returnBtn = document.getElementById("return-btn");
  const cancelLink = document.getElementById("cancel-expense");

  if (anotherExpenseBtn) {
    anotherExpenseBtn.addEventListener("click", (event) => {
      event.preventDefault();
      hideConfirmation();
      expenseForm.reset();
    });
  }

  if (returnBtn) {
    returnBtn.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "dashboard.html";
    });
  }

  if (cancelLink) {
    cancelLink.addEventListener("click", (event) => {
      event.preventDefault();
      expenseForm.reset();
    });
  }
};

const saveExpense = async (event) => {
  event.preventDefault();
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const amount = parseAmount(amountInput.value);
  const service = serviceInput.value.trim();
  const notes = noteInput.value.trim();
  const transactionDate = dateTimeInput.value
    ? new Date(dateTimeInput.value).toISOString()
    : new Date().toISOString();

  if (!amount || amount <= 0) {
    showToast("Enter a valid expense amount", "error");
    return;
  }

  const payload = {
    transaction_id: `expense_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    category: "expense",
    amount,
    service: service || "General expense",
    notes,
    transaction_date: transactionDate,
  };

  const originalText = saveButton.innerHTML;
  saveButton.disabled = true;
  saveButton.innerHTML = "<span>Saving...</span>";

  try {
    const response = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || "Could not save expense", "error");
      return;
    }

    showToast("Expense saved successfully", "success");
  } catch (error) {
    console.error("Error saving expense:", error);
    showToast("Error saving expense. Please try again.", "error");
    return;
  } finally {
    // Always save to localStorage
    const existingTx = JSON.parse(localStorage.getItem("finlite_tx") || "[]");
    const localTx = {
      id: payload.transaction_id,
      category: payload.category,
      amount: payload.amount,
      service: payload.service,
      notes: payload.notes,
      date: payload.transaction_date,
    };
    existingTx.push(localTx);
    localStorage.setItem("finlite_tx", JSON.stringify(existingTx));

    // Show confirmation modal after saving locally
    await showConfirmation({
      amount,
      service: payload.service,
      transactionDate,
    });

    saveButton.disabled = false;
    saveButton.innerHTML = originalText;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (!expenseForm) return;
  if (!getToken()) {
    window.location.href = "login.html";
    return;
  }

  // Prevent form submission and handle save
  expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveExpense(event);
  });

  wireQuickInputs();
  wireModalButtons();
  // Add click listener to save button since it's outside the form
  if (saveButton) {
    saveButton.addEventListener("click", (event) => {
      event.preventDefault();
      saveExpense(event);
    });
  }
});
