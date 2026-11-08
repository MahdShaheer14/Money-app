/* ============================================================
   Budge — UI, navigation, sheets, events
   ============================================================ */

let activeTab = 'home';
let sheetOpen = false;
const pendingToastActions = {};

/* ---------- boot ---------- */
function boot() {
  state = loadState();
  if (!state.profile) state.profile = { name: 'Ayesha Khan', email: 'ayesha@example.com' };
  if (!state.insightRange) state.insightRange = 6;
  $('#phone').setAttribute('data-theme', state.theme || 'dark');
  hydrateStaticIcons();
  renderAll();
  nav('home', true);
  startClock();
  bindGlobal();
  /* if a relay address is saved, start collecting in the background */
  if (isNativeApp()) {
    state.sms = state.sms || {};
    state.sms.native = true;
    pollNativeSms();
    setTimeout(pollNativeSms, 1500);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) pollNativeSms();
    });
  } else if (state.sms && state.sms.endpoint) {
    startSmsPoller();
  }
}

function hydrateStaticIcons() {
  $$('[data-icon]').forEach(el => {
    el.innerHTML = icon(el.getAttribute('data-icon'), Number(el.getAttribute('data-size')) || 20);
  });
  $$('[data-mkicon]').forEach(el => {
    el.innerHTML = icon(el.getAttribute('data-mkicon'), 17);
  });
}

function startClock() {
  const tick = () => {
    const d = new Date();
    let h = d.getHours() % 12 || 12;
    $('#clock').textContent = `${h}:${pad2(d.getMinutes())}`;
  };
  tick();
  setInterval(tick, 20000);
}

/* ---------- navigation ---------- */
function nav(name, silent) {
  activeTab = name;
  $$('.screen').forEach(s => s.classList.toggle('is-active', s.getAttribute('data-screen') === name));
  $$('.tab').forEach(t => {
    const on = t.getAttribute('data-tab') === name;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-current', on ? 'page' : 'false');
  });
  const screen = $('#screen-' + name);
  if (screen) {
    screen.scrollTop = 0;
    /* retrigger entrance animations */
    screen.querySelectorAll('.anim').forEach(el => {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    });
  }
  if (!silent) haptic();
}

function renderAll() {
  renderHome();
  renderBudget();
  renderInsights();
  renderWallet();
  renderMonthly();
  renderAuto();
  renderPeople();
}

function rerender(tab) {
  if (!tab || tab === 'home') renderHome();
  if (!tab || tab === 'budget') renderBudget();
  if (!tab || tab === 'insights') renderInsights();
  if (!tab || tab === 'wallet') renderWallet();
  if (!tab || tab === 'monthly') renderMonthly();
  if (!tab || tab === 'auto') renderAuto();
  if (!tab || tab === 'people') renderPeople();
}

function haptic() {
  if (navigator.vibrate && window.matchMedia('(pointer:coarse)').matches) {
    try { navigator.vibrate(6); } catch (e) { /* noop */ }
  }
}

/* ---------- toasts ---------- */
function toast(msg, opts) {
  opts = opts || {};
  const host = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  const id = uid();
  el.innerHTML = `<span class="tic">${icon(opts.icon || 'check', 15)}</span><span>${esc(msg)}</span>${opts.action ? `<button style="margin-left:4px;font-weight:800;color:#D7FA4C;letter-spacing:-.01em" data-toast="${id}">${esc(opts.action.label)}</button>` : ''}`;
  host.appendChild(el);
  if (opts.action) {
    pendingToastActions[id] = () => { opts.action.fn(); el.remove(); };
  }
  setTimeout(() => { el.remove(); delete pendingToastActions[id]; }, 2750);
}

/* ---------- sheets ---------- */
function openSheet(html, opts) {
  const sheet = $('#sheet');
  sheet.innerHTML = html;
  sheetOpen = true;
  $('#overlay').classList.add('show');
  requestAnimationFrame(() => sheet.classList.add('open'));
  if (opts && opts.focus) {
    setTimeout(() => {
      const f = sheet.querySelector(opts.focus);
      if (f) { f.focus({ preventScroll: true }); if (f.select) f.select(); }
    }, 380);
  }
}
function closeSheet() {
  sheetOpen = false;
  const sheet = $('#sheet');
  sheet.classList.remove('open');
  $('#overlay').classList.remove('show');
  setTimeout(() => {
    if (!sheetOpen) sheet.innerHTML = '';
  }, 380);
}

function sheetHead(title, sub) {
  return `<div class="sheet-grab"><i></i></div>
    <div class="sheet-head">
      <div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>
      <button class="sheet-x" data-close aria-label="Close">${icon('close', 16)}</button>
    </div>`;
}

/* ============================================================
   ADD / EDIT TRANSACTION
   ============================================================ */
let draft = null;
let editingId = null;

function addTxSheet(txId) {
  editingId = txId || null;
  const existing = txId ? state.txns.find(t => t.id === txId) : null;

  if (existing) {
    draft = {
      type: existing.type,
      amount: String(existing.amount),
      catId: existing.categoryId,
      title: existing.title,
      note: existing.note || '',
      accountId: existing.accountId,
      date: existing.date.slice(0, 16)
    };
  } else {
    const firstOut = state.categories.find(c => c.kind !== 'in');
    draft = {
      type: 'out',
      amount: '',
      catId: firstOut ? firstOut.id : 'groceries',
      title: '',
      note: '',
      accountId: (state.accounts[0] || {}).id || '',
      date: isoLocal(new Date())
    };
  }
  paintTxSheet();
}

