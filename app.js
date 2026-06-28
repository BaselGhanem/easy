(() => {
  "use strict";

  const STORE = "cashflow_simple_v5";
  const LEGACY = "cashflow_simple_v2";
  const DEFAULT_MONTH = new Date().toISOString().slice(0, 7);
  const BANKS = { alrajhi: "الراجحي", arab: "العربي", cash: "نقدي" };
  const TYPES = { Income: "دخل", Expense: "مصروف", Transfer: "تحويل", Deduction: "اقتطاع", Reimbursement: "تعويض", DebtRepayment: "سداد دين" };
  const STATUSES = { Pending: "غير مدفوع", Completed: "مدفوع", Delayed: "متأخر", Skipped: "متجاوز" };
  const PRIORITIES = { high: "عالية", medium: "متوسطة", low: "منخفضة" };
  const P_WEIGHT = { high: 0, medium: 1, low: 2 };
  const CATEGORIES = [
    { id: "income", name: "مصادر الدخل" }, { id: "banking", name: "التزامات بنكية" },
    { id: "home", name: "المنزل والعقار" }, { id: "bills", name: "فواتير وخدمات" },
    { id: "personal", name: "مصروف شخصي / عائلي" }, { id: "debt", name: "تحويلات وسداد ديون" },
    { id: "internal", name: "تحويلات داخلية" }
  ];

  const DEFAULT_ITEMS = [
    ["استلام الراتب في الراجحي",2449.664,"alrajhi","","Income","income",25,"Salary received in Al Rajhi","high",true],
    ["اقتطاع قرض السكن",444,"alrajhi","","Deduction","banking",25,"خصم مباشر من الراجحي","high",true],
    ["تحويل المتبقي إلى العربي",2005.664,"alrajhi","arab","Transfer","internal",25,"تحويل داخلي لا يعتبر مصروف","high",true],
    ["استلام تعويض قرض السكن",444,"alrajhi","","Reimbursement","income",25,"","medium",true],
    ["تحويل تعويض قرض السكن إلى العربي",444,"alrajhi","arab","Transfer","internal",25,"","medium",true],
    ["استلام بدل الإيجار",421,"alrajhi","","Reimbursement","income",25,"","medium",true],
    ["تحويل بدل الإيجار إلى العربي",421,"alrajhi","arab","Transfer","internal",25,"","medium",true],
    ["قرض البنك العربي",435,"arab","","Expense","banking",26,"","high",true],
    ["دفعة إلى البنك العربي",1081.188,"arab","","Expense","banking",26,"","high",true],
    ["قسط اللابتوب",21,"arab","","Expense","banking",26,"","medium",true],
    ["البيت",150,"arab","","Expense","home",26,"","high",true],
    ["رسوم تحويل البيت",100,"arab","","Expense","home",26,"","medium",true],
    ["مسقفات / ضريبة عقار",213.466,"arab","","Expense","home",26,"","high",true],
    ["موبايل",25,"arab","","Expense","bills",26,"","medium",true],
    ["Microsoft",5,"arab","","Expense","bills",26,"","low",true],
    ["المصري",9,"arab","","Expense","bills",26,"","low",true],
    ["إنترنت",20.88,"arab","","Expense","bills",26,"","medium",true],
    ["كهرباء",36.488,"arab","","Expense","bills",26,"","medium",true],
    ["كهرباء العائلة",45.642,"arab","","Expense","bills",26,"","medium",true],
    ["إنترنت العائلة",10,"arab","","Expense","bills",26,"","low",true],
    ["مياه",5,"arab","","Expense","bills",26,"","low",true],
    ["Basel",100,"arab","","Expense","personal",27,"","medium",false],
    ["Areen",75,"arab","","Expense","personal",27,"","medium",false],
    ["Mall",100,"arab","","Expense","personal",27,"","low",false],
    ["وقود",100,"arab","","Expense","personal",27,"","medium",true],
    ["مخصص عقيقة",175,"arab","","Expense","personal",27,"","medium",false],
    ["تحويل إلى آرين - سداد دين",163,"arab","","DebtRepayment","debt",27,"","high",true]
  ];

  let state = load();
  let data = null;
  let confirmResolve = null;
  const $ = (id) => document.getElementById(id);
  const el = {};

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    ["monthInput","themeBtn","expectedRemaining","balanceExplain","monthScore","scoreRing","quickStats","actionCards","flowIncome","flowTransfers","flowExpenses","flowRemaining","monthComparison","actualBalanceTotal","balanceMismatch","bankCards","categoryCards","searchInput","statusFilter","bankFilter","categoryFilter","typeFilter","sortSelect","hideCompletedToggle","pendingOnlyBtn","quickPayTodayBtn","bulkPayBtn","bulkDeleteBtn","transactionList","transactionsHint","categoryChart","paidChart","topChart","lastFiveList","addBtn","fabBtn","closeMonthBtn","unlockMonthBtn","copyNextBtn","exportBtn","importBtn","importFile","csvBtn","printBtn","undoBtn","readOnlyBtn","compactBtn","setPasswordBtn","resetBtn","monthNotes","txDialog","txForm","modalTitle","txId","txName","txAmount","txStatus","txType","txBank","txToBank","toBankWrap","txCategory","txDate","txPriority","txReference","txEssential","txRecurring","txRecurringDay","txRecurringUntil","txRecurringPaused","txReceipt","txNotes","txLog","deleteBtn","confirmDialog","confirmTitle","confirmText","confirmPhraseWrap","confirmPhraseLabel","confirmPhrase","toast"].forEach(id => el[id] = $(id));
    el.openingInputs = Array.from(document.querySelectorAll(".openingInput"));
    el.actualInputs = Array.from(document.querySelectorAll(".actualInput"));
    el.statusPills = Array.from(document.querySelectorAll("[data-status-filter]"));
    ensureMonth(state.activeMonth);
    fillOptions();
    bind();
    render();
  }

  function fillOptions(){
    el.txCategory.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
    el.categoryFilter.innerHTML = `<option value="all">كل التصنيفات</option>${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}`;
  }

  function bind(){
    el.monthInput.addEventListener("change", () => { state.activeMonth = el.monthInput.value || DEFAULT_MONTH; ensureMonth(state.activeMonth); saveRender("تم تغيير الشهر"); });
    el.themeBtn.addEventListener("click", () => { state.theme = state.theme === "dark" ? "light" : "dark"; saveRender(); });
    document.querySelectorAll("[data-toggle]").forEach(b => b.addEventListener("click", () => { const p = $(b.dataset.toggle); p.classList.toggle("open"); b.querySelector("i").textContent = p.classList.contains("open") ? "−" : "+"; }));
    el.openingInputs.forEach(i => i.addEventListener("input", () => mutate(() => active().opening[i.dataset.bank] = num(i.value))));
    el.actualInputs.forEach(i => i.addEventListener("input", () => mutate(() => active().actual[i.dataset.bank] = i.value === "" ? null : num(i.value))));
    [el.searchInput,el.bankFilter,el.categoryFilter,el.typeFilter,el.sortSelect].forEach(c => { c.addEventListener("input", renderTransactions); c.addEventListener("change", renderTransactions); });
    el.statusFilter.addEventListener("change", () => { syncStatusPills(); renderTransactions(); });
    el.statusPills.forEach(b => b.addEventListener("click", () => { el.statusFilter.value = b.dataset.statusFilter; syncStatusPills(); renderTransactions(); }));
    el.hideCompletedToggle.addEventListener("change", () => mutate(() => active().hideCompleted = el.hideCompletedToggle.checked));
    el.pendingOnlyBtn.addEventListener("click", () => { el.statusFilter.value = "Pending"; syncStatusPills(); renderTransactions(); });
    el.quickPayTodayBtn.addEventListener("click", quickPayToday);
    el.bulkPayBtn.addEventListener("click", bulkPay);
    el.bulkDeleteBtn.addEventListener("click", bulkDelete);
    el.addBtn.addEventListener("click", () => openEditor());
    el.fabBtn.addEventListener("click", () => openEditor());
    el.txType.addEventListener("change", syncFormType);
    el.txForm.addEventListener("submit", saveTransaction);
    el.deleteBtn.addEventListener("click", deleteCurrentTransaction);
    document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => closeDialog(el.txDialog)));
    document.addEventListener("click", e => { const edit = e.target.closest("[data-edit]"); if(edit) openEditor(edit.dataset.edit); const r = e.target.closest("[data-receipt]"); if(r) showReceipt(r.dataset.receipt); });
    document.addEventListener("change", e => { const paid = e.target.closest("[data-paid]"); if(!paid) return; const tx = active().items.find(x => x.id === paid.dataset.paid); if(!tx) return; mutate(() => { tx.status = paid.checked ? "Completed" : "Pending"; tx.actualDate = paid.checked ? today() : ""; addLog(tx, paid.checked ? "تم تسجيلها كمدفوعة" : "تم إرجاعها لغير مدفوعة"); }, paid.checked ? "تم تسجيلها كمدفوعة" : "تم إرجاعها لغير مدفوعة"); });
    el.closeMonthBtn.addEventListener("click", closeMonth); el.unlockMonthBtn.addEventListener("click", unlockMonth); el.copyNextBtn.addEventListener("click", copyToNextMonth);
    el.exportBtn.addEventListener("click", exportJson); el.importBtn.addEventListener("click", () => el.importFile.click()); el.importFile.addEventListener("change", importJson);
    el.csvBtn.addEventListener("click", exportCsv); el.printBtn.addEventListener("click", () => window.print()); el.undoBtn.addEventListener("click", undoLastChange);
    el.readOnlyBtn.addEventListener("click", () => { state.readOnly = !state.readOnly; saveRender(state.readOnly ? "تم تفعيل وضع القراءة فقط" : "تم إلغاء وضع القراءة فقط"); });
    el.compactBtn.addEventListener("click", () => { state.compactMobile = !state.compactMobile; saveRender(state.compactMobile ? "تم تفعيل العرض المختصر" : "تم إلغاء العرض المختصر"); });
    el.setPasswordBtn.addEventListener("click", setResetPassword); el.resetBtn.addEventListener("click", resetMonth);
    el.monthNotes.addEventListener("input", () => mutate(() => active().notes = el.monthNotes.value));
    el.confirmDialog.addEventListener("close", () => { if(!confirmResolve) return; const ok = el.confirmDialog.returnValue === "ok"; const need = !el.confirmPhraseWrap.classList.contains("hidden"); const phraseOk = !need || el.confirmPhrase.value.trim() === el.confirmPhrase.dataset.expected; confirmResolve(ok && phraseOk); confirmResolve = null; el.confirmPhrase.value = ""; el.confirmPhraseWrap.classList.add("hidden"); });
  }

  function load(){
    try { const s = JSON.parse(localStorage.getItem(STORE) || "null"); if(s && s.months) return s; } catch{}
    try { const s = JSON.parse(localStorage.getItem(LEGACY) || "null"); if(s && s.months) return { activeMonth:s.activeMonth||DEFAULT_MONTH, theme:s.theme||"dark", readOnly:false, compactMobile:false, resetPassword:"", lastSnapshot:null, months:s.months }; } catch{}
    return { activeMonth: DEFAULT_MONTH, theme:"dark", readOnly:false, compactMobile:false, resetPassword:"", lastSnapshot:null, months:{ [DEFAULT_MONTH]: newMonth(DEFAULT_MONTH) } };
  }

  function newMonth(month){
    return { opening:{alrajhi:0,arab:0,cash:0}, actual:{alrajhi:null,arab:null,cash:null}, notes:"", closed:false, hideCompleted:false, items: DEFAULT_ITEMS.map((r,i) => cleanTx({ id:`tx_${month.replace("-","")}_${i+1}_${id()}`, name:r[0], amount:r[1], bank:r[2], toBank:r[3], type:r[4], category:r[5], date:`${month}-${String(r[6]).padStart(2,"0")}`, actualDate:"", status:"Pending", notes:r[7], priority:r[8], essential:r[9], reference:"", receipt:null, logs:[{at:stamp(),action:"تم إنشاء الحركة"}], recurring:{enabled:false, day:r[6], until:"", paused:false, originId:""} }, month)) };
  }

  function ensureMonth(month){
    if(!state.months[month]) state.months[month] = newMonth(month);
    normalizeMonth(state.months[month], month);
    applyRecurring(month);
  }

  function normalizeMonth(m, month){
    m.opening = { alrajhi:num(m.opening?.alrajhi), arab:num(m.opening?.arab), cash:num(m.opening?.cash) };
    m.actual = { alrajhi:m.actual?.alrajhi==null?null:num(m.actual.alrajhi), arab:m.actual?.arab==null?null:num(m.actual.arab), cash:m.actual?.cash==null?null:num(m.actual.cash) };
    m.notes = String(m.notes||""); m.closed = Boolean(m.closed); m.hideCompleted = Boolean(m.hideCompleted);
    m.items = Array.isArray(m.items) ? m.items.map(tx => cleanTx(tx, month)) : [];
  }

  function cleanTx(tx, month){
    return { id:tx.id||`tx_${id()}`, name:String(tx.name||"حركة مالية"), amount:Math.abs(num(tx.amount)), bank:BANKS[tx.bank]?tx.bank:"arab", toBank:BANKS[tx.toBank]?tx.toBank:"", type:TYPES[tx.type]?tx.type:"Expense", category:CATEGORIES.some(c=>c.id===tx.category)?tx.category:"personal", date:validDate(tx.date)?tx.date:`${month||state.activeMonth||DEFAULT_MONTH}-01`, actualDate:validDate(tx.actualDate)?tx.actualDate:"", status:STATUSES[tx.status]?tx.status:"Pending", notes:String(tx.notes||""), priority:PRIORITIES[tx.priority]?tx.priority:"medium", essential:Boolean(tx.essential), reference:String(tx.reference||""), receipt:tx.receipt||null, logs:Array.isArray(tx.logs)?tx.logs:[], recurring:{ enabled:Boolean(tx.recurring?.enabled), day:clamp(Number(tx.recurring?.day||String(tx.date||"").slice(-2)||1),1,31), until:validMonth(tx.recurring?.until)?tx.recurring.until:"", paused:Boolean(tx.recurring?.paused), originId:String(tx.recurring?.originId||tx.id||"") } };
  }

  function applyRecurring(targetMonth){
    const m = state.months[targetMonth];
    Object.entries(state.months).forEach(([mk, md]) => {
      if(mk >= targetMonth) return;
      md.items.forEach(tx => {
        if(!tx.recurring?.enabled || tx.recurring.paused) return;
        if(tx.recurring.until && tx.recurring.until < targetMonth) return;
        const origin = tx.recurring.originId || tx.id;
        if(m.items.some(x => x.recurring?.originId === origin || x.id === origin)) return;
        m.items.push(cleanTx({ ...tx, id:`tx_${targetMonth.replace("-","")}_rec_${id()}`, date:dateInMonth(targetMonth, tx.recurring.day), status:"Pending", actualDate:"", logs:[{at:stamp(),action:"تم توليدها من تكرار شهري"}], recurring:{...tx.recurring, originId:origin} }, targetMonth));
      });
    });
  }

  function active(){ ensureMonth(state.activeMonth); return state.months[state.activeMonth]; }
  function save(){ localStorage.setItem(STORE, JSON.stringify(state)); }
  function snapshot(){ state.lastSnapshot = JSON.stringify(state); }
  function mutate(fn, message=""){ if(state.readOnly){ toast("وضع القراءة فقط مفعّل"); render(); return; } if(active().closed){ toast("الشهر مغلق. فك الإغلاق أولاً"); render(); return; } snapshot(); fn(); saveRender(message); }
  function saveRender(message=""){ save(); render(); if(message) toast(message); }

  function calc(month){
    const balances={...month.opening}, actual={...month.opening};
    const cat=Object.fromEntries(CATEGORIES.map(c=>[c.id,{...c,planned:0,paid:0,pending:0,count:0}]));
    const bank=Object.fromEntries(Object.keys(BANKS).map(b=>[b,{opening:month.opening[b],expected:month.opening[b],actual:month.opening[b],in:0,out:0,transfersIn:0,transfersOut:0}]));
    let income=0,reimbursements=0,expenses=0,paidExpenses=0,pendingExpenses=0,transfers=0,completedCount=0,paidToday=0;
    const timeline=[...month.items].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(tx=>{
      const before=balances[tx.bank]||0, amount=num(tx.amount), skipped=tx.status==="Skipped", completed=tx.status==="Completed", expense=isExpense(tx.type), inc=tx.type==="Income"||tx.type==="Reimbursement";
      if(!skipped){ if(inc){ balances[tx.bank]+=amount; bank[tx.bank].in+=amount; income+=amount; if(tx.type==="Reimbursement") reimbursements+=amount; } else if(expense){ balances[tx.bank]-=amount; bank[tx.bank].out+=amount; expenses+=amount; } else if(tx.type==="Transfer"){ balances[tx.bank]-=amount; if(tx.toBank) balances[tx.toBank]+=amount; bank[tx.bank].transfersOut+=amount; if(tx.toBank) bank[tx.toBank].transfersIn+=amount; transfers+=amount; } }
      if(completed&&!skipped){ completedCount++; if(inc) actual[tx.bank]+=amount; else if(expense){ actual[tx.bank]-=amount; paidExpenses+=amount; if(tx.actualDate===today()) paidToday+=amount; } else if(tx.type==="Transfer"){ actual[tx.bank]-=amount; if(tx.toBank) actual[tx.toBank]+=amount; } }
      if(expense && tx.status!=="Completed" && tx.status!=="Skipped") pendingExpenses+=amount;
      if(expense && cat[tx.category]){ cat[tx.category].planned+=amount; cat[tx.category].count++; if(completed) cat[tx.category].paid+=amount; else if(!skipped) cat[tx.category].pending+=amount; }
      Object.keys(BANKS).forEach(b=>{ bank[b].expected=balances[b]; bank[b].actual=actual[b]; });
      return {...tx,before,after:balances[tx.bank],categoryName:catName(tx.category),bankName:BANKS[tx.bank],toBankName:tx.toBank?BANKS[tx.toBank]:"",overdue:isOverdue(tx)};
    });
    const expectedRemaining=Object.values(balances).reduce((a,b)=>a+b,0), actualRemaining=Object.values(actual).reduce((a,b)=>a+b,0);
    const actualVals=Object.values(month.actual).filter(v=>v!==null), realActual=actualVals.reduce((a,b)=>a+num(b),0), hasActual=actualVals.length>0;
    const delayed=timeline.filter(tx=>tx.status==="Delayed"||tx.overdue), dueToday=timeline.filter(tx=>tx.date===today()&&tx.status!=="Completed"&&tx.status!=="Skipped");
    const remaining=timeline.filter(tx=>isExpense(tx.type)&&tx.status!=="Completed"&&tx.status!=="Skipped");
    const largestRemaining=[...remaining].sort((a,b)=>b.amount-a.amount)[0]||null;
    const optionalTotal=timeline.filter(tx=>isExpense(tx.type)&&!tx.essential).reduce((s,tx)=>s+tx.amount,0), pressureRatio=income?expenses/income:0, completion=timeline.length?completedCount/timeline.length:0;
    const score=clamp(100-Math.min(30,delayed.length*7)-Math.min(20,Math.round(pressureRatio*10))-(hasActual?Math.min(20,Math.round(Math.abs(realActual-actualRemaining)/10)):0)+Math.round(completion*15),0,100);
    return {timeline,category:cat,bankStats:bank,balances,actual,income,reimbursements,expenses,paidExpenses,pendingExpenses,transfers,expectedRemaining,actualRemaining,completedCount,totalCount:month.items.length,paidToday,dueToday,delayed,largestRemaining,optionalTotal,pressureRatio,score,realActual,hasActual};
  }

  function render(){
    document.documentElement.dataset.theme=state.theme; document.body.classList.toggle("compactMobile",!!state.compactMobile);
    el.themeBtn.textContent=state.theme==="dark"?"فاتح":"داكن"; el.readOnlyBtn.textContent=state.readOnly?"إلغاء القراءة فقط":"وضع قراءة فقط"; el.compactBtn.textContent=state.compactMobile?"إلغاء العرض المختصر":"Dashboard موبايل مختصر"; el.monthInput.value=state.activeMonth; data=calc(active());
    el.openingInputs.forEach(i=>i.value=displayInt(active().opening[i.dataset.bank])); el.actualInputs.forEach(i=>{const v=active().actual[i.dataset.bank]; i.value=v==null?"":displayInt(v);});
    el.monthNotes.value=active().notes||""; el.hideCompletedToggle.checked=!!active().hideCompleted;
    renderHeader(); renderActionCards(); renderBanks(); renderCategories(); syncStatusPills(); renderTransactions(); renderCharts(); updateDisabledState();
  }

  function renderHeader(){
    el.expectedRemaining.textContent=fmt(data.expectedRemaining); el.balanceExplain.textContent=`الحالي الفعلي حسب المكتمل: ${fmt(data.actualRemaining)}`; el.monthScore.textContent=data.score; el.scoreRing.style.setProperty("--score",`${data.score}%`);
    el.flowIncome.textContent=shortFmt(data.income); el.flowTransfers.textContent=shortFmt(data.transfers); el.flowExpenses.textContent=shortFmt(data.expenses); el.flowRemaining.textContent=shortFmt(data.expectedRemaining);
    const prev=previousMonth(state.activeMonth), prevExpenses=state.months[prev]?calc(state.months[prev]).expenses:null; el.monthComparison.textContent=prevExpenses==null?"لا يوجد شهر سابق":fmt(data.expenses-prevExpenses); el.actualBalanceTotal.textContent=data.hasActual?fmt(data.realActual):"غير مدخل"; el.balanceMismatch.textContent=data.hasActual?fmt(data.realActual-data.actualRemaining):"غير متاح";
    const completion=data.totalCount?data.completedCount/data.totalCount:0, pressureText=data.pressureRatio>=1?"مرتفع":data.pressureRatio>=.75?"متوسط":"منخفض";
    const stats=[["الأموال المتاحة",data.income,"راتب + تعويضات"],["المصروفات",data.expenses,"بدون التحويلات"],["المدفوع",data.paidExpenses,`${pct(completion)} من الحركات`],["المتبقي للدفع",data.pendingExpenses,`${data.delayed.length} متأخرة`],["دُفع اليوم",data.paidToday,"حركات مكتملة اليوم"],["ضغط مالي",Math.round(data.pressureRatio*100),pressureText,"%"],["اختياري",data.optionalTotal,"يمكن مراجعته"],["التعويضات",data.reimbursements,"غير مصروف حقيقي"]];
    el.quickStats.innerHTML=stats.map(s=>`<article class="statCard"><span>${s[0]}</span><strong>${s[3]?`${s[1]}${s[3]}`:fmt(s[1])}</strong><small>${s[2]}</small></article>`).join("");
  }
  function renderActionCards(){ const due=data.dueToday.reduce((s,tx)=>s+tx.amount,0), big=data.largestRemaining, last=[...data.timeline].sort((a,b)=>new Date(b.actualDate||b.date)-new Date(a.actualDate||a.date))[0]; el.actionCards.innerHTML=`<article class="actionCard"><span>ماذا يجب أن أدفع الآن؟</span><strong>${fmt(due)}</strong><small>${data.dueToday.length} حركات مستحقة اليوم</small></article><article class="actionCard"><span>أكبر مبلغ متبقٍ</span><strong>${big?fmt(big.amount):"0 JOD"}</strong><small>${big?safe(big.name):"لا يوجد"}</small></article><article class="actionCard"><span>آخر حركة</span><strong>${last?fmt(last.amount):"0 JOD"}</strong><small>${last?safe(last.name):"لا يوجد"}</small></article><article class="actionCard"><span>تنبيه التأخير</span><strong>${data.delayed.length}</strong><small>${data.delayed.length?"يوجد حركات تحتاج إجراء":"لا يوجد تأخير"}</small></article>`; }
  function renderBanks(){ el.bankCards.innerHTML=Object.entries(BANKS).map(([id,name])=>{const s=data.bankStats[id];return `<article class="bankCard"><h3>${name}</h3><strong class="bankValue">${fmt(s.actual)}</strong><div class="miniRows"><div class="miniRow"><span>افتتاحي</span><strong>${fmt(s.opening)}</strong></div><div class="miniRow"><span>داخل</span><strong>${fmt(s.in+s.transfersIn)}</strong></div><div class="miniRow"><span>خارج</span><strong>${fmt(s.out+s.transfersOut)}</strong></div><div class="miniRow"><span>نهائي متوقع</span><strong>${fmt(s.expected)}</strong></div></div></article>`}).join(""); }
  function renderCategories(){ const cats=Object.values(data.category).filter(c=>!["income","internal"].includes(c.id)), max=Math.max(1,...cats.map(c=>c.planned)); el.categoryCards.innerHTML=cats.map(c=>`<article class="categoryCard"><h3>${c.name}</h3><div class="miniRows"><div class="miniRow"><span>المخطط</span><strong>${fmt(c.planned)}</strong></div><div class="miniRow"><span>المدفوع</span><strong>${fmt(c.paid)}</strong></div><div class="miniRow"><span>المتبقي</span><strong>${fmt(c.pending)}</strong></div><div class="miniRow"><span>عدد الحركات</span><strong>${c.count}</strong></div></div><div class="progress"><span style="--w:${Math.min(100,(c.planned/max)*100)}%"></span></div><small>${pct(c.planned?c.paid/c.planned:0)} مكتمل</small></article>`).join(""); }
  function syncStatusPills(){ el.statusPills.forEach(b=>b.classList.toggle("active",b.dataset.statusFilter===el.statusFilter.value)); }
  function filtered(){ const q=el.searchInput.value.trim().toLowerCase(), st=el.statusFilter.value, bank=el.bankFilter.value, cat=el.categoryFilter.value, type=el.typeFilter.value, sort=el.sortSelect.value; const rows=data.timeline.filter(tx=>(!q||`${tx.name} ${tx.notes} ${tx.categoryName} ${tx.bankName} ${tx.reference}`.toLowerCase().includes(q))&&(st==="all"||tx.status===st)&&(bank==="all"||tx.bank===bank||tx.toBank===bank)&&(cat==="all"||tx.category===cat)&&(type==="all"||tx.type===type)&&(!active().hideCompleted||tx.status!=="Completed")); rows.sort((a,b)=>sort==="dateDesc"?new Date(b.date)-new Date(a.date):sort==="amountDesc"?b.amount-a.amount:sort==="amountAsc"?a.amount-b.amount:sort==="priority"?P_WEIGHT[a.priority]-P_WEIGHT[b.priority]||new Date(a.date)-new Date(b.date):new Date(a.date)-new Date(b.date)); return rows; }
  function renderTransactions(){ const items=filtered(); el.transactionsHint.textContent=`${items.length} حركة ظاهرة من أصل ${data.timeline.length}`; el.transactionList.innerHTML=items.length?items.map(tx=>{const signed=signedAmount(tx), amountClass=tx.type==="Transfer"?"transfer":signed>=0?"in":"out";return `<article class="txCard ${statusClass(tx.status)}"><div class="txTop"><div class="txTitle"><h3>${safe(tx.name)}</h3><div class="badges"><span class="badge ${statusClass(tx.status)}">${STATUSES[tx.status]}</span><span class="badge">${TYPES[tx.type]}</span><span class="badge">${tx.categoryName}</span><span class="badge priority-${tx.priority}">${PRIORITIES[tx.priority]}</span>${tx.essential?`<span class="badge">أساسية</span>`:`<span class="badge">اختيارية</span>`}${tx.recurring.enabled?`<span class="badge">شهري</span>`:""}${tx.receipt?`<span class="badge">مرفق</span>`:""}</div>${tx.reference?`<small>Ref: ${safe(tx.reference)}</small>`:""}</div><div class="amount ${amountClass}">${fmtSigned(signed)}</div></div><div class="txDetails"><div class="detailBox"><span>البنك</span><strong>${tx.bankName}${tx.toBankName?` ← ${tx.toBankName}`:""}</strong></div><div class="detailBox"><span>التاريخ</span><strong>${dateFmt(tx.date)}</strong></div><div class="detailBox"><span>قبل</span><strong>${fmt(tx.before)}</strong></div><div class="detailBox"><span>بعد</span><strong>${fmt(tx.after)}</strong></div><div class="detailBox"><span>ملاحظة</span><strong>${tx.notes?safe(tx.notes):"—"}</strong></div></div><div class="txActions"><div class="txRightActions"><input class="selectBox" type="checkbox" data-select="${tx.id}" aria-label="تحديد الحركة" /><label class="toggle"><input type="checkbox" data-paid="${tx.id}" ${tx.status==="Completed"?"checked":""}/><i></i><span>مدفوع</span></label></div><div class="txLeftActions">${tx.receipt?`<button class="btn ghost" type="button" data-receipt="${tx.id}">المرفق</button>`:""}<button class="btn ghost" type="button" data-edit="${tx.id}">تعديل</button></div></div></article>`}).join(""):`<div class="empty">لا توجد حركات مطابقة.</div>`; updateDisabledState(); }
  function renderCharts(){ const cats=Object.values(data.category).filter(c=>c.planned>0&&!["income","internal"].includes(c.id)); bars(el.categoryChart,cats.map(c=>[c.name,c.planned])); bars(el.paidChart,[["مدفوع",data.paidExpenses],["غير مدفوع",data.pendingExpenses]]); bars(el.topChart,data.timeline.filter(tx=>isExpense(tx.type)).sort((a,b)=>b.amount-a.amount).slice(0,5).map(tx=>[tx.name,tx.amount])); const last=[...data.timeline].sort((a,b)=>new Date(b.actualDate||b.date)-new Date(a.actualDate||a.date)).slice(0,5); el.lastFiveList.innerHTML=last.map(tx=>`<div class="miniRow"><span>${safe(tx.name)}</span><strong>${fmt(tx.amount)}</strong></div>`).join("")||`<div class="empty">لا يوجد</div>`; }
  function bars(c,rows){ const max=Math.max(1,...rows.map(r=>r[1])); c.innerHTML=rows.map(r=>`<div class="barRow"><div class="barHead"><span>${safe(r[0])}</span><strong>${fmt(r[1])}</strong></div><div class="barTrack"><div class="barFill" style="--w:${Math.min(100,(r[1]/max)*100)}%"></div></div></div>`).join("")||`<div class="empty">لا يوجد بيانات</div>`; }

  function openEditor(idValue=""){ if(state.readOnly) return toast("وضع القراءة فقط مفعّل"); if(active().closed) return toast("الشهر مغلق. فك الإغلاق أولاً"); const tx=idValue?active().items.find(x=>x.id===idValue):null; el.modalTitle.textContent=tx?"تعديل حركة":"إضافة حركة"; el.txId.value=tx?.id||""; el.txName.value=tx?.name||""; el.txAmount.value=tx?displayInt(tx.amount):""; el.txStatus.value=tx?.status||"Pending"; el.txType.value=tx?.type||"Expense"; el.txBank.value=tx?.bank||"arab"; el.txToBank.value=tx?.toBank||"arab"; el.txCategory.value=tx?.category||"personal"; el.txDate.value=tx?.date||`${state.activeMonth}-01`; el.txPriority.value=tx?.priority||"medium"; el.txReference.value=tx?.reference||""; el.txEssential.checked=!!tx?.essential; el.txRecurring.checked=!!tx?.recurring?.enabled; el.txRecurringDay.value=tx?.recurring?.day||Number((tx?.date||`${state.activeMonth}-01`).slice(-2)); el.txRecurringUntil.value=tx?.recurring?.until||""; el.txRecurringPaused.checked=!!tx?.recurring?.paused; el.txReceipt.value=""; el.txNotes.value=tx?.notes||""; el.deleteBtn.style.display=tx?"inline-flex":"none"; el.txLog.innerHTML=tx?.logs?.length?tx.logs.slice(-5).reverse().map(l=>`<div class="logItem">${safe(l.at)} — ${safe(l.action)}</div>`).join(""):""; syncFormType(); openDialog(el.txDialog); }
  function syncFormType(){ const transfer=el.txType.value==="Transfer"; el.toBankWrap.style.display=transfer?"grid":"none"; el.txCategory.disabled=transfer; if(transfer) el.txCategory.value="internal"; }
  async function saveTransaction(e){ e.preventDefault(); const idv=el.txId.value; const tx={ id:idv||`tx_${state.activeMonth.replace("-","")}_${id()}`, name:el.txName.value.trim(), amount:Math.abs(num(el.txAmount.value)), status:el.txStatus.value, type:el.txType.value, bank:el.txBank.value, toBank:el.txType.value==="Transfer"?el.txToBank.value:"", category:el.txType.value==="Transfer"?"internal":el.txCategory.value, date:el.txDate.value, actualDate:el.txStatus.value==="Completed"?today():"", priority:el.txPriority.value, reference:el.txReference.value.trim(), essential:el.txEssential.checked, notes:el.txNotes.value.trim(), recurring:{enabled:el.txRecurring.checked,day:clamp(Number(el.txRecurringDay.value||String(el.txDate.value).slice(-2)||1),1,31),until:el.txRecurringUntil.value,paused:el.txRecurringPaused.checked,originId:""} }; if(!tx.name||!tx.amount||!tx.date) return toast("راجع اسم الحركة والمبلغ والتاريخ"); if(tx.type==="Transfer"&&tx.bank===tx.toBank) return toast("التحويل غير صحيح: المصدر والوجهة نفس البنك"); const receipt=el.txReceipt.files?.[0]?await fileToData(el.txReceipt.files[0]):null; mutate(()=>{ const m=active(), i=m.items.findIndex(x=>x.id===tx.id); if(i>=0){ const old=m.items[i]; tx.receipt=receipt||old.receipt||null; tx.logs=[...(old.logs||[]),{at:stamp(),action:"تم تعديل الحركة"}]; tx.recurring.originId=old.recurring?.originId||old.id; m.items[i]=cleanTx(tx,state.activeMonth); } else { tx.receipt=receipt; tx.logs=[{at:stamp(),action:"تم إنشاء الحركة"}]; tx.recurring.originId=tx.id; m.items.push(cleanTx(tx,state.activeMonth)); } },"تم حفظ الحركة"); closeDialog(el.txDialog); }
  async function deleteCurrentTransaction(){ const idv=el.txId.value; if(!idv)return; if(!await confirmBox("حذف الحركة","هل تريد حذف هذه الحركة؟",""))return; mutate(()=>active().items=active().items.filter(x=>x.id!==idv),"تم حذف الحركة"); closeDialog(el.txDialog); }
  async function quickPayToday(){ const ids=data.dueToday.map(x=>x.id); if(!ids.length)return toast("لا توجد حركات مستحقة اليوم"); if(!await confirmBox("دفع مستحقات اليوم",`سيتم تسجيل ${ids.length} حركة كمدفوعة.`,""))return; mutate(()=>active().items.forEach(tx=>{if(ids.includes(tx.id)){tx.status="Completed";tx.actualDate=today();addLog(tx,"دفع سريع لمستحقات اليوم");}}),"تم دفع مستحقات اليوم"); }
  function selectedIds(){ return Array.from(document.querySelectorAll("[data-select]:checked")).map(i=>i.dataset.select); }
  async function bulkPay(){ const ids=selectedIds(); if(!ids.length)return toast("حدد حركات أولاً"); mutate(()=>active().items.forEach(tx=>{if(ids.includes(tx.id)){tx.status="Completed";tx.actualDate=today();addLog(tx,"دفع جماعي");}}),"تم دفع المحدد"); }
  async function bulkDelete(){ const ids=selectedIds(); if(!ids.length)return toast("حدد حركات أولاً"); if(!await confirmBox("حذف جماعي",`سيتم حذف ${ids.length} حركة.`,""))return; mutate(()=>active().items=active().items.filter(tx=>!ids.includes(tx.id)),"تم حذف المحدد"); }
  async function closeMonth(){ if(!await confirmBox("إغلاق الشهر","بعد الإغلاق لن يمكن التعديل إلا بعد فك الإغلاق.",""))return; snapshot(); active().closed=true; saveRender("تم إغلاق الشهر"); }
  async function unlockMonth(){ if(!await confirmBox("فك الإغلاق","سيتم السماح بالتعديل على الشهر الحالي.",""))return; snapshot(); active().closed=false; saveRender("تم فك الإغلاق"); }
  async function copyToNextMonth(){ const next=nextMonth(state.activeMonth); if(!await confirmBox("نسخ للشهر القادم",`نسخ خطة ${state.activeMonth} إلى ${next}؟`,""))return; snapshot(); state.months[next]={opening:{alrajhi:data.bankStats.alrajhi.expected,arab:data.bankStats.arab.expected,cash:data.bankStats.cash.expected},actual:{alrajhi:null,arab:null,cash:null},notes:"",closed:false,hideCompleted:false,items:active().items.map(tx=>cleanTx({...tx,id:`tx_${next.replace("-","")}_${id()}`,date:moveDate(tx.date,next),actualDate:"",status:"Pending",logs:[{at:stamp(),action:"تم نسخها من الشهر السابق"}],recurring:{...tx.recurring,originId:tx.recurring?.originId||tx.id}},next))}; state.activeMonth=next; saveRender("تم نسخ الشهر"); }
  function exportJson(){ download(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),`cashflow-${state.activeMonth}.json`); toast("تم تصدير نسخة JSON"); }
  async function importJson(e){ const f=e.target.files?.[0]; e.target.value=""; if(!f)return; try{const p=JSON.parse(await f.text()); if(!p.months)throw new Error(); if(!await confirmBox("استيراد البيانات","سيتم استبدال البيانات الحالية. هل تريد المتابعة؟",""))return; snapshot(); state=p; if(!state.activeMonth)state.activeMonth=DEFAULT_MONTH; if(!state.theme)state.theme="dark"; ensureMonth(state.activeMonth); saveRender("تم الاستيراد");}catch{toast("ملف غير صالح");} }
  function exportCsv(){ const rows=[["الشهر","الحركة","النوع","البنك","إلى بنك","التصنيف","المبلغ","الحالة","التاريخ","الأولوية","أساسية","مرجع","متكررة","الرصيد قبل","الرصيد بعد","ملاحظة"],...data.timeline.map(tx=>[state.activeMonth,tx.name,TYPES[tx.type],tx.bankName,tx.toBankName,tx.categoryName,String(displayInt(tx.amount)),STATUSES[tx.status],tx.date,PRIORITIES[tx.priority],tx.essential?"نعم":"لا",tx.reference,tx.recurring.enabled?"نعم":"لا",String(displayInt(tx.before)),String(displayInt(tx.after)),tx.notes])]; const csv="\ufeff"+rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(",")).join("\n"); download(new Blob([csv],{type:"text/csv;charset=utf-8"}),`cashflow-${state.activeMonth}.csv`); toast("تم تصدير ملف Excel"); }
  async function resetMonth(){ const expected=state.resetPassword||"RESET"; if(!await confirmBox("تصفير الشهر",state.resetPassword?"أدخل كلمة سر Reset.":"سيتم حذف تعديلات الشهر الحالي. اكتب RESET للتأكيد.",expected)){toast("لم يتم التصفير");return;} snapshot(); state.months[state.activeMonth]=newMonth(state.activeMonth); saveRender("تم تصفير الشهر"); }
  function setResetPassword(){ const v=prompt(state.resetPassword?"كلمة سر Reset مفعلة. أدخل كلمة جديدة أو اتركها فارغة لإزالتها.":"أدخل كلمة سر لحماية Reset."); if(v===null)return; snapshot(); state.resetPassword=v.trim(); saveRender(state.resetPassword?"تم حفظ كلمة سر Reset":"تم إلغاء كلمة سر Reset"); }
  function undoLastChange(){ if(!state.lastSnapshot)return toast("لا توجد نسخة سابقة"); state=JSON.parse(state.lastSnapshot); saveRender("تم استعادة آخر تعديل"); }
  function updateDisabledState(){ const locked=state.readOnly||active().closed; [el.addBtn,el.fabBtn,el.bulkPayBtn,el.bulkDeleteBtn,el.quickPayTodayBtn].forEach(b=>b.disabled=locked); document.querySelectorAll("[data-paid],[data-edit],[data-select]").forEach(c=>c.disabled=locked); }
  function showReceipt(txid){ const tx=active().items.find(x=>x.id===txid); if(!tx?.receipt?.data)return toast("لا يوجد مرفق"); const w=window.open(); if(!w)return toast("المتصفح منع فتح المرفق"); w.document.write(`<title>Receipt</title><iframe src="${tx.receipt.data}" style="border:0;width:100vw;height:100vh"></iframe>`); }
  function confirmBox(title,text,expected=""){ el.confirmTitle.textContent=title; el.confirmText.textContent=text; el.confirmPhraseWrap.classList.toggle("hidden",!expected); el.confirmPhraseLabel.textContent=expected==="RESET"?"اكتب RESET":"أدخل كلمة التأكيد"; el.confirmPhrase.dataset.expected=expected; el.confirmPhrase.value=""; openDialog(el.confirmDialog); return new Promise(r=>confirmResolve=r); }

  function addLog(tx,action){ tx.logs=[...(tx.logs||[]),{at:stamp(),action}]; }
  function isExpense(type){ return ["Expense","Deduction","DebtRepayment"].includes(type); }
  function signedAmount(tx){ if(tx.type==="Income"||tx.type==="Reimbursement")return tx.amount; if(tx.type==="Transfer"||isExpense(tx.type))return -tx.amount; return 0; }
  function statusClass(status){ return status==="Completed"?"done":status==="Delayed"?"delayed":status==="Pending"?"pending":"skipped"; }
  function isOverdue(tx){ return tx.date<today()&&tx.status!=="Completed"&&tx.status!=="Skipped"; }
  function catName(v){ return CATEGORIES.find(c=>c.id===v)?.name||"غير مصنف"; }
  function displayInt(v){ return Math.round(num(v)); }
  function fmt(v){ return `${displayInt(v).toLocaleString("en-US",{maximumFractionDigits:0})} JOD`; }
  function shortFmt(v){ return displayInt(v).toLocaleString("en-US",{maximumFractionDigits:0}); }
  function fmtSigned(v){ const n=displayInt(v), sign=n>0?"+":n<0?"-":""; return `${sign}${Math.abs(n).toLocaleString("en-US",{maximumFractionDigits:0})} JOD`; }
  function pct(v){ return `${Math.max(0,Math.min(999,v*100)).toFixed(0)}%`; }
  function num(v){ const n=Number.parseFloat(String(v??"").replace(/,/g,"")); return Number.isFinite(n)?Math.round(n*1000000)/1000000:0; }
  function validDate(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")); }
  function validMonth(v){ return /^\d{4}-\d{2}$/.test(String(v||"")); }
  function dateFmt(v){ if(!validDate(v))return "—"; const [y,m,d]=v.split("-"); return `${d}/${m}/${y}`; }
  function nextMonth(month){ const [y,m]=month.split("-").map(Number), d=new Date(y,m,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
  function previousMonth(month){ const [y,m]=month.split("-").map(Number), d=new Date(y,m-2,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
  function moveDate(date,month){ return dateInMonth(month,Number(String(date||"").slice(-2)||1)); }
  function dateInMonth(month,day){ const [y,m]=month.split("-").map(Number), last=new Date(y,m,0).getDate(); return `${month}-${String(Math.min(Number(day),last)).padStart(2,"0")}`; }
  function today(){ return new Date().toISOString().slice(0,10); }
  function stamp(){ return new Date().toLocaleString("ar-JO"); }
  function id(){ return Math.random().toString(36).slice(2,10); }
  function clamp(v,min,max){ return Math.min(max,Math.max(min,v)); }
  function safe(v){ return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
  function fileToData(file){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve({name:file.name,type:file.type,data:r.result}); r.onerror=reject; r.readAsDataURL(file); }); }
  function download(blob,name){ const url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
  function openDialog(d){ if(typeof d.showModal==="function")d.showModal(); else d.setAttribute("open","open"); }
  function closeDialog(d){ if(typeof d.close==="function")d.close(); else d.removeAttribute("open"); }
  function toast(message){ el.toast.textContent=message; el.toast.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.toast.classList.remove("show"),2400); }
})();
