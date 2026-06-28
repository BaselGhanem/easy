(() => {
  "use strict";

  const STORAGE_KEY = "premium_cashflow_tracker_v1";
  const ACTIVE_VERSION = "20260628_finance_cashflow_v1";

  const BANKS = {
    alrajhi: { id: "alrajhi", name: "مصرف الراجحي", shortName: "الراجحي" },
    arab: { id: "arab", name: "البنك العربي", shortName: "العربي" },
    cash: { id: "cash", name: "محفظة نقدية", shortName: "نقدي" }
  };

  const CATEGORY_DEFS = [
    { id: "income", name: "مصادر الدخل", kind: "income" },
    { id: "salaryDeduction", name: "اقتطاعات الراتب", kind: "deduction" },
    { id: "banking", name: "التزامات بنكية / قروض / دفعات", kind: "expense" },
    { id: "home", name: "المنزل والعقار", kind: "expense" },
    { id: "bills", name: "فواتير وخدمات", kind: "expense" },
    { id: "personal", name: "مصروف شخصي / عائلي", kind: "expense" },
    { id: "debt", name: "تحويلات وسداد ديون", kind: "expense" },
    { id: "internal", name: "تحويلات داخلية بين البنوك", kind: "transfer" }
  ];

  const TYPE_LABELS = {
    Income: "دخل",
    Expense: "مصروف",
    Transfer: "تحويل داخلي",
    Deduction: "اقتطاع",
    Reimbursement: "تعويض",
    DebtRepayment: "سداد دين"
  };

  const STATUS_LABELS = {
    Pending: "معلقة",
    Completed: "مكتملة",
    Delayed: "متأخرة",
    Skipped: "متجاوزة"
  };

  const MONTHLY_CLOSING_ITEMS = [
    "كل مصادر الدخل والتعويضات مكتملة",
    "لا توجد حركة متأخرة بدون قرار",
    "الأرصدة الفعلية مطابقة للبنوك",
    "تم تصدير تقرير الشهر",
    "تم حفظ نسخة JSON احتياطية",
    "تمت مراجعة أكبر 5 دفعات",
    "تم فصل التحويلات عن المصروف الحقيقي",
    "تم تجهيز خطة الشهر القادم"
  ];

  const DEFAULT_MONTH = new Date().toISOString().slice(0, 7);

  const DEFAULT_TRANSACTIONS = [
    {
      name: "استلام الراتب في مصرف الراجحي",
      amount: 2449.664,
      bank: "alrajhi",
      toBank: "",
      type: "Income",
      category: "income",
      plannedDate: `${DEFAULT_MONTH}-25`,
      actualDate: "",
      status: "Pending",
      notes: "Salary received in Al Rajhi Bank"
    },
    {
      name: "اقتطاع قرض السكن",
      amount: 444.000,
      bank: "alrajhi",
      toBank: "",
      type: "Deduction",
      category: "salaryDeduction",
      plannedDate: `${DEFAULT_MONTH}-25`,
      actualDate: "",
      status: "Pending",
      notes: "خصم مباشر من الراجحي"
    },
    {
      name: "تحويل المبلغ المتبقي إلى البنك العربي",
      amount: 2005.664,
      bank: "alrajhi",
      toBank: "arab",
      type: "Transfer",
      category: "internal",
      plannedDate: `${DEFAULT_MONTH}-25`,
      actualDate: "",
      status: "Pending",
      notes: "تحويل داخلي لا يُحسب كمصروف"
    },
    {
      name: "استلام تعويض قرض السكن في الراجحي",
      amount: 444.000,
      bank: "alrajhi",
      toBank: "",
      type: "Reimbursement",
      category: "income",
      plannedDate: `${DEFAULT_MONTH}-25`,
      actualDate: "",
      status: "Pending",
      notes: "Home loan reimbursement"
    },
    {
      name: "تحويل تعويض قرض السكن إلى البنك العربي",
      amount: 444.000,
      bank: "alrajhi",
      toBank: "arab",
      type: "Transfer",
      category: "internal",
      plannedDate: `${DEFAULT_MONTH}-25`,
      actualDate: "",
      status: "Pending",
      notes: "تحويل التعويض إلى العربي"
    },
    {
      name: "استلام تعويض بدل الإيجار في الراجحي",
      amount: 421.000,
      bank: "alrajhi",
      toBank: "",
      type: "Reimbursement",
      category: "income",
      plannedDate: `${DEFAULT_MONTH}-25`,
      actualDate: "",
      status: "Pending",
      notes: "Rent allowance reimbursement"
    },
    {
      name: "تحويل بدل الإيجار إلى البنك العربي",
      amount: 421.000,
      bank: "alrajhi",
      toBank: "arab",
      type: "Transfer",
      category: "internal",
      plannedDate: `${DEFAULT_MONTH}-25`,
      actualDate: "",
      status: "Pending",
      notes: "تحويل التعويض إلى العربي"
    },
    { name: "قرض البنك العربي", amount: 435.000, bank: "arab", toBank: "", type: "Expense", category: "banking", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "دفعة إلى البنك العربي", amount: 1081.188, bank: "arab", toBank: "", type: "Expense", category: "banking", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "قسط اللابتوب", amount: 21.000, bank: "arab", toBank: "", type: "Expense", category: "banking", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "البيت", amount: 150.000, bank: "arab", toBank: "", type: "Expense", category: "home", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "رسوم تحويل البيت", amount: 100.000, bank: "arab", toBank: "", type: "Expense", category: "home", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "مسقفات / ضريبة عقار", amount: 213.466, bank: "arab", toBank: "", type: "Expense", category: "home", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "موبايل", amount: 25.000, bank: "arab", toBank: "", type: "Expense", category: "bills", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "Microsoft", amount: 5.000, bank: "arab", toBank: "", type: "Expense", category: "bills", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "المصري", amount: 9.000, bank: "arab", toBank: "", type: "Expense", category: "bills", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "إنترنت", amount: 20.880, bank: "arab", toBank: "", type: "Expense", category: "bills", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "كهرباء", amount: 36.488, bank: "arab", toBank: "", type: "Expense", category: "bills", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "كهرباء العائلة", amount: 45.642, bank: "arab", toBank: "", type: "Expense", category: "bills", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "إنترنت العائلة", amount: 10.000, bank: "arab", toBank: "", type: "Expense", category: "bills", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "مياه", amount: 5.000, bank: "arab", toBank: "", type: "Expense", category: "bills", plannedDate: `${DEFAULT_MONTH}-26`, actualDate: "", status: "Pending", notes: "" },
    { name: "Basel", amount: 100.000, bank: "arab", toBank: "", type: "Expense", category: "personal", plannedDate: `${DEFAULT_MONTH}-27`, actualDate: "", status: "Pending", notes: "" },
    { name: "Areen", amount: 75.000, bank: "arab", toBank: "", type: "Expense", category: "personal", plannedDate: `${DEFAULT_MONTH}-27`, actualDate: "", status: "Pending", notes: "" },
    { name: "Mall", amount: 100.000, bank: "arab", toBank: "", type: "Expense", category: "personal", plannedDate: `${DEFAULT_MONTH}-27`, actualDate: "", status: "Pending", notes: "" },
    { name: "وقود", amount: 100.000, bank: "arab", toBank: "", type: "Expense", category: "personal", plannedDate: `${DEFAULT_MONTH}-27`, actualDate: "", status: "Pending", notes: "" },
    { name: "مخصص عقيقة", amount: 175.000, bank: "arab", toBank: "", type: "Expense", category: "personal", plannedDate: `${DEFAULT_MONTH}-27`, actualDate: "", status: "Pending", notes: "" },
    { name: "تحويل إلى آرين - سداد دين", amount: 163.000, bank: "arab", toBank: "", type: "DebtRepayment", category: "debt", plannedDate: `${DEFAULT_MONTH}-27`, actualDate: "", status: "Pending", notes: "مصروف حقيقي وليس تحويل داخلي بين حساباتي" }
  ].map((tx, index) => ({
    id: `default_${index + 1}_${cryptoSafeId()}`,
    ...tx
  }));

  let state = loadState();
  let derived = null;
  let confirmResolver = null;

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheEls();
    ensureMonth(state.activeMonth);
    applyPreferences();
    populateCategorySelect();
    bindEvents();
    render();
    if (!state.preferences.onboardingSeen) {
      openDialog("onboardingDialog");
    }
  }

  function cacheEls() {
    [
      "monthSelector", "accentPicker", "themeToggleBtn", "onboardingBtn", "finishOnboardingBtn",
      "dashboardCards", "sideExpectedRemaining", "heroFinalBalance", "healthPill", "moneyFlow",
      "smartSummary", "unpaidCard", "unpaidCount", "largestRemainingCard", "todayActionsCard",
      "warningsCard", "bankCards", "categoryCards", "transactionsTableBody", "transactionCards",
      "searchInput", "statusFilter", "bankFilter", "sortSelect", "categoryChart", "statusChart",
      "balanceChart", "topPaymentsChart", "incomeExpenseChart", "transferExpenseChart", "timelineList",
      "closingChecklist", "openTransactionBtn", "quickAddFab", "transactionDialog", "transactionForm",
      "transactionDialogTitle", "transactionId", "txName", "txAmount", "txType", "txBank", "txToBank",
      "toBankField", "txCategory", "txPlannedDate", "txActualDate", "txStatus", "txNotes",
      "deleteTransactionBtn", "confirmDialog", "confirmTitle", "confirmMessage", "confirmInputWrap",
      "confirmInput", "confirmOkBtn", "exportJsonBtn", "importJsonBtn", "jsonImportInput", "exportCsvBtn",
      "printReportBtn", "resetMonthBtn", "duplicateMonthBtn", "saveStatus", "toastHost"
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });

    els.openingInputs = Array.from(document.querySelectorAll(".opening-input"));
    els.navLinks = Array.from(document.querySelectorAll(".nav-link"));
  }

  function bindEvents() {
    els.navLinks.forEach((button) => {
      button.addEventListener("click", () => {
        els.navLinks.forEach((link) => link.classList.remove("is-active"));
        button.classList.add("is-active");
        document.getElementById(button.dataset.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    els.monthSelector.addEventListener("change", () => {
      state.activeMonth = els.monthSelector.value || DEFAULT_MONTH;
      ensureMonth(state.activeMonth);
      saveAndRender("تم تغيير الشهر");
    });

    els.openingInputs.forEach((input) => {
      input.addEventListener("input", () => {
        const month = getActiveMonth();
        month.openingBalances[input.dataset.bank] = money(input.value);
        saveAndRender("تم تحديث الرصيد الافتتاحي");
      });
    });

    els.accentPicker.addEventListener("input", () => {
      state.preferences.accent = els.accentPicker.value || "#099999";
      applyPreferences();
      saveState();
    });

    els.themeToggleBtn.addEventListener("click", () => {
      state.preferences.theme = state.preferences.theme === "dark" ? "light" : "dark";
      applyPreferences();
      saveState();
      render();
    });

    els.onboardingBtn.addEventListener("click", () => openDialog("onboardingDialog"));
    els.finishOnboardingBtn.addEventListener("click", () => {
      state.preferences.onboardingSeen = true;
      saveState();
      closeDialog("onboardingDialog");
    });

    els.openTransactionBtn.addEventListener("click", () => openTransactionEditor());
    els.quickAddFab.addEventListener("click", () => openTransactionEditor());

    [els.searchInput, els.statusFilter, els.bankFilter, els.sortSelect].forEach((control) => {
      control.addEventListener("input", renderTransactions);
      control.addEventListener("change", renderTransactions);
    });

    els.txType.addEventListener("change", syncTypeFields);
    els.transactionForm.addEventListener("submit", onTransactionSubmit);
    els.deleteTransactionBtn.addEventListener("click", onDeleteTransaction);

    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
    });

    els.exportJsonBtn.addEventListener("click", exportJson);
    els.importJsonBtn.addEventListener("click", () => els.jsonImportInput.click());
    els.jsonImportInput.addEventListener("change", importJson);
    els.exportCsvBtn.addEventListener("click", exportCsv);
    els.printReportBtn.addEventListener("click", () => window.print());
    els.resetMonthBtn.addEventListener("click", resetMonth);
    els.duplicateMonthBtn.addEventListener("click", duplicateToNextMonth);

    document.addEventListener("change", (event) => {
      const toggle = event.target.closest("[data-toggle-complete]");
      if (toggle) {
        updateTransactionStatus(toggle.dataset.toggleComplete, toggle.checked ? "Completed" : "Pending");
      }

      const checklist = event.target.closest("[data-checklist-index]");
      if (checklist) {
        const month = getActiveMonth();
        month.closingChecklist[checklist.dataset.checklistIndex] = checklist.checked;
        saveAndRender("تم تحديث قائمة الإغلاق");
      }
    });

    document.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-edit-id]");
      if (editButton) {
        openTransactionEditor(editButton.dataset.editId);
      }

      const categoryButton = event.target.closest("[data-category-toggle]");
      if (categoryButton) {
        const card = categoryButton.closest(".category-card");
        card?.classList.toggle("is-open");
      }
    });

    els.confirmDialog.addEventListener("close", () => {
      if (!confirmResolver) return;
      const confirmed = els.confirmDialog.returnValue === "ok";
      const needsPhrase = els.confirmInputWrap.classList.contains("is-visible");
      const phraseValid = !needsPhrase || els.confirmInput.value.trim().toUpperCase() === "RESET";
      confirmResolver(Boolean(confirmed && phraseValid));
      confirmResolver = null;
      els.confirmInput.value = "";
      els.confirmInputWrap.classList.remove("is-visible");
    });
  }

  function loadState() {
    const fallback = createFreshState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      const merged = {
        version: ACTIVE_VERSION,
        activeMonth: parsed.activeMonth || DEFAULT_MONTH,
        preferences: {
          theme: parsed.preferences?.theme || "dark",
          accent: parsed.preferences?.accent || "#099999",
          onboardingSeen: Boolean(parsed.preferences?.onboardingSeen)
        },
        months: parsed.months && typeof parsed.months === "object" ? parsed.months : fallback.months
      };

      Object.keys(merged.months).forEach((monthKey) => normalizeMonth(merged.months[monthKey], monthKey));
      return merged;
    } catch {
      return fallback;
    }
  }

  function createFreshState() {
    return {
      version: ACTIVE_VERSION,
      activeMonth: DEFAULT_MONTH,
      preferences: {
        theme: "dark",
        accent: "#099999",
        onboardingSeen: false
      },
      months: {
        [DEFAULT_MONTH]: createDefaultMonth(DEFAULT_MONTH)
      }
    };
  }

  function createDefaultMonth(monthKey) {
    const datePrefix = monthKey || DEFAULT_MONTH;
    return {
      openingBalances: { alrajhi: 0, arab: 0, cash: 0 },
      transactions: DEFAULT_TRANSACTIONS.map((tx, index) => ({
        ...tx,
        id: `tx_${datePrefix.replace("-", "")}_${index + 1}_${cryptoSafeId()}`,
        plannedDate: tx.plannedDate.replace(DEFAULT_MONTH, datePrefix),
        actualDate: ""
      })),
      closingChecklist: MONTHLY_CLOSING_ITEMS.map(() => false)
    };
  }

  function normalizeMonth(month, monthKey) {
    month.openingBalances = {
      alrajhi: money(month.openingBalances?.alrajhi),
      arab: money(month.openingBalances?.arab),
      cash: money(month.openingBalances?.cash)
    };

    month.transactions = Array.isArray(month.transactions) ? month.transactions.map((tx) => ({
      id: tx.id || `tx_${cryptoSafeId()}`,
      name: String(tx.name || "حركة مالية"),
      amount: Math.abs(money(tx.amount)),
      bank: BANKS[tx.bank] ? tx.bank : "arab",
      toBank: BANKS[tx.toBank] ? tx.toBank : "",
      type: TYPE_LABELS[tx.type] ? tx.type : "Expense",
      category: CATEGORY_DEFS.some((cat) => cat.id === tx.category) ? tx.category : "personal",
      plannedDate: validDate(tx.plannedDate) ? tx.plannedDate : `${monthKey}-01`,
      actualDate: validDate(tx.actualDate) ? tx.actualDate : "",
      status: STATUS_LABELS[tx.status] ? tx.status : "Pending",
      notes: String(tx.notes || "")
    })) : [];

    month.closingChecklist = Array.isArray(month.closingChecklist) && month.closingChecklist.length === MONTHLY_CLOSING_ITEMS.length
      ? month.closingChecklist.map(Boolean)
      : MONTHLY_CLOSING_ITEMS.map(() => false);
  }

  function ensureMonth(monthKey) {
    if (!state.months[monthKey]) {
      state.months[monthKey] = createDefaultMonth(monthKey);
    }
    normalizeMonth(state.months[monthKey], monthKey);
  }

  function getActiveMonth() {
    ensureMonth(state.activeMonth);
    return state.months[state.activeMonth];
  }

  function saveState() {
    showSaving();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.clearTimeout(saveState._timer);
    saveState._timer = window.setTimeout(() => {
      els.saveStatus?.classList.remove("is-saving");
      if (els.saveStatus) els.saveStatus.querySelector("span:last-child").textContent = "محفوظ محلياً";
    }, 450);
  }

  function saveAndRender(message) {
    saveState();
    render();
    if (message) showToast(message);
  }

  function showSaving() {
    if (!els.saveStatus) return;
    els.saveStatus.classList.add("is-saving");
    els.saveStatus.querySelector("span:last-child").textContent = "جاري الحفظ...";
  }

  function applyPreferences() {
    document.documentElement.dataset.theme = state.preferences.theme || "dark";
    document.documentElement.style.setProperty("--accent", state.preferences.accent || "#099999");
    document.documentElement.style.setProperty("--accent-rgb", hexToRgb(state.preferences.accent || "#099999"));
    els.accentPicker.value = state.preferences.accent || "#099999";
    els.themeToggleBtn.textContent = state.preferences.theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن";
  }

  function render() {
    derived = calculateMonth(getActiveMonth());
    els.monthSelector.value = state.activeMonth;

    els.openingInputs.forEach((input) => {
      input.value = formatInput(getActiveMonth().openingBalances[input.dataset.bank]);
    });

    renderDashboard();
    renderBanks();
    renderCategories();
    renderTransactions();
    renderCharts();
    renderTimeline();
    renderClosingChecklist();
    syncTypeFields();
  }

  function calculateMonth(month) {
    const sorted = getSortedTransactions(month.transactions, "dateAsc");
    const plannedBalances = { ...month.openingBalances };
    const actualBalances = { ...month.openingBalances };

    const bankStats = Object.fromEntries(Object.keys(BANKS).map((id) => [id, {
      opening: money(month.openingBalances[id]),
      income: 0,
      reimbursements: 0,
      transfersIn: 0,
      transfersOut: 0,
      deductions: 0,
      expenses: 0,
      actualIncome: 0,
      actualReimbursements: 0,
      actualTransfersIn: 0,
      actualTransfersOut: 0,
      actualDeductions: 0,
      actualExpenses: 0,
      plannedFinal: money(month.openingBalances[id]),
      actualFinal: money(month.openingBalances[id]),
      ledger: []
    }]));

    const categoryStats = Object.fromEntries(CATEGORY_DEFS.map((cat) => [cat.id, {
      ...cat,
      planned: 0,
      completed: 0,
      pending: 0,
      count: 0,
      transactions: []
    }]));

    const timeline = [];
    const actualTimeline = [];

    let totalIncome = 0;
    let totalSalary = 0;
    let totalReimbursements = 0;
    let totalRealExpenses = 0;
    let completedExpenses = 0;
    let pendingExpenses = 0;
    let transferVolume = 0;
    let completedTransferVolume = 0;

    sorted.forEach((tx, index) => {
      const amount = money(tx.amount);
      const plannedBefore = plannedBalances[tx.bank] ?? 0;
      const actualBefore = actualBalances[tx.bank] ?? 0;
      const isCompleted = tx.status === "Completed";
      const isSkipped = tx.status === "Skipped";
      const isRealExpense = isExpenseLike(tx.type);
      const isIncome = tx.type === "Income" || tx.type === "Reimbursement";

      let plannedAfter = plannedBefore;
      let actualAfter = actualBefore;

      if (!isSkipped) {
        if (tx.type === "Transfer") {
          plannedAfter = plannedBefore - amount;
          plannedBalances[tx.bank] = plannedAfter;
          if (tx.toBank && plannedBalances[tx.toBank] !== undefined) {
            plannedBalances[tx.toBank] += amount;
          }

          bankStats[tx.bank].transfersOut += amount;
          if (tx.toBank) bankStats[tx.toBank].transfersIn += amount;
          transferVolume += amount;
        } else if (isIncome) {
          plannedAfter = plannedBefore + amount;
          plannedBalances[tx.bank] = plannedAfter;
          bankStats[tx.bank].income += amount;
          if (tx.type === "Income") totalSalary += amount;
          if (tx.type === "Reimbursement") {
            bankStats[tx.bank].reimbursements += amount;
            totalReimbursements += amount;
          }
          totalIncome += amount;
        } else if (isRealExpense) {
          plannedAfter = plannedBefore - amount;
          plannedBalances[tx.bank] = plannedAfter;
          totalRealExpenses += amount;
          if (tx.type === "Deduction") bankStats[tx.bank].deductions += amount;
          else bankStats[tx.bank].expenses += amount;
        }
      }

      if (isCompleted && !isSkipped) {
        if (tx.type === "Transfer") {
          actualAfter = actualBefore - amount;
          actualBalances[tx.bank] = actualAfter;
          if (tx.toBank && actualBalances[tx.toBank] !== undefined) {
            actualBalances[tx.toBank] += amount;
          }
          bankStats[tx.bank].actualTransfersOut += amount;
          if (tx.toBank) bankStats[tx.toBank].actualTransfersIn += amount;
          completedTransferVolume += amount;
        } else if (isIncome) {
          actualAfter = actualBefore + amount;
          actualBalances[tx.bank] = actualAfter;
          bankStats[tx.bank].actualIncome += amount;
          if (tx.type === "Reimbursement") bankStats[tx.bank].actualReimbursements += amount;
        } else if (isRealExpense) {
          actualAfter = actualBefore - amount;
          actualBalances[tx.bank] = actualAfter;
          completedExpenses += amount;
          if (tx.type === "Deduction") bankStats[tx.bank].actualDeductions += amount;
          else bankStats[tx.bank].actualExpenses += amount;
        }
      }

      if (isRealExpense && tx.status !== "Completed" && tx.status !== "Skipped") {
        pendingExpenses += amount;
      }

      if (categoryStats[tx.category]) {
        const category = categoryStats[tx.category];
        category.count += 1;
        category.transactions.push(tx);
        if (!isSkipped && isRealExpense) {
          category.planned += amount;
          if (isCompleted) category.completed += amount;
          else category.pending += amount;
        }
      }

      const enriched = {
        ...tx,
        sequence: index + 1,
        plannedBefore,
        plannedAfter,
        actualBefore,
        actualAfter,
        signedAmount: signedAmount(tx),
        isRealExpense,
        isIncome,
        categoryName: getCategoryName(tx.category),
        bankName: BANKS[tx.bank]?.name || tx.bank,
        toBankName: tx.toBank ? BANKS[tx.toBank]?.name : ""
      };

      bankStats[tx.bank].ledger.push(enriched);
      timeline.push(enriched);

      if (isCompleted) {
        actualTimeline.push(enriched);
      }
    });

    Object.keys(BANKS).forEach((id) => {
      bankStats[id].plannedFinal = plannedBalances[id];
      bankStats[id].actualFinal = actualBalances[id];
    });

    const plannedFinalRemaining = sum(Object.values(plannedBalances));
    const actualCurrentRemaining = sum(Object.values(actualBalances));
    const totalAvailableFunds = totalIncome;
    const completionByExpense = totalRealExpenses ? completedExpenses / totalRealExpenses : 0;
    const completionByCount = sorted.length ? sorted.filter((tx) => tx.status === "Completed").length / sorted.length : 0;
    const largestCategory = Object.values(categoryStats)
      .filter((cat) => cat.kind === "expense")
      .sort((a, b) => b.planned - a.planned)[0];

    const delayed = sorted.filter((tx) => tx.status === "Delayed" || isPastDue(tx));
    const healthScore = calculateHealthScore({ plannedFinalRemaining, pendingExpenses, delayedCount: delayed.length, completionByExpense, totalRealExpenses });
    const financialPressure = calculatePressure(totalRealExpenses, totalAvailableFunds);

    return {
      sorted,
      bankStats,
      categoryStats,
      timeline,
      actualTimeline,
      totalSalary,
      totalReimbursements,
      totalAvailableFunds,
      totalRealExpenses,
      completedExpenses,
      pendingExpenses,
      plannedFinalRemaining,
      actualCurrentRemaining,
      completionByExpense,
      completionByCount,
      largestCategory,
      delayed,
      healthScore,
      financialPressure,
      transferVolume,
      completedTransferVolume,
      plannedBalances,
      actualBalances
    };
  }

  function renderDashboard() {
    const cards = [
      { label: "إجمالي الأموال المتاحة", value: fmt(derived.totalAvailableFunds), sub: "راتب + تعويضات" },
      { label: "الراتب", value: fmt(derived.totalSalary), sub: "Salary amount" },
      { label: "إجمالي التعويضات", value: fmt(derived.totalReimbursements), sub: "تحويلات تعويض للراتب" },
      { label: "المصروفات المخططة", value: fmt(derived.totalRealExpenses), sub: "مصروف حقيقي بدون تكرار التحويلات" },
      { label: "المصروفات المكتملة", value: fmt(derived.completedExpenses), sub: pct(derived.completionByExpense) },
      { label: "المصروفات المتبقية", value: fmt(derived.pendingExpenses), sub: "Pending + Delayed" },
      { label: "المتبقي المتوقع النهائي", value: fmt(derived.plannedFinalRemaining), sub: "بعد كل الحركات المخططة" },
      { label: "الرصيد الحالي الفعلي", value: fmt(derived.actualCurrentRemaining), sub: "حسب الحركات المكتملة فقط" },
      { label: "رصيد الراجحي الحالي", value: fmt(derived.bankStats.alrajhi.actualFinal), sub: `المتوقع: ${fmt(derived.bankStats.alrajhi.plannedFinal)}` },
      { label: "رصيد العربي الحالي", value: fmt(derived.bankStats.arab.actualFinal), sub: `المتوقع: ${fmt(derived.bankStats.arab.plannedFinal)}` },
      { label: "نسبة الإنجاز", value: pct(derived.completionByCount), sub: "حسب عدد الحركات" },
      { label: "أكبر تصنيف", value: derived.largestCategory?.name || "غير متاح", sub: derived.largestCategory ? fmt(derived.largestCategory.planned) : "0.000 JOD" },
      { label: "مؤشر الضغط المالي", value: derived.financialPressure.label, sub: pct(derived.financialPressure.ratio) },
      { label: "التحويلات الداخلية", value: fmt(derived.transferVolume), sub: "لا تُحتسب كمصروف" },
      { label: "فرق المخطط والفعلي", value: fmt(derived.plannedFinalRemaining - derived.actualCurrentRemaining), sub: "Expected - Actual" },
      { label: "النتيجة النهائية", value: fmt(derived.plannedFinalRemaining), sub: "Final remaining balance" }
    ];

    els.dashboardCards.innerHTML = cards.map((card, index) => `
      <article class="kpi-card" style="animation-delay:${index * 24}ms">
        <span>${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <small>${escapeHtml(card.sub)}</small>
      </article>
    `).join("");

    els.sideExpectedRemaining.textContent = fmt(derived.plannedFinalRemaining);
    els.heroFinalBalance.textContent = fmt(derived.plannedFinalRemaining);
    els.healthPill.textContent = `Score ${derived.healthScore}/100`;

    renderMoneyFlow();
    renderSmartSummary();
    renderInsightCards();
  }

  function renderMoneyFlow() {
    const arabReceived = derived.bankStats.arab.transfersIn;
    els.moneyFlow.innerHTML = [
      { title: "الراتب", value: derived.totalSalary, sub: "دخل الراتب إلى الراجحي" },
      { title: "الراجحي", value: derived.bankStats.alrajhi.plannedFinal, sub: `اقتطاعات ${fmt(derived.bankStats.alrajhi.deductions)} + تحويلات ${fmt(derived.bankStats.alrajhi.transfersOut)}` },
      { title: "التعويضات", value: derived.totalReimbursements, sub: "تعويض قرض السكن + بدل الإيجار" },
      { title: "البنك العربي", value: arabReceived, sub: "استقبل الحوالات ثم دفع المصروفات" },
      { title: "المصروفات والنتيجة", value: derived.totalRealExpenses, sub: `المتبقي النهائي: ${fmt(derived.plannedFinalRemaining)}` }
    ].map((node) => `
      <div class="flow-node">
        <span>${escapeHtml(node.title)}</span>
        <strong>${fmt(node.value)}</strong>
        <small>${escapeHtml(node.sub)}</small>
      </div>
    `).join("");
  }

  function renderSmartSummary() {
    const exactZero = Math.abs(derived.plannedFinalRemaining) < 0.0005;
    els.smartSummary.innerHTML = `
      <p>إجمالي الأموال المتاحة هو <strong>${fmt(derived.totalAvailableFunds)}</strong>، ويتكوّن من راتب بقيمة <strong>${fmt(derived.totalSalary)}</strong> وتعويضات بقيمة <strong>${fmt(derived.totalReimbursements)}</strong>.</p>
      <p>إجمالي المصروفات الحقيقية النهائية هو <strong>${fmt(derived.totalRealExpenses)}</strong>. التحويلات بين الراجحي والعربي مفصولة ولا تُحسب كمصروف مكرر.</p>
      <p>النتيجة النهائية: <strong>${exactZero ? "المتبقي النهائي 0.000 JOD" : `المتبقي النهائي ${fmt(derived.plannedFinalRemaining)}`}</strong>.</p>
      <p>الرصيد الفعلي الحالي حسب الحركات المكتملة فقط هو <strong>${fmt(derived.actualCurrentRemaining)}</strong>.</p>
    `;
  }

  function renderInsightCards() {
    els.unpaidCard.textContent = fmt(derived.pendingExpenses);
    const pendingCount = derived.sorted.filter((tx) => isExpenseLike(tx.type) && tx.status !== "Completed" && tx.status !== "Skipped").length;
    els.unpaidCount.textContent = `${pendingCount} حركات`;

    const remaining = derived.sorted
      .filter((tx) => isExpenseLike(tx.type) && tx.status !== "Completed" && tx.status !== "Skipped")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    els.largestRemainingCard.innerHTML = remaining.length ? remaining.map((tx) => `
      <div class="mini-item"><span>${escapeHtml(tx.name)}</span><strong>${fmt(tx.amount)}</strong></div>
    `).join("") : `<div class="mini-item"><span>لا توجد التزامات متبقية</span><strong>—</strong></div>`;

    const today = new Date().toISOString().slice(0, 10);
    const todayItems = derived.sorted
      .filter((tx) => tx.plannedDate === today && tx.status !== "Completed" && tx.status !== "Skipped")
      .slice(0, 3);

    els.todayActionsCard.innerHTML = todayItems.length ? todayItems.map((tx) => `
      <div class="mini-item"><span>${escapeHtml(tx.name)}</span><strong>${fmt(tx.amount)}</strong></div>
    `).join("") : `<div class="mini-item"><span>لا توجد حركات مستحقة اليوم</span><strong>—</strong></div>`;

    const warnings = [];
    if (Math.abs(derived.plannedFinalRemaining) > 0.0005) warnings.push(`المتبقي المتوقع ليس صفراً: ${fmt(derived.plannedFinalRemaining)}`);
    if (derived.delayed.length) warnings.push(`${derived.delayed.length} حركة متأخرة أو تجاوزت تاريخها`);
    if (Math.abs(derived.actualCurrentRemaining - sum(Object.values(derived.actualBalances))) > 0.0005) warnings.push("يوجد اختلاف في الرصيد الفعلي");
    if (!warnings.length) warnings.push("لا توجد تنبيهات حرجة");

    els.warningsCard.innerHTML = warnings.slice(0, 3).map((warning) => `
      <div class="mini-item"><span>${escapeHtml(warning)}</span><strong>${warning.includes("لا توجد") ? "مستقر" : "تنبيه"}</strong></div>
    `).join("");
  }

  function renderBanks() {
    els.bankCards.innerHTML = Object.values(BANKS).map((bank) => {
      const stat = derived.bankStats[bank.id];
      const ledger = stat.ledger.slice(0, 5).map((tx) => `
        <div class="ledger-item">
          <span>${formatDate(tx.plannedDate)}</span>
          <strong>${escapeHtml(tx.name)}</strong>
          <span class="${amountClass(tx.signedAmount)}">${fmtSigned(tx.signedAmount)}</span>
        </div>
      `).join("");

      return `
        <article class="bank-card">
          <div class="bank-card-head">
            <div>
              <p class="eyebrow">Bank Ledger</p>
              <h4>${escapeHtml(bank.name)}</h4>
            </div>
            <div class="bank-balance">
              <span class="eyebrow">الرصيد الفعلي</span>
              <strong>${fmt(stat.actualFinal)}</strong>
            </div>
          </div>

          <div class="metric-list">
            <div class="metric-row"><span>الرصيد الافتتاحي</span><strong>${fmt(stat.opening)}</strong></div>
            <div class="metric-row"><span>إجمالي الدخل</span><strong>${fmt(stat.income)}</strong></div>
            <div class="metric-row"><span>تحويلات داخلة</span><strong>${fmt(stat.transfersIn)}</strong></div>
            <div class="metric-row"><span>تحويلات خارجة</span><strong>${fmt(stat.transfersOut)}</strong></div>
            <div class="metric-row"><span>اقتطاعات</span><strong>${fmt(stat.deductions)}</strong></div>
            <div class="metric-row"><span>مصروفات</span><strong>${fmt(stat.expenses)}</strong></div>
            <div class="metric-row"><span>الرصيد المتوقع النهائي</span><strong>${fmt(stat.plannedFinal)}</strong></div>
            <div class="metric-row"><span>الرصيد الفعلي الحالي</span><strong>${fmt(stat.actualFinal)}</strong></div>
          </div>

          <div class="mini-ledger">
            ${ledger || `<div class="ledger-item"><span>—</span><strong>لا توجد حركات</strong><span>—</span></div>`}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderCategories() {
    const expenseCategories = Object.values(derived.categoryStats).filter((cat) => cat.kind === "expense");
    els.categoryCards.innerHTML = expenseCategories.map((category, index) => {
      const percent = category.planned ? category.completed / category.planned : 0;
      const transactions = category.transactions.map((tx) => `
        <div class="category-transaction">
          <strong>${escapeHtml(tx.name)}</strong>
          <span>${STATUS_LABELS[tx.status]}</span>
          <span>${fmt(tx.amount)}</span>
        </div>
      `).join("");

      return `
        <article class="category-card ${index === 0 ? "is-open" : ""}">
          <button class="category-button" type="button" data-category-toggle="${category.id}">
            <div>
              <h4>${escapeHtml(category.name)}</h4>
              <div class="category-summary">
                <span>المخطط: ${fmt(category.planned)}</span>
                <span>المكتمل: ${fmt(category.completed)}</span>
                <span>المتبقي: ${fmt(category.pending)}</span>
                <span>${category.count} حركات</span>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:${clamp(percent * 100, 0, 100)}%"></div></div>
            </div>
            <span class="mini-badge">${pct(percent)}</span>
          </button>
          <div class="category-content">
            ${transactions || `<div class="category-transaction"><strong>لا توجد حركات</strong><span>—</span><span>—</span></div>`}
            <div class="mini-item"><span>تحليل التصنيف</span><strong>${category.pending > 0 ? "يوجد مبلغ متبقٍ" : "مكتمل أو غير مستحق"}</strong></div>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderTransactions() {
    const list = getFilteredTransactions();
    els.transactionsTableBody.innerHTML = list.map((tx) => `
      <tr>
        <td>
          <label class="checkbox-toggle" title="تغيير حالة الاكتمال">
            <input type="checkbox" data-toggle-complete="${tx.id}" ${tx.status === "Completed" ? "checked" : ""} />
            <span></span>
          </label>
        </td>
        <td><strong>${escapeHtml(tx.name)}</strong><br><small>${escapeHtml(tx.notes || "")}</small></td>
        <td><span class="type-badge ${tx.type}">${TYPE_LABELS[tx.type]}</span></td>
        <td>${escapeHtml(tx.bankName)}${tx.toBankName ? ` ← ${escapeHtml(tx.toBankName)}` : ""}</td>
        <td>${escapeHtml(tx.categoryName)}</td>
        <td class="${amountClass(tx.signedAmount)}"><strong>${fmtSigned(tx.signedAmount)}</strong></td>
        <td>${formatDate(tx.plannedDate)}</td>
        <td>${fmt(tx.plannedBefore)}</td>
        <td>${fmt(tx.plannedAfter)}</td>
        <td>
          <div class="row-actions">
            <span class="status-badge ${tx.status}">${STATUS_LABELS[tx.status]}</span>
            <button class="btn btn-soft" type="button" data-edit-id="${tx.id}">تعديل</button>
          </div>
        </td>
      </tr>
    `).join("");

    els.transactionCards.innerHTML = list.map((tx) => `
      <article class="mobile-tx-card">
        <div class="mobile-tx-top">
          <div>
            <h4>${escapeHtml(tx.name)}</h4>
            <span class="status-badge ${tx.status}">${STATUS_LABELS[tx.status]}</span>
          </div>
          <label class="checkbox-toggle" title="تغيير حالة الاكتمال">
            <input type="checkbox" data-toggle-complete="${tx.id}" ${tx.status === "Completed" ? "checked" : ""} />
            <span></span>
          </label>
        </div>
        <div class="mobile-tx-meta">
          <div><span>المبلغ</span><strong class="${amountClass(tx.signedAmount)}">${fmtSigned(tx.signedAmount)}</strong></div>
          <div><span>البنك</span><strong>${escapeHtml(tx.bankName)}</strong></div>
          <div><span>التصنيف</span><strong>${escapeHtml(tx.categoryName)}</strong></div>
          <div><span>التاريخ</span><strong>${formatDate(tx.plannedDate)}</strong></div>
          <div><span>الرصيد قبل</span><strong>${fmt(tx.plannedBefore)}</strong></div>
          <div><span>الرصيد بعد</span><strong>${fmt(tx.plannedAfter)}</strong></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-soft" type="button" data-edit-id="${tx.id}">تعديل</button>
        </div>
      </article>
    `).join("");
  }

  function renderCharts() {
    renderCategoryChart();
    renderStatusChart();
    renderBalanceChart();
    renderTopPaymentsChart();
    renderComparisonCharts();
  }

  function renderCategoryChart() {
    const expenseCategories = Object.values(derived.categoryStats).filter((cat) => cat.kind === "expense");
    const maxValue = Math.max(1, ...expenseCategories.map((cat) => cat.planned));
    els.categoryChart.innerHTML = expenseCategories.map((cat) => `
      <div class="bar-row">
        <div class="bar-row-head"><span>${escapeHtml(cat.name)}</span><strong>${fmt(cat.planned)}</strong></div>
        <div class="bar-track"><div class="bar-fill" style="--w:${(cat.planned / maxValue) * 100}%"></div></div>
      </div>
    `).join("");
  }

  function renderStatusChart() {
    const completed = derived.completedExpenses;
    const pending = derived.pendingExpenses;
    const skipped = sum(derived.sorted.filter((tx) => isExpenseLike(tx.type) && tx.status === "Skipped").map((tx) => tx.amount));
    const total = Math.max(0.001, completed + pending + skipped);
    const completedDeg = (completed / total) * 360;
    const pendingDeg = completedDeg + ((pending / total) * 360);
    els.statusChart.innerHTML = `
      <div class="donut" style="--completedDeg:${completedDeg}deg;--pendingDeg:${pendingDeg}deg" data-label="${pct(completed / total)}"></div>
      <div class="legend">
        <div class="legend-item"><span><i class="legend-dot" style="background:var(--green)"></i>مكتمل</span><strong>${fmt(completed)}</strong></div>
        <div class="legend-item"><span><i class="legend-dot" style="background:var(--amber)"></i>معلق</span><strong>${fmt(pending)}</strong></div>
        <div class="legend-item"><span><i class="legend-dot" style="background:var(--red)"></i>متجاوز</span><strong>${fmt(skipped)}</strong></div>
      </div>
    `;
  }

  function renderBalanceChart() {
    const points = buildBalancePoints(derived.timeline);
    const width = 720;
    const height = 240;
    const padding = 34;
    const allValues = points.flatMap((point) => [point.alrajhi, point.arab, point.cash]);
    const min = Math.min(...allValues, 0);
    const max = Math.max(...allValues, 1);
    const y = (value) => height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2);
    const x = (index) => padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
    const line = (bank) => points.map((point, index) => `${x(index)},${y(point[bank])}`).join(" ");

    els.balanceChart.innerHTML = `
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="حركة أرصدة البنوك">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="currentColor" opacity=".18"/>
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="currentColor" opacity=".18"/>
        <polyline points="${line("alrajhi")}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${line("arab")}" fill="none" stroke="var(--green)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${line("cash")}" fill="none" stroke="var(--gold)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="${padding}" y="${padding - 10}">${fmt(max)}</text>
        <text x="${padding}" y="${height - 8}">${fmt(min)}</text>
        <text x="${width - 170}" y="26">الراجحي / العربي / نقدي</text>
      </svg>
    `;
  }

  function renderTopPaymentsChart() {
    const top = derived.sorted
      .filter((tx) => isExpenseLike(tx.type))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    const maxValue = Math.max(1, ...top.map((tx) => tx.amount));

    els.topPaymentsChart.innerHTML = top.map((tx) => `
      <div class="bar-row">
        <div class="bar-row-head"><span>${escapeHtml(tx.name)}</span><strong>${fmt(tx.amount)}</strong></div>
        <div class="bar-track"><div class="bar-fill" style="--w:${(tx.amount / maxValue) * 100}%"></div></div>
      </div>
    `).join("");
  }

  function renderComparisonCharts() {
    const incomeExpense = [
      { label: "الدخل والتعويضات", value: derived.totalAvailableFunds },
      { label: "المصروفات الحقيقية", value: derived.totalRealExpenses }
    ];
    const transfersExpenses = [
      { label: "التحويلات الداخلية", value: derived.transferVolume },
      { label: "المصروفات الحقيقية", value: derived.totalRealExpenses }
    ];

    els.incomeExpenseChart.innerHTML = renderComparisonRows(incomeExpense);
    els.transferExpenseChart.innerHTML = renderComparisonRows(transfersExpenses);
  }

  function renderComparisonRows(rows) {
    const maxValue = Math.max(1, ...rows.map((row) => row.value));
    return rows.map((row) => `
      <div class="compare-row">
        <div class="compare-row-head"><span>${escapeHtml(row.label)}</span><strong>${fmt(row.value)}</strong></div>
        <div class="compare-track"><div class="compare-fill" style="--w:${(row.value / maxValue) * 100}%"></div></div>
      </div>
    `).join("");
  }

  function renderTimeline() {
    els.timelineList.innerHTML = derived.timeline.map((tx) => `
      <article class="timeline-item">
        <div class="timeline-date">${formatDate(tx.plannedDate)}<br><span class="status-badge ${tx.status}">${STATUS_LABELS[tx.status]}</span></div>
        <div class="timeline-body">
          <strong>${escapeHtml(tx.name)}</strong>
          <span>${escapeHtml(tx.bankName)}${tx.toBankName ? ` ← ${escapeHtml(tx.toBankName)}` : ""} · ${escapeHtml(tx.categoryName)}</span>
          ${tx.notes ? `<br><span>${escapeHtml(tx.notes)}</span>` : ""}
        </div>
        <div class="timeline-amount">
          <strong class="${amountClass(tx.signedAmount)}">${fmtSigned(tx.signedAmount)}</strong>
          <small>قبل: ${fmt(tx.plannedBefore)}</small>
          <small>بعد: ${fmt(tx.plannedAfter)}</small>
        </div>
      </article>
    `).join("");
  }

  function renderClosingChecklist() {
    const month = getActiveMonth();
    els.closingChecklist.innerHTML = MONTHLY_CLOSING_ITEMS.map((item, index) => `
      <label class="check-item">
        <input type="checkbox" data-checklist-index="${index}" ${month.closingChecklist[index] ? "checked" : ""} />
        <span>${escapeHtml(item)}</span>
      </label>
    `).join("");
  }

  function populateCategorySelect() {
    els.txCategory.innerHTML = CATEGORY_DEFS.map((cat) => `<option value="${cat.id}">${cat.name}</option>`).join("");
  }

  function getFilteredTransactions() {
    const query = (els.searchInput.value || "").trim().toLowerCase();
    const status = els.statusFilter.value;
    const bank = els.bankFilter.value;
    const sort = els.sortSelect.value;

    return getSortedTransactions(derived.timeline, sort).filter((tx) => {
      const matchesQuery = !query || [tx.name, tx.notes, tx.categoryName, tx.bankName].join(" ").toLowerCase().includes(query);
      const matchesStatus = status === "all" || tx.status === status;
      const matchesBank = bank === "all" || tx.bank === bank || tx.toBank === bank;
      return matchesQuery && matchesStatus && matchesBank;
    });
  }

  function getSortedTransactions(transactions, sort) {
    const order = [...transactions];
    const dateValue = (tx) => new Date(tx.plannedDate || "1970-01-01").getTime();

    order.sort((a, b) => {
      if (sort === "dateDesc") return dateValue(b) - dateValue(a);
      if (sort === "amountDesc") return money(b.amount) - money(a.amount);
      if (sort === "amountAsc") return money(a.amount) - money(b.amount);
      if (sort === "categoryAsc") return getCategoryName(a.category).localeCompare(getCategoryName(b.category), "ar");
      if (sort === "statusAsc") return STATUS_LABELS[a.status].localeCompare(STATUS_LABELS[b.status], "ar");
      return dateValue(a) - dateValue(b);
    });

    return order;
  }

  function openTransactionEditor(id = "") {
    const month = getActiveMonth();
    const tx = id ? month.transactions.find((item) => item.id === id) : null;

    els.transactionDialogTitle.textContent = tx ? "تعديل حركة مالية" : "إضافة حركة مالية";
    els.transactionId.value = tx?.id || "";
    els.txName.value = tx?.name || "";
    els.txAmount.value = tx ? formatInput(tx.amount) : "";
    els.txType.value = tx?.type || "Expense";
    els.txBank.value = tx?.bank || "arab";
    els.txToBank.value = tx?.toBank || "arab";
    els.txCategory.value = tx?.category || "personal";
    els.txPlannedDate.value = tx?.plannedDate || `${state.activeMonth}-01`;
    els.txActualDate.value = tx?.actualDate || "";
    els.txStatus.value = tx?.status || "Pending";
    els.txNotes.value = tx?.notes || "";
    els.deleteTransactionBtn.style.display = tx ? "inline-flex" : "none";
    syncTypeFields();
    openDialog("transactionDialog");
  }

  function onTransactionSubmit(event) {
    event.preventDefault();
    const month = getActiveMonth();
    const id = els.transactionId.value;
    const type = els.txType.value;
    const bank = els.txBank.value;
    const toBank = type === "Transfer" ? els.txToBank.value : "";
    const tx = {
      id: id || `tx_${state.activeMonth.replace("-", "")}_${cryptoSafeId()}`,
      name: els.txName.value.trim(),
      amount: Math.abs(money(els.txAmount.value)),
      bank,
      toBank,
      type,
      category: type === "Transfer" ? "internal" : els.txCategory.value,
      plannedDate: els.txPlannedDate.value,
      actualDate: els.txActualDate.value,
      status: els.txStatus.value,
      notes: els.txNotes.value.trim()
    };

    if (!tx.name || !tx.amount || !validDate(tx.plannedDate)) {
      showToast("راجع اسم الحركة والمبلغ والتاريخ", "لا يمكن حفظ حركة ناقصة");
      return;
    }

    if (tx.type === "Transfer" && tx.bank === tx.toBank) {
      showToast("التحويل غير صحيح", "حساب المصدر والوجهة لا يجب أن يكونا نفس الحساب");
      return;
    }

    if (id) {
      const index = month.transactions.findIndex((item) => item.id === id);
      if (index >= 0) month.transactions[index] = tx;
    } else {
      month.transactions.push(tx);
    }

    closeDialog("transactionDialog");
    saveAndRender("تم حفظ الحركة المالية");
  }

  async function onDeleteTransaction() {
    const id = els.transactionId.value;
    if (!id) return;
    const ok = await askConfirm("حذف الحركة", "هل تريد حذف هذه الحركة؟ لا يمكن التراجع بعد الحذف.", false);
    if (!ok) return;

    const month = getActiveMonth();
    month.transactions = month.transactions.filter((tx) => tx.id !== id);
    closeDialog("transactionDialog");
    saveAndRender("تم حذف الحركة");
  }

  function updateTransactionStatus(id, status) {
    const month = getActiveMonth();
    const tx = month.transactions.find((item) => item.id === id);
    if (!tx) return;
    tx.status = status;
    if (status === "Completed" && !tx.actualDate) tx.actualDate = new Date().toISOString().slice(0, 10);
    if (status !== "Completed") tx.actualDate = "";
    saveAndRender(status === "Completed" ? "تم تحديث الحركة كمكتملة" : "تم إرجاع الحركة إلى معلقة");
  }

  function syncTypeFields() {
    const isTransfer = els.txType.value === "Transfer";
    els.toBankField.style.display = isTransfer ? "grid" : "none";
    if (isTransfer) {
      els.txCategory.value = "internal";
      els.txCategory.disabled = true;
    } else {
      els.txCategory.disabled = false;
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `cashflow-backup-${state.activeMonth}.json`);
    showToast("تم إنشاء النسخة الاحتياطية", "ملف JSON جاهز للاستعادة لاحقاً");
  }

  async function importJson(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const raw = await file.text();
      const imported = JSON.parse(raw);
      if (!imported.months || !imported.preferences) throw new Error("Invalid backup");
      const ok = await askConfirm("استيراد نسخة احتياطية", "سيتم استبدال البيانات الحالية بالملف المستورد. هل تريد المتابعة؟", false);
      if (!ok) return;

      state = imported;
      state.version = ACTIVE_VERSION;
      if (!state.activeMonth) state.activeMonth = DEFAULT_MONTH;
      if (!state.preferences) state.preferences = { theme: "dark", accent: "#099999", onboardingSeen: true };
      Object.keys(state.months).forEach((key) => normalizeMonth(state.months[key], key));
      applyPreferences();
      saveAndRender("تم استيراد النسخة الاحتياطية");
    } catch {
      showToast("فشل الاستيراد", "ملف JSON غير صالح أو غير متوافق");
    }
  }

  function exportCsv() {
    const rows = [
      ["الشهر", "الحالة", "الحركة", "النوع", "البنك", "إلى بنك", "التصنيف", "المبلغ", "التاريخ المخطط", "التاريخ الفعلي", "الرصيد قبل", "الرصيد بعد", "ملاحظات"],
      ...derived.timeline.map((tx) => [
        state.activeMonth,
        STATUS_LABELS[tx.status],
        tx.name,
        TYPE_LABELS[tx.type],
        tx.bankName,
        tx.toBankName || "",
        tx.categoryName,
        money(tx.amount).toFixed(3),
        tx.plannedDate,
        tx.actualDate || "",
        money(tx.plannedBefore).toFixed(3),
        money(tx.plannedAfter).toFixed(3),
        tx.notes || ""
      ])
    ];

    const csv = "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `cashflow-report-${state.activeMonth}.csv`);
    showToast("تم تصدير ملف Excel", "الملف بصيغة CSV متوافقة مع Excel");
  }

  async function resetMonth() {
    const ok = await askConfirm("تصفير الشهر", "سيتم حذف كل تعديلات الشهر الحالي وإرجاع الخطة الافتراضية. اكتب RESET للتأكيد.", true);
    if (!ok) {
      showToast("لم يتم التصفير", "لم يتم إدخال كلمة التأكيد الصحيحة");
      return;
    }

    state.months[state.activeMonth] = createDefaultMonth(state.activeMonth);
    saveAndRender("تم تصفير الشهر الحالي");
  }

  async function duplicateToNextMonth() {
    const current = state.activeMonth;
    const next = nextMonth(current);
    const ok = await askConfirm("نسخ للشهر القادم", `سيتم نسخ خطة ${current} إلى ${next}. هل تريد المتابعة؟`, false);
    if (!ok) return;

    const currentMonth = getActiveMonth();
    state.months[next] = {
      openingBalances: { ...derived.plannedBalances },
      transactions: currentMonth.transactions.map((tx) => ({
        ...tx,
        id: `tx_${next.replace("-", "")}_${cryptoSafeId()}`,
        plannedDate: shiftDateMonth(tx.plannedDate, next),
        actualDate: "",
        status: "Pending"
      })),
      closingChecklist: MONTHLY_CLOSING_ITEMS.map(() => false)
    };
    state.activeMonth = next;
    saveAndRender("تم نسخ الخطة للشهر القادم");
  }

  function askConfirm(title, message, requireResetPhrase) {
    els.confirmTitle.textContent = title;
    els.confirmMessage.textContent = message;
    els.confirmInputWrap.classList.toggle("is-visible", Boolean(requireResetPhrase));
    els.confirmInput.value = "";
    openDialog("confirmDialog");
    return new Promise((resolve) => {
      confirmResolver = resolve;
    });
  }

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "open");
  }

  function closeDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function showToast(title, message = "") {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong>${message ? `<small>${escapeHtml(message)}</small>` : ""}`;
    els.toastHost.appendChild(toast);
    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      window.setTimeout(() => toast.remove(), 280);
    }, 2600);
  }

  function buildBalancePoints(timeline) {
    const opening = getActiveMonth().openingBalances;
    const points = [{
      label: "Opening",
      alrajhi: opening.alrajhi,
      arab: opening.arab,
      cash: opening.cash
    }];

    timeline.forEach((tx) => {
      const last = { ...points[points.length - 1] };
      const amount = money(tx.amount);

      if (tx.status !== "Skipped") {
        if (tx.type === "Transfer") {
          last[tx.bank] -= amount;
          if (tx.toBank) last[tx.toBank] += amount;
        } else if (tx.type === "Income" || tx.type === "Reimbursement") {
          last[tx.bank] += amount;
        } else if (isExpenseLike(tx.type)) {
          last[tx.bank] -= amount;
        }
      }

      points.push(last);
    });

    return points;
  }

  function calculateHealthScore(data) {
    let score = 100;
    if (Math.abs(data.plannedFinalRemaining) > 0.0005) score -= 20;
    score -= Math.min(25, data.delayedCount * 5);
    if (data.totalRealExpenses > 0 && data.pendingExpenses / data.totalRealExpenses > 0.6) score -= 10;
    score += Math.round(data.completionByExpense * 10);
    return clamp(Math.round(score), 0, 100);
  }

  function calculatePressure(expenses, income) {
    const ratio = income ? expenses / income : 0;
    if (ratio >= 1) return { label: "مرتفع", ratio };
    if (ratio >= 0.75) return { label: "متوسط", ratio };
    return { label: "منخفض", ratio };
  }

  function isExpenseLike(type) {
    return ["Expense", "Deduction", "DebtRepayment"].includes(type);
  }

  function signedAmount(tx) {
    const amount = money(tx.amount);
    if (tx.type === "Income" || tx.type === "Reimbursement") return amount;
    if (tx.type === "Transfer" || isExpenseLike(tx.type)) return -amount;
    return 0;
  }

  function isPastDue(tx) {
    if (!tx.plannedDate || tx.status === "Completed" || tx.status === "Skipped") return false;
    const today = new Date().toISOString().slice(0, 10);
    return tx.plannedDate < today;
  }

  function getCategoryName(id) {
    return CATEGORY_DEFS.find((cat) => cat.id === id)?.name || "غير مصنف";
  }

  function fmt(value) {
    return `${money(value).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} JOD`;
  }

  function fmtSigned(value) {
    const numeric = money(value);
    const sign = numeric > 0 ? "+" : numeric < 0 ? "-" : "";
    return `${sign}${Math.abs(numeric).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} JOD`;
  }

  function formatInput(value) {
    return money(value).toFixed(3);
  }

  function pct(value) {
    return `${clamp(value * 100, 0, 999).toFixed(1)}%`;
  }

  function money(value) {
    const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(parsed) ? Math.round(parsed * 1000000) / 1000000 : 0;
  }

  function sum(values) {
    return values.reduce((total, value) => total + money(value), 0);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatDate(value) {
    if (!validDate(value)) return "—";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  function validDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function nextMonth(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function shiftDateMonth(dateValue, targetMonth) {
    if (!validDate(dateValue)) return `${targetMonth}-01`;
    const day = dateValue.slice(-2);
    const [year, month] = targetMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return `${targetMonth}-${String(Math.min(Number(day), lastDay)).padStart(2, "0")}`;
  }

  function amountClass(value) {
    const numeric = money(value);
    if (numeric > 0) return "amount-positive";
    if (numeric < 0) return "amount-negative";
    return "amount-neutral";
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function hexToRgb(hex) {
    const normalized = String(hex || "#099999").replace("#", "");
    const full = normalized.length === 3
      ? normalized.split("").map((char) => char + char).join("")
      : normalized.padEnd(6, "0").slice(0, 6);
    const int = Number.parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `${r}, ${g}, ${b}`;
  }

  function cryptoSafeId() {
    if (window.crypto?.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return arr[0].toString(36);
    }
    return Math.random().toString(36).slice(2, 10);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