function paintTxSheet() {
  const isEdit = !!editingId;
  const cats = state.categories.filter(c => (draft.type === 'in' ? c.kind === 'in' : c.kind !== 'in'));
  const amt = draft.amount ? Number(draft.amount) : 0;
  const amtText = draft.amount === '' ? '0' : money(amt) + (draft.amount.includes('.') ? '.' + (draft.amount.split('.')[1] || '') : '');
  const valid = amt > 0;

  const body = `
    ${sheetHead(isEdit ? 'Edit transaction' : 'Add transaction', isEdit ? 'Update the details below' : 'Log it now, forget about it later')}
    <div class="sheet-body">
      <div class="seg type" role="tablist">
        <button class="${draft.type === 'out' ? 'on' : ''}" data-dtype="out" ${isEdit ? 'disabled' : ''}>Expense</button>
        <button class="${draft.type === 'in' ? 'on' : ''}" data-dtype="in" ${isEdit ? 'disabled' : ''}>Income</button>
      </div>

      <div class="amount-display">
        <span class="cur">${curSym()}</span>
        <span class="val ${draft.amount === '' ? 'placeholder' : ''}">${amtText}</span>
      </div>

      <div class="cats">
        ${cats.map(c => `<button class="cat ${draft.catId === c.id ? 'on' : ''}" data-dcat="${c.id}" style="--c:${c.color}">
          <span class="cic">${icon(c.icon, 18)}</span><span>${esc(c.name.split(' ')[0])}</span>
        </button>`).join('')}
      </div>

      <input class="entry-title" id="txTitle" placeholder="${draft.type === 'in' ? 'Who paid you?' : 'What was it for?'}" value="${esc(draft.title)}" maxlength="48">

      <div class="meta-row">
        <label class="chip-btn">${icon('wallet', 13)}<select id="txAcct">${state.accounts.map(a => `<option value="${a.id}" ${a.id === draft.accountId ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>
        <label class="chip-btn">${icon('calendar', 13)}<input type="datetime-local" id="txDate" value="${draft.date}"></label>
      </div>

      <input class="entry-note" id="txNote" placeholder="Add a note (optional)" value="${esc(draft.note)}" maxlength="70">

      ${isEdit ? `
        <div class="field" style="margin-top:6px">
          <label>Amount</label>
          <input type="number" id="txAmountInput" value="${draft.amount}" inputmode="decimal" min="1">
        </div>
      ` : `
        <div class="keypad">
          ${['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => k === 'del'
            ? `<button class="key del" data-key="del" aria-label="Delete">${icon('chevron-left', 19)}</button>`
            : `<button class="key" data-key="${k}">${k}</button>`).join('')}
        </div>
      `}

      <button class="btn btn-lime" id="saveTx" ${valid ? '' : 'disabled'}>${icon('check', 17)} ${isEdit ? 'Save changes' : 'Save transaction'}</button>
      ${isEdit ? `<button class="btn btn-danger" id="delTx" style="margin-top:9px">${icon('trash', 16)} Delete transaction</button>` : ''}
    </div>
  `;
  openSheet(body);

  /* keep keypad typing snappy by binding directly */
  const sheet = $('#sheet');
  sheet.querySelectorAll('[data-key]').forEach(b => {
    b.addEventListener('click', () => pressKey(b.getAttribute('data-key')));
  });
  const titleEl = $('#txTitle');
  if (titleEl) {
    titleEl.addEventListener('input', e => { draft.title = e.target.value; });
    titleEl.addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  }
  const noteEl = $('#txNote');
  if (noteEl) noteEl.addEventListener('input', e => { draft.note = e.target.value; });
  const acctEl = $('#txAcct');
  if (acctEl) acctEl.addEventListener('change', e => { draft.accountId = e.target.value; });
  const dateEl = $('#txDate');
  if (dateEl) dateEl.addEventListener('change', e => { if (e.target.value) draft.date = e.target.value; });
  const amtIn = $('#txAmountInput');
  if (amtIn) amtIn.addEventListener('input', e => {
    draft.amount = String(e.target.value).replace(/[^\d.]/g, '');
    const btn = $('#saveTx');
    if (btn) { const ok = Number(draft.amount) > 0; btn.disabled = !ok; }
    const valEl = sheet.querySelector('.amount-display .val');
    if (valEl) { valEl.textContent = draft.amount === '' ? '0' : money(draft.amount); valEl.classList.toggle('placeholder', draft.amount === ''); }
  });

  sheet.querySelectorAll('[data-dtype]').forEach(b => b.addEventListener('click', () => {
    const t = b.getAttribute('data-dtype');
    if (draft.type === t) return;
    draft.type = t;
    const list = state.categories.filter(c => (t === 'in' ? c.kind === 'in' : c.kind !== 'in'));
    draft.catId = list.length ? list[0].id : draft.catId;
    paintTxSheet();
  }));
  sheet.querySelectorAll('[data-dcat]').forEach(b => b.addEventListener('click', () => {
    draft.catId = b.getAttribute('data-dcat');
    paintTxSheet();
  }));

  const saveBtn = $('#saveTx');
  if (saveBtn) saveBtn.addEventListener('click', saveTx);
  const delBtn = $('#delTx');
  if (delBtn) delBtn.addEventListener('click', () => deleteTx(editingId));
}

function pressKey(k) {
  if (k === 'del') {
    draft.amount = draft.amount.slice(0, -1);
  } else if (k === '.') {
    if (!draft.amount.includes('.')) draft.amount = (draft.amount || '0') + '.';
  } else {
    if (draft.amount.length >= 9) return;
    const parts = draft.amount.split('.');
    if (parts[1] && parts[1].length >= 2) return;
    if (draft.amount === '0') draft.amount = k;
    else draft.amount += k;
  }
  /* lightweight DOM update */
  const valEl = $('#sheet .amount-display .val');
  if (valEl) {
    const v = draft.amount;
    let text = '0';
    if (v !== '') {
      const [i, d] = v.split('.');
      text = money(i || 0) + (v.includes('.') ? '.' + (d || '') : '');
    }
    valEl.textContent = text;
    valEl.classList.toggle('placeholder', v === '');
  }
  const btn = $('#saveTx');
  if (btn) btn.disabled = !(Number(draft.amount) > 0);
  haptic();
}

function saveTx() {
  const amount = Number(draft.amount);
  if (!(amount > 0)) { toast('Enter an amount first', { icon: 'target' }); return; }
  const cat = catById(draft.catId);
  const title = (draft.title || '').trim() || cat.name;
  const date = draft.date || isoLocal(new Date());

  if (editingId) {
    const t = state.txns.find(x => x.id === editingId);
    if (t) {
      /* reverse old balance impact, then apply new */
      const oldAcct = acctById(t.accountId);
      if (oldAcct && oldAcct.id) oldAcct.balance += (t.type === 'in' ? -t.amount : t.amount);
      Object.assign(t, { title, amount, categoryId: draft.catId, accountId: draft.accountId, date, type: draft.type, note: draft.note });
      const acct = acctById(draft.accountId);
      if (acct && acct.id) acct.balance += (draft.type === 'in' ? amount : -amount);
    }
    toast('Transaction updated');
    editingId = null;
  } else {
    const t = {
      id: uid(), title, amount, categoryId: draft.catId, accountId: draft.accountId,
      date, type: draft.type, note: draft.note
    };
    state.txns.push(t);
    const acct = acctById(draft.accountId);
    if (acct && acct.id) acct.balance += (draft.type === 'in' ? amount : -amount);
    toast(`${draft.type === 'in' ? 'Income' : 'Expense'} of ${fmtMoney(amount)} logged`);
  }
  saveState();
  commit();
  closeSheet();
}

function deleteTx(id) {
  const idx = state.txns.findIndex(t => t.id === id);
  if (idx < 0) return;
  const removed = state.txns[idx];
  const acct = acctById(removed.accountId);
  if (acct && acct.id) acct.balance += (removed.type === 'in' ? -removed.amount : removed.amount);
  state.txns.splice(idx, 1);
  saveState();
  commit();
  closeSheet();
  toast('Transaction deleted', {
    icon: 'trash',
    action: {
      label: 'Undo',
      fn: () => {
        state.txns.push(removed);
        const a = acctById(removed.accountId);
        if (a && a.id) a.balance += (removed.type === 'in' ? removed.amount : -removed.amount);
        saveState();
        commit();
        toast('Restored');
      }
    }
  });
}

function commit() {
  rerender();
  const screen = $('#screen-' + activeTab);
  if (screen) {
    screen.querySelectorAll('.anim').forEach(el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
  }
}

/* ============================================================
   TRANSACTION DETAIL
   ============================================================ */
function txDetailSheet(id) {
  const t = state.txns.find(x => x.id === id);
  if (!t) return;
  const c = catById(t.categoryId);
  const a = acctById(t.accountId);
  const isIn = t.type === 'in';
  const splitCount = (t.splits || []).length;

  openSheet(`
    ${sheetHead('Transaction', 'Logged ' + shortDate(t.date))}
    <div class="sheet-body">
      <div class="detail-hero">
        <div class="detail-ico" style="--c:${c.color}">${icon(c.icon, 27)}</div>
        <div class="amt ${isIn ? 'in' : ''}">${isIn ? '+' : '−'} ${fmtMoney(t.amount)}</div>
        <h4>${esc(t.title)}</h4>
        <p>${esc(c.name)}</p>
      </div>
      <div class="kv">
        <div><span>Type</span><strong>${isIn ? 'Income' : 'Expense'}</strong></div>
        <div><span>Account</span><strong>${esc(a.name)}</strong></div>
        <div><span>Date & time</span><strong>${shortDate(t.date)} · ${timeLabel(t.date)}</strong></div>
        ${t.note ? `<div><span>Note</span><strong style="text-align:right;max-width:60%">${esc(t.note)}</strong></div>` : ''}
        <div><span>Category budget</span><strong>${c.budget ? `${fmtMoney(c.budget)} / mo` : '—'}</strong></div>
        ${t.source === 'sms' ? `<div><span>Source</span><strong class="src-sms">${icon('message', 11)} Autopilot</strong></div>` : ''}
      </div>

      ${splitCount ? `<div class="split-done">
        <div class="sd-head">${icon('split', 13)} Split ${splitCount + 1} ways</div>
        ${(t.splits || []).map(x => {
          const p = personById(x.personId);
          return `<div class="sd-row">
            <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>
            <span class="sd-nm">${esc(p.name)}</span>
            <span class="sd-amt">${fmtMoney(x.amount)}</span>
          </div>`;
        }).join('')}
        <div class="sd-row mine">
          <span class="pi-avatar" style="background:linear-gradient(150deg,#E9FF9C,#C9F53F);color:#0C1004">You</span>
          <span class="sd-nm">You</span>
          <span class="sd-amt">${fmtMoney(t.amount - (t.splits || []).reduce((n, x) => n + x.amount, 0))}</span>
        </div>
      </div>`
      : (!isIn ? `<button class="btn btn-lime" id="splitTx" style="margin-bottom:9px">${icon('split', 16)} Split this with people</button>` : '')}

      <button class="btn btn-ghost" id="editTx">${icon('sparkles', 16)} Edit transaction</button>
      <button class="btn btn-danger" style="margin-top:9px" id="deleteTx">${icon('trash', 16)} Delete</button>
    </div>
  `);
  $('#editTx').addEventListener('click', () => { closeSheet(); setTimeout(() => addTxSheet(id), 240); });
  $('#deleteTx').addEventListener('click', () => deleteTx(id));
  const sp = $('#splitTx');
  if (sp) sp.addEventListener('click', () => { closeSheet(); setTimeout(() => splitSheetForTx(id), 240); });
}

function budgetSheet(catId) {
  const c = catById(catId);
  const spent = sum(state.txns.filter(t => t.categoryId === c.id && t.type === 'out' && monthKeyOf(t.date) === budgetViewMonth).map(t => t.amount));
  const quick = [5000, 10000, 15000, 25000, 50000];

  openSheet(`
    ${sheetHead('Edit budget', esc(c.name) + ' · ' + monthLabelFromKey(budgetViewMonth))}
    <div class="sheet-body">
      <div class="row" style="gap:12px;margin-bottom:16px">
        <span class="tx-ico" style="--c:${c.color}">${icon(c.icon, 20)}</span>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:650;letter-spacing:-.01em">${esc(c.name)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Spent ${fmtMoney(spent)} so far</div>
        </div>
        ${spent > c.budget ? `<span class="pill down">over</span>` : `<span class="pill up">${c.budget ? Math.round((spent / c.budget) * 100) : 0}% used</span>`}
      </div>

      <div class="budget-edit-val" id="budVal">${fmtMoney(c.budget)}</div>
      <div class="budget-edit-sub" id="budSub">${c.budget ? `${fmtMoney(Math.max(0, c.budget - spent))} left to spend` : 'Set a monthly limit'}</div>

      <input class="slider" type="range" id="budRange" min="0" max="${Math.max(200000, c.budget * 3)}" step="1000" value="${c.budget}">
      <div class="quick-amts">${quick.map(q => `<button data-quick="${q}">${fmtMoney(q)}</button>`).join('')}</div>

      <div class="field">
        <label>Exact amount</label>
        <input type="number" id="budInput" value="${c.budget}" min="0" step="500" inputmode="numeric">
        <div class="hint">Budgets reset every month — pick a number you can actually live with.</div>
      </div>

      <button class="btn btn-lime" id="saveBud">${icon('check', 17)} Save budget</button>
    </div>
  `);

  const range = $('#budRange'), input = $('#budInput'), val = $('#budVal'), sub = $('#budSub');
  let value = c.budget;
  const paint = v => {
    value = Math.max(0, Number(v) || 0);
    val.textContent = fmtMoney(value);
    sub.textContent = value ? `${fmtMoney(Math.max(0, value - spent))} left to spend` : 'Set a monthly limit';
    if (Number(range.value) !== value) range.max = Math.max(200000, value * 3);
    range.value = value;
    input.value = value;
  };
  range.addEventListener('input', e => paint(e.target.value));
  input.addEventListener('input', e => paint(e.target.value));
  $$('[data-quick]', $('#sheet')).forEach(b => b.addEventListener('click', () => paint(b.getAttribute('data-quick'))));

  $('#saveBud').addEventListener('click', () => {
    c.budget = Math.round(value);
    saveState();
    rerender('budget');
    rerender('home');
    closeSheet();
    toast('Budget updated for ' + catById(c.id).name);
  });
}

/* ============================================================
   GOALS
   ============================================================ */
function goalSheet(id) {
  const g = state.goals.find(x => x.id === id);
  if (!g) return;
  const pct = clamp(Math.round((g.saved / Math.max(1, g.target)) * 100), 0, 100);
  openSheet(`
    ${sheetHead('Savings goal', g.due ? 'Target date · ' + g.due : '')}
    <div class="sheet-body">
      <div style="position:relative;width:158px;height:158px;margin:4px auto 14px">
        ${ringSvg(pct, 158, 13, g.color)}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px">
          <b style="font-size:26px;font-weight:800;letter-spacing:-.045em">${pct}%</b>
          <span style="font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.08em">complete</span>
        </div>
      </div>
      <div style="text-align:center;margin-bottom:16px">
        <h4 style="font-size:17px;font-weight:750;letter-spacing:-.03em">${esc(g.name)}</h4>
        <p style="font-size:12px;color:var(--muted);margin-top:5px">${fmtMoney(g.saved)} saved of ${fmtMoney(g.target)}</p>
      </div>
      <div class="kv">
        <div><span>Still to save</span><strong>${fmtMoney(Math.max(0, g.target - g.saved))}</strong></div>
        <div><span>Monthly needed</span><strong>${fmtMoney(Math.max(0, g.target - g.saved) / 12)}</strong></div>
        <div><span>Target date</span><strong>${esc(g.due || '—')}</strong></div>
      </div>
      <div class="field">
        <label>Add money to this goal</label>
        <input type="number" id="goalAdd" placeholder="e.g. 10000" min="1" inputmode="numeric">
      </div>
      <div class="quick-amts">
        ${[5000, 10000, 25000, 50000].map(q => `<button data-gquick="${q}">+ ${fmtMoney(q)}</button>`).join('')}
      </div>
      <button class="btn btn-lime" id="goalSave">${icon('target', 17)} Add to goal</button>
      <button class="btn btn-danger" style="margin-top:9px" id="goalDel">${icon('trash', 16)} Delete goal</button>
    </div>
  `);

  const inp = $('#goalAdd');
  $$('[data-gquick]', $('#sheet')).forEach(b => b.addEventListener('click', () => { inp.value = b.getAttribute('data-gquick'); inp.focus(); }));

  $('#goalSave').addEventListener('click', () => {
    const v = Number(inp.value);
    if (!(v > 0)) { toast('Enter an amount to add', { icon: 'target' }); return; }
    g.saved += v;
    const cash = state.accounts.find(a => a.type === 'Cash') || state.accounts[state.accounts.length - 1];
    if (cash) cash.balance = Math.max(0, cash.balance - v);
    saveState();
    rerender();
    closeSheet();
    if (g.saved >= g.target) toast(`${g.name} complete — well done! 🎉`, { icon: 'sparkles' });
    else toast(`${fmtMoney(v)} moved to ${g.name}`);
  });

  $('#goalDel').addEventListener('click', () => {
    const idx = state.goals.findIndex(x => x.id === g.id);
    const removed = state.goals[idx];
    state.goals.splice(idx, 1);
    saveState();
    rerender();
    closeSheet();
    toast('Goal removed', { icon: 'trash', action: { label: 'Undo', fn: () => { state.goals.splice(idx, 0, removed); saveState(); rerender(); toast('Restored'); } } });
  });
}

function newGoalSheet() {
  openSheet(`
    ${sheetHead('New savings goal', 'Give your money a destination')}
    <div class="sheet-body">
      <div class="field"><label>Goal name</label><input id="gName" placeholder="e.g. Japan trip" maxlength="32"></div>
      <div class="two-col">
        <div class="field"><label>Target amount</label><input id="gTarget" type="number" placeholder="250000" inputmode="numeric" min="1"></div>
        <div class="field"><label>Target date</label><input id="gDue" placeholder="Dec 2027" maxlength="14"></div>
      </div>
      <div class="field"><label>Starting amount (optional)</label><input id="gStart" type="number" placeholder="0" inputmode="numeric" min="0"></div>
      <div class="field">
        <label>Colour</label>
        <div class="quick-amts" id="gColors">
          ${['#7EE7B9','#7EC8F2','#C6A6FF','#F5A65B','#FF8BA0','#F2D06B'].map((c, i) => `<button data-gcolor="${c}" style="width:34px;height:34px;border-radius:50%;background:${c};border:${i === 0 ? '3px solid var(--text)' : '3px solid transparent'};padding:0"></button>`).join('')}
        </div>
      </div>
      <button class="btn btn-lime" id="gCreate">${icon('plus', 17)} Create goal</button>
    </div>
  `);
  let color = '#7EE7B9';
  $$('[data-gcolor]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    color = b.getAttribute('data-gcolor');
    $$('[data-gcolor]', $('#sheet')).forEach(x => x.style.borderColor = 'transparent');
    b.style.borderColor = 'var(--text)';
  }));

  $('#gCreate').addEventListener('click', () => {
    const name = $('#gName').value.trim();
    const target = Number($('#gTarget').value);
    if (!name) { toast('Give your goal a name', { icon: 'target' }); $('#gName').focus(); return; }
    if (!(target > 0)) { toast('Set a target amount', { icon: 'target' }); $('#gTarget').focus(); return; }
    state.goals.unshift({
      id: uid(), name, target,
      saved: Math.max(0, Number($('#gStart').value) || 0),
      color, due: $('#gDue').value.trim() || '—'
    });
    saveState();
    rerender();
    closeSheet();
    toast(`${name} goal created`);
  });
}

/* ============================================================
   ALL TRANSACTIONS
   ============================================================ */
let txFilter = { q: '', type: 'all', month: 'all' };

function allTxSheet() {
  txFilter = { q: '', type: 'all', month: 'all' };
  openSheet(`
    ${sheetHead('All transactions', state.txns.length + ' entries · ' + fmtMoney(sum(state.txns.filter(t => t.type === 'out').map(t => t.amount))) + ' spent all-time')}
    <div class="sheet-body">
      <div class="row" style="gap:8px;margin-bottom:12px">
        <div style="flex:1;position:relative">
          <input class="entry-title" id="txSearch" placeholder="Search transactions" style="margin:0;padding-left:36px">
          <span style="position:absolute;left:12px;top:13px;color:var(--faint)">${icon('search', 15)}</span>
        </div>
      </div>
      <div class="meta-row" id="txFilters" style="margin-bottom:10px">
        <button class="chip-btn on" data-tfilter="all">All</button>
        <button class="chip-btn" data-tfilter="out">Expenses</button>
        <button class="chip-btn" data-tfilter="in">Income</button>
        <button class="chip-btn" data-tfilter="month">This month</button>
      </div>
      <div id="txList"></div>
    </div>
  `);

  const paint = () => {
    let list = state.txns.slice();
    if (txFilter.type !== 'all') list = list.filter(t => t.type === txFilter.type);
    if (txFilter.month === 'month') list = list.filter(t => monthKeyOf(t.date) === thisMonthKey());
    if (txFilter.q) {
      const q = txFilter.q.toLowerCase();
      list = list.filter(t => (t.title + ' ' + catById(t.categoryId).name + ' ' + (t.note || '')).toLowerCase().includes(q));
    }
    list.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    const host = $('#txList');
    if (!host) return;
    if (!list.length) {
      host.innerHTML = `<div class="empty"><div class="eic">${icon('search', 22)}</div><strong>No matches</strong><p>Try a different search or filter.</p></div>`;
      return;
    }
    const groups = [];
    list.forEach(t => {
      const lbl = dayLabel(t.date);
      let g = groups.find(x => x.label === lbl);
      if (!g) { g = { label: lbl, items: [] }; groups.push(g); }
      g.items.push(t);
    });
    host.innerHTML = groups.slice(0, 40).map(g => `<div class="tx-day">${g.label}</div><div class="tx-card" style="margin-bottom:10px;background:var(--surface-2)">${g.items.map(t => txRow(t, 0)).join('')}</div>`).join('')
      + (list.length > 40 ? `<div style="text-align:center;font-size:11px;color:var(--faint);padding:8px">Showing 40 of ${list.length} entries</div>` : '');
  };
  paint();

  $('#txSearch').addEventListener('input', e => { txFilter.q = e.target.value; paint(); });
  $$('[data-tfilter]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    const f = b.getAttribute('data-tfilter');
    if (f === 'month') {
      txFilter.month = txFilter.month === 'month' ? 'all' : 'month';
      b.classList.toggle('on', txFilter.month === 'month');
    } else {
      txFilter.type = f;
      $$('[data-tfilter]', $('#sheet')).forEach(x => { if (x.getAttribute('data-tfilter') !== 'month') x.classList.remove('on'); });
      b.classList.add('on');
    }
    paint();
  }));
}

/* ============================================================
   MONTH PICKER
   ============================================================ */
function monthSheet() {
  const opts = [0, -1, -2, -3, -4, -5].map(o => shiftMonthKey(o));
  openSheet(`
    ${sheetHead('View month', 'Budgets are tracked monthly')}
    <div class="sheet-body">
      <div class="settings">
        ${opts.map(k => {
          const spending = monthExpense(k);
          return `<button class="set-row" data-month="${k}">
            <span class="sic">${icon('calendar', 16)}</span>
            <span class="stx"><strong>${monthLabelFromKey(k)}</strong><span>${fmtMoney(spending)} spent</span></span>
            ${k === budgetViewMonth ? `<span class="pill up">${icon('check', 12)}</span>` : `<span class="chev">${icon('chevron-right', 15)}</span>`}
          </button>`;
        }).join('')}
      </div>
    </div>
  `);
  $$('[data-month]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    budgetViewMonth = b.getAttribute('data-month');
    renderBudget();
    closeSheet();
    nav('budget');
  }));
}

/* ============================================================
   SETTINGS / NOTIFICATIONS / EXPORT / ACCOUNT
   ============================================================ */
function settingsSheet() {
  openSheet(`
    ${sheetHead('Settings', 'Make Budge yours')}
    <div class="sheet-body">
      <div class="field"><label>Your name</label><input id="setName" value="${esc(state.profile.name)}" maxlength="30"></div>
      <div class="two-col">
        <div class="field"><label>Currency</label>
          <select id="setCur">${Object.keys(CURRENCIES).map(k => `<option value="${k}" ${state.currency === k ? 'selected' : ''}>${k} · ${CURRENCIES[k].sym}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Theme</label>
          <div class="seg mini" id="setTheme" style="width:100%;display:grid;grid-template-columns:1fr 1fr">
            <button data-theme-opt="dark" class="${state.theme !== 'light' ? 'on' : ''}">Dark</button>
            <button data-theme-opt="light" class="${state.theme === 'light' ? 'on' : ''}">Light</button>
          </div>
        </div>
      </div>

      <div class="settings" style="margin-top:4px">
        <div class="set-row">
          <span class="sic">${icon('bell', 16)}</span>
          <span class="stx"><strong>Smart notifications</strong><span>Budget alerts and weekly recaps</span></span>
          <button class="switch ${state.notify ? 'on' : ''}" id="setNotify" aria-label="Toggle notifications"></button>
        </div>
        <div class="set-row">
          <span class="sic">${icon('shield', 16)}</span>
          <span class="stx"><strong>Privacy</strong><span>Everything is stored on this device</span></span>
          <span class="chev">${icon('lock', 15)}</span>
        </div>
      </div>

      <button class="btn btn-ghost" id="setExport" style="margin-bottom:9px">${icon('download', 16)} Export my data</button>
      <button class="btn btn-danger" id="setReset">${icon('reset', 16)} Reset demo data</button>
      <div class="app-ver" style="padding-top:14px">Budge 1.0 · a UI demo<br>Not connected to any real bank</div>
    </div>
  `);

  $('#setName').addEventListener('change', e => {
    state.profile.name = e.target.value.trim() || 'Friend';
    saveState(); rerender('home'); toast('Name updated');
  });
  $('#setCur').addEventListener('change', e => {
    state.currency = e.target.value;
    saveState(); rerender(); toast('Currency set to ' + state.currency);
  });
  $$('[data-theme-opt]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    applyTheme(b.getAttribute('data-theme-opt'));
    $$('[data-theme-opt]', $('#sheet')).forEach(x => x.classList.toggle('on', x === b));
  }));
  $('#setNotify').addEventListener('click', e => {
    state.notify = !state.notify;
    e.currentTarget.classList.toggle('on', state.notify);
    saveState();
    toast(state.notify ? 'Alerts turned on' : 'Alerts turned off', { icon: 'bell' });
  });
  $('#setExport').addEventListener('click', exportSheet);
  $('#setReset').addEventListener('click', () => {
    state = defaultState();
    saveState();
    applyTheme(state.theme);
    rerender();
    closeSheet();
    nav('home');
    toast('Demo data restored');
  });
}

function applyTheme(t) {
  state.theme = t;
  $('#phone').setAttribute('data-theme', t);
  saveState();
  rerender('home');
}

function exportSheet() {
  const data = JSON.stringify(state, null, 2);
  openSheet(`
    ${sheetHead('Export data', 'Copy this JSON to back up your Budge data')}
    <div class="sheet-body">
      <textarea id="exportTa" readonly style="width:100%;height:260px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line);color:var(--text);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;line-height:1.5;padding:12px;outline:none;resize:none">${esc(data)}</textarea>
      <button class="btn btn-lime" id="copyExport" style="margin-top:12px">${icon('download', 16)} Copy to clipboard</button>
      <button class="btn btn-ghost" id="dlExport" style="margin-top:9px">${icon('download', 16)} Download .json file</button>
    </div>
  `);
  const ta = $('#exportTa');
  $('#copyExport').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(ta.value);
      toast('Copied to clipboard');
    } catch (e) {
      ta.focus(); ta.select();
      toast('Select and copy manually', { icon: 'receipt' });
    }
  });
  $('#dlExport').addEventListener('click', () => {
    try {
      const blob = new Blob([ta.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'budge-backup.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Backup file downloaded');
    } catch (e) {
      toast('Download blocked here — copy instead', { icon: 'shield' });
    }
  });
}

function notificationsSheet() {
  const T = totals();
  const cats = state.categories.filter(c => c.kind !== 'in')
    .map(c => ({ c, spent: spentByCat(c.id) }))
    .filter(x => x.c.budget > 0)
    .sort((a, b) => (b.spent / b.c.budget) - (a.spent / a.c.budget));
  const worst = cats[0];
  const items = [];
  if (worst){
    const p = Math.round((worst.spent / worst.c.budget) * 100);
    items.push({ ic: 'target', t: worst.spent > worst.c.budget ? `${worst.c.name} is over budget` : `${worst.c.name} at ${p}%`, d: worst.spent > worst.c.budget ? `You've spent ${fmtMoney(worst.spent - worst.c.budget)} more than planned this month.` : `${fmtMoney(Math.max(0, worst.c.budget - worst.spent))} left in this category.`, time: 'Today · 9:12 AM' });
  }
  items.push({ ic: 'sparkles', t: 'Weekly recap is ready', d: `You spent ${fmtMoney(T.expense)} this month across ${T.monthTx.filter(t => t.type === 'out').length} transactions.`, time: 'Yesterday · 6:00 PM' });
  items.push({ ic: 'trending-down', t: 'Dining is trending up', d: 'Eating out is your fastest growing category — 23% above last month.', time: 'Mon · 8:30 AM' });
  if (state.goals[0]) items.push({ ic: 'target', t: `You're close on ${state.goals[0].name}`, d: `${fmtMoney(state.goals[0].target - state.goals[0].saved)} to go. Add a little this week?`, time: 'Sun · 10:00 AM' });

  openSheet(`
    ${sheetHead('Notifications', 'Smart nudges from Budge')}
    <div class="sheet-body">
      ${items.map(n => `<div class="notif">
        <span class="nic">${icon(n.ic, 17)}</span>
        <div><strong>${esc(n.t)}</strong><p>${esc(n.d)}</p><time>${esc(n.time)}</time></div>
      </div>`).join('')}
      <button class="btn btn-ghost" style="margin-top:14px" data-close>Done</button>
    </div>
  `);
}

