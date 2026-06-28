(() => {
  "use strict";

  const STORE = "cashflow_simple_v2";
  const DEFAULT_MONTH = new Date().toISOString().slice(0, 7);

  const BANKS = {
    alrajhi: "الراجحي",
    arab: "العربي",
    cash: "نقدي"
  };

  const TYPES = {
    Income: "دخل",
    Expense: "مصروف",
    Transfer: "تحويل",
    Deduction: "اقتطاع",
    Reimbursement: "تعويض",
    DebtRepayment: "سداد دين"
  };

  const STATUSES = {
    Pending: "غير مدفوع",
    Completed: "مدفوع",
    Delayed: "متأخر",
    Skipped: "متجاوز"
  };

  const CATEGORIES = [
    { id: "income", name: "مصادر الدخل" },
    { id: "banking", name: "التزامات بنكية" },
    { id: "home", name: "المنزل والعقار" },
    { id: "bills", name: "فواتير وخدمات" },
    { id: "personal", name: "مصروف شخصي / عائلي" },
    { id: "debt", name: "تحويلات وسداد ديون" },
    { id: "internal", name: "تحويلات داخلية" }
  ];

  const DEFAULT_ITEMS = [
    ["استلام الراتب في الراجحي", 2449.664, "alrajhi", "", "Income", "income", 25, "Salary received in Al Rajhi"],
    ["اقتطاع قرض السكن", 444.000, "alrajhi", "", "Deduction", "banking", 25, "خصم مباشر من الراجحي"],
    ["تحويل المتبقي إلى العربي", 2005.664, "alrajhi", "arab", "Transfer", "internal", 25, "تحويل داخلي لا يعتبر مصروف"],
    ["استلام تعويض قرض السكن", 444.000, "alrajhi", "", "Reimbursement", "income", 25, ""],
    ["تحويل تعويض قرض السكن إلى العربي", 444.000, "alrajhi", "arab", "Transfer", "internal", 25, ""],
    ["استلام بدل الإيجار", 421.000, "alrajhi", "", "Reimbursement", "income", 25, ""],
    ["تحويل بدل الإيجار إلى العربي", 421.000, "alrajhi", "arab", "Transfer", "internal", 25, ""],
    ["قرض البنك العربي", 435.000, "arab", "", "Expense", "banking", 26, ""],
    ["دفعة إلى البنك العربي", 1081.188, "arab", "", "Expense", "banking", 26, ""],
    ["قسط اللابتوب", 21.000, "arab", "", "Expense", "banking", 26, ""],
    ["البيت", 150.000, "arab", "", "Expense", "home", 26, ""],
    ["رسوم تحويل البيت", 100.000, "arab", "", "Expense", "home", 26, ""],
    ["مسقفات / ضريبة عقار", 213.466, "arab", "", "Expense", "home", 26, ""],
    ["موبايل", 25.000, "arab", "", "Expense", "bills", 26, ""],
    ["Microsoft", 5.000, "arab", "", "Expense", "bills", 26, ""],
    ["المصري", 9.000, "arab", "", "Expense", "bills", 26, ""],
    ["إنترنت", 20.880, "arab", "", "Expense", "bills", 26, ""],
    ["كهرباء", 36.488, "arab", "", "Expense", "bills", 26, ""],
    ["كهرباء العائلة", 45.642, "arab", "", "Expense", "bills", 26, ""],
    ["إنترنت العائلة", 10.000, "arab", "", "Expense", "bills", 26, ""],
    ["مياه", 5.000, "arab", "", "Expense", "bills", 26, ""],
    ["Basel", 100.000, "arab", "", "Expense", "personal", 27, ""],
    ["Areen", 75.000, "arab", "", "Expense", "personal", 27, ""],
    ["Mall", 100.000, "arab", "", "Expense", "personal", 27, ""],
    ["وقود", 100.000, "arab", "", "Expense", "personal", 27, ""],
    ["مخصص عقيقة", 175.000, "arab", "", "Expense", "personal", 27, ""],
    ["تحويل إلى آرين - سداد دين", 163.000, "arab", "", "DebtRepayment", "debt", 27, ""]
  ];

  let state = load();
  let data = null;
  let confirmResolve = null;

  const $ = (id) => document.getElementById(id);

  const el = {
    monthInput: $("monthInput"),
    themeBtn: $("themeBtn"),
    expectedRemaining: $("expectedRemaining"),
    balanceExplain: $("balanceExplain"),
    quickStats: $("quickStats"),
    flowIncome: $("flowIncome"),
    flowTransfers: $("flowTransfers"),
    flowExpenses: $("flowExpenses"),
    flowRemaining: $("flowRemaining"),
    openingInputs: Array.from(document.querySelectorAll(".openingInput")),
    bankCards: $("bankCards"),
    categoryCards: $("categoryCards"),
    searchInput: $("searchInput"),
    statusFilter: $("statusFilter"),
    transactionList: $("transactionList"),
    addBtn: $("addBtn"),
    fabBtn: $("fabBtn"),
    txDialog: $("txDialog"),
    txForm: $("txForm"),
    modalTitle: $("modalTitle"),
    txId: $("txId"),
    txName: $("txName"),
    txAmount: $("txAmount"),
    txStatus: $("txStatus"),
    txType: $("txType"),
    txBank: $("txBank"),
    txToBank: $("txToBank"),
    toBankWrap: $("toBankWrap"),
    txCategory: $("txCategory"),
    txDate: $("txDate"),
    txNotes: $("txNotes"),
    deleteBtn: $("deleteBtn"),
    copyNextBtn: $("copyNextBtn"),
    exportBtn: $("exportBtn"),
    importBtn: $("importBtn"),
    importFile: $("importFile"),
    csvBtn: $("csvBtn"),
    resetBtn: $("resetBtn"),
    confirmDialog: $("confirmDialog"),
    confirmTitle: $("confirmTitle"),
    confirmText: $("confirmText"),
    confirmPhraseWrap: $("confirmPhraseWrap"),
    confirmPhrase: $("confirmPhrase"),
    toast: $("toast")
  };

  init();

  function init() {
    ensureMonth(state.activeMonth);
    fillCategoryOptions();
    bind();
    render();
  }

  function bind() {
    el.monthInput.addEventListener("change", () => {
      state.activeMonth = el.monthInput.value || DEFAULT_MONTH;
      ensureMonth(state.activeMonth);
      saveRender("تم تغيير الشهر");
    });

    el.themeBtn.addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = state.theme;
      el.themeBtn.textContent = state.theme === "dark" ? "فاتح" : "داكن";
      save();
    });

    document.querySelectorAll("[data-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const panel = $(button.dataset.toggle);
        panel.classList.toggle("open");
        button.querySelector("i").textContent = panel.classList.contains("open") ? "−" : "+";
      });
    });

    el.openingInputs.forEach((input) => {
      input.addEventListener("input", () => {
        active().opening[input.dataset.bank] = num(input.value);
        saveRender();
      });
    });

    el.searchInput.addEventListener("input", renderTransactions);
    el.statusFilter.addEventListener("change", renderTransactions);
    el.addBtn.addEventListener("click", () => openEditor());
    el.fabBtn.addEventListener("click", () => openEditor());
    el.txType.addEventListener("change", syncFormType);
    el.txForm.addEventListener("submit", saveTransaction);
    el.deleteBtn.addEventListener("click", deleteCurrentTransaction);

    document.querySelectorAll("[data-close]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(el.txDialog));
    });

    document.addEventListener("click", (event) => {
      const edit = event.target.closest("[data-edit]");
      if (edit) openEditor(edit.dataset.edit);
    });

    document.addEventListener("change", (event) => {
      const paid = event.target.closest("[data-paid]");
      if (!paid) return;
      const tx = active().items.find((item) => item.id === paid.dataset.paid);
      if (!tx) return;
      tx.status = paid.checked ? "Completed" : "Pending";
      tx.actualDate = paid.checked ? today() : "";
      if (paid.checked && el.statusFilter.value !== "all") {
        el.statusFilter.value = "all";
      }
      saveRender(paid.checked ? "تم تسجيلها كمدفوعة" : "تم إرجاعها لغير مدفوعة");
    });

    el.copyNextBtn.addEventListener("click", copyToNextMonth);
    el.exportBtn.addEventListener("click", exportJson);
    el.importBtn.addEventListener("click", () => el.importFile.click());
    el.importFile.addEventListener("change", importJson);
    el.csvBtn.addEventListener("click", exportCsv);
    el.resetBtn.addEventListener("click", resetMonth);

    el.confirmDialog.addEventListener("close", () => {
      if (!confirmResolve) return;
      const ok = el.confirmDialog.returnValue === "ok";
      const phraseNeeded = !el.confirmPhraseWrap.classList.contains("hidden");
      const phraseOk = !phraseNeeded || el.confirmPhrase.value.trim().toUpperCase() === "RESET";
      confirmResolve(ok && phraseOk);
      confirmResolve = null;
      el.confirmPhrase.value = "";
      el.confirmPhraseWrap.classList.add("hidden");
    });
  }

  function fillCategoryOptions() {
    el.txCategory.innerHTML = CATEGORIES.map((cat) => `<option value="${cat.id}">${cat.name}</option>`).join("");
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (saved && saved.months) return saved;
    } catch {}
    return {
      activeMonth: DEFAULT_MONTH,
      theme: "dark",
      months: {
        [DEFAULT_MONTH]: newMonth(DEFAULT_MONTH)
      }
    };
  }

  function newMonth(month) {
    return {
      opening: { alrajhi: 0, arab: 0, cash: 0 },
      items: DEFAULT_ITEMS.map((row, index) => ({
        id: `tx_${month.replace("-", "")}_${index + 1}_${id()}`,
        name: row[0],
        amount: row[1],
        bank: row[2],
        toBank: row[3],
        type: row[4],
        category: row[5],
        date: `${month}-${String(row[6]).padStart(2, "0")}`,
        actualDate: "",
        status: "Pending",
        notes: row[7]
      }))
    };
  }

  function ensureMonth(month) {
    if (!state.months[month]) state.months[month] = newMonth(month);
    const m = state.months[month];
    m.opening = {
      alrajhi: num(m.opening?.alrajhi),
      arab: num(m.opening?.arab),
      cash: num(m.opening?.cash)
    };
    m.items = Array.isArray(m.items) ? m.items.map(cleanTx) : [];
  }

  function cleanTx(tx) {
    return {
      id: tx.id || `tx_${id()}`,
      name: String(tx.name || "حركة مالية"),
      amount: Math.abs(num(tx.amount)),
      bank: BANKS[tx.bank] ? tx.bank : "arab",
      toBank: BANKS[tx.toBank] ? tx.toBank : "",
      type: TYPES[tx.type] ? tx.type : "Expense",
      category: CATEGORIES.some((cat) => cat.id === tx.category) ? tx.category : "personal",
      date: /^\d{4}-\d{2}-\d{2}$/.test(tx.date || "") ? tx.date : `${state.activeMonth}-01`,
      actualDate: /^\d{4}-\d{2}-\d{2}$/.test(tx.actualDate || "") ? tx.actualDate : "",
      status: STATUSES[tx.status] ? tx.status : "Pending",
      notes: String(tx.notes || "")
    };
  }

  function active() {
    ensureMonth(state.activeMonth);
    return state.months[state.activeMonth];
  }

  function save() {
    localStorage.setItem(STORE, JSON.stringify(state));
  }

  function saveRender(message = "") {
    save();
    render();
    if (message) toast(message);
  }

  function render() {
    document.documentElement.dataset.theme = state.theme;
    el.themeBtn.textContent = state.theme === "dark" ? "فاتح" : "داكن";
    el.monthInput.value = state.activeMonth;
    data = calc(active());

    el.openingInputs.forEach((input) => {
      input.value = moneyInput(active().opening[input.dataset.bank]);
    });

    renderHeader();
    renderBanks();
    renderCategories();
    renderTransactions();
  }

  function calc(month) {
    const balances = { ...month.opening };
    const actual = { ...month.opening };
    const category = Object.fromEntries(CATEGORIES.map((cat) => [cat.id, { ...cat, planned: 0, paid: 0, pending: 0, count: 0 }]));
    const bankStats = Object.fromEntries(Object.keys(BANKS).map((bank) => [bank, {
      opening: month.opening[bank],
      expected: month.opening[bank],
      actual: month.opening[bank],
      in: 0,
      out: 0,
      transfersIn: 0,
      transfersOut: 0
    }]));

    let income = 0;
    let reimbursements = 0;
    let expenses = 0;
    let paidExpenses = 0;
    let pendingExpenses = 0;
    let transfers = 0;
    let completedCount = 0;

    const timeline = [...month.items].sort((a, b) => new Date(a.date) - new Date(b.date)).map((tx) => {
      const before = balances[tx.bank] || 0;
      const actualBefore = actual[tx.bank] || 0;
      const amount = num(tx.amount);
      const skipped = tx.status === "Skipped";
      const completed = tx.status === "Completed";
      const expense = isExpense(tx.type);
      const inc = tx.type === "Income" || tx.type === "Reimbursement";

      if (!skipped) {
        if (inc) {
          balances[tx.bank] += amount;
          bankStats[tx.bank].in += amount;
          income += amount;
          if (tx.type === "Reimbursement") reimbursements += amount;
        } else if (expense) {
          balances[tx.bank] -= amount;
          bankStats[tx.bank].out += amount;
          expenses += amount;
        } else if (tx.type === "Transfer") {
          balances[tx.bank] -= amount;
          if (tx.toBank) balances[tx.toBank] += amount;
          bankStats[tx.bank].transfersOut += amount;
          if (tx.toBank) bankStats[tx.toBank].transfersIn += amount;
          transfers += amount;
        }
      }

      if (completed && !skipped) {
        completedCount += 1;
        if (inc) {
          actual[tx.bank] += amount;
        } else if (expense) {
          actual[tx.bank] -= amount;
          paidExpenses += amount;
        } else if (tx.type === "Transfer") {
          actual[tx.bank] -= amount;
          if (tx.toBank) actual[tx.toBank] += amount;
        }
      }

      if (expense && tx.status !== "Completed" && tx.status !== "Skipped") {
        pendingExpenses += amount;
      }

      if (expense && category[tx.category]) {
        category[tx.category].planned += amount;
        category[tx.category].count += 1;
        if (completed) category[tx.category].paid += amount;
        else if (!skipped) category[tx.category].pending += amount;
      }

      Object.keys(BANKS).forEach((bank) => {
        bankStats[bank].expected = balances[bank];
        bankStats[bank].actual = actual[bank];
      });

      return {
        ...tx,
        before,
        after: balances[tx.bank],
        actualBefore,
        categoryName: catName(tx.category),
        bankName: BANKS[tx.bank],
        toBankName: tx.toBank ? BANKS[tx.toBank] : ""
      };
    });

    return {
      timeline,
      category,
      bankStats,
      income,
      reimbursements,
      expenses,
      paidExpenses,
      pendingExpenses,
      transfers,
      expectedRemaining: Object.values(balances).reduce((a, b) => a + b, 0),
      actualRemaining: Object.values(actual).reduce((a, b) => a + b, 0),
      completedCount,
      totalCount: month.items.length
    };
  }

  function renderHeader() {
    el.expectedRemaining.textContent = fmt(data.expectedRemaining);
    el.balanceExplain.textContent = `الحالي الفعلي: ${fmt(data.actualRemaining)}`;

    const completion = data.totalCount ? data.completedCount / data.totalCount : 0;
    const stats = [
      ["الأموال المتاحة", data.income, "راتب + تعويضات"],
      ["المصروفات", data.expenses, "بدون التحويلات الداخلية"],
      ["المدفوع", data.paidExpenses, `${pct(completion)} من الحركات`],
      ["المتبقي للدفع", data.pendingExpenses, "غير مدفوع + متأخر"]
    ];

    el.quickStats.innerHTML = stats.map((item) => `
      <article class="statCard">
        <span>${item[0]}</span>
        <strong>${fmt(item[1])}</strong>
        <small>${item[2]}</small>
      </article>
    `).join("");

    el.flowIncome.textContent = shortFmt(data.income);
    el.flowTransfers.textContent = shortFmt(data.transfers);
    el.flowExpenses.textContent = shortFmt(data.expenses);
    el.flowRemaining.textContent = shortFmt(data.expectedRemaining);
  }

  function renderBanks() {
    el.bankCards.innerHTML = Object.entries(BANKS).map(([id, name]) => {
      const s = data.bankStats[id];
      return `
        <article class="bankCard">
          <h3>${name}</h3>
          <strong class="bankValue">${fmt(s.actual)}</strong>
          <div class="miniRows">
            <div class="miniRow"><span>افتتاحي</span><strong>${fmt(s.opening)}</strong></div>
            <div class="miniRow"><span>داخل</span><strong>${fmt(s.in + s.transfersIn)}</strong></div>
            <div class="miniRow"><span>خارج</span><strong>${fmt(s.out + s.transfersOut)}</strong></div>
            <div class="miniRow"><span>نهائي متوقع</span><strong>${fmt(s.expected)}</strong></div>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderCategories() {
    const cats = Object.values(data.category).filter((cat) => !["income", "internal"].includes(cat.id));
    const max = Math.max(1, ...cats.map((cat) => cat.planned));
    el.categoryCards.innerHTML = cats.map((cat) => {
      const p = cat.planned ? cat.paid / cat.planned : 0;
      return `
        <article class="categoryCard">
          <h3>${cat.name}</h3>
          <div class="miniRows">
            <div class="miniRow"><span>المخطط</span><strong>${fmt(cat.planned)}</strong></div>
            <div class="miniRow"><span>المدفوع</span><strong>${fmt(cat.paid)}</strong></div>
            <div class="miniRow"><span>المتبقي</span><strong>${fmt(cat.pending)}</strong></div>
          </div>
          <div class="progress"><span style="--w:${Math.min(100, (cat.planned / max) * 100)}%"></span></div>
          <small>${pct(p)} مكتمل</small>
        </article>
      `;
    }).join("");
  }

  function renderTransactions() {
    const q = el.searchInput.value.trim().toLowerCase();
    const status = el.statusFilter.value;
    const items = data.timeline.filter((tx) => {
      const matchQ = !q || `${tx.name} ${tx.notes} ${tx.categoryName} ${tx.bankName}`.toLowerCase().includes(q);
      const matchS = status === "all" || tx.status === status;
      return matchQ && matchS;
    });

    el.transactionList.innerHTML = items.length ? items.map((tx) => {
      const signed = signedAmount(tx);
      const amountClass = tx.type === "Transfer" ? "transfer" : signed >= 0 ? "in" : "out";
      return `
        <article class="txCard">
          <div class="txTop">
            <div class="txTitle">
              <h3>${safe(tx.name)}</h3>
              <div class="badges">
                <span class="badge ${statusClass(tx.status)}">${STATUSES[tx.status]}</span>
                <span class="badge">${TYPES[tx.type]}</span>
                <span class="badge">${tx.categoryName}</span>
              </div>
            </div>
            <div class="amount ${amountClass}">${fmtSigned(signed)}</div>
          </div>

          <div class="txDetails">
            <div class="detailBox"><span>البنك</span><strong>${tx.bankName}${tx.toBankName ? ` ← ${tx.toBankName}` : ""}</strong></div>
            <div class="detailBox"><span>التاريخ</span><strong>${dateFmt(tx.date)}</strong></div>
            <div class="detailBox"><span>قبل</span><strong>${fmt(tx.before)}</strong></div>
            <div class="detailBox"><span>بعد</span><strong>${fmt(tx.after)}</strong></div>
          </div>

          <div class="txActions">
            <label class="toggle">
              <input type="checkbox" data-paid="${tx.id}" ${tx.status === "Completed" ? "checked" : ""} />
              <i></i>
              <span>مدفوع</span>
            </label>
            <button class="btn ghost" type="button" data-edit="${tx.id}">تعديل</button>
          </div>
        </article>
      `;
    }).join("") : `<div class="empty">لا توجد حركات مطابقة.</div>`;
  }

  function openEditor(idValue = "") {
    const tx = idValue ? active().items.find((item) => item.id === idValue) : null;
    el.modalTitle.textContent = tx ? "تعديل حركة" : "إضافة حركة";
    el.txId.value = tx?.id || "";
    el.txName.value = tx?.name || "";
    el.txAmount.value = tx ? moneyInput(tx.amount) : "";
    el.txStatus.value = tx?.status || "Pending";
    el.txType.value = tx?.type || "Expense";
    el.txBank.value = tx?.bank || "arab";
    el.txToBank.value = tx?.toBank || "arab";
    el.txCategory.value = tx?.category || "personal";
    el.txDate.value = tx?.date || `${state.activeMonth}-01`;
    el.txNotes.value = tx?.notes || "";
    el.deleteBtn.style.display = tx ? "inline-flex" : "none";
    syncFormType();
    openDialog(el.txDialog);
  }

  function syncFormType() {
    const transfer = el.txType.value === "Transfer";
    el.toBankWrap.style.display = transfer ? "grid" : "none";
    el.txCategory.disabled = transfer;
    if (transfer) el.txCategory.value = "internal";
  }

  function saveTransaction(event) {
    event.preventDefault();
    const idValue = el.txId.value;
    const tx = {
      id: idValue || `tx_${state.activeMonth.replace("-", "")}_${id()}`,
      name: el.txName.value.trim(),
      amount: Math.abs(num(el.txAmount.value)),
      status: el.txStatus.value,
      type: el.txType.value,
      bank: el.txBank.value,
      toBank: el.txType.value === "Transfer" ? el.txToBank.value : "",
      category: el.txType.value === "Transfer" ? "internal" : el.txCategory.value,
      date: el.txDate.value,
      actualDate: el.txStatus.value === "Completed" ? today() : "",
      notes: el.txNotes.value.trim()
    };

    if (!tx.name || !tx.amount || !tx.date) {
      toast("راجع اسم الحركة والمبلغ والتاريخ");
      return;
    }

    if (tx.type === "Transfer" && tx.bank === tx.toBank) {
      toast("التحويل غير صحيح: المصدر والوجهة نفس البنك");
      return;
    }

    const month = active();
    const i = month.items.findIndex((item) => item.id === idValue);
    if (i >= 0) month.items[i] = tx;
    else month.items.push(tx);

    closeDialog(el.txDialog);
    saveRender("تم حفظ الحركة");
  }

  async function deleteCurrentTransaction() {
    const currentId = el.txId.value;
    if (!currentId) return;
    const ok = await confirmBox("حذف الحركة", "هل تريد حذف هذه الحركة؟", false);
    if (!ok) return;
    active().items = active().items.filter((item) => item.id !== currentId);
    closeDialog(el.txDialog);
    saveRender("تم حذف الحركة");
  }

  async function resetMonth() {
    const ok = await confirmBox("تصفير الشهر", "سيتم حذف تعديلات الشهر الحالي وإرجاع الخطة الافتراضية. اكتب RESET للتأكيد.", true);
    if (!ok) {
      toast("لم يتم التصفير");
      return;
    }
    state.months[state.activeMonth] = newMonth(state.activeMonth);
    saveRender("تم تصفير الشهر");
  }

  async function copyToNextMonth() {
    const next = nextMonth(state.activeMonth);
    const ok = await confirmBox("نسخ للشهر القادم", `نسخ خطة ${state.activeMonth} إلى ${next}؟`, false);
    if (!ok) return;

    state.months[next] = {
      opening: {
        alrajhi: data.bankStats.alrajhi.expected,
        arab: data.bankStats.arab.expected,
        cash: data.bankStats.cash.expected
      },
      items: active().items.map((tx) => ({
        ...tx,
        id: `tx_${next.replace("-", "")}_${id()}`,
        date: moveDate(tx.date, next),
        actualDate: "",
        status: "Pending"
      }))
    };

    state.activeMonth = next;
    saveRender("تم نسخ الشهر");
  }

  function exportJson() {
    download(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }), `cashflow-${state.activeMonth}.json`);
    toast("تم تصدير نسخة JSON");
  }

  async function importJson(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed.months) throw new Error("invalid");
      const ok = await confirmBox("استيراد البيانات", "سيتم استبدال البيانات الحالية. هل تريد المتابعة؟", false);
      if (!ok) return;
      state = parsed;
      if (!state.activeMonth) state.activeMonth = DEFAULT_MONTH;
      if (!state.theme) state.theme = "dark";
      ensureMonth(state.activeMonth);
      saveRender("تم الاستيراد");
    } catch {
      toast("ملف غير صالح");
    }
  }

  function exportCsv() {
    const rows = [
      ["الشهر", "الحركة", "النوع", "البنك", "إلى بنك", "التصنيف", "المبلغ", "الحالة", "التاريخ", "الرصيد قبل", "الرصيد بعد", "ملاحظة"],
      ...data.timeline.map((tx) => [
        state.activeMonth,
        tx.name,
        TYPES[tx.type],
        tx.bankName,
        tx.toBankName,
        tx.categoryName,
        String(displayInt(tx.amount)),
        STATUSES[tx.status],
        tx.date,
        String(displayInt(tx.before)),
        String(displayInt(tx.after)),
        tx.notes
      ])
    ];
    const csv = "\ufeff" + rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `cashflow-${state.activeMonth}.csv`);
    toast("تم تصدير ملف Excel");
  }

  function confirmBox(title, text, phrase) {
    el.confirmTitle.textContent = title;
    el.confirmText.textContent = text;
    el.confirmPhraseWrap.classList.toggle("hidden", !phrase);
    el.confirmPhrase.value = "";
    openDialog(el.confirmDialog);
    return new Promise((resolve) => {
      confirmResolve = resolve;
    });
  }

  function isExpense(type) {
    return ["Expense", "Deduction", "DebtRepayment"].includes(type);
  }

  function signedAmount(tx) {
    if (tx.type === "Income" || tx.type === "Reimbursement") return tx.amount;
    if (tx.type === "Transfer" || isExpense(tx.type)) return -tx.amount;
    return 0;
  }

  function statusClass(status) {
    if (status === "Completed") return "done";
    if (status === "Delayed") return "delayed";
    if (status === "Pending") return "pending";
    return "";
  }

  function catName(idValue) {
    return CATEGORIES.find((cat) => cat.id === idValue)?.name || "غير مصنف";
  }

  function displayInt(value) {
    return Math.round(num(value));
  }

  function fmt(value) {
    return `${displayInt(value).toLocaleString("en-US", { maximumFractionDigits: 0 })} JOD`;
  }

  function shortFmt(value) {
    return displayInt(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function fmtSigned(value) {
    const n = displayInt(value);
    const sign = n > 0 ? "+" : n < 0 ? "-" : "";
    return `${sign}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })} JOD`;
  }

  function pct(value) {
    return `${Math.max(0, Math.min(999, value * 100)).toFixed(0)}%`;
  }

  function moneyInput(value) {
    return String(displayInt(value));
  }

  function num(value) {
    const n = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? Math.round(n * 1000000) / 1000000 : 0;
  }

  function dateFmt(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "—";
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  }

  function nextMonth(month) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function moveDate(date, month) {
    const day = String(date || "").slice(-2) || "01";
    const [y, m] = month.split("-").map(Number);
    const last = new Date(y, m, 0).getDate();
    return `${month}-${String(Math.min(Number(day), last)).padStart(2, "0")}`;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function id() {
    return Math.random().toString(36).slice(2, 10);
  }

  function safe(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "open");
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.toast.classList.remove("show"), 2400);
  }
})();
