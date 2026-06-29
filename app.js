(() => {
  "use strict";

  const STORE = "cashflow_typeform_v6";
  const DEFAULT_MONTH = new Date().toISOString().slice(0, 7);

  const BANKS = {
    alrajhi: "الراجحي",
    arab: "العربي",
    cash: "نقدي"
  };

  const DEFAULT_ITEMS = [
    ["استلام الراتب في الراجحي", 2449.664, "alrajhi", "", "income", 25, "راتب شهري", "استلام"],
    ["اقتطاع قرض السكن", 444, "alrajhi", "", "expense", 25, "التزام شهري", "اقتطاع"],
    ["تحويل المتبقي إلى العربي", 2005.664, "alrajhi", "arab", "transfer", 25, "تحويل داخلي", "تحويل"],
    ["استلام تعويض قرض السكن", 444, "alrajhi", "", "income", 25, "تعويض", "استلام"],
    ["تحويل تعويض قرض السكن إلى العربي", 444, "alrajhi", "arab", "transfer", 25, "تحويل داخلي", "تحويل"],
    ["استلام بدل الإيجار", 421, "alrajhi", "", "income", 25, "تعويض", "استلام"],
    ["تحويل بدل الإيجار إلى العربي", 421, "alrajhi", "arab", "transfer", 25, "تحويل داخلي", "تحويل"],
    ["قرض البنك العربي", 435, "arab", "", "expense", 26, "بنك", "دفع"],
    ["دفعة إلى البنك العربي", 1081.188, "arab", "", "expense", 26, "بنك", "دفع"],
    ["قسط اللابتوب", 21, "arab", "", "expense", 26, "أقساط", "دفع"],
    ["البيت", 150, "arab", "", "expense", 26, "منزل", "دفع"],
    ["رسوم تحويل البيت", 100, "arab", "", "expense", 26, "منزل", "دفع"],
    ["مسقفات / ضريبة عقار", 213.466, "arab", "", "expense", 26, "منزل", "دفع"],
    ["موبايل", 25, "arab", "", "expense", 26, "فواتير", "دفع"],
    ["Microsoft", 5, "arab", "", "expense", 26, "فواتير", "دفع"],
    ["المصري", 9, "arab", "", "expense", 26, "فواتير", "دفع"],
    ["إنترنت", 20.88, "arab", "", "expense", 26, "فواتير", "دفع"],
    ["كهرباء", 36.488, "arab", "", "expense", 26, "فواتير", "دفع"],
    ["كهرباء العائلة", 45.642, "arab", "", "expense", 26, "فواتير", "دفع"],
    ["إنترنت العائلة", 10, "arab", "", "expense", 26, "فواتير", "دفع"],
    ["مياه", 5, "arab", "", "expense", 26, "فواتير", "دفع"],
    ["Basel", 100, "arab", "", "expense", 27, "شخصي", "دفع"],
    ["Areen", 75, "arab", "", "expense", 27, "شخصي", "دفع"],
    ["Mall", 100, "arab", "", "expense", 27, "شخصي", "دفع"],
    ["وقود", 100, "arab", "", "expense", 27, "سيارة", "دفع"],
    ["مخصص عقيقة", 175, "arab", "", "expense", 27, "شخصي", "دفع"],
    ["تحويل إلى آرين - سداد دين", 163, "arab", "", "expense", 27, "ديون", "دفع"]
  ];

  let state = loadState();

  const $ = (id) => document.getElementById(id);
  const el = {
    monthInput: $("monthInput"),
    resetMonthBtn: $("resetMonthBtn"),
    toggleSetupBtn: $("toggleSetupBtn"),
    setupPanel: $("setupPanel"),
    openingInputs: Array.from(document.querySelectorAll(".openingInput")),
    progressTitle: $("progressTitle"),
    progressValue: $("progressValue"),
    progressFill: $("progressFill"),
    progressHint: $("progressHint"),
    flowView: $("flowView"),
    flowCard: $("flowCard"),
    reportView: $("reportView"),
    reportStats: $("reportStats"),
    skippedList: $("skippedList"),
    confirmedList: $("confirmedList"),
    reopenAllSkippedBtn: $("reopenAllSkippedBtn"),
    toast: $("toast")
  };

  init();

  function init() {
    ensureMonth(state.activeMonth);
    bind();
    render();
  }

  function bind() {
    el.monthInput.addEventListener("change", () => {
      state.activeMonth = el.monthInput.value || DEFAULT_MONTH;
      ensureMonth(state.activeMonth);
      saveAndRender("تم تغيير الشهر");
    });

    el.resetMonthBtn.addEventListener("click", () => {
      if (!confirm("سيتم إعادة هذا الشهر للوضع الافتراضي. هل تريد المتابعة؟")) return;
      state.months[state.activeMonth] = newMonth(state.activeMonth);
      saveAndRender("تم تصفير الشهر");
    });

    el.toggleSetupBtn.addEventListener("click", () => {
      el.setupPanel.classList.toggle("hidden");
    });

    el.openingInputs.forEach((input) => {
      input.addEventListener("input", () => {
        const month = getActiveMonth();
        month.opening[input.dataset.bank] = num(input.value);
        saveAndRender();
      });
    });

    el.reopenAllSkippedBtn.addEventListener("click", () => {
      const month = getActiveMonth();
      month.items.forEach((item) => {
        if (item.status === "skipped") item.status = "pending";
      });
      month.currentId = firstPendingId(month);
      saveAndRender("تم إرجاع كل الحركات المتخطاة للمراجعة");
    });

    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      const action = target.dataset.action;
      const itemId = target.dataset.id || "";

      if (action === "confirm") confirmCurrent();
      if (action === "skip") skipCurrent();
      if (action === "delete") deleteCurrent();
      if (action === "previous") goPreviousPending();
      if (action === "next") goNextPending();
      if (action === "restore") restoreItem(itemId);
      if (action === "confirm-skipped") restoreAndFocus(itemId);
    });

    document.addEventListener("change", (event) => {
      if (event.target.id === "currentAmountInput") {
        const item = getCurrentItem();
        if (!item) return;
        item.amount = Math.round(Math.abs(num(event.target.value)));
        saveAndRender("تم تعديل قيمة الحركة");
      }
    });
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (saved && saved.months) return saved;
    } catch {}

    return {
      activeMonth: DEFAULT_MONTH,
      months: {
        [DEFAULT_MONTH]: newMonth(DEFAULT_MONTH)
      }
    };
  }

  function saveState() {
    localStorage.setItem(STORE, JSON.stringify(state));
  }

  function saveAndRender(message = "") {
    saveState();
    render();
    if (message) toast(message);
  }

  function newMonth(month) {
    return {
      opening: { alrajhi: 0, arab: 0, cash: 0 },
      currentId: "",
      items: DEFAULT_ITEMS.map((row, index) => ({
        id: `tx_${month.replace('-', '')}_${index + 1}`,
        name: row[0],
        amount: Math.round(num(row[1])),
        bank: row[2],
        toBank: row[3],
        type: row[4],
        date: `${month}-${String(row[5]).padStart(2, '0')}`,
        notes: row[6],
        label: row[7],
        status: "pending"
      }))
    };
  }

  function ensureMonth(month) {
    if (!state.months[month]) state.months[month] = newMonth(month);
    const current = state.months[month];
    current.opening = {
      alrajhi: num(current.opening?.alrajhi),
      arab: num(current.opening?.arab),
      cash: num(current.opening?.cash)
    };
    current.items = Array.isArray(current.items) ? current.items.map((item) => ({
      ...item,
      amount: Math.round(num(item.amount)),
      status: ["pending", "confirmed", "skipped", "deleted"].includes(item.status) ? item.status : "pending"
    })) : [];
    if (!current.currentId || !current.items.some((item) => item.id === current.currentId && item.status === "pending")) {
      current.currentId = firstPendingId(current);
    }
  }

  function getActiveMonth() {
    ensureMonth(state.activeMonth);
    return state.months[state.activeMonth];
  }

  function firstPendingId(month) {
    return month.items.find((item) => item.status === "pending")?.id || "";
  }

  function sortedItems(month) {
    return [...month.items].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function render() {
    const month = getActiveMonth();
    const items = sortedItems(month);
    const activeItems = items.filter((item) => item.status !== "deleted");
    const pendingItems = activeItems.filter((item) => item.status === "pending");
    const processed = activeItems.filter((item) => item.status !== "pending");
    const progress = activeItems.length ? Math.round((processed.length / activeItems.length) * 100) : 100;

    el.monthInput.value = state.activeMonth;
    el.openingInputs.forEach((input) => {
      input.value = Math.round(num(month.opening[input.dataset.bank]));
    });

    el.progressTitle.textContent = pendingItems.length
      ? `الحركة ${processed.length + 1} من ${activeItems.length}`
      : `تم إنهاء ${activeItems.length} حركة`;
    el.progressValue.textContent = `${progress}%`;
    el.progressFill.style.width = `${progress}%`;
    el.progressHint.textContent = pendingItems.length
      ? `باقي ${pendingItems.length} حركة تحتاج إجراء.`
      : `لا يوجد حركات معلقة. التقرير جاهز.`;

    if (pendingItems.length) {
      el.flowView.classList.remove("hidden");
      el.reportView.classList.add("hidden");
      renderFlowCard(month, activeItems, pendingItems);
    } else {
      el.flowView.classList.add("hidden");
      el.reportView.classList.remove("hidden");
      renderReport(month, activeItems);
    }
  }

  function getCurrentItem() {
    const month = getActiveMonth();
    const item = month.items.find((entry) => entry.id === month.currentId && entry.status === "pending");
    return item || month.items.find((entry) => entry.status === "pending") || null;
  }

  function pendingSequence(month) {
    return sortedItems(month).filter((item) => item.status === "pending");
  }

  function goPreviousPending() {
    const month = getActiveMonth();
    const pending = pendingSequence(month);
    if (!pending.length) return;
    const index = pending.findIndex((item) => item.id === month.currentId);
    if (index > 0) {
      month.currentId = pending[index - 1].id;
      saveAndRender();
    }
  }

  function goNextPending() {
    const month = getActiveMonth();
    const pending = pendingSequence(month);
    if (!pending.length) return;
    const index = pending.findIndex((item) => item.id === month.currentId);
    if (index >= 0 && index < pending.length - 1) {
      month.currentId = pending[index + 1].id;
      saveAndRender();
    }
  }

  function renderFlowCard(month, activeItems, pendingItems) {
    const current = getCurrentItem();
    if (!current) {
      el.flowCard.innerHTML = `<div class="emptyState">لا توجد حركة حالية.</div>`;
      return;
    }
    month.currentId = current.id;

    const pendingIndex = pendingItems.findIndex((item) => item.id === current.id);
    const balances = liveBalances(month);
    const preview = previewBalances(balances, current);

    el.flowCard.innerHTML = `
      <div class="stepMeta">
        <div class="stepTag">${escapeHtml(current.label)} · ${escapeHtml(typeLabel(current.type))}</div>
        <div class="stepDate">${formatDate(current.date)}</div>
      </div>

      <h2 class="stepTitle">${escapeHtml(current.name)}</h2>
      <p class="stepNote">${current.notes ? escapeHtml(current.notes) : 'راجع المبلغ ثم اختر الإجراء المناسب.'}</p>

      <div class="balanceStrip">
        ${Object.entries(BANKS).map(([key, label]) => `
          <div class="balancePill">
            <span>${label}</span>
            <strong>${formatMoney(balances[key])}</strong>
          </div>
        `).join('')}
      </div>

      <div class="editorGrid">
        <div class="amountEditor">
          <h3>قيمة الحركة</h3>
          <input id="currentAmountInput" class="bigInput" type="number" step="1" inputmode="numeric" value="${Math.round(current.amount)}" />
          <div class="helperText">تقدر تعدل القيمة مباشرة من هنا قبل التأكيد أو التخطي أو الشطب.</div>
          <div class="tagList">
            <span class="tag">من: ${escapeHtml(BANKS[current.bank])}</span>
            ${current.toBank ? `<span class="tag">إلى: ${escapeHtml(BANKS[current.toBank])}</span>` : ''}
            <span class="tag">الحالة: بانتظار الإجراء</span>
          </div>
        </div>

        <div class="impactCard">
          <h3>تأثير التأكيد</h3>
          <div class="impactRows">
            ${Object.entries(BANKS).map(([key, label]) => `
              <div class="impactRow">
                <span>${label}</span>
                <strong>${formatMoney(preview[key])}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="actionsBar">
        <button class="btn success" type="button" data-action="confirm">Confirm</button>
        <button class="btn warning" type="button" data-action="skip">Skip</button>
        <button class="btn danger" type="button" data-action="delete">Delete</button>
        <button class="btn ghost" type="button" data-action="next">التالي</button>
      </div>

      <div class="subActions">
        <button class="btn subtle smallBtn" type="button" data-action="previous" ${pendingIndex <= 0 ? 'disabled' : ''}>السابق</button>
        <div class="statusHint">${pendingIndex + 1} / ${pendingItems.length} من الحركات المعلقة حالياً</div>
      </div>
    `;
  }

  function renderReport(month, activeItems) {
    const confirmed = activeItems.filter((item) => item.status === "confirmed");
    const skipped = activeItems.filter((item) => item.status === "skipped");
    const deleted = month.items.filter((item) => item.status === "deleted");
    const balances = liveBalances(month);

    const stats = [
      ["تم تأكيدها", confirmed.length, sumAmount(confirmed)],
      ["تم تخطيها", skipped.length, sumAmount(skipped)],
      ["تم شطبها", deleted.length, sumAmount(deleted)],
      ["الرصيد النهائي", 3, Object.values(balances).reduce((a, b) => a + b, 0)]
    ];

    el.reportStats.innerHTML = stats.map((row) => `
      <article class="statCard shellCard">
        <span>${row[0]}</span>
        <strong>${row[0] === 'الرصيد النهائي' ? formatMoney(row[2]) : row[1]}</strong>
        <small>${row[0] === 'الرصيد النهائي' ? `مجموع الأرصدة الثلاثة` : formatMoney(row[2])}</small>
      </article>
    `).join('');

    el.skippedList.innerHTML = skipped.length
      ? skipped.map((item) => skippedTemplate(item)).join('')
      : `<div class="emptyState">لا يوجد حركات متخطاة.</div>`;

    el.confirmedList.innerHTML = confirmed.length
      ? confirmed.slice().reverse().map((item) => confirmedTemplate(item)).join('')
      : `<div class="emptyState">لا يوجد حركات مؤكدة.</div>`;
  }

  function skippedTemplate(item) {
    return `
      <article class="listItem">
        <div class="listTop">
          <div>
            <h4>${escapeHtml(item.name)}</h4>
            <div class="tagList">
              <span class="tag">${escapeHtml(BANKS[item.bank])}</span>
              ${item.toBank ? `<span class="tag">${escapeHtml(BANKS[item.toBank])}</span>` : ''}
            </div>
          </div>
          <strong>${formatMoney(item.amount)}</strong>
        </div>
        <p>${item.notes ? escapeHtml(item.notes) : 'تم تخطي هذه الحركة حتى تعود لها لاحقاً.'}</p>
        <div class="itemActions">
          <button class="btn subtle smallBtn" type="button" data-action="restore" data-id="${item.id}">إرجاع للمراجعة</button>
          <button class="btn ghost smallBtn" type="button" data-action="confirm-skipped" data-id="${item.id}">افتحها الآن</button>
        </div>
      </article>
    `;
  }

  function confirmedTemplate(item) {
    return `
      <article class="listItem">
        <div class="listTop">
          <div>
            <h4>${escapeHtml(item.name)}</h4>
            <div class="tagList">
              <span class="tag">${escapeHtml(BANKS[item.bank])}</span>
              ${item.toBank ? `<span class="tag">${escapeHtml(BANKS[item.toBank])}</span>` : ''}
            </div>
          </div>
          <strong>${formatMoney(item.amount)}</strong>
        </div>
        <p>${item.notes ? escapeHtml(item.notes) : 'تم تأكيد هذه الحركة.'}</p>
      </article>
    `;
  }

  function confirmCurrent() {
    const month = getActiveMonth();
    const item = getCurrentItem();
    if (!item) return;
    item.status = "confirmed";
    month.currentId = firstPendingId(month);
    saveAndRender("تم تأكيد الحركة");
  }

  function skipCurrent() {
    const month = getActiveMonth();
    const item = getCurrentItem();
    if (!item) return;
    item.status = "skipped";
    month.currentId = firstPendingId(month);
    saveAndRender("تم تخطي الحركة");
  }

  function deleteCurrent() {
    const month = getActiveMonth();
    const item = getCurrentItem();
    if (!item) return;
    if (!confirm(`هل تريد شطب الحركة: ${item.name} ؟`)) return;
    item.status = "deleted";
    month.currentId = firstPendingId(month);
    saveAndRender("تم شطب الحركة");
  }

  function restoreItem(id) {
    const month = getActiveMonth();
    const item = month.items.find((entry) => entry.id === id);
    if (!item) return;
    item.status = "pending";
    month.currentId = id;
    saveAndRender("تم إرجاع الحركة للمراجعة");
  }

  function restoreAndFocus(id) {
    restoreItem(id);
  }

  function liveBalances(month) {
    const balances = { ...month.opening };
    sortedItems(month).forEach((item) => {
      if (item.status !== "confirmed") return;
      applyItemEffect(balances, item);
    });
    return balances;
  }

  function previewBalances(currentBalances, item) {
    const preview = { ...currentBalances };
    applyItemEffect(preview, item);
    return preview;
  }

  function applyItemEffect(balances, item) {
    const amount = Math.round(num(item.amount));
    if (item.type === "income") {
      balances[item.bank] += amount;
      return;
    }
    if (item.type === "expense") {
      balances[item.bank] -= amount;
      return;
    }
    if (item.type === "transfer") {
      balances[item.bank] -= amount;
      if (item.toBank) balances[item.toBank] += amount;
    }
  }

  function sumAmount(items) {
    return items.reduce((sum, item) => sum + Math.round(num(item.amount)), 0);
  }

  function typeLabel(type) {
    return ({ income: "دخل", expense: "مصروف", transfer: "تحويل" })[type] || "حركة";
  }

  function formatMoney(value) {
    return `${Math.round(num(value)).toLocaleString('en-US')} JOD`;
  }

  function formatDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return '—';
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }

  function num(value) {
    const parsed = Number.parseFloat(String(value ?? '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.toast.classList.remove('show'), 2200);
  }
})();