function accountSheet(id) {
  const a = state.accounts.find(x => x.id === id);
  if (!a) return;
  const tx = state.txns.filter(t => t.accountId === id).sort((x, y) => parseDate(y.date) - parseDate(x.date));
  const inSum = sum(tx.filter(t => t.type === 'in' && monthKeyOf(t.date) === thisMonthKey()).map(t => t.amount));
  const outSum = sum(tx.filter(t => t.type === 'out' && monthKeyOf(t.date) === thisMonthKey()).map(t => t.amount));

  openSheet(`
    ${sheetHead(esc(a.name), esc(a.type) + ' · •••• ' + esc(a.last4))}
    <div class="sheet-body">
      <div style="text-align:center;padding:4px 0 18px">
        <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.08em">Available balance</div>
        <div style="font-size:32px;font-weight:800;letter-spacing:-.045em;margin-top:5px">${fmtMoney(a.balance)}</div>
      </div>
      <div class="wallet-sum" style="grid-template-columns:1fr 1fr">
        <div class="wsum"><span>Money in</span><strong class="g">${fmtMoney(inSum)}</strong></div>
        <div class="wsum"><span>Money out</span><strong class="r">${fmtMoney(outSum)}</strong></div>
      </div>
      <div class="field"><label>Adjust balance</label><input type="number" id="acctBal" value="${Math.round(a.balance)}" inputmode="numeric"></div>
      <button class="btn btn-lime" id="saveAcct">${icon('check', 17)} Save balance</button>
      <div class="sec-head" style="margin:18px 0 10px"><h2 style="font-size:13px">Account activity</h2><span class="count">${tx.length}</span></div>
      <div class="tx-card" style="background:var(--surface-2)">${tx.slice(0, 12).map(t => txRow(t, 0)).join('') || '<div class="empty"><p>No activity yet.</p></div>'}</div>
    </div>
  `);
  $('#saveAcct').addEventListener('click', () => {
    a.balance = Math.max(0, Number($('#acctBal').value) || 0);
    saveState(); rerender(); closeSheet(); toast('Balance updated');
  });
}

function addAccountSheet() {
  openSheet(`
    ${sheetHead('Add account', 'Track another pot of money')}
    <div class="sheet-body">
      <div class="field"><label>Account name</label><input id="acName" placeholder="e.g. Meezan Bank" maxlength="26"></div>
      <div class="two-col">
        <div class="field"><label>Type</label>
          <select id="acType">${['Current account','Savings','Cash','Credit card'].map(t => `<option>${t}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Last 4 digits</label><input id="acLast" placeholder="1234" maxlength="4"></div>
      </div>
      <div class="field"><label>Current balance</label><input id="acBal" type="number" placeholder="0" inputmode="numeric"></div>
      <button class="btn btn-lime" id="acCreate">${icon('plus', 17)} Add account</button>
    </div>
  `);
  $('#acCreate').addEventListener('click', () => {
    const name = $('#acName').value.trim();
    if (!name) { toast('Name your account', { icon: 'wallet' }); return; }
    state.accounts.push({
      id: uid(), name, type: $('#acType').value,
      last4: ($('#acLast').value || '0000').slice(-4),
      balance: Math.max(0, Number($('#acBal').value) || 0)
    });
    saveState(); rerender(); closeSheet(); toast(name + ' added');
  });
}

/* ---------- auto balance budgets ---------- */
function autoBalance() {
  const outCats = state.categories.filter(c => c.kind !== 'in');
  const totalBudget = sum(outCats.map(c => c.budget));
  const weights = outCats.map(c => Math.max(1, spentByCat(c.id)));
  const totalWeight = sum(weights) || 1;
  outCats.forEach((c, i) => {
    c.budget = Math.round((weights[i] / totalWeight) * totalBudget / 500) * 500;
  });
  saveState();
  rerender();
  nav('budget');
  toast('Budgets rebalanced around your spending', { icon: 'sparkles' });
}

/* ============================================================
   EVENT WIRING
   ============================================================ */
function bindGlobal() {
  /* tabs */
  $$('.tab').forEach(t => t.addEventListener('click', () => nav(t.getAttribute('data-tab'))));
  $('#fab').addEventListener('click', () => addTxSheet());

  /* overlay + close buttons (delegated) */
  $('#overlay').addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sheetOpen) closeSheet();
  });

  /* delegated clicks inside screens */
  $('#screens').addEventListener('click', e => {
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) { closeSheet(); return; }

    const txEl = e.target.closest('[data-tx]');
    if (txEl) { txDetailSheet(txEl.getAttribute('data-tx')); return; }

    const recEl = e.target.closest('[data-rec]');
    if (recEl) { recurringSheet(recEl.getAttribute('data-rec')); return; }

    const detOk = e.target.closest('[data-detect-ok]');
    if (detOk) {
      approveDetected(state.detected.find(x => x.id === detOk.getAttribute('data-detect-ok')));
      saveState(); rerender();
      return;
    }
    const detNo = e.target.closest('[data-detect-no]');
    if (detNo) { ignoreDetected(detNo.getAttribute('data-detect-no')); return; }

    const cardMap = e.target.closest('[data-card-map]');
    if (cardMap) { cardMapSheet(cardMap.getAttribute('data-card-map')); return; }

    const personEl = e.target.closest('[data-person]');
    if (personEl) { personSheet(personEl.getAttribute('data-person')); return; }
    const lendEl = e.target.closest('[data-lend]');
    if (lendEl) { lendBorrowSheet(lendEl.getAttribute('data-lend'), 'lend'); return; }
    const borrowEl = e.target.closest('[data-borrow]');
    if (borrowEl) { lendBorrowSheet(borrowEl.getAttribute('data-borrow'), 'borrow'); return; }
    const settleEl = e.target.closest('[data-settle]');
    if (settleEl) { settleSheet(settleEl.getAttribute('data-settle')); return; }
    const remindEl = e.target.closest('[data-remind-person]');
    if (remindEl) { remindSheet(remindEl.getAttribute('data-remind-person')); return; }
    const groupEl = e.target.closest('[data-group]');
    if (groupEl) { groupSheet(groupEl.getAttribute('data-group')); return; }
    const shareEl = e.target.closest('[data-share]');
    if (shareEl) { shareDetailSheet(shareEl.getAttribute('data-share')); return; }
    const rpEl = e.target.closest('[data-remove-person]');
    if (rpEl) {
      const pid = rpEl.getAttribute('data-remove-person');
      const removed = state.people.find(x => x.id === pid);
      state.people = state.people.filter(x => x.id !== pid);
      state.shares = state.shares.filter(x => x.personId !== pid);
      saveState(); rerender(); closeSheet();
      toast('Person removed', { icon: 'trash', action: { label: 'Undo', fn: () => {
        state.people.push(removed); saveState(); rerender(); toast('Restored');
      } } });
      return;
    }
    const rsEl = e.target.closest('[data-remove-share]');
    if (rsEl) {
      const sid = rsEl.getAttribute('data-remove-share');
      const idx = state.shares.findIndex(x => x.id === sid);
      const removed = state.shares[idx];
      state.shares.splice(idx, 1);
      saveState(); rerender(); closeSheet();
      toast('Record deleted', { icon: 'trash', action: { label: 'Undo', fn: () => { state.shares.splice(idx, 0, removed); saveState(); rerender(); toast('Restored'); } } });
      return;
    }
    const dgEl = e.target.closest('[data-delete-group]');
    if (dgEl) {
      const gid = dgEl.getAttribute('data-delete-group');
      const idx = state.groups.findIndex(x => x.id === gid);
      const removed = state.groups[idx];
      state.groups.splice(idx, 1);
      state.shares.forEach(x => { if (x.groupId === gid) x.groupId = ''; });
      saveState(); rerender(); closeSheet();
      toast('Group deleted', { icon: 'trash', action: { label: 'Undo', fn: () => { state.groups.splice(idx, 0, removed); saveState(); rerender(); toast('Restored'); } } });
      return;
    }
    const spOk = e.target.closest('[data-split-ok]');
    if (spOk) { approveSplit(state.splitInbox.find(x => x.id === spOk.getAttribute('data-split-ok'))); return; }
    const spNo = e.target.closest('[data-split-no]');
    if (spNo) {
      const en = state.splitInbox.find(x => x.id === spNo.getAttribute('data-split-no'));
      if (en) { en.state = 'ignored'; saveState(); rerender(); }
      return;
    }

    const goalEl = e.target.closest('[data-goal]');
    if (goalEl) {
      const gid = goalEl.getAttribute('data-goal');
      if (gid === 'new') newGoalSheet(); else goalSheet(gid);
      return;
    }

    const budEl = e.target.closest('[data-budget]');
    if (budEl) { budgetSheet(budEl.getAttribute('data-budget')); return; }

    const rangeEl = e.target.closest('[data-range]');
    if (rangeEl) {
      state.insightRange = Number(rangeEl.getAttribute('data-range'));
      saveState();
      renderInsights();
      return;
    }

    const actEl = e.target.closest('[data-action]');
    if (actEl) {
      const act = actEl.getAttribute('data-action');
      if (act === 'theme') { applyTheme(state.theme === 'dark' ? 'light' : 'dark'); renderAll(); }
      else if (act === 'notifications') notificationsSheet();
      else if (act === 'settings') settingsSheet();
      else if (act === 'all-txns') allTxSheet();
      else if (act === 'pick-month') monthSheet();
      else if (act === 'adjust-budgets') autoBalance();
      else if (act === 'export') exportSheet();
      else if (act === 'add-account') addAccountSheet();
      else if (act === 'acct') accountSheet(actEl.getAttribute('data-acct'));
      else if (act === 'insights') insightsSheet();
      else if (act === 'go-people') nav('people');
      else if (act === 'go-insights') nav('insights');
      else if (act === 'new-split') newSplitSheet();
      else if (act === 'add-person') addPersonSheet();
      else if (act === 'new-group') newGroupSheet();
      else if (act === 'all-shares') allSharesSheet();
      else if (act === 'review-split-inbox') reviewSplitInbox();
      else if (act === 'ignore-all-splits') {
        state.splitInbox.forEach(x => { if (x.state === 'pending') x.state = 'ignored'; });
        saveState(); rerender(); closeSheet(); toast('All transfers ignored', { icon: 'shield' });
      }
      else if (act === 'sync-transfers') syncTransfers();
      else if (act === 'import-message') importMessageSheet('');
      else if (act === 'sync-sms-demo') syncSmsDemo();
      else if (act === 'open-rules') rulesSheet();
      else if (act === 'connect-sms') connectSmsSheet();
      else if (act === 'poll-sms') pollSmsOnce({ announce: true });
      else if (act === 'poll-native') { pollNativeSms(); toast('Checking for new messages', { icon: 'refresh' }); }
      else if (act === 'allow-sms') requestNativeSms();
      else if (act === 'split-group') { closeSheet(); setTimeout(() => { newSplitSheet(); splitDraft.groupId = actEl.getAttribute('data-group-id'); const gm = state.groups.find(g => g.id === splitDraft.groupId); if (gm) splitDraft.memberIds = gm.memberIds.slice(); paintSplitSheet(); }, 240); }
      else if (act === 'settle-group') settleGroup(actEl.getAttribute('data-group-id'));
      else if (act === 'go-monthly') nav('monthly');
      else if (act === 'go-auto') nav('auto');
      else if (act === 'post-due') postDueRecurring();
      else if (act === 'demo-sync') startDemoSync();
      else if (act === 'sync-now') syncNow();
      else if (act === 'auto-help') autoHelpSheet();
      else if (act === 'review-detected') reviewSheet();
      else if (act === 'approve-all') approveAllDetected();
      else if (act === 'toggle-autopost') autoToggleAutoPost();
      else if (act === 'add-card') addCardSheet();
      else if (act === 'go-budget') nav('budget');
      else if (act === 'go-insights') nav('insights');
      else if (act === 'go-wallet') nav('wallet');
      return;
    }
  });

  /* delegated clicks inside sheets */
  $('#sheet').addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closeSheet(); return; }
    const txEl = e.target.closest('[data-tx]');
    if (txEl) { closeSheet(); setTimeout(() => txDetailSheet(txEl.getAttribute('data-tx')), 260); return; }
  });

  /* toast actions */
  $('#toasts').addEventListener('click', e => {
    const b = e.target.closest('[data-toast]');
    if (!b) return;
    const id = b.getAttribute('data-toast');
    if (pendingToastActions[id]) pendingToastActions[id]();
  });

  /* keyboard shortcuts for desktop demo */
  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select')) return;
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); addTxSheet(); }
    if (e.key >= '1' && e.key <= '6') {
      const order = ['home', 'budget', 'monthly', 'people', 'wallet', 'auto'];
      const target = order[Number(e.key) - 1];
      if (target) nav(target);
    }
  });
}

document.addEventListener('DOMContentLoaded', boot);

/* ============================================================
   RECURRING — create / edit / pay
   ============================================================ */
let recDraft = null;

function recurringSheet(id) {
  const isNew = !id || id === 'new';
  const r = isNew ? null : allRecurring().find(x => x.id === id);
  if (!isNew && !r) return;

  recDraft = isNew ? {
    name: '', amount: '', dueDay: 1, cycle: 'monthly', categoryId: 'fun',
    accountId: (state.accounts[0] || {}).id, kind: 'sub', icon: 'repeat', color: '#7EE7B9',
    status: 'active', autoPost: true, source: 'manual'
  } : { ...r };

  const isBill = (recDraft.kind === 'bill');
  openSheet(`
    ${sheetHead(isNew ? 'New recurring expense' : 'Edit recurring expense', isNew ? 'Subscriptions, bills or monthly buys' : esc(recDraft.name))}
    <div class="sheet-body">
      ${isNew ? `<div class="seg type" style="grid-template-columns:1fr 1fr 1fr">
        <button data-rkind="sub" class="${recDraft.kind === 'sub' ? 'on' : ''}">Subscription</button>
        <button data-rkind="bill" class="${recDraft.kind === 'bill' ? 'on' : ''}">Bill</button>
        <button data-rkind="item" class="${recDraft.kind === 'item' ? 'on' : ''}">Item</button>
      </div>` : ''}

      <div class="field"><label>Name</label><input id="rName" placeholder="e.g. Netflix, K-Electric, Fuel" value="${esc(recDraft.name)}" maxlength="34"></div>

      <div class="two-col">
        <div class="field"><label>Amount</label><input id="rAmount" type="number" inputmode="numeric" placeholder="0" value="${recDraft.amount || ''}"></div>
        <div class="field"><label>Billing cycle</label>
          <select id="rCycle">
            ${[['monthly','Every month'],['quarterly','Every 3 months'],['yearly','Once a year'],['weekly','Every week']].map(([v, l]) => `<option value="${v}" ${recDraft.cycle === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="two-col">
        <div class="field"><label>Due day of month</label><input id="rDay" type="number" min="1" max="31" inputmode="numeric" value="${recDraft.dueDay}"></div>
        <div class="field"><label>Paid from</label>
          <select id="rAcct">${state.accounts.map(a => `<option value="${a.id}" ${a.id === recDraft.accountId ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
        </div>
      </div>

      <div class="field"><label>Category</label>
        <select id="rCat">${state.categories.filter(c => c.kind !== 'in').map(c => `<option value="${c.id}" ${c.id === recDraft.categoryId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      </div>

      <div class="field">
        <label>Icon</label>
        <div class="cats" style="margin:0;padding:2px 0 4px">
          ${[['repeat','Repeat'],['film','Streaming'],['coffee','Coffee'],['zap','Utility'],['receipt','Bills'],['cart','Groceries'],['fuel','Fuel'],['heart','Health'],['book','School'],['car','Transport'],['home','Home'],['mail','Cloud']].map(([ic, lb]) => `
            <button class="cat ${recDraft.icon === ic ? 'on' : ''}" data-ricon="${ic}" style="--c:${recDraft.color};width:58px">
              <span class="cic">${icon(ic, 17)}</span><span>${lb}</span>
            </button>`).join('')}
        </div>
      </div>

      <div class="settings" style="margin-top:6px">
        <div class="set-row">
          <span class="sic">${icon('pauseCircle', 16)}</span>
          <span class="stx"><strong>Pause this expense</strong><span>Keeps history, stops counting</span></span>
          <button class="switch ${recDraft.status === 'paused' ? 'on' : ''}" id="rPaused"></button>
        </div>
      </div>

      <button class="btn btn-lime" id="rSave" style="margin-top:13px">${icon('check', 17)} ${isNew ? 'Add recurring expense' : 'Save changes'}</button>
      ${isNew ? '' : `<button class="btn btn-ghost" id="rPay" style="margin-top:9px">${icon('zap', 16)} Log this month's payment</button>
      <button class="btn btn-danger" id="rDelete" style="margin-top:9px">${icon('trash', 16)} Delete</button>`}
    </div>
  `);

  $$('[data-rkind]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    recDraft.kind = b.getAttribute('data-rkind');
    $$('[data-rkind]', $('#sheet')).forEach(x => x.classList.toggle('on', x === b));
    if (recDraft.kind === 'item') { recDraft.categoryId = 'groceries'; }
  }));
  $$('[data-ricon]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    recDraft.icon = b.getAttribute('data-ricon');
    $$('[data-ricon]', $('#sheet')).forEach(x => x.classList.toggle('on', x === b));
  }));
  $('#rPaused').addEventListener('click', e => {
    recDraft.status = recDraft.status === 'paused' ? 'active' : 'paused';
    e.currentTarget.classList.toggle('on', recDraft.status === 'paused');
  });

  $('#rSave').addEventListener('click', () => {
    const name = $('#rName').value.trim();
    const amount = Number($('#rAmount').value);
    if (!name) { toast('Give it a name', { icon: 'repeat' }); $('#rName').focus(); return; }
    if (!(amount > 0)) { toast('Add an amount', { icon: 'repeat' }); $('#rAmount').focus(); return; }
    const payload = {
      name, amount,
      cycle: $('#rCycle').value,
      dueDay: clamp(Number($('#rDay').value) || 1, 1, 31),
      categoryId: $('#rCat').value,
      accountId: $('#rAcct').value,
      icon: recDraft.icon,
      color: catById($('#rCat').value).color,
      status: recDraft.status,
      kind: recDraft.kind
    };
    if (isNew) {
      const list = recDraft.kind === 'item' ? state.items : state.recurrences;
      list.push({ id: uid(), ...payload, lastPaid: null, autoPost: true, source: 'manual' });
      toast(`${name} added to monthly`);
    } else {
      /* kind changes move it between lists */
      const srcList = state.recurrences.some(x => x.id === r.id) ? state.recurrences : state.items;
      const dstList = recDraft.kind === 'item' ? state.items : state.recurrences;
      const idx = srcList.findIndex(x => x.id === r.id);
      if (idx > -1) srcList.splice(idx, 1);
      dstList.push({ ...r, ...payload });
      toast('Recurring expense updated');
    }
    saveState(); rerender(); closeSheet();
  });

  const payBtn = $('#rPay');
  if (payBtn) payBtn.addEventListener('click', () => { payRecurring(r.id); closeSheet(); });
  const delBtn = $('#rDelete');
  if (delBtn) delBtn.addEventListener('click', () => {
    const srcList = state.recurrences.some(x => x.id === r.id) ? state.recurrences : state.items;
    const idx = srcList.findIndex(x => x.id === r.id);
    const removed = srcList[idx];
    srcList.splice(idx, 1);
    saveState(); rerender(); closeSheet();
    toast('Removed', { icon: 'trash', action: { label: 'Undo', fn: () => { srcList.splice(idx, 0, removed); saveState(); rerender(); toast('Restored'); } } });
  });
}

function payRecurring(id) {
  const r = allRecurring().find(x => x.id === id);
  if (!r) return;
  const today = new Date();
  const t = {
    id: uid(),
    title: r.name,
    amount: r.amount,
    categoryId: r.categoryId,
    accountId: r.accountId,
    date: isoLocal(today),
    type: 'out',
    note: `${r.cycle} recurring${r.source === 'sms' ? ' · from SMS' : ''}`,
    recurringId: r.id
  };
  state.txns.push(t);
  const acct = acctById(r.accountId);
  if (acct && acct.id) acct.balance -= r.amount;
  r.lastPaid = isoLocal(today);
  saveState(); rerender();
  toast(`${r.name} payment logged`);
}

function postDueRecurring() {
  const due = activeRecurring().filter(r => daysUntil(nextDueDate(r)) === 0 && (!r.lastPaid || r.lastPaid.slice(0, 7) !== isoLocal(new Date()).slice(0, 7)));
  if (!due.length) { toast('Nothing is due today', { icon: 'clock' }); return; }
  due.forEach(r => {
    state.txns.push({
      id: uid(), title: r.name, amount: r.amount, categoryId: r.categoryId, accountId: r.accountId,
      date: isoLocal(new Date()), type: 'out', note: 'Recurring · auto-logged', recurringId: r.id
    });
    const a = acctById(r.accountId);
    if (a && a.id) a.balance -= r.amount;
    r.lastPaid = isoLocal(new Date());
  });
  saveState(); rerender(); nav('monthly');
  toast(`${due.length} payment${due.length > 1 ? 's' : ''} logged`);
}

/* ============================================================
   AUTOPILOT — connect, sync, review
   ============================================================ */
function pollConnection(endpoint) {
  let tries = 0;
  const iv = setInterval(async () => {
    tries++;
    if (tries > 40) { clearInterval(iv); return; }
    try {
      const res = await fetch(endpoint + '/status', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.connected) {
        clearInterval(iv);
        state.autopilot.connected = true;
        state.autopilot.provider = 'live';
        state.autopilot.email = data.email || '';
        state.autopilot.lastSync = data.lastSync || isoLocal(new Date());
        state.autopilot.endpoint = endpoint;
        saveState();
        rerender();
        closeSheet();
        toast('SMS reader ready — importing now', { icon: 'message' });
        syncNow();
      }
    } catch (e) { /* server not up yet */ }
  }, 2500);
}

function startDemoSync() {
  state.autopilot.connected = true;
  state.autopilot.provider = 'demo';
  state.autopilot.email = state.profile.email || 'demo@budge.app';
  state.autopilot.lastSync = isoLocal(new Date());
  saveState();
  syncNow(true);
}

async function syncNow(demo) {
  const isDemo = demo || state.autopilot.provider !== 'live';
  const endpoint = (state.autopilot.endpoint || '').replace(/\/$/, '');

  /* show progress */
  const host = $('#screen-auto');
  if (host) {
    const btn = host.querySelector('[data-action="sync-now"]');
    if (btn) { btn.disabled = true; btn.innerHTML = `${icon('refresh', 16)} Scanning inbox…`; }
  }
  haptic();

  let messages = null;
  if (!isDemo && endpoint) {
    try {
      const res = await fetch(`${endpoint}/emails?days=${state.autopilot.lookbackDays || 45}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        messages = data.messages || [];
      }
    } catch (e) { messages = null; }
  }
  if (messages === null) {
    /* fall back to the simulated inbox so the flow is always demonstrable */
    await new Promise(r => setTimeout(r, 900));
    messages = demoInbox();
  }

  const seen = new Set((state.detected || []).map(d => d.messageId));
  const existingTx = new Set(state.txns.map(t => `${t.title}|${t.amount}|${String(t.date).slice(0, 10)}`));
  const fresh = [];

  messages.forEach(msg => {
    if (seen.has(msg.id)) return;
    const parsed = parseEmailMessage(msg, { accountId: state.accounts[0].id });
    if (!parsed.amount) return;                                   /* no amount, no transaction */
    if (parsed.confidence < 0.5) return;                          /* likely OTP / marketing */
    const dupKey = `${parsed.merchant}|${parsed.amount}|${String(parsed.date).slice(0, 10)}`;
    if (existingTx.has(dupKey)) return;                           /* already in the ledger */
    parsed.messageId = msg.id;
    fresh.push(parsed);
  });

  state.detected = (state.detected || []).concat(fresh);
  state.autopilot.lastSync = isoLocal(new Date());
  state.autopilot.provider = isDemo ? 'demo' : state.autopilot.provider;
  state.autopilot.connected = true;

  /* auto-post the confident ones if enabled */
  let autoPosted = 0;
  if (state.autopilot.autoPost) {
    state.detected.filter(d => d.state === 'pending' && d.confidence >= 0.8).forEach(d => {
      approveDetected(d, true);
      autoPosted++;
    });
  }

  saveState();
  rerender();

  /* also look for person-to-person transfers in the same inbox */
  try { syncTransfersQuiet(messages); } catch (e) { /* ignore */ }

  if (!fresh.length) toast('Inbox is clean — nothing new', { icon: 'check' });
  else if (autoPosted) toast(`${fresh.length} found · ${autoPosted} auto-posted`, { icon: 'zap' });
  else toast(`${fresh.length} transaction${fresh.length > 1 ? 's' : ''} found in SMS`, { icon: 'mail' });
}

function approveDetected(d, silent) {
  if (!d || d.state !== 'pending') return;
  state.txns.push({
    id: uid(),
    title: d.merchant,
    amount: d.amount,
    categoryId: d.categoryId,
    accountId: d.accountId,
    date: d.date,
    type: d.type,
    note: `SMS · ${d.from || d.subject || ''}`.slice(0, 80),
    source: 'sms'
  });
  const acct = acctById(d.accountId);
  if (acct && acct.id) acct.balance += (d.type === 'in' ? d.amount : -d.amount);
  d.state = 'approved';

  /* learn recurring subscriptions */
  if (d.recurring && d.type === 'out') {
    const exists = allRecurring().some(r => r.name.toLowerCase().includes(d.merchant.toLowerCase()) || d.merchant.toLowerCase().includes(r.name.toLowerCase().split(' ')[0]));
    if (!exists) {
      state.recurrences.push({
        id: uid(), name: d.merchant, amount: d.amount, dueDay: parseDate(d.date).getDate(),
        cycle: 'monthly', categoryId: d.categoryId, accountId: d.accountId,
        icon: d.icon || 'repeat', color: d.color || '#7EE7B9', status: 'active',
        kind: 'sub', lastPaid: d.date, autoPost: true, source: 'sms'
      });
    }
  }
  if (!silent) toast(`${d.merchant} logged`, { icon: 'check' });
}

function ignoreDetected(id) {
  const d = state.detected.find(x => x.id === id);
  if (!d) return;
  d.state = 'ignored';
  saveState(); rerender();
  toast('Ignored', { icon: 'shield' });
}

function reviewSheet() {
  const pending = state.detected.filter(d => d.state === 'pending');
  openSheet(`
    ${sheetHead('Review sync', pending.length + ' transaction' + (pending.length === 1 ? '' : 's') + ' from SMS')}
    <div class="sheet-body">
      ${pending.length ? pending.map(detectedCard).join('') : `<div class="empty"><div class="eic">${icon('check', 22)}</div><strong>All clear</strong><p>Nothing waiting for review.</p></div>`}
      ${pending.length ? `<button class="btn btn-lime" data-action="approve-all" style="margin-top:6px">${icon('check', 16)} Approve all ${pending.length}</button>` : ''}
    </div>
  `);
  bindDetectedButtons($('#sheet'));
}

function bindDetectedButtons(root) {
  $$('[data-detect-ok]', root).forEach(b => b.addEventListener('click', () => {
    const d = state.detected.find(x => x.id === b.getAttribute('data-detect-ok'));
    approveDetected(d);
    saveState(); rerender();
    closeSheet();
    setTimeout(() => { if (state.detected.some(x => x.state === 'pending')) reviewSheet(); }, 260);
  }));
  $$('[data-detect-no]', root).forEach(b => b.addEventListener('click', () => {
    ignoreDetected(b.getAttribute('data-detect-no'));
    closeSheet();
    setTimeout(() => { if (state.detected.some(x => x.state === 'pending')) reviewSheet(); }, 260);
  }));
  const all = $('[data-action="approve-all"]', root);
  if (all) all.addEventListener('click', approveAllDetected);
}

function approveAllDetected() {
  const pending = state.detected.filter(d => d.state === 'pending');
  if (!pending.length) { toast('Nothing to approve', { icon: 'check' }); return; }
  pending.forEach(d => approveDetected(d, true));
  saveState(); rerender(); closeSheet();
  toast(`${pending.length} transaction${pending.length > 1 ? 's' : ''} added`);
}

function cardMapSheet(cardId) {
  const card = (state.autopilot.cards || []).find(c => c.id === cardId);
  if (!card) return;
  openSheet(`
    ${sheetHead('Map card to account', '•••• ' + esc(card.mask) + ' · ' + esc(card.label))}
    <div class="sheet-body">
      <div class="settings">
        ${state.accounts.map(a => `<button class="set-row" data-map-to="${a.id}">
          <span class="sic">${icon('bank', 16)}</span>
          <span class="stx"><strong>${esc(a.name)}</strong><span>${esc(a.type)} · ${fmtMoney(a.balance)}</span></span>
          ${a.id === card.accountId ? `<span class="pill up">${icon('check', 12)}</span>` : `<span class="chev">${icon('chevron-right', 15)}</span>`}
        </button>`).join('')}
      </div>
    </div>
  `);
  $$('[data-map-to]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    card.accountId = b.getAttribute('data-map-to');
    saveState(); rerender(); closeSheet();
    toast('Card mapped to ' + acctById(card.accountId).name);
  }));
}

function addCardSheet() {
  openSheet(`
    ${sheetHead('Add a card', 'So emails can be matched to the right account')}
    <div class="sheet-body">
      <div class="field"><label>Card label</label><input id="ncLabel" placeholder="e.g. HBL Visa" maxlength="26"></div>
      <div class="two-col">
        <div class="field"><label>Last 4 digits</label><input id="ncMask" placeholder="1234" maxlength="4" inputmode="numeric"></div>
        <div class="field"><label>Posts to</label>
          <select id="ncAcct">${state.accounts.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select>
        </div>
      </div>
      <button class="btn btn-lime" id="ncSave">${icon('plus', 17)} Add card</button>
    </div>
  `);
  $('#ncSave').addEventListener('click', () => {
    const label = $('#ncLabel').value.trim();
    const mask = ($('#ncMask').value || '').replace(/\D/g, '').slice(-4);
    if (!label || mask.length !== 4) { toast('Need a label and 4 digits', { icon: 'card' }); return; }
    state.autopilot.cards.push({ id: uid(), label, mask, accountId: $('#ncAcct').value });
    saveState(); rerender(); closeSheet();
    toast(label + ' mapped');
  });
}

function autoHelpSheet() {
  openSheet(`
    ${sheetHead('How Autopilot works', 'Automatic expense capture, explained')}
    <div class="sheet-body">
      <div class="steps">
        <div class="step"><span class="num"></span><div class="stx2"><strong>SMS, on-device</strong><p>Budge reads bank SMS on your phone. Messages stay on the device — nothing is uploaded.</p></div></div>
        <div class="step"><span class="num"></span><div class="stx2"><strong>Every bank SMS</strong><p>JazzCash, HBL, Askari, Easypaisa, NayaPay and SadaPay alerts are scanned for an amount, a merchant and an account.</p></div></div>
        <div class="step"><span class="num"></span><div class="stx2"><strong>Noise is dropped</strong><p>OTP codes, statements, promos and login alerts never produce a transaction.</p></div></div>
        <div class="step"><span class="num"></span><div class="stx2"><strong>You stay in control</strong><p>Approve each one, or switch on auto-post for high-confidence matches only.</p></div></div>
        <div class="step"><span class="num"></span><div class="stx2"><strong>Subscriptions get tracked</strong><p>Anything that looks recurring is offered for the Monthly tab automatically.</p></div></div>
      </div>
      <div class="codeblock" style="margin-top:14px">
<b>Status</b>
${state.autopilot.connected ? (state.autopilot.provider === 'live' ? 'Live · connected to ' + esc(state.autopilot.email || 'Google') : 'Demo · simulated inbox') : 'Not connected'}
<b>Auto-post</b> ${state.autopilot.autoPost ? 'on (≥80% confidence)' : 'off — manual review'}
<b>Cards mapped</b> ${(state.autopilot.cards || []).length}
      </div>
      <button class="btn btn-ghost" style="margin-top:12px" data-close>Got it</button>
    </div>
  `);
}

function autoToggleAutoPost() {
  state.autopilot.autoPost = !state.autopilot.autoPost;
  saveState(); rerender();
  toast(state.autopilot.autoPost ? 'Auto-post is on — 80%+ matches skip review' : 'Auto-post off — everything waits for review', { icon: 'zap' });
}

/* lookback select + misc live controls */
document.addEventListener('change', e => {
  if (e.target.matches('[data-action="lookback"]')) {
    state.autopilot.lookbackDays = Number(e.target.value);
    saveState();
    toast('Scanning last ' + state.autopilot.lookbackDays + ' days', { icon: 'clock' });
  }
});

/* ============================================================
   PEOPLE — split a bill, lend, borrow, settle
   ============================================================ */
let splitDraft = null;
let splitForTx = null;

function newSplitSheet() {
  splitDraft = {
    total: '', payer: 'me', note: '', groupId: '', memberIds: ['p1','p2'],
    date: isoLocal(new Date()), postToBudget: true, categoryId: 'dining', accountId: (state.accounts[0] || {}).id
  };
  paintSplitSheet();
}

function splitSharesPreview() {
  const names = splitDraft.memberIds;
  const total = Number(splitDraft.total) || 0;
  const each = names.length ? total / (names.length + 1) : 0;
  const mine = total - each * names.length;
  return { each, mine, names, total };
}

function paintSplitSheet() {
  const { each, mine, total } = splitSharesPreview();
  const participants = state.people;

  openSheet(`
    ${sheetHead('Split a bill', 'One person pays, everyone owes their share')}
    <div class="sheet-body">
      <div class="field">
        <label>Bill total</label>
        <input id="spTotal" type="number" inputmode="decimal" placeholder="0" value="${splitDraft.total}">
      </div>
      <div class="field"><label>What was it for?</label>
        <input id="spNote" placeholder="e.g. Friday dinner at Kolachi" value="${esc(splitDraft.note)}" maxlength="46">
      </div>

      <div class="field" style="margin-bottom:10px">
        <label>Who paid?</label>
        <div class="seg type" style="grid-template-columns:1fr 1fr;margin:0">
          <button data-sp-payer="me" class="${splitDraft.payer === 'me' ? 'on' : ''}">I paid</button>
          <button data-sp-payer="them" class="${splitDraft.payer === 'them' ? 'on' : ''}">Someone else paid</button>
        </div>
      </div>

      ${splitDraft.payer === 'them' ? `<div class="field">
        <label>Payer</label>
        <select id="spPayer">${state.people.map(p => `<option value="${p.id}" ${splitDraft.payerId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
      </div>` : ''}

      <div class="field">
        <label>Split between</label>
        <div class="people-pick">
          ${participants.map(p => `<button class="pick ${splitDraft.memberIds.includes(p.id) ? 'on' : ''}" data-sp-pick="${p.id}">
            <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>${esc(p.name.split(' ')[0])}
          </button>`).join('')}
        </div>
        <div class="share-list">
          <div class="share-row">
            <span class="pi-avatar" style="background:linear-gradient(150deg,#E9FF9C,#C9F53F);color:#0C1004">You</span>
            <span class="nm">You ${splitDraft.payer === 'me' ? '(paid)' : ''}</span>
            <span class="amt-ro">${fmtMoney(mine)}</span>
          </div>
          ${splitDraft.memberIds.map(id => {
            const p = personById(id);
            return `<div class="share-row">
              <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>
              <span class="nm">${esc(p.name)}</span>
              <span class="amt-ro">${fmtMoney(each)}</span>
            </div>`;
          }).join('')}
          <div class="share-note">${splitDraft.memberIds.length + 1} ways · ${fmtMoney(total)} total${splitDraft.payer === 'them' ? ' · they paid' : ' · you paid'}</div>
        </div>
      </div>

      <div class="field">
        <label>Group (optional)</label>
        <select id="spGroup">
          <option value="">No group</option>
          ${state.groups.map(g => `<option value="${g.id}" ${splitDraft.groupId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}
        </select>
      </div>

      ${splitDraft.payer === 'me' ? `
      <div class="settings" style="margin-bottom:12px">
        <div class="set-row">
          <span class="sic">${icon('budget', 16)}</span>
          <span class="stx"><strong>Add to my expenses</strong><span id="spBudgetHint">Log ${fmtMoney(total)} as spending</span></span>
          <button class="switch ${splitDraft.postToBudget ? 'on' : ''}" id="spBudget"></button>
        </div>
        ${splitDraft.postToBudget ? `<div class="set-row">
          <span class="sic">${icon('wallet', 16)}</span>
          <span class="stx"><strong>Paid from</strong></span>
          <select id="spAcct">${state.accounts.map(a => `<option value="${a.id}" ${a.id === splitDraft.accountId ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
        </div>` : ''}
      </div>` : ''}

      <button class="btn btn-lime" id="spSave" ${total > 0 && splitDraft.memberIds.length ? '' : 'disabled'}>
        ${icon('split', 16)} ${splitDraft.payer === 'me' ? `Split & record ${fmtMoney(total)}` : `Record my share ${fmtMoney(mine)}`}
      </button>
    </div>
  `);

  const tot = $('#spTotal');
  tot.addEventListener('input', e => {
    splitDraft.total = e.target.value;
    const btn = $('#spSave');
    if (btn) btn.disabled = !(Number(splitDraft.total) > 0 && splitDraft.memberIds.length);
    /* refresh the share maths without rebuilding the whole sheet */
    const prev = splitSharesPreview();
    const rows = $$('.share-list .share-row');
    if (rows.length) {
      const amtEls = rows.map(r => r.querySelector('.amt-ro'));
      amtEls[0].textContent = fmtMoney(prev.mine);
      for (let i = 1; i < amtEls.length; i++) amtEls[i].textContent = fmtMoney(prev.each);
      const note = $('.share-note');
      if (note) note.textContent = `${prev.names.length + 1} ways · ${fmtMoney(prev.total)} total${splitDraft.payer === 'them' ? ' · they paid' : ' · you paid'}`;
    }
    if (btn) btn.innerHTML = icon('split', 16) + ' ' + (splitDraft.payer === 'me' ? `Split & record ${fmtMoney(Number(splitDraft.total) || 0)}` : `Record my share ${fmtMoney(prev.mine)}`);
    const budgetHint = document.querySelector('#spBudgetHint');
    if (budgetHint) budgetHint.textContent = `Log ${fmtMoney(Number(splitDraft.total) || 0)} as spending`;
  });
  $('#spNote').addEventListener('input', e => {
    splitDraft.note = e.target.value;
    /* suggest a matching group and pull in its members */
    if (!splitDraft.groupId && e.target.value.length > 3) {
      const txt = e.target.value.toLowerCase();
      const match = state.groups.find(g => g.name.toLowerCase().split(' ').some(w => w.length > 3 && txt.includes(w)));
      if (match) {
        splitDraft.groupId = match.id;
        splitDraft.memberIds = Array.from(new Set(splitDraft.memberIds.concat(match.memberIds)));
        paintSplitSheet();
        const tot = $('#spTotal');
        if (tot) { tot.focus(); tot.value = splitDraft.total; }
        toast(`Matched group "${match.name}"`, { icon: 'users' });
      }
    }
  });

  $$('[data-sp-picker]', $('#sheet'));
  $$('[data-sp-payer]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    splitDraft.payer = b.getAttribute('data-sp-payer');
    if (splitDraft.payer === 'them' && !splitDraft.payerId) splitDraft.payerId = state.people[0].id;
    paintSplitSheet();
  }));
  const payerSel = $('#spPayer');
  if (payerSel) payerSel.addEventListener('change', e => { splitDraft.payerId = e.target.value; paintSplitSheet(); });
  $$('[data-sp-pick]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    const id = b.getAttribute('data-sp-pick');
    if (splitDraft.memberIds.includes(id)) splitDraft.memberIds = splitDraft.memberIds.filter(x => x !== id);
    else splitDraft.memberIds.push(id);
    paintSplitSheet();
  }));
  const grp = $('#spGroup');
  if (grp) grp.addEventListener('change', e => { splitDraft.groupId = e.target.value; });
  const bud = $('#spBudget');
  if (bud) bud.addEventListener('click', () => { splitDraft.postToBudget = !splitDraft.postToBudget; paintSplitSheet(); });
  const acct = $('#spAcct');
  if (acct) acct.addEventListener('change', e => { splitDraft.accountId = e.target.value; });

  const save = $('#spSave');
  if (save) save.addEventListener('click', saveSplit);
}

function saveSplit() {
  const total = Number(splitDraft.total);
  if (!(total > 0) || !splitDraft.memberIds.length) return;
  const each = Math.round((total / (splitDraft.memberIds.length + 1)) * 100) / 100;
  const mine = Math.round((total - each * splitDraft.memberIds.length) * 100) / 100;
  const note = splitDraft.note.trim() || 'Shared bill';
  const now = new Date();
  const created = [];

  if (splitDraft.payer === 'me') {
    /* everyone else owes me */
    splitDraft.memberIds.forEach(id => {
      created.push({
        id: uid(), personId: id, direction: 'they_owe', amount: each, note,
        date: isoLocal(now), status: 'open', groupId: splitDraft.groupId || '', kind: 'split', source: 'manual'
      });
    });
    if (splitDraft.postToBudget) {
      state.txns.push({
        id: uid(), title: note, amount: total, categoryId: splitDraft.categoryId,
        accountId: splitDraft.accountId, date: isoLocal(now), type: 'out',
        note: `Split ${splitDraft.memberIds.length + 1} ways`
      });
      const a = acctById(splitDraft.accountId);
      if (a && a.id) a.balance -= total;
    }
  } else {
    /* someone else paid — I owe my share, they owe the rest back to them (not tracked) */
    const payerId = splitDraft.payerId || splitDraft.memberIds[0];
    created.push({
      id: uid(), personId: payerId, direction: 'i_owe', amount: mine, note,
      date: isoLocal(now), status: 'open', groupId: splitDraft.groupId || '', kind: 'split', source: 'manual'
    });
  }

  state.shares = state.shares.concat(created);
  if (splitDraft.groupId) {
    const g = state.groups.find(x => x.id === splitDraft.groupId);
    if (g) {
      const all = new Set(g.memberIds.concat(splitDraft.memberIds));
      if (splitDraft.payer === 'them' && splitDraft.payerId) all.add(splitDraft.payerId);
      g.memberIds = Array.from(all);
    }
  }
  saveState(); rerender();
  closeSheet();
  const who = splitDraft.memberIds.length;
  toast(splitDraft.payer === 'me'
    ? `${fmtMoney(total)} split ${who + 1} ways — ${who} ${who === 1 ? 'person' : 'people'} owe you`
    : `Your ${fmtMoney(mine)} share recorded`, { icon: 'split' });
}


/* ==================================================================
   MESSAGE AUTOMATION UI — inbox, rules, and the "teach it once" flows
   ================================================================== */

let ruleDraft = null;

/* ---------- the import sheet: paste or forward a bank message ---------- */
function importMessageSheet(prefill) {
  openSheet(`
    ${sheetHead('Add a message', 'Paste a bank SMS or forward it in')}
    <div class="sheet-body">
      <div class="import-hint">
        ${icon('message', 13)} Copy any bank SMS and paste it here — or forward it to your
        Budge address and it lands automatically.
      </div>
      <div class="field"><label>Message text</label>
        <textarea id="imText" rows="5" placeholder="Askari Bank: PKR 421.00 debited from A/C **4417 on 08-11-25 at AMAZON PRIME VIDEO...">${esc(prefill || '')}</textarea>
      </div>
      <div class="two-col">
        <div class="field"><label>From (number or name)</label>
          <input id="imFrom" placeholder="ASKARI / 8556" maxlength="24">
        </div>
        <div class="field"><label>Received</label>
          <input id="imDate" type="datetime-local" value="${isoLocal(new Date()).slice(0, 16)}">
        </div>
      </div>
      <button class="btn btn-ghost" id="imDemo">${icon('zap', 15)} Fill with a sample</button>
      <button class="btn btn-lime" id="imSave" style="margin-top:9px">${icon('check', 16)} Read this message</button>
    </div>
  `);
  $('#imDemo').addEventListener('click', () => {
    const sample = demoSmsInbox()[1];
    $('#imText').value = sample.text;
    $('#imFrom').value = sample.from;
  });
  $('#imSave').addEventListener('click', () => {
    const text = $('#imText').value.trim();
    const from = $('#imFrom').value.trim();
    if (text.length < 8) { toast('Paste the message text first', { icon: 'message' }); return; }
    const msg = { id: uid(), channel: 'sms', from: from || 'unknown', text, date: $('#imDate').value || isoLocal(new Date()) };
    const parsed = applyMessageRules(msg);

    if (parsed.confidence < 0.55 || !parsed.amount) {
      openSheet(`
        ${sheetHead('Couldn\u2019t read that', 'Nothing was changed')}
        <div class="sheet-body">
          <div class="empty" style="padding:10px">
            <div class="eic">${icon('message', 22)}</div>
            <strong>No amount found</strong>
            <p>Paste the full message, including the amount, then try again.</p>
          </div>
          <button class="btn btn-lime" id="imRetry">${icon('refresh', 15)} Try again</button>
        </div>
      `);
      $('#imRetry').addEventListener('click', () => importMessageSheet(text));
      return;
    }

    parsed.messageId = msg.id;
    state.detected = (state.detected || []).concat(parsed);
    saveState(); rerender(); closeSheet();
    setTimeout(() => reviewParsed(parsed.id), 240);
  });
}

/* ---------- confirm sheet: shows what the rules understood ---------- */
function reviewParsed(detId) {
  const d = state.detected.find(x => x.id === detId);
  if (!d) return;
  const acct = acctById(d.accountId);
  const cat = catById(d.categoryId);
  const src = d.sourceName || (matchSourceRule({ from: d.from, text: d.subject }) || {}).preset;
  const srcName = d.sourceName || (src && src.name) || 'Unknown sender';

  openSheet(`
    ${sheetHead('Here\u2019s what I read', d.channel === 'sms' ? 'From an SMS' : 'From an email')}
    <div class="sheet-body">
      <div class="parsed-card">
        <div class="pc-top">
          <span class="pc-src">${icon(d.channel === 'sms' ? 'message' : 'mail', 12)} ${esc(srcName)}</span>
          <span class="pc-conf">${Math.round(d.confidence * 100)}% sure</span>
        </div>
        <div class="pc-amt ${d.type === 'in' ? 'in' : ''}">${d.type === 'in' ? '+' : '−'} ${fmtMoney(d.amount)}</div>
        <div class="pc-merch">${esc(d.merchant)}</div>
      </div>

      <div class="rule-read">
        <div class="rr-row">${icon('wallet', 14)}<span>Goes into</span><strong>${esc(acct.name)}</strong></div>
        <div class="rr-row">${icon(cat.icon, 14)}<span>Category</span><strong>${esc(cat.name)}</strong></div>
        <div class="rr-row">${icon('calendar', 14)}<span>Date</span><strong>${shortDate(d.date)}</strong></div>
      </div>

      <div class="field"><label>Merchant name</label>
        <input id="rpMerchant" value="${esc(d.merchant)}" maxlength="34">
      </div>
      <div class="two-col">
        <div class="field"><label>Account</label>
          <select id="rpAcct">${state.accounts.map(a => `<option value="${a.id}" ${a.id === d.accountId ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Category</label>
          <select id="rpCat">${state.categories.map(c => `<option value="${c.id}" ${c.id === d.categoryId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        </div>
      </div>

      <button class="btn btn-lime" id="rpSave">${icon('check', 16)} Add ${fmtMoney(d.amount)} to ${d.type === 'in' ? 'income' : 'spending'}</button>
      <button class="btn btn-ghost" id="rpTeach" style="margin-top:9px">${icon('sparkles', 15)} Always treat this sender this way</button>
    </div>
  `);

  $('#rpSave').addEventListener('click', () => {
    d.merchant = $('#rpMerchant').value.trim() || d.merchant;
    d.accountId = $('#rpAcct').value;
    d.categoryId = $('#rpCat').value;
    approveDetected(d);
    closeSheet();
  });
  $('#rpTeach').addEventListener('click', () => {
    closeSheet();
    setTimeout(() => newRuleSheet({ kind: 'sender', source: d.sourceKey, match: d.from, accountId: d.accountId }), 240);
  });
}

/* ---------- rules manager ---------- */
function rulesSheet() {
  const senderRules = (state.rules || []).filter(r => r.kind === 'sender');
  const merchantRules = (state.rules || []).filter(r => r.kind === 'merchant');

  openSheet(`
    ${sheetHead('Message rules', 'What each message turns into')}
    <div class="sheet-body">
      <div class="sec-head" style="margin-top:0"><h2 style="font-size:13px">Sender → account</h2>
        <button class="link" data-new-rule="sender">Add ${icon('plus', 11)}</button></div>
      ${senderRules.length ? senderRules.map(r => {
        const preset = sourcePreset(r.source);
        const acct = acctById(r.accountId);
        return `<button class="rule-row ${r.enabled === false ? 'off' : ''}" data-edit-rule="${r.id}">
          <span class="ru-dot" style="background:${preset ? preset.color : '#888'}"></span>
          <span class="ru-tx">
            <strong>${esc(preset ? preset.name : r.source)}</strong>
            <span>${esc(r.match || '')}</span>
          </span>
          <span class="ru-acct">${esc(acct ? acct.name : '—')}</span>
        </button>`;
      }).join('') : `<div class="empty" style="padding:14px"><p>No sender rules yet.</p></div>`}

      <div class="sec-head" style="margin-top:16px"><h2 style="font-size:13px">Merchant rules</h2>
        <button class="link" data-new-rule="merchant">Add ${icon('plus', 11)}</button></div>
      ${merchantRules.length ? merchantRules.map(r => {
        const cat = catById(r.categoryId);
        return `<button class="rule-row ${r.enabled === false ? 'off' : ''}" data-edit-rule="${r.id}">
          <span class="ru-dot" style="background:${cat.color}"></span>
          <span class="ru-tx">
            <strong>${esc(r.merchant)}</strong>
            <span>${r.amount ? fmtMoney(r.amount) : 'any amount'}${r.keyword ? ' · "' + esc(r.keyword) + '"' : ''}</span>
          </span>
          <span class="ru-acct">auto</span>
        </button>`;
      }).join('') : `<div class="empty" style="padding:14px"><p>Teach it once: "Rs 421 is Amazon Prime".</p></div>`}

      <div class="rule-tip">
        ${icon('sparkles', 13)} Rules are checked on every new message. Sender rules decide
        which account; merchant rules rename the transaction and its category.
      </div>

      <button class="btn btn-lime" id="rlNew" style="margin-top:12px">${icon('plus', 16)} New rule</button>
    </div>
  `);
  $$('[data-edit-rule]', $('#sheet')).forEach(b => b.addEventListener('click', () => editRuleSheet(b.getAttribute('data-edit-rule'))));
  $$('[data-new-rule]', $('#sheet')).forEach(b => b.addEventListener('click', () => { closeSheet(); setTimeout(() => newRuleSheet({ kind: b.getAttribute('data-new-rule') }), 220); }));
  $('#rlNew').addEventListener('click', () => { closeSheet(); setTimeout(() => newRuleSheet({ kind: 'sender' }), 220); });
}

function newRuleSheet(opts) {
  const o = opts || {};
  ruleDraft = { kind: o.kind || 'sender', source: o.source || 'askari', match: o.match || '', accountId: o.accountId || state.accounts[0].id,
                merchant: o.merchant || '', amount: o.amount || '', keyword: o.keyword || '', categoryId: o.categoryId || 'shopping', id: o.id || null };
  paintRuleSheet();
}

function editRuleSheet(id) {
  const r = (state.rules || []).find(x => x.id === id);
  if (!r) return;
  ruleDraft = { ...r, amount: r.amount == null ? '' : r.amount };
  paintRuleSheet();
}

function paintRuleSheet() {
  const d = ruleDraft;
  const isSender = d.kind === 'sender';
  openSheet(`
    ${sheetHead(isSender ? 'Sender rule' : 'Merchant rule', isSender ? 'This number means this account' : 'This transaction means this merchant')}
    <div class="sheet-body">
      ${isSender ? `
        <div class="field"><label>Institution</label>
          <select id="nrSource">${SOURCE_PRESETS.map(p => `<option value="${p.key}" ${d.source === p.key ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Sender number or name</label>
          <input id="nrMatch" value="${esc(d.match)}" placeholder="ASKARI / 8556 / HBL" maxlength="40">
        </div>
        <div class="field"><label>Put its transactions in</label>
          <select id="nrAcct">${state.accounts.map(a => `<option value="${a.id}" ${d.accountId === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
        </div>
      ` : `
        <div class="field"><label>Merchant name</label>
          <input id="nrMerchant" value="${esc(d.merchant)}" placeholder="Amazon Prime Video" maxlength="34">
        </div>
        <div class="two-col">
          <div class="field"><label>Amount (optional)</label>
            <input id="nrAmount" type="number" value="${d.amount}" placeholder="421">
          </div>
          <div class="field"><label>Contains word (optional)</label>
            <input id="nrKeyword" value="${esc(d.keyword)}" placeholder="AMAZON">
          </div>
        </div>
        <div class="field"><label>Category</label>
          <select id="nrCat">${state.categories.map(c => `<option value="${c.id}" ${d.categoryId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        </div>
        <div class="rule-tip">${icon('sparkles', 13)} Leave the amount blank to match any amount, or the word blank to match any message.</div>
      `}
      <button class="btn btn-lime" id="nrSave">${icon('check', 16)} ${d.id ? 'Save rule' : 'Create rule'}</button>
      ${d.id ? `<button class="btn btn-ghost" id="nrToggle" style="margin-top:9px">${d.enabled === false ? 'Turn on' : 'Turn off'}</button>
      <button class="btn btn-danger" id="nrDelete" style="margin-top:9px">${icon('trash', 15)} Delete rule</button>` : ''}
    </div>
  `);
  $('#nrSave').addEventListener('click', () => {
    if (isSender) {
      d.source = $('#nrSource').value;
      d.match = $('#nrMatch').value.trim();
      d.accountId = $('#nrAcct').value;
      const preset = sourcePreset(d.source);
      if (!d.match) d.match = preset ? preset.name : '';
    } else {
      d.merchant = $('#nrMerchant').value.trim();
      d.amount = $('#nrAmount').value === '' ? '' : Number($('#nrAmount').value);
      d.keyword = $('#nrKeyword').value.trim();
      d.categoryId = $('#nrCat').value;
      if (!d.merchant) { toast('Name the merchant', { icon: 'bag' }); return; }
    }
    state.rules = state.rules || [];
    if (d.id) {
      const i = state.rules.findIndex(x => x.id === d.id);
      if (i >= 0) state.rules[i] = { ...d, amount: d.amount === '' ? null : d.amount };
    } else {
      state.rules.push({ ...d, id: uid(), enabled: true, amount: d.amount === '' ? null : d.amount });
    }
    saveState(); rerender(); closeSheet();
    toast(d.kind === 'sender' ? 'Sender rule saved' : `“${d.merchant}” recognised`, { icon: 'sparkles' });
  });
  const tog = $('#nrToggle'); if (tog) tog.addEventListener('click', () => {
    const r = state.rules.find(x => x.id === d.id);
    if (r) { r.enabled = r.enabled === false; saveState(); rerender(); closeSheet(); toast(r.enabled === false ? 'Rule off' : 'Rule on'); }
  });
  const del = $('#nrDelete'); if (del) del.addEventListener('click', () => {
    state.rules = state.rules.filter(x => x.id !== d.id);
    saveState(); rerender(); closeSheet(); toast('Rule deleted');
  });
}

/* ---------- "teach from this transaction" ---------- */
function teachFromTx(txId) {
  const t = state.txns.find(x => x.id === txId);
  if (!t) return;
  newRuleSheet({ kind: 'merchant', merchant: t.title, amount: t.amount, categoryId: t.categoryId });
}



/* ==================================================================
   NATIVE ANDROID BRIDGE
   When Budge is installed as an app, Android hands us SMS directly —
   no relay, no pasting. The Java side calls:
       BudgeNative.onSmsBatch([{from,text,when}])
       BudgeNative.onSmsPermission(true|false)
   ================================================================== */

function isNativeApp() {
  return typeof window.Budge !== 'undefined' && typeof window.Budge.hasSmsPermission === 'function';
}

function nativeSmsSupported() {
  try { return isNativeApp() && window.Budge.hasSmsPermission(); }
  catch (e) { return false; }
}

/* Called by SmsReceiver → MainActivity once the page is ready. */
window.BudgeNative = {
  onSmsBatch: function (rows) {
    try {
      const msgs = (rows || []).map(r => ({
        id: 'native-' + r.when + '-' + String(r.text || '').length,
        channel: 'sms',
        from: r.from || 'unknown',
        text: r.text || '',
        date: isoLocal(new Date(r.when || Date.now())),
        when: r.when
      }));
      if (!msgs.length) return;
      const res = ingestMessages(msgs, { channel: 'sms' });
      state.sms = state.sms || {};
      state.sms.native = true;
      state.sms.live = true;
      state.sms.lastAt = isoLocal(new Date());
      state.sms.forwarded = (state.sms.forwarded || 0) + res.fresh;
      saveState();
      rerender();
      if (res.fresh) {
        toast(`${res.fresh} bank message${res.fresh === 1 ? '' : 's'} read · ${res.posted} logged`, { icon: 'zap' });
      }
    } catch (e) { /* never let the bridge crash the UI */ }
  },
  onSmsPermission: function (granted) {
    state.sms = state.sms || {};
    state.sms.native = true;
    state.sms.live = !!granted;
    state.sms.permission = !!granted;
    saveState();
    rerender();
    if (granted) toast('SMS access on — bank messages will log themselves', { icon: 'check' });
  }
};

function requestNativeSms() {
  try {
    if (!isNativeApp()) return;
    window.Budge.requestSmsPermission();
  } catch (e) { /* ignore */ }
}

/* Pull anything that arrived while the app was in the background. */
function pollNativeSms() {
  try { if (isNativeApp()) window.Budge.pollSms(); } catch (e) { /* ignore */ }
}

/* ---------- live SMS relay connection ---------- */
let smsPoller = null;

function smsEndpoint() {
  const raw = (state.sms && state.sms.endpoint) || '';
  return raw.replace(/\/+$/, '');
}

function connectSmsSheet() {
  const ep = smsEndpoint();
  openSheet(`
    ${sheetHead('Connect bank SMS', 'Forward SMS into Budge')}
    <div class="sheet-body">
      <div class="import-hint">
        ${icon('message', 13)} A web page can't read your SMS — Android reserves that for the
        default messaging app. So your phone forwards bank messages to a small relay on your own
        computer, and Budge reads them from there.
      </div>

      <div class="field"><label>Relay address</label>
        <input id="smEp" value="${esc(ep)}" placeholder="http://192.168.1.5:5179" maxlength="120">
      </div>

      <div class="field"><label>Shared token (optional)</label>
        <input id="smTok" value="${esc((state.sms && state.sms.token) || '')}" placeholder="leave blank if unset" maxlength="80">
      </div>

      <button class="btn btn-lime" id="smSave">${icon('refresh', 16)} Connect &amp; check</button>
      <button class="btn btn-ghost" id="smOff" style="margin-top:9px">${icon('minus', 15)} Turn off</button>

      <div class="rule-tip" style="margin-top:14px">
        ${icon('shield', 13)} Start it with <b>python3 server/sms_server.py</b> on the computer
        that runs Budge. Then install any SMS-forwarder app and point it at
        <b>http://&lt;that-pc&gt;:5179/sms</b>.
      </div>
    </div>
  `);

  const clean = v => String(v || '').trim();
  $('#smSave').addEventListener('click', async () => {
    const url = clean($('#smEp').value);
    if (!url) { toast('Add the relay address', { icon: 'cloud' }); return; }
    state.sms = state.sms || {};
    state.sms.endpoint = url;
    state.sms.token = clean($('#smTok').value);
    saveState();
    const res = await pollSmsOnce({ announce: true });
    if (res.ok) closeSheet();
    rerender();
  });
  $('#smOff').addEventListener('click', () => {
    state.sms = state.sms || {};
    state.sms.endpoint = '';
    stopSmsPoller();
    saveState(); rerender(); closeSheet();
    toast('SMS relay turned off', { icon: 'message' });
  });
}

async function pollSmsOnce(opts) {
  const o = opts || {};
  const base = smsEndpoint();
  if (!base) return { ok: false, reason: 'no-endpoint' };
  try {
    const headers = {};
    if (state.sms && state.sms.token) headers['X-Budge-Token'] = state.sms.token;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(base + '/inbox', { headers, signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const msgs = (data.messages || []).map(m => ({ ...m, channel: 'sms' }));
    if (!msgs.length) {
      if (o.announce) toast('Connected — no new messages yet', { icon: 'check' });
      state.sms = state.sms || {};
      state.sms.live = true;
      state.sms.lastAt = isoLocal(new Date());
      saveState(); rerender();
      return { ok: true, count: 0 };
    }
    const r = ingestMessages(msgs, { channel: 'sms' });
    if (!r.fresh) { toast('No new messages', { icon: 'check' }); }
    state.sms = state.sms || {};
    state.sms.live = true;
    state.sms.lastAt = isoLocal(new Date());
    saveState(); rerender();
    toast(`${r.fresh} new message${r.fresh === 1 ? '' : 's'} · ${r.posted} logged`, { icon: 'zap' });
    return { ok: true, count: r.fresh };
  } catch (e) {
    if (o.announce) toast('Could not reach the relay at ' + base, { icon: 'minus' });
    state.sms = state.sms || {};
    state.sms.live = false;
    saveState(); rerender();
    return { ok: false, reason: String(e.message || e) };
  }
}

function startSmsPoller() {
  stopSmsPoller();
  if (!smsEndpoint()) return;
  pollSmsOnce({});
  smsPoller = setInterval(() => pollSmsOnce({}), 15000);
}

function stopSmsPoller() {
  if (smsPoller) { clearInterval(smsPoller); smsPoller = null; }
}

/* ---------- sync the demo SMS inbox ---------- */
function syncSmsDemo() {
  const r = ingestMessages(demoSmsInbox(), { channel: 'sms' });
  rerender();
  if (!r.fresh) toast('No new messages', { icon: 'message' });
  else toast(`${r.fresh} messages read · ${r.posted} logged automatically`, { icon: 'zap' });
}

/* ------------------------------------------------------------------
   Split a transaction that already exists (usually one Autopilot caught
   from a bank email). The expense is already posted, so this only
   creates the IOUs — never a second expense.
   ------------------------------------------------------------------ */
function splitSheetForTx(txId) {
  const t = state.txns.find(x => x.id === txId);
  if (!t) return;
  if ((t.splits || []).length) { toast('Already split', { icon: 'split' }); return; }

  /* Seed with the people who show up in recent splits — the usual suspects. */
  const recent = state.shares.slice(-12).map(x => x.personId);
  const seed = Array.from(new Set(recent)).filter(id => personById(id)).slice(0, 2);

  splitForTx = { txId, memberIds: seed };

  openSheet(`
    ${sheetHead('Split this payment', `${fmtMoney(t.amount)} · ${esc(t.title)}`)}
    <div class="sheet-body">
      <div class="split-hero">
        <div class="sh-ico" style="--c:${catById(t.categoryId).color}">${icon(catById(t.categoryId).icon, 22)}</div>
        <div class="sh-meta">
          <strong>${esc(t.title)}</strong>
          <span>${shortDate(t.date)} · ${esc(acctById(t.accountId).name)}</span>
        </div>
        <span class="sh-amt">${fmtMoney(t.amount)}</span>
      </div>

      <div class="split-hint">${icon('check', 12)} Already in your expenses — this only records who owes you.</div>

      <div class="field">
        <label>Who was with you?</label>
        <div class="people-pick">
          ${state.people.map(p => `<button class="pick ${splitForTx.memberIds.includes(p.id) ? 'on' : ''}" data-tx-pick="${p.id}">
            <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>${esc(p.name.split(' ')[0])}
          </button>`).join('')}
        </div>
        <button class="add-inline" data-add-person-inline="1">${icon('plus', 12)} Add someone new</button>
      </div>

      <div class="share-list" id="txShareList">${txShareRows(t)}</div>

      <div class="field" style="margin-top:12px">
        <label>Group (optional)</label>
        <select id="txGroup">
          <option value="">No group</option>
          ${state.groups.map(g => `<option value="${g.id}" ${splitForTx.groupId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}
        </select>
      </div>

      <button class="btn btn-lime" id="txSplitSave" ${splitForTx.memberIds.length ? '' : 'disabled'}>
        ${icon('split', 16)} Split ${splitForTx.memberIds.length + 1} ways
      </button>
    </div>
  `);

  const refresh = () => {
    const list = $('#txShareList');
    if (list) list.innerHTML = txShareRows(t);
    const btn = $('#txSplitSave');
    if (btn) {
      btn.disabled = !splitForTx.memberIds.length;
      btn.innerHTML = icon('split', 16) + ` Split ${splitForTx.memberIds.length + 1} ways`;
    }
    $$('[data-tx-pick]', $('#sheet')).forEach(b =>
      b.classList.toggle('on', splitForTx.memberIds.includes(b.getAttribute('data-tx-pick'))));
  };

  $$('[data-tx-pick]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    const id = b.getAttribute('data-tx-pick');
    splitForTx.memberIds = splitForTx.memberIds.includes(id)
      ? splitForTx.memberIds.filter(x => x !== id)
      : splitForTx.memberIds.concat(id);
    refresh();
  }));

  const addNew = $('[data-add-person-inline]');
  if (addNew) addNew.addEventListener('click', () => {
    const name = window.prompt('Their name?');
    if (!name || !name.trim()) return;
    const nm = name.trim();
    const initials = nm.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const colors = ['#7EC8F2','#F5A65B','#C6A6FF','#7EE7B9','#FF8BA0','#F2D06B','#7EE7E0'];
    const person = { id: uid(), name: nm, initials, color: colors[state.people.length % colors.length], email: '', phone: '' };
    state.people.push(person);
    splitForTx.memberIds = splitForTx.memberIds.concat(person.id);
    saveState();
    splitSheetForTx(txId);
    toast('Added ' + nm, { icon: 'user' });
  });

  const grp = $('#txGroup');
  if (grp) grp.addEventListener('change', e => { splitForTx.groupId = e.target.value; });

  $('#txSplitSave').addEventListener('click', () => saveTxSplit(txId));
}

/* Rows for the split preview — payer plus each participant. */
function txShareRows(t) {
  const n = splitForTx.memberIds.length;
  const total = t.amount;
  const each = n ? Math.round((total / (n + 1)) * 100) / 100 : total;
  const mine = Math.round((total - each * n) * 100) / 100;
  return `
    <div class="share-row">
      <span class="pi-avatar" style="background:linear-gradient(150deg,#E9FF9C,#C9F53F);color:#0C1004">You</span>
      <span class="nm">You (paid)</span>
      <span class="amt-ro">${fmtMoney(mine)}</span>
    </div>
    ${splitForTx.memberIds.map(id => {
      const p = personById(id);
      return `<div class="share-row">
        <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>
        <span class="nm">${esc(p.name)}</span>
        <span class="amt-ro">${fmtMoney(each)}</span>
      </div>`;
    }).join('')}
    <div class="share-note">${n + 1} ways · ${fmtMoney(total)} total · already paid</div>`;
}

function saveTxSplit(txId) {
  const t = state.txns.find(x => x.id === txId);
  if (!t || !splitForTx.memberIds.length) return;
  const n = splitForTx.memberIds.length;
  const each = Math.round((t.amount / (n + 1)) * 100) / 100;
  const note = t.title || 'Shared bill';

  const created = splitForTx.memberIds.map(id => ({
    id: uid(), personId: id, direction: 'they_owe', amount: each, note,
    date: t.date, status: 'open', groupId: splitForTx.groupId || '',
    kind: 'split', source: 'manual', txId: t.id
  }));

  state.shares = state.shares.concat(created);
  t.splits = splitForTx.memberIds.map(id => ({ personId: id, amount: each }));

  if (splitForTx.groupId) {
    const g = state.groups.find(x => x.id === splitForTx.groupId);
    if (g) g.memberIds = Array.from(new Set(g.memberIds.concat(splitForTx.memberIds)));
  }

  saveState(); rerender(); closeSheet();
  toast(`${fmtMoney(t.amount)} split ${n + 1} ways — ${n} ${n === 1 ? 'person owes' : 'people owe'} you ${fmtMoney(each)}`, { icon: 'split' });
}

function lendBorrowSheet(personId, mode) {
  const p = personById(personId);
  const isLend = mode === 'lend';
  openSheet(`
    ${sheetHead(isLend ? 'Lend money' : 'Borrow money', isLend ? `Lending to ${esc(p.name)}` : `Borrowing from ${esc(p.name)}`)}
    <div class="sheet-body">
      <div class="row" style="gap:11px;margin-bottom:16px">
        <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>
        <div><div style="font-size:13px;font-weight:650">${esc(p.name)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${personNet(p.id) === 0 ? 'All settled' : personNet(p.id) > 0 ? `Owes you ${fmtMoney(personNet(p.id))}` : `You owe ${fmtMoney(Math.abs(personNet(p.id)))}`}</div></div>
      </div>
      <div class="field"><label>Amount</label><input id="lbAmt" type="number" inputmode="decimal" placeholder="0"></div>
      <div class="field"><label>Note</label><input id="lbNote" placeholder="${isLend ? 'e.g. Bike repair' : 'e.g. Textbooks'}" maxlength="44"></div>
      <div class="field"><label>Date</label><input id="lbDate" type="date" value="${isoLocal(new Date()).slice(0, 10)}"></div>
      ${isLend ? `<div class="settings" style="margin-bottom:12px"><div class="set-row">
        <span class="sic">${icon('wallet', 16)}</span>
        <span class="stx"><strong>Deduct from account</strong><span>Cash leaves now, they owe you</span></span>
        <button class="switch on" id="lbAcctOn"></button>
      </div></div>` : ''}
      <button class="btn btn-lime" id="lbSave">${icon(isLend ? 'send' : 'handCoins', 16)} ${isLend ? 'Record loan' : 'Record borrowing'}</button>
    </div>
  `);
  let deduct = isLend;
  const sw = $('#lbAcctOn');
  if (sw) sw.addEventListener('click', () => { deduct = !deduct; sw.classList.toggle('on', deduct); });

  $('#lbSave').addEventListener('click', () => {
    const amount = Number($('#lbAmt').value);
    if (!(amount > 0)) { toast('Enter an amount', { icon: 'handCoins' }); $('#lbAmt').focus(); return; }
    const date = $('#lbDate').value ? $('#lbDate').value + 'T12:00' : isoLocal(new Date());
    state.shares.push({
      id: uid(), personId: p.id, direction: isLend ? 'they_owe' : 'i_owe', amount,
      note: $('#lbNote').value.trim() || (isLend ? 'Loan to ' + p.name : 'Borrowed from ' + p.name),
      date, status: 'open', kind: isLend ? 'lend' : 'borrow', source: 'manual'
    });
    if (isLend && deduct) {
      const cash = state.accounts.find(a => a.type === 'Cash') || state.accounts[0];
      if (cash) cash.balance = Math.max(0, cash.balance - amount);
    }
    saveState(); rerender(); closeSheet();
    toast(isLend ? `${fmtMoney(amount)} lent to ${p.name}` : `${fmtMoney(amount)} borrowed from ${p.name}`);
  });
}

function settleSheet(personId) {
  const p = personById(personId);
  const net = personNet(p.id);
  if (!Math.abs(net)) { toast('Nothing to settle with ' + p.name, { icon: 'check' }); return; }
  const theyOwe = net > 0;
  const amt = Math.abs(net);
  openSheet(`
    ${sheetHead(theyOwe ? 'Collect payment' : 'Settle up', theyOwe ? `${esc(p.name)} owes you ${fmtMoney(amt)}` : `You owe ${esc(p.name)} ${fmtMoney(amt)}`)}
    <div class="sheet-body">
      <div class="person-hero">
        <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>
        <h4>${esc(p.name)}</h4>
        <div class="net ${theyOwe ? 'pos' : 'neg'}">${fmtMoney(amt)}</div>
        <p>${theyOwe ? 'owes you right now' : 'you owe right now'}</p>
      </div>

      ${!theyOwe ? `<div class="field"><label>Paid from</label>
        <select id="stAcct">${state.accounts.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select>
      </div>` : ''}

      <div class="settings" style="margin-bottom:12px">
        ${theyOwe ? `<button class="set-row" data-action="remind" data-remind-person="${p.id}">
          <span class="sic">${icon('send', 16)}</span>
          <span class="stx"><strong>Send a reminder</strong><span>${p.phone ? `WhatsApp ${esc(p.phone)}` : 'Add their number to nudge them'}</span></span>
          <span class="chev">${icon('chevron-right', 15)}</span>
        </button>` : ''}
        <button class="set-row" data-settle-all="${p.id}">
          <span class="sic">${icon('settle', 16)}</span>
          <span class="stx"><strong>Mark everything settled</strong><span>Clears ${personShares(p.id).filter(s => s.status === 'open').length} open items</span></span>
          <span class="chev">${icon('chevron-right', 15)}</span>
        </button>
      </div>

      <div class="field"><label>Partial amount (optional)</label><input id="stAmt" type="number" inputmode="decimal" placeholder="${amt}"></div>
      <button class="btn btn-lime" id="stSave">${icon('check', 16)} ${theyOwe ? 'Mark as received' : 'Mark as paid'} ${fmtMoney(amt)}</button>
      <div style="font-size:10px;color:var(--faint);text-align:center;padding-top:9px;line-height:1.5">
        ${theyOwe ? 'Money received goes back into your account balance.' : 'Money paid leaves the account you choose above.'}
      </div>
    </div>
  `);

  $('#stSave').addEventListener('click', () => {
    const partial = Number($('#stAmt').value);
    settlePerson(p.id, partial > 0 ? partial : null, theyOwe, $('#stAcct') ? $('#stAcct').value : null);
  });
  const allBtn = $('[data-settle-all]', $('#sheet'));
  if (allBtn) allBtn.addEventListener('click', () => settlePerson(p.id, null, theyOwe, $('#stAcct') ? $('#stAcct').value : null, true));
}

function settlePerson(personId, partial, _ignoredDirection, accountId) {
  const p = personById(personId);
  const open = personShares(personId).filter(s => s.status === 'open');
  if (!open.length) { toast('Nothing to settle with ' + p.name, { icon: 'check' }); return; }

  /* net = positive means they owe me. Settling nets both sides off at once. */
  const net = sum(open.map(s => s.direction === 'they_owe' ? s.amount : -s.amount));
  const round2 = v => Math.round(v * 100) / 100;
  let accountDelta;

  if (partial != null && partial > 0) {
    /* partial: apply only to items going the same way as the net */
    const dir = net >= 0 ? 'they_owe' : 'i_owe';
    let remaining = partial;
    open.slice().reverse().filter(s => s.direction === dir).forEach(s => {
      if (remaining <= 0) return;
      if (s.amount <= remaining + 0.001) {
        s.status = 'settled';
        s.settledAt = isoLocal(new Date());
        remaining = round2(remaining - s.amount);
      } else {
        s.amount = round2(s.amount - remaining);
        remaining = 0;
      }
    });
    accountDelta = net >= 0 ? partial : -partial;
  } else {
    open.forEach(s => {
      s.status = 'settled';
      s.settledAt = isoLocal(new Date());
      s.settledFrom = 'manual';
    });
    accountDelta = net;
  }

  const acct = state.accounts.find(a => a.id === accountId) || state.accounts[0];
  if (acct) acct.balance = Math.max(0, acct.balance + accountDelta);

  state.settleRequests = state.settleRequests.filter(r => r.personId !== personId);
  saveState(); rerender(); closeSheet();
  const moved = Math.abs(partial != null && partial > 0 ? partial : net);
  toast(net > 0 ? `${fmtMoney(moved)} received from ${p.name}` : `Settled ${fmtMoney(moved)} with ${p.name}`, { icon: 'settle' });
}

function personSheet(personId) {
  const p = personById(personId);
  const net = personNet(p.id);
  const shares = personShares(p.id);
  const open = shares.filter(s => s.status === 'open');
  openSheet(`
    ${sheetHead('Person', esc(p.name))}
    <div class="sheet-body">
      <div class="person-hero">
        <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>
        <h4>${esc(p.name)}</h4>
        ${net === 0 ? `<p style="margin-top:6px">All settled up</p>`
          : `<div class="net ${net > 0 ? 'pos' : 'neg'}">${fmtMoney(Math.abs(net))}</div>
             <p>${net > 0 ? 'owes you' : 'you owe them'}</p>`}
      </div>

      <div class="person-actions" style="margin-bottom:14px">
        <button class="btn btn-ghost" data-lend="${p.id}">${icon('send', 13)} Lend</button>
        <button class="btn btn-ghost" data-borrow="${p.id}">${icon('handCoins', 13)} Borrow</button>
        <button class="btn btn-lime" data-settle="${p.id}">${icon('settle', 13)} Settle</button>
      </div>

      <div class="kv" style="margin-bottom:14px">
        ${p.email ? `<div><span>Email</span><strong>${esc(p.email)}</strong></div>` : ''}
        ${p.phone ? `<div><span>Phone</span><strong>${esc(p.phone)}</strong></div>` : ''}
        <div><span>Open items</span><strong>${open.length}</strong></div>
        <div><span>Settled</span><strong>${shares.filter(s => s.status === 'settled').length}</strong></div>
      </div>

      <div class="sec-head" style="margin:0 0 8px"><h2 style="font-size:13px">History</h2></div>
      <div class="tx-card" style="background:var(--surface-2);margin-bottom:12px">
        ${shares.length ? shares.map(s => {
          const mine = s.direction === 'they_owe';
          const done = s.status === 'settled';
          const ic = (s.kind === 'lend' || s.kind === 'borrow') ? 'handCoins' : 'split';
          return `<div class="tl-row">
            <span class="tl-dot">${icon(done ? 'settle' : ic, 14)}</span>
            <span class="tl-body">
              <strong>${esc(s.note || (mine ? 'They owe you' : 'You owe them'))}</strong>
              <span>${shortDate(s.date)}${done ? ' · settled' : ''}${s.source === 'sms' ? ' · from SMS' : ''}</span>
            </span>
            <span class="tl-amt ${done ? 'mut' : mine ? 'pos' : 'neg'}">${mine ? '+' : '−'}${fmtMoney(s.amount)}</span>
          </div>`;
        }).join('') : `<div class="empty" style="padding:16px"><p>No history yet.</p></div>`}
      </div>

      <button class="btn btn-ghost" data-remind-person="${p.id}" style="${net > 0 ? '' : 'display:none'}">${icon('send', 15)} Send reminder</button>
      <button class="btn btn-danger" style="margin-top:9px" data-remove-person="${p.id}">${icon('trash', 15)} Remove person</button>
    </div>
  `);
}

function addPersonSheet() {
  openSheet(`
    ${sheetHead('Add a person', 'Who do you split with?')}
    <div class="sheet-body">
      <div class="field"><label>Name</label><input id="npName" placeholder="e.g. Usman Ali" maxlength="30"></div>
      <div class="two-col">
        <div class="field"><label>Email</label><input id="npEmail" placeholder="name@gmail.com" inputmode="email"></div>
        <div class="field"><label>Phone</label><input id="npPhone" placeholder="03xx xxxxxxx" inputmode="tel"></div>
      </div>
      <div class="field"><label>Colour</label>
        <div class="quick-amts" id="npColors">
          ${['#7EC8F2','#F5A65B','#C6A6FF','#7EE7B9','#FF8BA0','#F2D06B','#7EE7E0'].map((cc, i) => `<button data-ncolor="${cc}" style="width:34px;height:34px;border-radius:11px;background:${cc};border:${i === 0 ? '3px solid var(--text)' : '3px solid transparent'};padding:0"></button>`).join('')}
        </div>
      </div>
      <button class="btn btn-lime" id="npSave">${icon('plus', 16)} Add person</button>
    </div>
  `);
  let color = '#7EC8F2';
  $$('[data-ncolor]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    color = b.getAttribute('data-ncolor');
    $$('[data-ncolor]', $('#sheet')).forEach(x => x.style.borderColor = 'transparent');
    b.style.borderColor = 'var(--text)';
  }));
  $('#npSave').addEventListener('click', () => {
    const name = $('#npName').value.trim();
    if (!name) { toast('Add a name', { icon: 'user' }); return; }
    const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    state.people.push({
      id: uid(), name, initials, color,
      email: $('#npEmail').value.trim(), phone: $('#npPhone').value.trim()
    });
    saveState(); rerender(); closeSheet();
    toast(name + ' added');
  });
}

function newGroupSheet() {
  openSheet(`
    ${sheetHead('New group', 'For trips, dinners, shared living')}
    <div class="sheet-body">
      <div class="field"><label>Group name</label><input id="ngName" placeholder="e.g. Murree trip" maxlength="28"></div>
      <div class="field"><label>Members</label>
        <div class="people-pick">
          ${state.people.map(p => `<button class="pick" data-ng-pick="${p.id}">
            <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>${esc(p.name.split(' ')[0])}
          </button>`).join('')}
        </div>
      </div>
      <button class="btn btn-lime" id="ngSave">${icon('users', 16)} Create group</button>
    </div>
  `);
  const picked = new Set();
  $$('[data-ng-pick]', $('#sheet')).forEach(b => b.addEventListener('click', () => {
    const id = b.getAttribute('data-ng-pick');
    if (picked.has(id)) picked.delete(id); else picked.add(id);
    b.classList.toggle('on', picked.has(id));
  }));
  $('#ngSave').addEventListener('click', () => {
    const name = $('#ngName').value.trim();
    if (!name) { toast('Name the group', { icon: 'users' }); return; }
    if (!picked.size) { toast('Pick at least one member', { icon: 'users' }); return; }
    state.groups.push({ id: uid(), name, icon: 'users', color: '#C6A6FF', memberIds: Array.from(picked), created: isoLocal(new Date()) });
    saveState(); rerender(); closeSheet();
    toast(`${name} created`);
  });
}

function groupSheet(groupId) {
  const g = state.groups.find(x => x.id === groupId);
  if (!g) return;
  const shares = state.shares.filter(s => s.groupId === groupId).sort((a, b) => parseDate(b.date) - parseDate(a.date));
  const total = sum(shares.map(s => s.amount));
  const net = groupNet(groupId);
  openSheet(`
    ${sheetHead(esc(g.name), `${g.memberIds.length + 1} people · ${shares.length} shared items`)}
    <div class="sheet-body">
      <div class="bal-grid" style="margin-bottom:14px">
        <div class="bal-card"><span>Group total</span><strong>${fmtMoney(total)}</strong><em>across ${shares.length} items</em></div>
        <div class="bal-card"><span>Your position</span>
          <strong class="${net > 0 ? 'pos' : net < 0 ? 'neg' : ''}">${net === 0 ? '—' : (net > 0 ? '+' : '−') + fmtMoney(Math.abs(net))}</strong>
          <em>${net > 0 ? 'they owe you' : net < 0 ? 'you owe' : 'settled'}</em>
        </div>
      </div>
      <div class="people-pick" style="margin-bottom:14px">
        ${g.memberIds.map(id => { const p = personById(id); return `<span class="pick on"><span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>${esc(p.name.split(' ')[0])}</span>`; }).join('')}
      </div>
      <div class="tx-card" style="background:var(--surface-2)">
        ${shares.length ? shares.map(s => {
          const p = personById(s.personId);
          const mine = s.direction === 'they_owe';
          const done = s.status === 'settled';
          return `<div class="tl-row">
            <span class="tl-dot">${icon(done ? 'settle' : 'split', 14)}</span>
            <span class="tl-body"><strong>${esc(s.note || 'Shared bill')}</strong><span>${esc(p.name)} · ${shortDate(s.date)}</span></span>
            <span class="tl-amt ${done ? 'mut' : mine ? 'pos' : 'neg'}">${mine ? '+' : '−'}${fmtMoney(s.amount)}</span>
          </div>`;
        }).join('') : `<div class="empty" style="padding:16px"><p>Nothing shared in this group yet.</p></div>`}
      </div>
      <button class="btn btn-lime" data-action="split-group" data-group-id="${g.id}" style="margin-top:12px">${icon('split', 16)} Split a bill here</button>
      <button class="btn btn-ghost" data-action="settle-group" data-group-id="${g.id}" style="margin-top:9px">${icon('settle', 15)} Settle the group</button>
      <button class="btn btn-danger" style="margin-top:9px" data-delete-group="${g.id}">${icon('trash', 15)} Delete group</button>
    </div>
  `);
}

function settleGroup(groupId) {
  const open = state.shares.filter(s => s.groupId === groupId && s.status === 'open');
  if (!open.length) { toast('Group is already settled', { icon: 'check' }); return; }
  const total = sum(open.map(s => s.amount));
  let netIn = 0;
  open.forEach(s => {
    s.status = 'settled'; s.settledAt = isoLocal(new Date());
    netIn += s.direction === 'they_owe' ? s.amount : -s.amount;
  });
  if (netIn !== 0) {
    const acct = state.accounts[0];
    if (acct) acct.balance = Math.max(0, acct.balance + netIn);
  }
  saveState(); rerender(); closeSheet();
  toast(`Group settled — ${fmtMoney(total)} cleared`, { icon: 'settle' });
}

function allSharesSheet() {
  const shares = state.shares.slice().sort((a, b) => parseDate(b.date) - parseDate(a.date));
  openSheet(`
    ${sheetHead('All shared items', shares.length + ' records')}
    <div class="sheet-body">
      ${shares.map(s => {
        const p = personById(s.personId);
        const mine = s.direction === 'they_owe';
        const done = s.status === 'settled';
        const ic = (s.kind === 'lend' || s.kind === 'borrow') ? 'handCoins' : 'split';
        return `<div class="shared-row" style="border-top:0;padding:11px 0">
          <span class="sh-ic" style="color:${p.color}">${icon(done ? 'settle' : ic, 16)}</span>
          <span class="sh-tx">
            <strong>${esc(s.note || 'Shared')}</strong>
            <span>${esc(p.name)} · ${shortDate(s.date)}${done ? ' · settled' : ''}${s.source === 'sms' ? ' · SMS' : ''}</span>
          </span>
          <span class="sh-amt ${done ? '' : mine ? 'pos' : 'neg'}">${done ? '' : mine ? '+' : '−'}${fmtMoney(s.amount)}</span>
        </div>`;
      }).join('') || '<div class="empty"><p>Nothing recorded yet.</p></div>'}
    </div>
  `);
}

function shareDetailSheet(id) {
  const s = state.shares.find(x => x.id === id);
  if (!s) return;
  const p = personById(s.personId);
  const mine = s.direction === 'they_owe';
  openSheet(`
    ${sheetHead('Shared item', shortDate(s.date))}
    <div class="sheet-body">
      <div class="person-hero">
        <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>
        <h4>${esc(p.name)}</h4>
        <div class="net ${s.status === 'settled' ? '' : mine ? 'pos' : 'neg'}" style="${s.status === 'settled' ? 'color:var(--faint)' : ''}">${mine ? '+' : '−'}${fmtMoney(s.amount)}</div>
        <p>${s.status === 'settled' ? 'settled' : mine ? 'owes you' : 'you owe them'}</p>
      </div>
      <div class="kv">
        <div><span>For</span><strong style="text-align:right;max-width:62%">${esc(s.note || '—')}</strong></div>
        <div><span>Type</span><strong>${s.kind === 'lend' ? 'Loan given' : s.kind === 'borrow' ? 'Loan taken' : 'Bill split'}</strong></div>
        <div><span>Date</span><strong>${shortDate(s.date)}</strong></div>
        ${s.groupId ? `<div><span>Group</span><strong>${esc((state.groups.find(g => g.id === s.groupId) || {}).name || '—')}</strong></div>` : ''}
        <div><span>Matched from</span><strong>${s.source === 'sms' ? 'Bank SMS' : 'Manual entry'}</strong></div>
      </div>
      ${s.status === 'open' ? `<button class="btn btn-lime" data-settle="${p.id}">${icon('settle', 16)} Settle ${fmtMoney(s.amount)}</button>`
        : `<div class="card" style="text-align:center;padding:14px"><span class="pill up">${icon('check', 11)} settled</span></div>`}
      <button class="btn btn-danger" style="margin-top:9px" data-remove-share="${s.id}">${icon('trash', 15)} Delete record</button>
    </div>
  `);
}

/* ============================================================
   SMS → person matching (raast / IBFT / easypaisa / jazzcash…)
   ============================================================ */
const PERSON_HINTS = /(raast|ibft|easypaisa|jazzcash|sadapay|nayapay|transfer|sent you|received from|paid you|money received|funds received|cash received|credited from|deposited)/i;
const FROM_HINTS = /(from|by|sender|received from|credited from|deposited by)/i;

/* extract a human name from a transfer email */
function parsePersonName(text, personNameHint) {
  const t = String(text || '');
  /* 1 · an existing contact is named in the email */
  const pool = state.people.concat([{ id:'__hint', name: personNameHint || '' }]).filter(p => p.name);
  for (const p of pool) {
    const first = p.name.split(' ')[0];
    if (p.name && new RegExp(`\\b${p.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i').test(t)) return { person: state.people.find(x => x.id === p.id) || null, name: p.name };
    if (p.name && first.length > 3 && new RegExp(`\\b${first}\\b`, 'i').test(t)) return { person: state.people.find(x => x.id === p.id) || null, name: p.name };
  }
  /* 2 · "from NAME" / "to NAME" in the body */
  const m = t.match(/\b(?:from|by|to)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/);
  if (m) {
    const nm = m[1].replace(/\b(Bank|Limited|Ltd|Account|Raast|IBFT)\b/gi, '').trim();
    if (nm.length >= 3) return { person: null, name: nm };
  }
  return { person: null, name: '' };
}

function parseTransferEmail(msg) {
  const from = msg.from || '';
  const subject = msg.subject || '';
  const body = msg.text || msg.snippet || '';
  const hay = `${subject} ${body}`;
  if (!PERSON_HINTS.test(hay)) return null;

  const amount = parseAmount(hay);
  if (!(amount > 0)) return null;

  /* direction: money coming to me, or going out */
  const outgoing = /(sent to|transferred to|you sent|debited|paid to|payment to|withdrawn)/i.test(hay);
  const incoming = /(sent you|received from|credited|from|deposited)/i.test(hay);
  const isIn = incoming && !outgoing;

  const found = parsePersonName(hay);
  if (!found.name) return null;

  /* try to match an existing contact by email or name */
  let person = found.person;
  if (!person) {
    const emailMatch = (from.match(/[\w.+-]+@[\w.-]+/) || [])[0] || '';
    person = state.people.find(p => p.email && emailMatch && p.email.toLowerCase() === emailMatch.toLowerCase()) ||
             state.people.find(p => p.name.toLowerCase() === found.name.toLowerCase()) ||
             state.people.find(p => p.name.toLowerCase().includes(found.name.toLowerCase().split(' ')[0]));
  }

  let conf = 0.5;
  if (amount > 0) conf += 0.2;
  if (person) conf += 0.2;
  if (/(raast|ibft|easypaisa|jazzcash|sadapay)/i.test(hay)) conf += 0.08;

  return {
    id: uid(),
    messageId: msg.id,
    personId: person ? person.id : '',
    personName: person ? person.name : found.name,
    amount: amount < 1000 ? Math.round(amount * 100) / 100 : Math.round(amount),
    type: isIn ? 'in' : 'out',
    direction: isIn ? 'they_owe' : 'i_owe',
    date: msg.date || isoLocal(new Date()),
    from: from.slice(0, 80),
    subject: subject.slice(0, 90),
    bankLabel: guessBankLabel(from, hay),
    confidence: Math.max(0.3, Math.min(0.98, conf)),
    state: 'pending'
  };
}

function guessBankLabel(from, hay) {
  const h = `${from} ${hay}`.toLowerCase();
  if (h.includes('raast')) return 'Raast transfer';
  if (h.includes('easypaisa')) return 'Easypaisa';
  if (h.includes('jazzcash')) return 'JazzCash';
  if (h.includes('sadapay')) return 'SadaPay';
  if (h.includes('nayapay')) return 'NayaPay';
  if (h.includes('meezan')) return 'Meezan transfer';
  if (h.includes('hbl')) return 'HBL transfer';
  if (h.includes('ubl')) return 'UBL transfer';
  if (h.includes('askari')) return 'Askari transfer';
  return 'Bank transfer';
}

/* demo transfer emails so the flow is visible without a real inbox */
function demoTransferEmails() {
  const now = new Date();
  const at = (d, h) => isoLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, h || 14, 20));
  return [
    { id:'tt-1', from:'alerts@meezanbank.com', subject:'Raast payment received', date:at(0, 13),
      text:'Dear Customer, you have received Rs 2,400.00 from Hamza Sheikh via Raast. Transaction ID 8841207. Reference: dinner share.' },
    { id:'tt-2', from:'service@easypaisa.com.pk', subject:'You received money', date:at(1, 20),
      text:'Sana Malik sent you Rs 1,200 through Easypaisa. Your new balance is available in the app.' },
    { id:'tt-3', from:'alerts@hbl.com', subject:'IBFT transfer successful', date:at(2, 11),
      text:'Funds transfer of PKR 1,400 has been sent to Abdul Rehman from your account. IBFT ref 22319001.' },
    { id:'tt-4', from:'no-reply@jazzcash.com.pk', subject:'JazzCash: payment received', date:at(3, 18),
      text:'You have received Rs 1,850 from Bilal Ahmed. Thank you for using JazzCash.' },
    { id:'tt-5', from:'alerts@meezanbank.com', subject:'Account debited — IBFT', date:at(4, 10),
      text:'An amount of Rs 3,000 has been transferred to Sana Malik on your instruction. Ref IBFT-77104.' }
  ];
}

function syncTransfers() {
  const r = syncTransfersQuiet(demoTransferEmails());
  rerender();
  if (!r.fresh) toast('No new transfers found', { icon: 'mail' });
  else if (r.auto) toast(`${r.fresh} matched · ${r.auto} settled automatically`, { icon: 'zap' });
  else toast(`${r.fresh} transfer${r.fresh > 1 ? 's' : ''} matched to people`, { icon: 'mail' });
}

function approveSplit(entry, silent) {
  if (!entry || entry.state !== 'pending') return;
  /* create or reuse the person */
  let person = state.people.find(p => p.id === entry.personId) ||
               state.people.find(p => p.name.toLowerCase() === String(entry.personName).toLowerCase());
  if (!person) {
    const name = entry.personName || 'Unknown';
    const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    person = { id: uid(), name, initials, color: '#7EC8F2', email: '', phone: '' };
    state.people.push(person);
  }

  /* is there an open item this settles? */
  const openSame = state.shares
    .filter(s => s.personId === person.id && s.status === 'open' &&
                 ((entry.type === 'in' && s.direction === 'they_owe') || (entry.type === 'out' && s.direction === 'i_owe')))
    .sort((a, b) => Math.abs(a.amount - entry.amount) - Math.abs(b.amount - entry.amount));

  /* Apply the transfer oldest-debt-first. Handles exact, partial and over-paid amounts. */
  const round2 = v => Math.round(v * 100) / 100;
  const ordered = openSame.slice().sort((a, b) => parseDate(a.date) - parseDate(b.date));
  let remaining = entry.amount;
  let settledSomething = false;

  ordered.forEach(s => {
    if (remaining <= 0.01) return;
    if (s.amount <= remaining + 0.001) {
      remaining = round2(remaining - s.amount);
      s.status = 'settled';
      s.settledAt = isoLocal(new Date());
      s.settledFrom = 'sms';
    } else {
      /* partial payment on this item — shrink it and keep the rest open */
      s.amount = round2(s.amount - remaining);
      s.lastPayment = entry.amount;
      remaining = 0;
    }
    settledSomething = true;
  });

  /* Anything left over is real money that moved but isn't tied to a debt. */
  if (remaining > 0.01 || !settledSomething) {
    const loose = settledSomething ? remaining : entry.amount;
    state.shares.push({
      id: uid(), personId: person.id, direction: entry.direction, amount: loose,
      note: `${entry.bankLabel}${entry.type === 'in' ? ' received' : ' sent'}`,
      date: entry.date, status: 'settled', settledAt: entry.date, kind: 'transfer', source: 'sms'
    });
  }

  /* money actually moved — reflect it in the balance */
  const acct = state.accounts.find(a => a.type === 'Cash') || state.accounts[0];
  if (acct) acct.balance = Math.max(0, acct.balance + (entry.type === 'in' ? entry.amount : -entry.amount));

  entry.state = 'approved';
  saveState(); rerender();
  if (!silent) toast(settledSomething ? `Settled ${fmtMoney(entry.amount)} with ${person.name}` : `${fmtMoney(entry.amount)} recorded for ${person.name}`, { icon: 'settle' });
}

function reviewSplitInbox() {
  const all = state.splitInbox;
  const pending = all.filter(x => x.state === 'pending');
  const done = all.filter(x => x.state === 'approved' || x.state === 'ignored');
  openSheet(`
    ${sheetHead('Transfers from SMS', pending.length ? pending.length + ' to review' : all.length + ' handled automatically')}
    <div class="sheet-body">
      ${pending.length ? pending.map(splitInboxRow).join('') : ''}
      ${done.length ? `<div class="sec-head" style="margin-top:6px"><h2 style="font-size:14px">Already handled</h2><span class="cnt">${done.length}</span></div>
        ${done.slice(0, 12).map(splitInboxRow).join('')}` : ''}
      ${!all.length ? `<div class="empty"><div class="eic">${icon('check', 22)}</div><strong>Nothing here yet</strong><p>Incoming transfers get matched as soon as they land.</p></div>` : ''}
      ${pending.length ? `<button class="btn btn-ghost" data-action="ignore-all-splits" style="margin-top:6px">Ignore all</button>` : ''}
    </div>
  `);
  bindSplitInboxButtons($('#sheet'));
}

function bindSplitInboxButtons(root) {
  $$('[data-split-ok]', root).forEach(b => b.addEventListener('click', () => {
    approveSplit(state.splitInbox.find(x => x.id === b.getAttribute('data-split-ok')));
    closeSheet();
    setTimeout(() => { if (state.splitInbox.some(x => x.state === 'pending')) reviewSplitInbox(); }, 250);
  }));
  $$('[data-split-no]', root).forEach(b => b.addEventListener('click', () => {
    const e = state.splitInbox.find(x => x.id === b.getAttribute('data-split-no'));
    if (e) { e.state = 'ignored'; saveState(); rerender(); }
    closeSheet();
    setTimeout(() => { if (state.splitInbox.some(x => x.state === 'pending')) reviewSplitInbox(); }, 250);
  }));
}

/* Turn "0300 1234567" into a wa.me-ready international number (Pakistan default). */
function waNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('92')) return d;
  if (d.startsWith('0')) return '92' + d.slice(1);
  return d;
}

/* The nudge itself — itemised so the person can see what it's for, no typing needed. */
function reminderMessage(p) {
  const net = personNet(p.id);
  const open = personShares(p.id).filter(s => s.status === 'open' && s.direction === 'they_owe');
  const lines = open.slice(0, 5).map(s => {
    const what = s.note ? s.note : 'shared bill';
    return `• ${fmtMoney(s.amount)} — ${what} (${shortDate(s.date)})`;
  });
  const more = open.length > 5 ? `\n…and ${open.length - 5} more` : '';
  const first = p.name.split(' ')[0];
  return `Hey ${first}! Just a gentle nudge about ${fmtMoney(net)} you owe me for our shared expenses:\n${lines.join('\n')}${more}\n\nNo rush — send whenever convenient. Thanks! 🙏`;
}

/* One tap: open WhatsApp with the message already addressed to them. */
function sendReminder(p, opts) {
  const silent = opts && opts.silent;
  const net = personNet(p.id);
  if (net <= 0) { toast(`${p.name.split(' ')[0]} doesn't owe you anything`, { icon: 'check' }); return; }
  const msg = reminderMessage(p);
  const digits = waNumber(p.phone);

  if (!digits) {
    if (!silent) { toast('Add their number first', { icon: 'user' }); setTimeout(() => personSheet(p.id), 260); }
    return;
  }

  const url = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
  /* Record that a nudge went out, so the card can say "reminded 2 days ago". */
  if (!state.reminders) state.reminders = [];
  state.reminders = state.reminders.filter(r => r.personId !== p.id || r.amount !== net);
  state.reminders.push({ id: uid(), personId: p.id, amount: net, at: isoLocal(new Date()) });
  saveState();

  const win = window.open(url, '_blank');
  if (!win) {
    /* popup blocked — hand them the message instead */
    try { navigator.clipboard.writeText(msg); } catch (e) {}
    toast('Message copied — paste it in WhatsApp', { icon: 'copy' });
  } else {
    toast(`Reminder sent to ${p.name.split(' ')[0]}`, { icon: 'send' });
  }
  rerender();
}

function remindSheet(personId) {
  const p = personById(personId);
  const net = personNet(personId);
  if (net <= 0) { toast(`${p.name.split(' ')[0]} doesn't owe you anything`, { icon: 'check' }); return; }
  const msg = reminderMessage(p);
  const digits = waNumber(p.phone);
  const target = digits || '';
  const last = (state.reminders || []).filter(r => r.personId === p.id).pop();

  openSheet(`
    ${sheetHead('Send a reminder', `${esc(p.name)} owes ${fmtMoney(net)}`)}
    <div class="sheet-body">
      <div class="remind-hero">
        <span class="pi-avatar" style="${avatarStyle(p)}">${esc(p.initials)}</span>
        <div class="rh-meta">
          <strong>${esc(p.name)}</strong>
          <span>${target ? '+' + target : 'No number saved'}</span>
        </div>
        <span class="rh-amt">${fmtMoney(net)}</span>
      </div>

      <div class="field">
        <label>Message</label>
        <div class="codeblock remind-msg">${esc(msg).replace(/\n/g, '<br>')}</div>
      </div>

      <div class="field">
        <label>Phone number</label>
        <input id="rmPhone" type="tel" inputmode="tel" placeholder="03xx xxxxxxx" value="${esc(p.phone || '')}">
      </div>

      <button class="btn btn-lime" id="rmSend">${icon('send', 16)} Send on WhatsApp</button>
      ${target ? `<div class="two-col" style="margin-top:9px">
        <button class="btn btn-ghost" id="rmCall">${icon('phone', 15)} Call</button>
        <button class="btn btn-ghost" id="rmSms">${icon('message', 15)} SMS</button>
      </div>` : ''}
      <button class="btn btn-ghost" id="rmCopy" style="margin-top:9px">${icon('copy', 15)} Copy message</button>

      ${last ? `<div class="remind-last">${icon('check', 11)} Last nudged ${relDay(last.at)} for ${fmtMoney(last.amount)}</div>` : ''}
      <div class="remind-note">
        WhatsApp opens with the message pre-filled and pre-addressed — you just tap send. Budge can't press that last button for you.
      </div>
    </div>
  `);

  const phoneInput = $('#rmPhone');
  phoneInput.addEventListener('change', () => {
    p.phone = phoneInput.value.trim();
    saveState(); rerender();
    if (p.phone) toast('Number saved', { icon: 'check' });
  });

  $('#rmSend').addEventListener('click', () => {
    p.phone = phoneInput.value.trim();
    saveState();
    sendReminder(p);
  });

  const callBtn = $('#rmCall');
  if (callBtn) callBtn.addEventListener('click', () => {
    const d = (p.phone || '').replace(/[^\d+]/g, '');
    if (!d) { toast('Add their number first', { icon: 'user' }); return; }
    window.location.href = `tel:${d}`;
  });

  const smsBtn = $('#rmSms');
  if (smsBtn) smsBtn.addEventListener('click', () => {
    const d = (p.phone || '').replace(/[^\d+]/g, '');
    if (!d) { toast('Add their number first', { icon: 'user' }); return; }
    window.location.href = `sms:${d}?body=${encodeURIComponent(msg)}`;
  });

  $('#rmCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(msg); toast('Message copied', { icon: 'copy' }); }
    catch (e) { toast('Select the text to copy manually', { icon: 'copy' }); }
  });
}

function insightsSheet() {
  renderInsights();
  const html = $('#screen-insights').innerHTML;
  openSheet(`
    ${sheetHead('Insights', MONTHS[new Date().getMonth()] + ' at a glance')}
    <div class="sheet-body" id="insightsHost">
      <div class="seg" id="rangeSegSheet" style="margin-bottom:12px">
        <button class="${state.insightRange === 3 ? 'on' : ''}" data-range="3">3M</button>
        <button class="${state.insightRange !== 3 ? 'on' : ''}" data-range="6">6M</button>
      </div>
      ${html}
    </div>
  `);
  const host = $('#insightsHost');
  /* the copied markup includes its own header + segmented control — trim duplicates */
  const dupHead = host.querySelector('.s-head');
  if (dupHead) dupHead.remove();
  const dupSeg = host.querySelector('#rangeSeg');
  if (dupSeg) dupSeg.remove();
  $$('[data-range]', host).forEach(b => b.addEventListener('click', () => {
    state.insightRange = Number(b.getAttribute('data-range'));
    saveState();
    closeSheet();
    setTimeout(insightsSheet, 240);
  }));
}


function syncTransfersQuiet(messages) {
  const seen = new Set((state.splitInbox || []).map(x => x.messageId));
  const fresh = [];
  (messages || []).forEach(msg => {
    if (seen.has(msg.id)) return;
    const parsed = parseTransferEmail(msg);
    if (!parsed || parsed.confidence < 0.55) return;
    parsed.messageId = msg.id;
    state.splitInbox = (state.splitInbox || []).concat(parsed);
    fresh.push(parsed);
  });

  /* Fully automatic: a confident transfer from someone we know is settled
     on arrival — no tap required. Low-confidence ones stay in the queue. */
  let auto = 0;
  fresh.forEach(t => {
    if (!state.autopilot.autoPost) return;
    if (t.confidence >= AUTO_SETTLE_CONFIDENCE && t.personId) {
      t.auto = true;
      approveSplit(t, true);
      auto++;
    }
  });
  saveState();
  return { fresh: fresh.length, auto };
}
